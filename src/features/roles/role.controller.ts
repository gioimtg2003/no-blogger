import { PaginatedResponseDto, SearchQueryDto } from '@common/dto';
import { PermissionGuard } from '@common/guard';
import { ActionPermission, SYSTEM_RESOURCE, VERSIONING_API } from '@constants';
import { HeaderTeamAlias, RequirePolicies } from '@decorators';
import { UserAuthGuard } from '@features/user-auth/guards';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PolicyIds } from 'src/decorators/policy-ids.decorator';
import { CreateRoleDto, MigrateRoleDto } from './dto';
import { RoleService } from './role.service';

@ApiTags('Role')
@Controller({
  path: SYSTEM_RESOURCE.role,
  version: VERSIONING_API.v1,
})
@HeaderTeamAlias()
@UseGuards(PermissionGuard, UserAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.create, SYSTEM_RESOURCE.role);
  })
  @Post()
  @ApiOkResponse({ type: Boolean })
  create(@Body() data: CreateRoleDto) {
    return this.roleService.create(data);
  }

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.role);
  })
  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated roles with search' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  getPaginatedRoles(@Query() query: SearchQueryDto) {
    return this.roleService.findAllPaginated(query);
  }

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.role);
  })
  @Get('/:id')
  @ApiOkResponse({ type: CreateRoleDto })
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findById(id);
  }

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.role);
  })
  @Get()
  @ApiOkResponse({ type: [CreateRoleDto] })
  getRoles(@PolicyIds(SYSTEM_RESOURCE['role']) resourceIds: number[]) {
    return this.roleService.findAll(resourceIds);
  }

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.role);
  })
  @Patch('/:id')
  @ApiOkResponse({ type: Boolean })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateRoleDto,
  ) {
    return this.roleService.update(id, data);
  }

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.delete, SYSTEM_RESOURCE.role);
  })
  @Delete('/:id')
  @ApiOkResponse({ type: Boolean })
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.delete(id);
  }

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.role);
  })
  @Post('/copy')
  @ApiOkResponse({ type: Boolean })
  copyRole(@Body() data: MigrateRoleDto) {
    return this.roleService.migrateRole(data.id, data.toTeamId, 'copy');
  }

  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.role);
  })
  @Post('/move')
  @ApiOkResponse({ type: Boolean })
  moveRole(@Body() data: MigrateRoleDto) {
    return this.roleService.migrateRole(data.id, data.toTeamId, 'move');
  }
}
