import { PaginationQueryDto } from '@common/dto';
import { ResourceType } from '@constants';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetResourcesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for resource name or description',
    example: 'blog',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource type',
    enum: ResourceType,
    enumName: 'ResourceType',
  })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by parent resource ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}
