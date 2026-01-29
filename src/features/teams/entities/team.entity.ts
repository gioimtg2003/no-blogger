import { BaseEntity } from '@common/entities/base.entity';
import { DATABASE_TABLES, DomainStatus, SYSTEM_RESOURCE } from '@constants';
import { Content } from '@features/content/entities/content.entity';
import { Resource } from '@features/resources/entities/resource.entity';
import { Role } from '@features/roles/entities/role.entity';
import { User } from '@features/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  Relation,
} from 'typeorm';
@Entity(DATABASE_TABLES.TEAMS)
export class Team extends BaseEntity {
  static readonly modelName = SYSTEM_RESOURCE.team;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  alias?: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  customDomain?: string;

  @Column({
    type: 'enum',
    enum: DomainStatus,
    nullable: true,
  })
  domainStatus?: DomainStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cloudflareId?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => User, (user) => user.teams)
  users: Relation<User>[];

  @Column({ type: 'varchar', nullable: true })
  logoUrl?: string;

  @Column({ type: 'boolean', default: false })
  isAutoAcceptMember?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @OneToMany(() => Resource, (resource) => resource.team)
  resources: Relation<Resource>[];

  @OneToMany(() => Content, (content) => content.team)
  contents: Relation<Content>[];

  @OneToMany(() => Role, (role) => role.team)
  roles: Relation<Role>[];

  @ManyToMany(() => User, (user) => user.teamsCreated)
  createdBy: Relation<User>;
}
