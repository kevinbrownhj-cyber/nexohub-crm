import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generar o usar requestId existente
    const requestId = req.headers['x-request-id'] as string || randomUUID();
    
    // Agregar a request para uso interno
    (req as any).requestId = requestId;
    
    // Devolver en response header
    res.setHeader('x-request-id', requestId);
    
    next();
  }
}
