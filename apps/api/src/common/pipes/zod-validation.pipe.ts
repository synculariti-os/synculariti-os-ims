import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validates request data against a Zod schema.
 * Use with @Body(new ZodValidationPipe(mySchema)) or @Query(...)
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const zodError = result.error as ZodError;
      throw new BadRequestException({
        message: 'Validation failed',
        error: 'BAD_REQUEST',
        details: zodError.flatten().fieldErrors,
      });
    }

    return result.data;
  }
}
