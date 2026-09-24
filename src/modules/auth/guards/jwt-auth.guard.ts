import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify<{ sub: string; mobileNo: string }>(token);
      req.user = { userId: payload.sub, mobileNo: payload.mobileNo };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
