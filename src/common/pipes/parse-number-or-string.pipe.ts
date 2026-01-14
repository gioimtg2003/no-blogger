import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Pipe that transforms a value to a number if possible, otherwise returns it as a string.
 * Useful for parameters that can be either a numeric ID or a string token.
 *
 * @example
 * ```typescript
 * @Get(':idOrToken')
 * getItem(@Param('idOrToken', ParseNumberOrStringPipe) idOrToken: number | string) {
 *   // idOrToken will be a number if the param is numeric, otherwise a string
 * }
 * ```
 */
@Injectable()
export class ParseNumberOrStringPipe
  implements PipeTransform<any, number | string>
{
  /**
   * Transforms the input value to a number if possible, otherwise returns it as a string.
   *
   * @param value - The value to transform
   * @param metadata - Metadata about the argument being transformed
   * @returns A number if the value can be converted to a valid number, otherwise a string
   */
  transform(value: any, _metadata: ArgumentMetadata): number | string {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return String(value);
    }

    if (typeof value === 'number') {
      return isNaN(value) ? String(value) : value;
    }

    if (typeof value === 'boolean') {
      return String(value);
    }

    const stringValue = String(value).trim();

    if (stringValue === '') {
      return stringValue;
    }

    const numValue = Number(stringValue);

    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue;
    }

    return stringValue;
  }
}
