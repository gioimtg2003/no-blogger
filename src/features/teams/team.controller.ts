import { PermissionGuard } from '@common/guard';
import { ActionPermission, SYSTEM_RESOURCE, VERSIONING_API } from '@constants';
import { CurrentUser, RequirePolicies } from '@decorators';

import { LocatorResourceGuard } from '@features/locator-resource';
import { UserAuthGuard } from '@features/user-auth/guards';
import { IUserSession } from '@interfaces';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTeamDto } from './dto';
import { TeamService } from './team.service';

@ApiTags('Team')
@Controller({ path: SYSTEM_RESOURCE.team, version: VERSIONING_API.v1 })
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @ApiOperation({ summary: 'Get team (workspace)' })
  @UseGuards(PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.read, SYSTEM_RESOURCE.team);
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Team retrieved successfully',
    type: Boolean,
  })
  get(@CurrentUser() user: IUserSession) {
    return this.teamService.getTeamByUserId(user?.id);
  }

  @ApiOperation({ summary: 'Create team (workspace)' })
  @UseGuards(PermissionGuard, UserAuthGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.create, SYSTEM_RESOURCE.team);
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Team created successfully',
    type: Boolean,
  })
  create(@Body() input: CreateTeamDto, @CurrentUser() user: IUserSession) {
    return this.teamService.create(input, user?.id);
  }

  @UseGuards(LocatorResourceGuard(SYSTEM_RESOURCE.team), PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.update, SYSTEM_RESOURCE.team);
  })
  @Patch(':teamAlias')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Team updated successfully', type: Boolean })
  update(@Param('id') id: number, @CurrentUser() user: IUserSession) {
    return user;
  }

  @UseGuards(UserAuthGuard, PermissionGuard)
  @RequirePolicies((ability) => {
    return ability.can(ActionPermission.manage, SYSTEM_RESOURCE.team);
  })
  @Post('public-access')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Team made public access successfully',
    type: Boolean,
  })
  makePublicAccess() {
    return this.teamService.makePublicAccess();
  }
}
