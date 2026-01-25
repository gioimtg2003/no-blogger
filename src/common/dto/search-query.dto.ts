import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

export class SearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for filtering results',
    example: 'search term',
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;
}
