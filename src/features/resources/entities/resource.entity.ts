import { BaseEntity } from '@common/entities/base.entity';
import { DATABASE_TABLES, ResourceType, SYSTEM_RESOURCE } from '@constants';
import { Content } from '@features/content/entities/content.entity';
import { Team } from '@features/teams/entities/team.entity';
import { Column, Entity, ManyToOne, OneToMany, Relation } from 'typeorm';

@Entity(DATABASE_TABLES.RESOURCES)
export class Resource extends BaseEntity {
  static readonly modelName = SYSTEM_RESOURCE.resource;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'enum', enum: ResourceType, default: ResourceType.BLOG })
  type: ResourceType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Content, (content) => content.resource)
  contents: Relation<Content>[];

  @ManyToOne(() => Resource)
  parent?: Relation<Resource>;

  @OneToMany(() => Resource, (item) => item.parent)
  children?: Relation<Resource>[];

  @ManyToOne(() => Team, (team) => team.resources, { nullable: true })
  team: Relation<Team>;
}
