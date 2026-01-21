import { ContentModule } from '@features/content';
import { ResourceModule } from '@features/resources';
import { RoleModule } from '@features/roles';
import { UserTeamModule } from '@features/users/user-team';
import { Module } from '@nestjs/common';
import { AbilityModule } from 'src/ability';
import { PolicyResourcesService } from './policy-resouces.service';
import { PolicyResourcesController } from './policy-resources.controller';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';

@Module({
  imports: [
    AbilityModule,
    UserTeamModule,
    RoleModule,
    ContentModule,
    ResourceModule,
  ],
  controllers: [PolicyController, PolicyResourcesController],
  providers: [PolicyService, PolicyResourcesService],
  exports: [],
})
export class PolicyModule {}
