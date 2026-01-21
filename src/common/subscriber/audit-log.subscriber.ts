import { AuditLogAction } from '@constants';
import { AuditLogService } from '@features/audit-log';
import { AuditLog } from '@features/audit-log/entities/audit-log.entity';
import { Inject, Injectable } from '@nestjs/common';
import { isNull } from 'lodash';
import { ClsService } from 'nestjs-cls';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

@Injectable()
@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface {
  private excludeEntities: any[] = [AuditLog.name];

  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    private readonly auditlogService: AuditLogService,
    private readonly cls: ClsService,
  ) {}

  onModuleInit() {
    if (this.dataSource && Array.isArray(this.dataSource.subscribers)) {
      this.dataSource.subscribers.push(this);
    }
  }
  listenTo() {
    return Object;
  }
  async afterInsert(event: InsertEvent<any>) {
    await this.logChange(event, AuditLogAction.created);
  }

  async afterUpdate(event: UpdateEvent<any>) {
    await this.logChange(event, AuditLogAction.updated);
  }

  async afterRemove(event: RemoveEvent<any>) {
    await this.logChange(event, AuditLogAction.deleted);
  }

  private async logChange(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    action: AuditLogAction,
  ) {
    const entityName = event.metadata?.targetName || event?.metadata?.target;
    if (isNull(entityName) || typeof entityName !== 'string') return;
    if (this.excludeEntities.includes(entityName)) return;

    const entityBefore = event['databaseEntity'];
    const entityAfter = event.entity;

    const [previousValue, updatedValue, recordId] =
      this.getPreviousAndUpdatedValues(event, action, {
        entityBefore,
        entityAfter,
      });
    // Get the current user ID from the context
    const userId = this.cls.get('userId');
    console.log('userId ', this.cls.get('requestInfo'));
    await this.auditlogService.createAuditLog(userId, {
      action,
      entityName,
      recordId,
      previousValue,
      newValue: updatedValue,
    });
  }

  private getPreviousAndUpdatedValues(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    action: AuditLogAction,
    entityValues: {
      entityBefore: Record<string, any>;
      entityAfter: Record<string, any>;
    },
  ): [Record<string, any>, Record<string, any>, recordId: number] {
    let previousValue: Record<string, any> = {};
    let updatedValue: Record<string, any> = {};

    const { entityBefore, entityAfter } = entityValues;
    const recordId = entityAfter?.id || entityBefore?.id;
    switch (action) {
      case AuditLogAction.created:
        updatedValue = entityAfter;

        break;
      case AuditLogAction.updated:
        previousValue['id'] = entityBefore ? entityBefore?.id : null;
        updatedValue['id'] = entityAfter ? entityAfter?.id : null;

        event['updatedColumns'].forEach((column: ColumnMetadata) => {
          previousValue[column.propertyName] =
            entityBefore[column.propertyName];
          updatedValue[column.propertyName] = entityAfter[column.propertyName];
        });

        event['updatedRelations'].forEach((relation: ColumnMetadata) => {
          previousValue[relation.propertyName] =
            entityBefore[relation.propertyName];
          updatedValue[relation.propertyName] =
            entityAfter[relation.propertyName];
        });
        break;
      case AuditLogAction.deleted:
        previousValue = { ...event.entity, ...event['databaseEntity'] };
        break;
    }
    return [previousValue, updatedValue, recordId];
  }
}
