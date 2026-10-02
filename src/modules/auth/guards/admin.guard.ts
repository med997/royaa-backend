import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service.js';
import { bearer, type Channel } from './jwt-auth.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const token = bearer(req);
    if (!token) throw new UnauthorizedException();

    let payload: { sub: string; mobileNo: string; ch: Channel; typ: string };
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (payload.typ !== 'access' || payload.ch !== 'admin') throw new UnauthorizedException();

    const user = await this.users.findById(payload.sub);
    if (!user?.isActive || !user.roles.includes('admin')) throw new ForbiddenException('Admin role required');
    req.user = { userId: user.id, mobileNo: user.mobileNo };
    return true;
  }
}
