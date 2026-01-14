import { PermissionGuard } from '@common/guard';
import { ParseNumberOrStringPipe } from '@common/pipes';
import {
  ActionPermission,
  InviteType,
  SYSTEM_RESOURCE,
  VERSIONING_API,
} from '@constants';
import { CurrentUser, HeaderTeamAlias, RequirePolicies } from '@decorators';
import { UserAuthGuard } from '@features/user-auth/guards';
import { IUserSession } from '@interfaces';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { SendInviteDto } from './dto';
import { UseInvitePublicGuard } from './guards';
import { UserInviteService } from './user-invite.service';

@Controller({
  path: SYSTEM_RESOURCE['user-invite'],
  version: VERSIONING_API.v1,
})
@HeaderTeamAlias()
@UseGuards(UserAuthGuard, PermissionGuard)
export class UserInviteController {
  constructor(private readonly userInviteService: UserInviteService) {}

  @Get()
  @RequirePolicies((ability) =>
    ability.can(ActionPermission.read, SYSTEM_RESOURCE['user-invite']),
  )
  getInvites() {
    return this.userInviteService.getInvites();
  }

  @ApiParam({
    name: 'idOrInviteToken',
    required: true,
    description: 'ID (number) or invite token (string)',
    schema: {
      oneOf: [{ type: 'number' }, { type: 'string' }],
    },
  })
  @Get('/:idOrInviteToken')
  @RequirePolicies((ability) =>
    ability.can(ActionPermission.read, SYSTEM_RESOURCE['user-invite']),
  )
  @ApiOkResponse({ description: 'Success get detail invite user' })
  getDetail(
    @Param('idOrInviteToken', ParseNumberOrStringPipe)
    idOrInviteToken: number | string,
  ) {
    return this.userInviteService.getInvite(idOrInviteToken);
  }

  @Post('/')
  @RequirePolicies((ability) =>
    ability.can(ActionPermission.create, SYSTEM_RESOURCE['user-invite']),
  )
  createInvitePrivate(
    @Body() sendInviteDto: SendInviteDto,
    @CurrentUser() user: IUserSession,
  ) {
    return this.userInviteService.createInvite(
      user.id,
      InviteType.PRIVATE,
      sendInviteDto?.email ?? '',
    );
  }

  @Delete('/:inviteId')
  @RequirePolicies((ability) =>
    ability.can(ActionPermission.delete, SYSTEM_RESOURCE['user-invite']),
  )
  deleteInvite(@Param('inviteId', ParseIntPipe) inviteId: number) {
    return this.userInviteService.delete(inviteId);
  }

  @Post('resend-invite/:inviteId')
  @RequirePolicies((ability) =>
    ability.can(ActionPermission.create, SYSTEM_RESOURCE['user-invite']),
  )
  resendInvite(@Param('inviteId', ParseIntPipe) inviteId: number) {
    return this.userInviteService.resendInvite(inviteId);
  }

  @Patch('use-invite/:inviteToken')
  useInvite(
    @Param('inviteToken') inviteToken: string,
    @CurrentUser() user: IUserSession,
  ) {
    return this.userInviteService.useInvite(
      user,
      inviteToken,
      InviteType.PRIVATE,
    );
  }

  @Patch('public-invite/use-invite/:inviteToken')
  @UseGuards(UseInvitePublicGuard)
  useInviteTokenPublic(
    @Param('inviteToken') inviteToken: string,
    @CurrentUser() user: IUserSession,
  ) {
    return this.userInviteService.useInvite(
      user,
      inviteToken,
      InviteType.PUBLIC,
    );
  }

  @Get('public-invite/generate')
  @RequirePolicies((ability) =>
    ability.can(ActionPermission.create, SYSTEM_RESOURCE['user-invite']),
  )
  generatePublicInvite(@CurrentUser() user: IUserSession) {
    return this.userInviteService.generateInvitePublicUrl(user.id);
  }

  @Patch('public-invite-request/:joinRequestId')
  @RequirePolicies((ability) =>
    ability.can(ActionPermission.update, SYSTEM_RESOURCE['user-invite']),
  )
  actionJoinRequest(
    @Param('joinRequestId') joinRequestId: number,
    @Body('approve') approve: boolean,
    @CurrentUser() user: IUserSession,
  ) {
    return this.userInviteService.actionUserJoinRequest(
      user.id,
      joinRequestId,
      approve,
    );
  }

  @Get('join-requests')
  getJoinRequests() {
    return this.userInviteService.findAllJoinRequests();
  }
}
