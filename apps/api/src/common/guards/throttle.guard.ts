import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { THROTTLE_KEY, ThrottleOptions } from '../decorators/throttle.decorator';

@Injectable()
export class ThrottleGuard implements CanActivate {
  private requests = new Map<string, number[]>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const throttleOptions = this.reflector.get<ThrottleOptions>(
      THROTTLE_KEY,
      context.getHandler(),
    );

    if (!throttleOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const now = Date.now();
    const windowStart = now - throttleOptions.ttl * 1000;

    const requestTimestamps = this.requests.get(key) || [];
    const recentRequests = requestTimestamps.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length >= throttleOptions.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: throttleOptions.ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    // Cleanup old entries
    if (this.requests.size > 10000) {
      this.cleanup(windowStart);
    }

    return true;
  }

  private getKey(request: any): string {
    const ip = request.ip || request.connection.remoteAddress;
    const email = request.body?.email || '';
    return `${ip}:${email}`;
  }

  private cleanup(windowStart: number): void {
    for (const [key, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(timestamp => timestamp > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}
