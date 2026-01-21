import { AuthError } from '@constants';
import { IUserSession } from '@interfaces';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly clsService: ClsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userSession = request?.session?.user as IUserSession;

    if (!userSession) {
      throw new UnauthorizedException(AuthError.AUTH_INVALID_SESSION);
    }
    // VALIDATE user belong team
    const teamId = this.clsService.get('tenantId');
    if (teamId && userSession.teams.indexOf(teamId) === -1) {
      throw new UnauthorizedException(AuthError.AUTH_USER_NOT_IN_TEAM);
    }

    this.clsService.set('userId', userSession.id);

    return true;
  }
}
