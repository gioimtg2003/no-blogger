import {
  ActionPermission,
  Policy,
  SEPARATOR_POLICY,
  SYSTEM_RESOURCE,
} from '@constants';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parserPolicy } from '@utils';
import { groupBy, omit } from 'lodash';
import { ClsService } from 'nestjs-cls';
import { In, Repository } from 'typeorm';
import { CreateRoleDto, PermissionDto } from './dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    private readonly cls: ClsService,
  ) {}

  async create(data: CreateRoleDto) {
    const { name, description } = data ?? {};
    const permissions = this.buildPermissions(data?.permissions ?? []);

    const role = this.roleRepository.create({
      name,
      description,
      permission: permissions,
      team: { id: this.cls.get('tenantId') },
    });

    await this.roleRepository.save(role);
    return true;
  }

  private buildPermissions(permissions: PermissionDto[]): Policy[] {
    const policyMap = new Map<string, Set<number>>();
    permissions?.forEach((permission) => {
      if (!permission?.resource || !permission?.actions) return;

      permission.actions.forEach((actionDto) => {
        if (!actionDto.action) return;

        const key = `${actionDto.action}${SEPARATOR_POLICY}${permission.resource}`;

        if (!policyMap.has(key)) {
          policyMap.set(key, new Set<number>());
        }
        const currentScopes = policyMap.get(key);

        if (Array.isArray(actionDto?.scope)) {
          actionDto?.scope?.forEach((s) => currentScopes.add(s));
        }
      });
    });

    return Array.from(policyMap.entries())?.map(([basePath, scopeSet]) => {
      const scopes = Array.from(scopeSet);
      const actionType = basePath.split(SEPARATOR_POLICY)[0];

      if (scopes.length === 0 || actionType === ActionPermission.create) {
        return basePath as Policy;
      }
      return `${basePath}${SEPARATOR_POLICY}${scopes.join(',')}` as Policy;
    });
  }

  private parsePermissions(policies: Policy[]): PermissionDto[] {
    const parsedPolicies = policies?.map((policy) => {
      const { action, resource, resourceIds } = parserPolicy(policy);
      return {
        action: action as ActionPermission,
        resource: resource,
        scope: resourceIds,
      };
    });
    const grouped = groupBy(parsedPolicies, 'resource');
    return Object.entries(grouped).map(([resource, actions]) => ({
      resource: resource as unknown as SYSTEM_RESOURCE,
      actions: actions.map((action) => ({
        action: action.action,
        scope: action.scope,
      })),
    }));
  }

  // TODO: Add pagination
  async findAll(ids: number[] = []) {
    let roles = [];
    if (ids?.length > 0) {
      roles = await this.roleRepository.find({
        where: {
          id: In(ids),
          team: { id: this.cls.get('tenantId') },
        },
        select: ['id', 'name', 'description', 'permission'],
      });
    }
    roles = await this.roleRepository.find({
      where: { team: { id: this.cls.get('tenantId') } },
      select: ['id', 'name', 'description', 'permission'],
    });

    return roles?.map((role) => ({
      ...role,
      permissions: this.parsePermissions(role?.permission ?? []),
    }));
  }

  async findById(id: number) {
    const role = await this.roleRepository.findOne({
      where: {
        id,
        team: { id: this.cls.get('tenantId') },
      },
      select: ['id', 'name', 'description', 'permission'],
    });

    const formattedPermissions = this.parsePermissions(role?.permission ?? []);

    return { ...omit(role, 'permission'), permissions: formattedPermissions };
  }

  async delete(id: number) {
    const result = await this.roleRepository.delete({
      id,
      team: { id: this.cls.get('tenantId') },
    });
    return result.affected > 0;
  }

  async update(id: number, data: CreateRoleDto) {
    const { name, description } = data ?? {};
    const permissions = this.buildPermissions(data?.permissions ?? []);

    const result = await this.roleRepository.update(
      {
        id,
        team: { id: this.cls.get('tenantId') },
      },
      {
        name,
        description,
        permission: permissions,
      },
    );
    return result.affected > 0;
  }

  //TODO: improve logic for copy role with scope permissions
  async migrateRole(roleId: number, toTeamId: number, type: 'copy' | 'move') {
    const result = await this.roleRepository.update(
      {
        id: roleId,
        team: { id: this.cls.get('tenantId') },
      },
      {
        team: { id: toTeamId },
      },
    );

    if (type === 'copy' && result.affected > 0) {
      const role = await this.roleRepository.findOne({
        where: {
          id: roleId,
          team: { id: this.cls.get('tenantId') },
        },
      });
      const { description, name, permission } = role ?? {};

      if (role) {
        const newRole = this.roleRepository.create({
          description,
          name,
          permission,
          id: undefined,
          team: { id: toTeamId },
        });
        await this.roleRepository.save(newRole);
      }
    }
    return result.affected > 0;
  }
}
