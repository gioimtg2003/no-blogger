import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [AuditLogService],
})
export class AuditLogModule {}
