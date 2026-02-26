import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

// Catch only HttpExceptions so unexpected runtime errors still bubble up naturally.
// Unwraps the class-validator message array so the client gets field errors flat,
// not nested inside the raw exception response object.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();

    const raw = exception.getResponse();
    const message =
      typeof raw === 'object' && raw !== null && 'message' in raw
        ? (raw as Record<string, unknown>).message as string | string[]
        : exception.message;

    // Log 5xx errors with full stack — 4xx are expected client errors, not noise
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}`,
        exception.stack,
      );
    }

    const body: ErrorResponse = {
      statusCode,
      error: HttpStatus[statusCode] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
