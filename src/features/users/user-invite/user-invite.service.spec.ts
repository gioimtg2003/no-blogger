import { MailService } from '@common/modules';
import { CryptoService } from '@features/crypto';
import { TeamService } from '@features/teams';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { UserInvite } from '../entities/user-invite.entity';
import { UserJoinRequest } from '../entities/user-join-request.entity';
import { UserTeamService } from '../user-team';
import { UserInviteService } from './user-invite.service';

describe('UserInviteService', () => {
  let service: UserInviteService;

  const mockUserInviteRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockSimpleProvider = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserInviteService,
        {
          provide: getRepositoryToken(UserInvite),
          useValue: mockUserInviteRepository,
        },
        {
          provide: getRepositoryToken(UserJoinRequest),
          useValue: mockUserInviteRepository,
        },
        { provide: CryptoService, useValue: mockSimpleProvider },
        { provide: ClsService, useValue: mockSimpleProvider },
        { provide: MailService, useValue: mockSimpleProvider },
        { provide: TeamService, useValue: mockSimpleProvider },
        { provide: UserTeamService, useValue: mockSimpleProvider },
        { provide: EventEmitter2, useValue: mockSimpleProvider },
      ],
    }).compile();

    service = module.get<UserInviteService>(UserInviteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
