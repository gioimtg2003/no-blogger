import { PaginatedResponseDto } from '@common/dto';
import { ResourceType } from '@constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ResourceMetaDataResponseDto {
  @ApiPropertyOptional({
    description: 'Hex color code for the resource UI',
    example: '#FF5733',
  })
  @Expose()
  color?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier',
    example: 'ri-home-line',
  })
  @Expose()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Custom banner image URL',
  })
  @Expose()
  bannerUrl?: string;
}

export class ResourceResponseDto {
  @ApiProperty({
    description: 'Resource ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Resource name',
    example: 'My Blog',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Resource description',
    example: 'A blog about technology',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Resource slug',
    example: 'my-blog',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Resource type',
    enum: ResourceType,
    example: ResourceType.BLOG,
  })
  @Expose()
  type: ResourceType;

  @ApiPropertyOptional({
    description: 'Resource metadata',
    type: ResourceMetaDataResponseDto,
  })
  @Expose()
  @Type(() => ResourceMetaDataResponseDto)
  metadata?: ResourceMetaDataResponseDto;

  @ApiProperty({
    description: 'Is resource active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Parent resource ID',
    example: 1,
  })
  @Expose()
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Parent resource details',
    type: () => ResourceResponseDto,
  })
  @Expose()
  @Type(() => ResourceResponseDto)
  parent?: ResourceResponseDto;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}

export class PaginatedResourceResponseDto extends PaginatedResponseDto<ResourceResponseDto> {
  @ApiProperty({
    description: 'List of resources',
    type: [ResourceResponseDto],
  })
  @Expose()
  @Type(() => ResourceResponseDto)
  data: ResourceResponseDto[];
}
