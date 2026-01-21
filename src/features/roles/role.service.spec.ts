import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { CreateRoleDto } from './dto';
import { Role } from './entities/role.entity';
import { RoleService } from './role.service';

describe('Role Service', () => {
  let roleService: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn().mockReturnValue([]),
            delete: jest.fn().mockReturnValue({ affected: 1 }),
            findOne: jest.fn().mockReturnValue({
              id: 1,
              name: 'Admin',
              permission: ['create::user'],
            }),
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockReturnValue(1),
          },
        },
      ],
    }).compile();

    roleService = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(roleService).toBeDefined();
  });

  it('should create a role', async () => {
    const data: CreateRoleDto = {
      name: 'Admin',
      permissions: [],
      description: 'Administrator role',
    };
    const role = await roleService.create(data);
    expect(role).toBe(true);
  });

  it('should find all roles', async () => {
    const roles = await roleService.findAll([]);
    expect(roles).toBeDefined();
  });

  it('should find a role by id', async () => {
    const role = await roleService.findById(1);
    expect(role).toEqual({
      id: 1,
      name: 'Admin',
      permissions: [
        {
          resource: 'user',
          actions: [
            {
              action: 'create',
              scope: [],
            },
          ],
        },
      ],
    });
  });

  it('should delete a role', async () => {
    const role = await roleService.delete(1);
    expect(role).toBe(true);
  });
});
