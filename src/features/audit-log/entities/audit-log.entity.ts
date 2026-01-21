import { AuditLogAction, DATABASE_TABLES } from '@constants';
import { User } from '@features/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity(DATABASE_TABLES.AUDIT_LOGS)
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: AuditLogAction,
  })
  action: AuditLogAction;

  @Column({ type: 'varchar', length: 10 })
  entityName: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', nullable: true })
  requestId?: string;

  @Column({ type: 'jsonb', nullable: true })
  previousValue?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValue?: Record<string, any>;

  @Column({ type: 'integer', nullable: true })
  recordId?: number;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: false })
  actor: Relation<User>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
