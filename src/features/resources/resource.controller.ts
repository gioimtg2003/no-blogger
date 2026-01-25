import { PaginatedResponseDto } from '@common/dto';
import { PermissionGuard } from '@common/guard';
import { ActionPermission, SYSTEM_RESOURCE, VERSIONING_API } from '@constants';
import { CurrentUser, HeaderTeamAlias, RequirePolicies } from '@decorators';
import { UserAuthGuard } from '@features/user-auth/guards';
import { IUserSession } from '@interfaces';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateResourceDto,
  GetResourcesQueryDto,
  ResourceResponseDto,
  UpdateResourceDto,
} from './dto';
import { ResourceService } from './resource.service';

@ApiTags('Resource')
@Controller({
  path: SYSTEM_RESOURCE.resource,
  version: VERSIONING_API.v1,
})
@HeaderTeamAlias()
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.resource);
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all resources with pagination and filtering' })
  @ApiOkResponse({
    description: 'Resources retrieved successfully',
    type: PaginatedResponseDto,
  })
  async findAll(
    @Query() query: GetResourcesQueryDto,
  ): Promise<PaginatedResponseDto<ResourceResponseDto>> {
    return this.resourceService.findAllPaginated(query);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.resource);
  })
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get resource statistics' })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
  })
  async getStatistics() {
    return this.resourceService.getStatistics();
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.resource);
  })
  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get resource by slug' })
  @ApiParam({ name: 'slug', description: 'Resource slug', example: 'my-blog' })
  @ApiOkResponse({
    description: 'Resource retrieved successfully',
    type: ResourceResponseDto,
  })
  async findBySlug(@Param('slug') slug: string): Promise<ResourceResponseDto> {
    return this.resourceService.findBySlug(slug);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.resource);
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource ID', example: 1 })
  @ApiOkResponse({
    description: 'Resource retrieved successfully',
    type: ResourceResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.findOne(id);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.create, SYSTEM_RESOURCE.resource);
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Resource created successfully',
    type: Boolean,
  })
  @ApiOperation({ summary: 'Create a new resource' })
  create(
    @Body() createResourceDto: CreateResourceDto,
    @CurrentUser() user: IUserSession,
  ) {
    return this.resourceService.create(createResourceDto, user);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.resource);
  })
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update resource by ID (full update)' })
  @ApiParam({ name: 'id', description: 'Resource ID', example: 1 })
  @ApiOkResponse({
    description: 'Resource updated successfully',
    type: ResourceResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
    @CurrentUser() user: IUserSession,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.update(id, updateResourceDto, user);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.resource);
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update resource by ID (partial update)' })
  @ApiParam({ name: 'id', description: 'Resource ID', example: 1 })
  @ApiOkResponse({
    description: 'Resource updated successfully',
    type: ResourceResponseDto,
  })
  async partialUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
    @CurrentUser() user: IUserSession,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.update(id, updateResourceDto, user);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.resource);
  })
  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle resource active status' })
  @ApiParam({ name: 'id', description: 'Resource ID', example: 1 })
  @ApiOkResponse({
    description: 'Resource active status toggled successfully',
    type: ResourceResponseDto,
  })
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.toggleActive(id);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.resource);
  })
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted resource' })
  @ApiParam({ name: 'id', description: 'Resource ID', example: 1 })
  @ApiOkResponse({
    description: 'Resource restored successfully',
    type: ResourceResponseDto,
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.restore(id);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.delete, SYSTEM_RESOURCE.resource);
  })
  @Delete(':id/soft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a resource (set isActive to false)' })
  @ApiParam({ name: 'id', description: 'Resource ID', example: 1 })
  @ApiOkResponse({
    description: 'Resource soft deleted successfully',
    type: Boolean,
  })
  async softDelete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.resourceService.softDelete(id);
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.delete, SYSTEM_RESOURCE.resource);
  })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a resource' })
  @ApiParam({ name: 'id', description: 'Resource ID', example: 1 })
  @ApiOkResponse({
    description: 'Resource permanently deleted successfully',
    type: Boolean,
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.resourceService.delete(id);
  }
}
