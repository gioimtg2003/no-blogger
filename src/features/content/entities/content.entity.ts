import { BaseEntity } from '@common/entities/base.entity';
import { DATABASE_TABLES, PostStatus, SYSTEM_RESOURCE } from '@constants';
import { Resource } from '@features/resources/entities/resource.entity';
import { Team } from '@features/teams/entities/team.entity';
import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity(DATABASE_TABLES.CONTENT)
export class Content extends BaseEntity {
  static readonly modelName = SYSTEM_RESOURCE.content;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text' })
  bodyLastSnapshot?: string;

  @Column({ type: 'jsonb', nullable: true, default: null })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { nullable: false })
  createdByUser: User;

  @Column('text', { array: true, default: [], nullable: true })
  tags?: string[];

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @ManyToOne(() => Resource, (resource) => resource.contents, {
    nullable: true,
  })
  resource: Relation<Resource>;

  @ManyToOne(() => Team, (team) => team.contents, { nullable: false })
  team: Relation<Team>;
}
