import { PaginatedResponseDto } from '@common/dto';
import { LIMIT_USER_JOIN_TEAM, TeamError, UserError } from '@constants';
import { User } from '@features/users/entities/user.entity';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { DataSource, FindOneOptions, ILike, Repository } from 'typeorm';
import { CreateTeamDto, GetTeamsQueryDto } from './dto';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
    private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {}

  async findAllPaginated(
    query: GetTeamsQueryDto,
  ): Promise<PaginatedResponseDto<Team>> {
    const { page = 1, limit = 10, search, userId } = query;

    this.logger.log(`Getting paginated teams`);

    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (search) {
      whereConditions.name = ILike(`%${search}%`);
    }

    if (userId) {
      whereConditions.users = { id: userId };
    }

    const [data, total] = await this.teamRepository.findAndCount({
      where: whereConditions,
      select: ['id', 'name', 'alias', 'logoUrl', 'settings', 'createdAt'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(
    id: number,
    select: FindOneOptions<Team>['select'] = [],
    relations: string[] = [],
  ) {
    const team = await this.teamRepository.findOne({
      where: { id },
      select,
      relations: relations?.length ? relations : undefined,
    });

    return team;
  }

  async create(input: CreateTeamDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        select: ['plan'],
      });

      if (!user) {
        throw new NotFoundException(UserError.USER_NOT_FOUND);
      }

      const teamCount = await queryRunner.manager.count(Team, {
        where: { createdBy: { id: user.id } },
      });

      const limit = LIMIT_USER_JOIN_TEAM[user.plan];
      if (teamCount > limit) {
        throw new ForbiddenException(UserError.USER_REACHES_CREATE_TEAM_LIMIT);
      }

      const team = queryRunner.manager.create(Team, {
        ...input,
        users: [{ id: userId }],
        createdBy: { id: userId },
      });

      await queryRunner.manager.save(team);

      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, input: Partial<Team>) {
    const result = await this.teamRepository.update(
      { id },
      {
        name: input.name,
        alias: input.alias,
        logoUrl: input.logoUrl,
        settings: input.settings,
      },
    );
    if (result.affected === 0) {
      throw new NotFoundException(TeamError.TEAM_NOT_FOUND);
    }

    return true;
  }

  async delete(id: number) {
    const result = await this.teamRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException(TeamError.TEAM_NOT_FOUND);
    }

    return true;
  }

  /**
   * get all team of user
   */
  async getTeamByUserId(id: number) {
    this.logger.log(`Getting team for user ${id}`);
    const teams = await this.teamRepository.find({
      where: {
        users: { id },
      },
      select: ['id', 'name', 'alias', 'logoUrl', 'settings'],
    });
    return teams;
  }

  async makePublicAccess() {
    const workspaceId = this.cls.get('tenantId');

    await this.update(workspaceId, { isAutoAcceptMember: true });

    return true;
  }
}
