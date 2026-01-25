import { SearchQueryDto } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class GetTeamsQueryDto extends SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Filter teams by user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'User ID must be an integer' })
  userId?: number;
}
