import { BaseEntity } from '@common/entities/base.entity';
import { DATABASE_TABLES, UserPlan } from '@constants';
import { AuditLog } from '@features/audit-log/entities/audit-log.entity';
import { Content } from '@features/content/entities/content.entity';
import { Role } from '@features/roles/entities/role.entity';
import { Team } from '@features/teams/entities/team.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  Relation,
} from 'typeorm';

@Entity(DATABASE_TABLES.USERS)
export class User extends BaseEntity {
  static readonly modelName = 'user';

  // @Index({ unique: true })
  // @Column({ type: 'varchar', length: 100, unique: true })
  // username: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'jsonb', nullable: true })
  profile?: Record<string, any>;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @ManyToMany(() => Team, (team) => team.users)
  @JoinTable({ name: DATABASE_TABLES.TEAM_USERS })
  teams: Relation<Team>[];

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({ name: DATABASE_TABLES.USER_ROLES })
  roles: Relation<Role>[];

  @OneToMany(() => Team, (team) => team.createdBy)
  teamsCreated: Relation<Team>[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actor)
  auditLogs: Relation<AuditLog>[];

  @OneToMany(() => Content, (content) => content.createdByUser)
  contentCreated: Relation<Content>[];
}
