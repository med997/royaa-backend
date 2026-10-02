import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/user.entity.js';
import type { Channel } from './guards/jwt-auth.guard.js';
import type { UpdateProfileDto } from './dto/profile.dto.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TTL = '30d';
const STATIC_OTP = '1234';

function generateOtp(): string {
  return STATIC_OTP;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const mobileNo = this.config.get<string>('ADMIN_MOBILE');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!mobileNo || !password) return;

    const existing = await this.users.findByMobile(mobileNo);
    if (!existing) {
      await this.users.create({
        userName: 'Admin',
        mobileNo,
        passwordHash: await bcrypt.hash(password, 10),
        isVerified: true,
        roles: ['customer', 'admin'],
      });
    } else if (!existing.roles.includes('admin')) {
      existing.roles = [...existing.roles, 'admin'];
      await this.users.save(existing);
    }
  }

  private issueTokens(user: User, ch: Channel) {
    const base = { sub: user.id, mobileNo: user.mobileNo, ch };
    return {
      token: this.jwt.sign({ ...base, typ: 'access' }),
      refreshToken: this.jwt.sign({ ...base, typ: 'refresh', ver: user.tokenVersion }, { expiresIn: REFRESH_TTL }),
    };
  }

  private sanitize(user: User) {
    const { passwordHash, otpCode, otpExpiresAt, otpAttempts, otpSentAt, tokenVersion, fcmToken, ...safe } = user;
    return safe;
  }

  private session(user: User, ch: Channel) {
    return { ...this.issueTokens(user, ch), user: this.sanitize(user) };
  }

  private async assignOtp(user: User) {
    user.otpCode = generateOtp();
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.otpAttempts = 0;
    user.otpSentAt = new Date();
    await this.users.save(user);
    console.log(`[OTP] ${user.mobileNo} -> ${user.otpCode}`);
  }

  private checkOtp(user: User | null, code: string): User {
    if (!user || !user.otpCode || !user.otpExpiresAt) throw new BadRequestException('OTP not requested');
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) throw new HttpException('Too many attempts, request a new code', HttpStatus.TOO_MANY_REQUESTS);
    if (user.otpExpiresAt.getTime() < Date.now()) throw new BadRequestException('Code expired');
    if (user.otpCode !== code) {
      user.otpAttempts += 1;
      void this.users.save(user);
      throw new BadRequestException('Invalid code');
    }
    return user;
  }

  private async sendOtpTo(mobileNo: string) {
    const user = await this.users.findByMobile(mobileNo);
    if (!user || !user.isActive) throw new BadRequestException('User not found');
    if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < OTP_RESEND_MS) {
      throw new HttpException('Please wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.assignOtp(user);
    return { mobileNo: user.mobileNo };
  }

  async register(data: { userName: string; mobileNo: string; password: string; email?: string }) {
    const existing = await this.users.findByMobile(data.mobileNo);
    if (existing) throw new ConflictException('Mobile number already registered');

    const user = await this.users.create({
      userName: data.userName,
      mobileNo: data.mobileNo,
      passwordHash: await bcrypt.hash(data.password, 10),
      email: data.email ?? null,
    });
    await this.assignOtp(user);
    return { mobileNo: user.mobileNo };
  }

  sendOtp(mobileNo: string) {
    return this.sendOtpTo(mobileNo);
  }

  forgotPassword(mobileNo: string) {
    return this.sendOtpTo(mobileNo);
  }

  async verifyOtp(mobileNo: string, code: string) {
    const user = this.checkOtp(await this.users.findByMobile(mobileNo), code);
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.users.save(user);
    return this.session(user, 'customer');
  }

  async resetPassword(mobileNo: string, code: string, newPassword: string) {
    const user = this.checkOtp(await this.users.findByMobile(mobileNo), code);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.tokenVersion += 1;
    await this.users.save(user);
    return this.session(user, 'customer');
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findById(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.tokenVersion += 1;
    await this.users.save(user);
    return this.session(user, 'customer');
  }

  private async authenticate(mobileNo: string, password: string) {
    const user = await this.users.findByMobile(mobileNo);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new ForbiddenException('Account disabled');
    return user;
  }

  async login(mobileNo: string, password: string) {
    const user = await this.authenticate(mobileNo, password);
    if (!user.isVerified) throw new UnauthorizedException('Account not verified');
    return this.session(user, 'customer');
  }

  async adminLogin(mobileNo: string, password: string) {
    const user = await this.authenticate(mobileNo, password);
    if (!user.roles.includes('admin')) throw new ForbiddenException('Admin role required');
    return this.session(user, 'admin');
  }

  async refresh(refreshToken: string) {
    try {
      const p = this.jwt.verify<{ sub: string; ch: Channel; typ: string; ver: number }>(refreshToken);
      const user = await this.users.findById(p.sub);
      if (p.typ !== 'refresh' || !user || !user.isActive || user.tokenVersion !== p.ver) throw new Error();
      if (p.ch === 'admin' && !user.roles.includes('admin')) throw new Error();
      return this.session(user, p.ch);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.users.findById(userId);
    if (user) {
      user.tokenVersion += 1;
      user.fcmToken = null;
      await this.users.save(user);
    }
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    Object.assign(user, dto);
    return this.sanitize(await this.users.save(user));
  }

  async deleteAccount(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    Object.assign(user, {
      userName: 'Deleted user',
      mobileNo: `deleted-${user.id}`,
      email: null,
      avatarUrl: null,
      fcmToken: null,
      isActive: false,
      tokenVersion: user.tokenVersion + 1,
    });
    await this.users.save(user);
  }
}
