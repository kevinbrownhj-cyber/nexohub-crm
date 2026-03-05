import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let code: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // PRESERVAR el payload original de la HttpException
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        code = responseObj.code || this.getDefaultCode(status);
        details = responseObj.details;
      } else {
        message = exceptionResponse as string;
        code = this.getDefaultCode(status);
      }
    } else {
      // SOLO errores no controlados se convierten a 500
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
      code = 'INTERNAL_SERVER_ERROR';
      
      // Generar requestId para tracking
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log del error completo para debugging
      this.logger.error(
        `Error no controlado: ${request.method} ${request.url} [${requestId}]`,
        exception instanceof Error ? exception.stack : exception,
      );
      
      // Agregar requestId a la respuesta
      details = { requestId };
    }

    // Log del error con contexto
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Code: ${code} - Message: ${message}`,
      {
        userId: (request as any).user?.sub,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        body: request.body,
        exception: exception instanceof Error ? exception.stack : exception,
      },
    );

    // Respuesta estandarizada
    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // En desarrollo, incluir más detalles
    if (process.env.NODE_ENV === 'development' && !(exception instanceof HttpException)) {
      errorResponse.error.details = {
        stack: exception instanceof Error ? exception.stack : exception,
      };
    }

    response.status(status).json(errorResponse);
  }

  private getDefaultCode(status: number): string {
    const statusCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return statusCodes[status] || 'UNKNOWN_ERROR';
  }
}
