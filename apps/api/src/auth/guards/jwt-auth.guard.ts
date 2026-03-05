import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Excluir rutas de Swagger y assets estáticos
    const request = context.switchToHttp().getRequest();
    const publicPaths = ['/docs', '/api/docs'];
    const isSwaggerPath = publicPaths.some(path => 
      request.url === path || 
      request.url.startsWith(path + '/') ||
      request.url.startsWith(path + '?')
    );
    
    if (isSwaggerPath) {
      return true;
    }

    return super.canActivate(context);
  }
}
