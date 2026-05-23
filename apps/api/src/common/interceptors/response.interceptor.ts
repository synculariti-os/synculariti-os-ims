import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: any;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If it's already wrapped, or has a specific shape, handle it.
        if (data && typeof data === 'object' && ('data' in data || 'meta' in data)) {
          // If the controller already returned `{ data, meta }`, return it as is, or strip `success`.
          const { success, ...rest } = data as any;
          return rest;
        }
        return { data };
      }),
    );
  }
}
