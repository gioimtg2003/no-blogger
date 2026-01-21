import { LocatorResourceModule } from '@features/locator-resource';
import { TeamModule } from '@features/teams';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbilityModule } from 'src/ability';
import { User } from '../entities/user.entity';
import { UserTeamController } from './user-team.controller';
import { UserTeamService } from './user-team.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AbilityModule,
    LocatorResourceModule,
    TeamModule,
  ],
  controllers: [UserTeamController],
  exports: [UserTeamService],
  providers: [UserTeamService],
})
export class UserTeamModule {}
