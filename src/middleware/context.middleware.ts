import { HEADER_TEAM_ID, SystemError } from '@constants';
import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, _: Response, next: NextFunction) {
    const teamId = req.headers[HEADER_TEAM_ID] as string;

    if (!teamId || isNaN(Number(teamId))) {
      throw new BadRequestException(SystemError.REQUIRED__HEADER_TEAM_ID);
    }
    this.cls.run(() => {
      this.cls.set('requestId', req.requestId!);
      this.cls.set('tenantId', Number(teamId));
      this.cls.set('userAgent', req.headers['user-agent']);
      this.cls.set('ipAddress', req.ip);

      next();
    });
  }
}
