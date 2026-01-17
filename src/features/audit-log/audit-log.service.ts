import { AuditLogAction } from '@constants';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: Repository<AuditLog>) {}

  async createAuditLog(
    editorId: number,
    action: AuditLogAction,
    ipAddress: string,
    userAgent: string,
    requestId: string,
    entityName: string,
  ) {
    const auditLog = this.auditLogRepository.create({
      action,
      actor: { id: editorId },
      ipAddress,
      userAgent,
      requestId,
      entityName,
    });

    return await this.auditLogRepository.save(auditLog);
  }
}
