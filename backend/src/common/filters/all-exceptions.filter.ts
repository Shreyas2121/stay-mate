import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let errorDetails = null;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseObj = exceptionResponse as any;
      errorMessage = responseObj.message || errorMessage;
      errorCode = responseObj.error || HttpStatus[httpStatus];
      errorDetails =
        responseObj.message instanceof Array ? responseObj.message : null;
    }

    if (httpStatus >= 500) {
      this.logger.error(`Exception: ${JSON.stringify(exception)}`);
    } else {
      this.logger.warn(`Exception: ${JSON.stringify(exception)}`);
    }

    const responseBody: ApiResponse<null> = {
      success: false,
      error: {
        code: errorCode,
        message: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        details: errorDetails,
      },
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
