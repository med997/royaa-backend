import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paged } from '../pagination.js';

export interface ApiResponse<T> {
  errorMessage: string;
  errorNo: number;
  data: T;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof Paged) {
          context.switchToHttp().getResponse<Response>().setHeader('X-Total-Count', String(data.total));
          data = data.items;
        }
        return { errorMessage: '', errorNo: 0, data: data ?? null };
      }),
    );
  }
}
