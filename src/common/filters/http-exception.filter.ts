import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

const DB_CONFLICTS: Record<string, string> = {
  '23505': 'Duplicate value',
  '23503': 'Item is referenced by other records',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const dbCode = exception instanceof QueryFailedError ? (exception.driverError as { code?: string })?.code : undefined;
    const conflict = dbCode ? DB_CONFLICTS[dbCode] : undefined;
    const status = exception instanceof HttpException ? exception.getStatus() : conflict ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const errorMessage = conflict ??
      (typeof body === 'string'
        ? body
        : ((body as { message?: string | string[] })?.message ?? (exception as Error)?.message ?? 'Internal server error'));

    res.status(status).json({
      errorMessage: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      errorNo: status,
      data: null,
    });
  }
}
