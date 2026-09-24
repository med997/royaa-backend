import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const errorMessage =
      typeof body === 'string'
        ? body
        : ((body as { message?: string | string[] })?.message ?? (exception as Error)?.message ?? 'Internal server error');

    res.status(status).json({
      errorMessage: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      errorNo: status,
      data: null,
    });
  }
}
