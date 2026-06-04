import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validates request data against a Zod schema.
 * Use with @Body(new ZodValidationPipe(mySchema)) or @Query(...)
 *
 * Per R-TS-05: uses .parse() at API boundaries. ZodError is caught and
 * re-thrown as a structured BadRequestException.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (err) {
      const zodError = err as ZodError;
      throw new BadRequestException({
        message: 'Validation failed',
        error: 'BAD_REQUEST',
        details: zodError.flatten?.().fieldErrors ?? zodError.message,
      });
    }
  }
}
