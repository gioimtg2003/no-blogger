import { PaginatedResponseDto } from '@common/dto';
import { PLAN_RESOURCE, ResourceError } from '@constants';
import { IUserSession } from '@interfaces';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { ILike, In, IsNull, Repository } from 'typeorm';
import { GetResourcesQueryDto, UpdateResourceDto } from './dto';
import { Resource } from './entities/resource.entity';

@Injectable()
export class ResourceService {
  private readonly logger = new Logger(ResourceService.name);

  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    private readonly cls: ClsService,
  ) {}

  /**
   * Get resources with optional filtering by IDs
   */
  get(ids: number[] = []) {
    const teamIdFromContext = this.cls.get('tenantId');
    if (ids.length === 0) {
      return this.resourceRepository.find({
        where: { team: { id: teamIdFromContext } },
        relations: ['parent'],
      });
    }
    return this.resourceRepository.findBy({
      id: In(ids),
      team: { id: teamIdFromContext },
    });
  }

  /**
   * Get paginated resources with filtering and search
   */
  async findAllPaginated(
    query: GetResourcesQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const teamIdFromContext = this.cls.get('tenantId');
    const { page = 1, limit = 10, search, type, isActive, parentId } = query;

    const skip = (page - 1) * limit;

    const whereConditions: any = {
      team: { id: teamIdFromContext },
    };

    // Apply filters
    if (search) {
      whereConditions.name = ILike(`%${search}%`);
    }

    if (type) {
      whereConditions.type = type;
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        whereConditions.parent = IsNull();
      } else {
        whereConditions.parent = { id: parentId };
      }
    }

    const [data, total] = await this.resourceRepository.findAndCount({
      where: whereConditions,
      relations: ['parent'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const formattedData = data.map((resource) => ({
      ...resource,
      parentId: resource.parent?.id,
    }));

    return new PaginatedResponseDto(formattedData, total, page, limit);
  }

  /**
   * Find a single resource by ID
   */
  async findOne(id: number): Promise<Resource> {
    const teamIdFromContext = this.cls.get('tenantId');

    const resource = await this.resourceRepository.findOne({
      where: { id, team: { id: teamIdFromContext } },
      relations: ['parent', 'children'],
    });

    if (!resource) {
      this.logger.warn(`Resource with id ${id} not found`);
      throw new NotFoundException(ResourceError.RESOURCE_NOT_FOUND);
    }

    return resource;
  }

  /**
   * Find all resources with optional filtering by IDs (for policy service)
   */
  async findAll(ids: number[] = []): Promise<Resource[]> {
    const teamIdFromContext = this.cls.get('tenantId');
    if (ids.length === 0) {
      return this.resourceRepository.find({
        where: { team: { id: teamIdFromContext } },
        select: ['id', 'name'],
      });
    }

    return this.resourceRepository.find({
      where: {
        id: In(ids),
        team: { id: teamIdFromContext },
      },
      select: ['id', 'name'],
    });
  }

  /**
   * Find resources by IDs with optional select fields (for internal use)
   */
  findByIds(ids: number[] = [], selectFields: (keyof Resource)[] = []) {
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

  /**
   * Find a resource by slug
   */
  async findBySlug(slug: string): Promise<Resource> {
    const teamIdFromContext = this.cls.get('tenantId');

    const resource = await this.resourceRepository.findOne({
      where: { slug, team: { id: teamIdFromContext } },
      relations: ['parent', 'children'],
    });

    if (!resource) {
      this.logger.warn(`Resource with slug ${slug} not found`);
      throw new NotFoundException(ResourceError.RESOURCE_NOT_FOUND);
    }

    return resource;
  }

  /**
   * Check if slug exists (internal helper)
   */
  private async findSlugInternal(slug: string, excludeId?: number) {
    const teamIdFromContext = this.cls.get('tenantId');
    const where: any = { slug, team: { id: teamIdFromContext } };

    if (excludeId) {
      where.id = In(
        (
          await this.resourceRepository.find({
            where: { team: { id: teamIdFromContext } },
            select: ['id'],
          })
        )
          .map((r) => r.id)
          .filter((id) => id !== excludeId),
      );
    }

    return this.resourceRepository.findOne({ where });
  }

  /**
   * Create a new resource
   */

  async create(
    data: Partial<Resource & { parentId: number }>,
    user: IUserSession,
  ) {
    const teamIdFromContext = this.cls.get('tenantId');
    const { slug, parentId, ...rest } = data;

    const resourceCount = await this.resourceRepository.count({
      where: {
        team: {
          id: teamIdFromContext,
        },
      },
    });

    if (
      PLAN_RESOURCE[user?.plan] &&
      resourceCount >= PLAN_RESOURCE[user?.plan]
    ) {
      this.logger.warn(`Resource limit reached for plan ${user?.plan}`);
      throw new ConflictException(ResourceError.RESOURCE_LIMIT_REACHED);
    }

    const findSlug = await this.findSlugInternal(slug);
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

  /**
   * Update an existing resource
   */
  async update(
    id: number,
    data: UpdateResourceDto,
    _user: IUserSession,
  ): Promise<Resource> {
    const teamIdFromContext = this.cls.get('tenantId');
    const { slug, parentId, ...rest } = data;

    // Find existing resource
    const resource = await this.findOne(id);

    // Check slug uniqueness if it's being changed
    if (slug && slug !== resource.slug) {
      const existingSlug = await this.findSlugInternal(slug, id);
      if (existingSlug) {
        this.logger.warn(`Slug ${slug} already exists`);
        throw new ConflictException(ResourceError.SLUG_ALREADY_EXISTS);
      }
      resource.slug = slug;
    }

    // Update parent if provided
    if (parentId !== undefined) {
      if (parentId === null) {
        resource.parent = null;
      } else {
        // Prevent circular reference
        if (parentId === id) {
          this.logger.warn('Resource cannot be its own parent');
          throw new BadRequestException(ResourceError.RESOURCE_CANNOT_UPDATE);
        }

        const parent = await this.resourceRepository.findOne({
          where: { id: parentId, team: { id: teamIdFromContext } },
        });

        if (!parent) {
          this.logger.warn(`Parent resource with id ${parentId} not found`);
          throw new BadRequestException(ResourceError.PARENT_NOT_FOUND);
        }

        // Check if parent is not a descendant of current resource
        const isDescendant = await this.isDescendant(id, parentId);
        if (isDescendant) {
          this.logger.warn(
            `Cannot set parent: circular reference detected between ${id} and ${parentId}`,
          );
          throw new BadRequestException(ResourceError.RESOURCE_CANNOT_UPDATE);
        }

        resource.parent = parent;
      }
    }

    // Update other fields
    Object.assign(resource, rest);

    await this.resourceRepository.save(resource);

    this.logger.log(`Resource ${id} updated successfully`);
    return resource;
  }

  /**
   * Soft delete a resource (set isActive to false)
   */
  async softDelete(id: number): Promise<boolean> {
    const resource = await this.findOne(id);

    // Check if resource has children
    const childrenCount = await this.resourceRepository.count({
      where: {
        parent: { id },
        team: { id: this.cls.get('tenantId') },
      },
    });

    if (childrenCount > 0) {
      this.logger.warn(
        `Cannot delete resource ${id}: has ${childrenCount} children`,
      );
      throw new BadRequestException(ResourceError.RESOURCE_HAS_CHILDREN);
    }

    resource.isActive = false;
    await this.resourceRepository.save(resource);

    this.logger.log(`Resource ${id} soft deleted successfully`);
    return true;
  }

  /**
   * Restore a soft-deleted resource
   */
  async restore(id: number): Promise<Resource> {
    const teamIdFromContext = this.cls.get('tenantId');

    const resource = await this.resourceRepository.findOne({
      where: { id, team: { id: teamIdFromContext }, isActive: false },
      relations: ['parent'],
    });

    if (!resource) {
      this.logger.warn(`Inactive resource with id ${id} not found`);
      throw new NotFoundException(ResourceError.RESOURCE_NOT_FOUND);
    }

    resource.isActive = true;
    await this.resourceRepository.save(resource);

    this.logger.log(`Resource ${id} restored successfully`);
    return resource;
  }

  /**
   * Permanently delete a resource
   */
  async delete(id: number): Promise<boolean> {
    const resource = await this.findOne(id);

    // Check if resource has children
    const childrenCount = await this.resourceRepository.count({
      where: {
        parent: { id },
        team: { id: this.cls.get('tenantId') },
      },
    });

    if (childrenCount > 0) {
      this.logger.warn(
        `Cannot delete resource ${id}: has ${childrenCount} children`,
      );
      throw new BadRequestException(ResourceError.RESOURCE_HAS_CHILDREN);
    }

    // Check if resource has associated content
    if (resource.contents && resource.contents.length > 0) {
      this.logger.warn(`Cannot delete resource ${id}: has associated content`);
      throw new BadRequestException(ResourceError.RESOURCE_IN_USE);
    }

    await this.resourceRepository.remove(resource);

    this.logger.log(`Resource ${id} permanently deleted`);
    return true;
  }

  /**
   * Toggle resource active status
   */
  async toggleActive(id: number): Promise<Resource> {
    const resource = await this.findOne(id);
    resource.isActive = !resource.isActive;
    await this.resourceRepository.save(resource);

    this.logger.log(
      `Resource ${id} active status toggled to ${resource.isActive}`,
    );
    return resource;
  }

  /**
   * Check if a resource is a descendant of another resource (prevent circular references)
   */
  private async isDescendant(
    ancestorId: number,
    descendantId: number,
  ): Promise<boolean> {
    const teamIdFromContext = this.cls.get('tenantId');

    const descendant = await this.resourceRepository.findOne({
      where: { id: descendantId, team: { id: teamIdFromContext } },
      relations: ['parent'],
    });

    if (!descendant || !descendant.parent) {
      return false;
    }

    if (descendant.parent.id === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parent.id);
  }

  /**
   * Get resource statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }> {
    const teamIdFromContext = this.cls.get('tenantId');

    const total = await this.resourceRepository.count({
      where: { team: { id: teamIdFromContext } },
    });

    const active = await this.resourceRepository.count({
      where: { team: { id: teamIdFromContext }, isActive: true },
    });

    const inactive = total - active;

    const resources = await this.resourceRepository.find({
      where: { team: { id: teamIdFromContext } },
      select: ['type'],
    });

    const byType = resources.reduce(
      (acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { total, active, inactive, byType };
  }
}
