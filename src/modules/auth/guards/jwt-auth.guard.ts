import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type Channel = 'customer' | 'admin';

export const bearer = (req: Request) => req.headers.authorization?.replace('Bearer ', '');

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = bearer(req);
    if (!token) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify<{ sub: string; mobileNo: string; ch: Channel; typ: string }>(token);
      if (payload.typ !== 'access' || payload.ch !== 'customer') throw new Error();
      req.user = { userId: payload.sub, mobileNo: payload.mobileNo };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
