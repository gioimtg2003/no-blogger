import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(editorId: number, data: Partial<AuditLog>) {
    const auditLog = this.auditLogRepository.create({
      actor: { id: editorId },
      ...data,
    });

    return await this.auditLogRepository.save(auditLog);
  }
}
