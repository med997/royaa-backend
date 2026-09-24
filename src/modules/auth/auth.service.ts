import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/user.entity.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const STATIC_OTP = '1234';

function generateOtp(): string {
  return STATIC_OTP;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private issueToken(user: User) {
    return this.jwt.sign({ sub: user.id, mobileNo: user.mobileNo });
  }

  private sanitize(user: User) {
    const { passwordHash, otpCode, otpExpiresAt, ...safe } = user;
    return safe;
  }

  private async assignOtp(user: User) {
    user.otpCode = generateOtp();
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    await this.users.save(user);
    console.log(`[OTP] ${user.mobileNo} -> ${user.otpCode}`);
  }

  async register(data: { userName: string; mobileNo: string; password: string; email?: string }) {
    const existing = await this.users.findByMobile(data.mobileNo);
    if (existing) throw new ConflictException('Mobile number already registered');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.users.create({
      userName: data.userName,
      mobileNo: data.mobileNo,
      passwordHash,
      email: data.email ?? null,
    });
    await this.assignOtp(user);
    return { mobileNo: user.mobileNo };
  }

  async sendOtp(mobileNo: string) {
    const user = await this.users.findByMobile(mobileNo);
    if (!user) throw new BadRequestException('User not found');
    await this.assignOtp(user);
    return { mobileNo: user.mobileNo };
  }

  async verifyOtp(mobileNo: string, code: string) {
    const user = await this.users.findByMobile(mobileNo);
    if (!user || !user.otpCode || !user.otpExpiresAt) throw new BadRequestException('OTP not requested');
    if (user.otpCode !== code) throw new BadRequestException('Invalid code');
    if (user.otpExpiresAt.getTime() < Date.now()) throw new BadRequestException('Code expired');

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.users.save(user);

    return { token: this.issueToken(user), user: this.sanitize(user) };
  }

  async login(mobileNo: string, password: string) {
    const user = await this.users.findByMobile(mobileNo);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');
    if (!user.isVerified) throw new UnauthorizedException('Account not verified');

    return { token: this.issueToken(user), user: this.sanitize(user) };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }
}
