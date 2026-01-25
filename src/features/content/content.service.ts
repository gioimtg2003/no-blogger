import { PaginatedResponseDto, SearchQueryDto } from '@common/dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { ILike, In, Repository } from 'typeorm';
import { Content } from './entities/content.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly cls: ClsService,
  ) {}

  async findAllPaginated(
    query: SearchQueryDto,
  ): Promise<PaginatedResponseDto<Content>> {
    const teamIdFromContext = this.cls.get('tenantId');
    const { page = 1, limit = 10, search } = query;

    const skip = (page - 1) * limit;

    const whereConditions: any = {
      team: { id: teamIdFromContext },
    };

    if (search) {
      whereConditions.body = ILike(`%${search}%`);
    }

    const [data, total] = await this.contentRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findAll(ids: number[] = []) {
    if (ids?.length > 0) {
      return this.contentRepository.find({
        where: {
          id: In(ids),
          team: { id: this.cls.get('tenantId') },
        },
        select: ['id', 'body', 'metadata'],
      });
    }
    return this.contentRepository.find({
      where: { team: { id: this.cls.get('tenantId') } },
      select: ['id', 'body', 'metadata'],
    });
  }

  async findById(id: number) {
    return this.contentRepository.findOne({
      where: { id, team: { id: this.cls.get('tenantId') } },
      relations: ['team'],
    });
  }

  async getTeamId(id: number): Promise<number | null> {
    const queryBuilder = this.contentRepository.createQueryBuilder('content');
    queryBuilder.select('content.teamId').where('content.id = :id', { id });

    const result = await queryBuilder.getOne();

    return (result as unknown as { teamId: number })?.teamId ?? null;
  }
}
