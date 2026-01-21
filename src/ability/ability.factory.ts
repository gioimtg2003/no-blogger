import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import {
  ActionPermission,
  ResourcePermission,
  SYSTEM_RESOURCE,
} from '@constants';
import { Content } from '@features/content/entities/content.entity';
import { Resource } from '@features/resources/entities/resource.entity';
import { Role } from '@features/roles/entities/role.entity';
import { Team } from '@features/teams/entities/team.entity';
import { User } from '@features/users/entities/user.entity';
import { IUserSession } from '@interfaces';

import { Injectable } from '@nestjs/common';
import { parserPolicy } from '@utils';

export type Subjects =
  | InferSubjects<typeof User>
  | InferSubjects<typeof Resource>
  | InferSubjects<typeof Team>
  | InferSubjects<typeof Content>
  | InferSubjects<typeof Role>
  | ResourcePermission;

export type AppAbility = PureAbility<[ActionPermission, Subjects]>;

@Injectable()
export class AbilityFactory {
  definePoliciesForUser(user: IUserSession) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user?.email === process.env.ROOT_USER_EMAIL) {
      can(ActionPermission.manage, SYSTEM_RESOURCE.all);
    } else {
      user?.permissions?.forEach((permission) => {
        const { action, resource } = parserPolicy(permission);
        can(action, resource);
      });
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
