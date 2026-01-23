import { ResourceType, SlugRegex } from '@constants';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ResourceMetaDataDto {
  @ApiProperty({
    description: 'Hex color code for the resource UI',
    example: '#FF5733',
    required: false,
  })
  @IsOptional()
  @IsHexColor({ message: 'Color must be a valid Hex Color code' })
  color?: string;

  @ApiProperty({
    description: 'Icon identifier (e.g., material icon name or remixicon)',
    example: 'ri-home-line',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: 'Custom banner image URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Banner must be a valid URL' })
  bannerUrl?: string;
}

export class CreateResourceDto {
  @ApiProperty({
    description: 'The name of the resource',
    example: 'My Resource',
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(4, { message: 'Name must be at least 4 characters long' })
  @MaxLength(100, { message: 'Name must be at most 100 characters long' })
  name: string;

  @ApiProperty({
    description: 'The description of the resource',
    example: 'This is a description',
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(4, { message: 'Name must be at least 4 characters long' })
  @MaxLength(100, { message: 'Name must be at most 100 characters long' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The type of the resource',
    enum: ResourceType,
    enumName: 'ResourceType',
  })
  @IsEnum(ResourceType, { message: 'Type must be a valid resource type' })
  @IsOptional()
  type?: ResourceType;

  @ApiProperty({
    description: 'The slug of the resource',
    example: 'my-resource',
  })
  @Matches(SlugRegex, { message: 'Slug must be a valid slug' })
  @IsString({ message: 'Slug must be a string' })
  @MinLength(4, { message: 'Slug must be at least 4 characters long' })
  @MaxLength(100, { message: 'Slug must be at most 100 characters long' })
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'The parent ID of the resource',
    example: 1,
  })
  @IsNumber({}, { message: 'Parent ID must be a number' })
  @IsOptional()
  parentId?: number;

  @ApiProperty({
    description: 'Metadata for UI configuration (color, icon, etc.)',
    type: ResourceMetaDataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResourceMetaDataDto)
  metadata?: ResourceMetaDataDto;
}
