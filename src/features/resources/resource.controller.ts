import { PermissionGuard } from '@common/guard';
import { ActionPermission, SYSTEM_RESOURCE, VERSIONING_API } from '@constants';
import { HeaderTeamAlias, RequirePolicies } from '@decorators';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PolicyIds } from 'src/decorators/policy-ids.decorator';
import { CreateResourceDto } from './dto';
import { ResourceService } from './resource.service';

@ApiTags('Resource')
@Controller({
  path: SYSTEM_RESOURCE.resource,
  version: VERSIONING_API.v1,
})
@HeaderTeamAlias()
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @UseGuards(PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.resource);
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Resources retrieved successfully',
    type: Boolean,
  })
  get(@PolicyIds(SYSTEM_RESOURCE.resource) resourceIds: number[]) {
    return this.resourceService.get(resourceIds);
  }

  @UseGuards(PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.create, SYSTEM_RESOURCE.resource);
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Resource created successfully',
    type: Boolean,
  })
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourceService.create(createResourceDto);
  }
}
