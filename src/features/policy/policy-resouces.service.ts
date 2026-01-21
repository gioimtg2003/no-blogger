import { ContentService } from '@features/content';
import { ResourceService } from '@features/resources';
import { RoleService } from '@features/roles';
import { UserTeamService } from '@features/users/user-team';
import { Injectable, Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

// TODO: Add pagination
@Injectable()
export class PolicyResourcesService {
  private readonly logger = new Logger(PolicyResourcesService.name);
  constructor(
    private readonly userTeamService: UserTeamService,
    private readonly roleService: RoleService,
    private readonly contentService: ContentService,
    private readonly cls: ClsService,
    private readonly resourceService: ResourceService,
  ) {}

  async getAllUsersInTeam(ids: number[] = []) {
    this.logger.log(`Getting all users in team ${this.cls.get('tenantId')}`);
    return this.userTeamService.getAllUsersInTeam(ids);
  }

  async getAllRoles(ids: number[] = []) {
    this.logger.log(`Getting all roles in team ${this.cls.get('tenantId')}`);
    return this.roleService.findAll(ids);
  }

  async getAllPosts(ids: number[] = []) {
    this.logger.log(`Getting all posts in team ${this.cls.get('tenantId')}`);
    return this.contentService.findAll(ids);
  }

  async getAllResources(ids: number[] = []) {
    this.logger.log(
      `Getting all resources in team ${this.cls.get('tenantId')}`,
    );
    return this.resourceService.findAll(ids);
  }
}
