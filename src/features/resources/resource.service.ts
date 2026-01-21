import { ResourceError } from '@constants';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { In, Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';

@Injectable()
export class ResourceService {
  private readonly logger = new Logger(ResourceService.name);

  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    private readonly cls: ClsService,
  ) {}

  get(ids: number[] = []) {
    const teamIdFromContext = this.cls.get('tenantId');
    if (ids.length === 0) {
      return this.resourceRepository.find({
        where: { team: { id: teamIdFromContext } },
      });
    }
    return this.resourceRepository.findBy({
      id: In(ids),
      team: { id: teamIdFromContext },
    });
  }

  findAll(ids: number[] = [], selectFields: (keyof Resource)[] = []) {
    if (ids.length === 0) {
      return this.resourceRepository.find({
        where: { team: { id: this.cls.get('tenantId') } },
        select: ['id', 'name', ...selectFields],
      });
    }

    return this.resourceRepository.find({
      where: {
        id: In(ids),
        team: { id: this.cls.get('tenantId') },
      },
      select: ['id', 'name', ...selectFields],
    });
  }

  findSlug(slug: string) {
    const teamIdFromContext = this.cls.get('tenantId');
    return this.resourceRepository.findOne({
      where: { slug, team: { id: teamIdFromContext } },
    });
  }

  async create(data: Partial<Resource & { parentId: number }>) {
    // TODO: handle limit with plan for resource creation
    const teamIdFromContext = this.cls.get('tenantId');
    const { slug, parentId, ...rest } = data;

    const findSlug = await this.findSlug(slug);
    if (findSlug) {
      this.logger.warn(`Slug ${slug} already exists`);
      throw new ConflictException(ResourceError.SLUG_ALREADY_EXISTS);
    }

    const created = this.resourceRepository.create({
      ...rest,
      slug,
      team: { id: teamIdFromContext },
    });

    if (parentId) {
      const parent = await this.resourceRepository.findOne({
        where: { id: parentId, team: { id: teamIdFromContext } },
      });

      if (!parent) {
        this.logger.warn(`Parent resource with id ${parentId} not found`);
        throw new BadRequestException(ResourceError.PARENT_NOT_FOUND);
      }

      created.parent = parent;
    }

    await this.resourceRepository.save(created);

    return true;
  }
}
