import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { In, Repository } from 'typeorm';
import { Content } from './entities/content.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly cls: ClsService,
  ) {}

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
