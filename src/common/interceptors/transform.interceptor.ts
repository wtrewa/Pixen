import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    return next.handle().pipe(
      map((payload) => {
        // If the payload has both data and meta, it's a paginated result; keep both.
        const isPaginated = payload?.data !== undefined && payload?.meta !== undefined;
        
        return {
          success: true,
          statusCode,
          message: payload?.message ?? 'Success',
          data: isPaginated ? payload.data : (payload?.data !== undefined ? payload.data : payload),
          meta: isPaginated ? payload.meta : undefined,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
