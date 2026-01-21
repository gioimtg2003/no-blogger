import { MailModule } from '@common/modules';
import { CryptoModule } from '@features/crypto';
import { TeamModule } from '@features/teams';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbilityModule } from 'src/ability';
import { UserInvite } from '../entities/user-invite.entity';
import { UserJoinRequest } from '../entities/user-join-request.entity';
import { UserTeamModule } from '../user-team';
import { UserInviteController } from './user-invite.controller';
import { UserInviteService } from './user-invite.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInvite, UserJoinRequest]),
    CryptoModule,
    MailModule,
    TeamModule,
    UserTeamModule,
    AbilityModule,
  ],
  providers: [UserInviteService],
  exports: [UserInviteService],
  controllers: [UserInviteController],
})
export class UserInviteModule {}
