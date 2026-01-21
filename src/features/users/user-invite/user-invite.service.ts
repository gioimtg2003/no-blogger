import { MailService } from '@common/modules';
import {
  InviteType,
  TeamError,
  USER_INVITE_TOKEN_EXPIRATION,
  UserError,
  UserJoinRequestStatus,
} from '@constants';
import { CryptoService } from '@features/crypto';
import { TeamService } from '@features/teams';
import { IUserSession } from '@interfaces';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import { UserInvite } from '../entities/user-invite.entity';
import { UserJoinRequest } from '../entities/user-join-request.entity';
import { UserTeamService } from '../user-team';
import { CreateUserInviteEvent, UserInviteEvents } from './events';

@Injectable()
export class UserInviteService {
  private readonly logger = new Logger(UserInviteService.name);
  private readonly tokenLength = 32;
  constructor(
    @InjectRepository(UserInvite)
    private readonly userInviteRepository: Repository<UserInvite>,
    @InjectRepository(UserJoinRequest)
    private readonly userJoinRequestRepository: Repository<UserJoinRequest>,
    private readonly cryptoService: CryptoService,
    private readonly cls: ClsService,
    private readonly mailService: MailService,
    private readonly teamService: TeamService,
    private readonly userTeamService: UserTeamService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: number, inviteData: Partial<UserInvite>) {
    const { email, type } = inviteData ?? {};

    const findUser = await this.userTeamService.findUserByIdOrEmail(
      email ?? '',
      ['id'],
      [],
      false,
    );
    if (findUser) {
      this.logger.error(
        `User with email ${email} already exists, cannot create invite`,
      );
      throw new BadRequestException(UserError.USER_ALREADY_EXISTS);
    }
    // suffix :0 indicates the first use of the invite, if re-invited, it will be :1, :2, ...
    const uid = `${this.cryptoService.generateToken(this.tokenLength)}:0`;
    const invite = this.userInviteRepository.create({
      uid,
      invitedBy: { id: userId },
      team: { id: inviteData?.team?.id },
      email,
      type,
    });
    const saved = await this.userInviteRepository.save(invite);

    if (!saved) {
      this.logger.error(
        `Failed to create invite for email ${inviteData.email}`,
      );
      return null;
    }

    this.logger.log(`Created invite ${saved.id} for email ${saved.email}`);
    return saved;
  }

  async delete(inviteId: number) {
    const found = await this.userInviteRepository.findOne({
      where: { id: inviteId, type: InviteType.PRIVATE, usedAt: null },
    });

    if (!found) {
      this.logger.error(`Invite ${inviteId} not found or already used`);
      throw new BadRequestException(TeamError.INVITE_NOT_FOUND);
    }

    await this.userInviteRepository.remove(found);

    return true;
  }

  async getInvite(idOrInviteToken: number | string) {
    const where =
      typeof idOrInviteToken === 'number'
        ? { id: idOrInviteToken }
        : { uid: idOrInviteToken };

    const invite = await this.userInviteRepository.findOne({
      where: {
        ...where,
        team: {
          id: this.cls.get('tenantId'),
        },
      },
      select: {
        id: true,
        uid: true,
        createdAt: true,
        updatedAt: true,
        team: {
          name: true,
        },
      },
      relations: ['team'],
    });
    return invite;
  }

  async getInvites() {
    const teamId = this.cls.get('tenantId');
    return this.userInviteRepository.find({
      where: { team: { id: teamId } },
      relations: ['invitedBy'],
      select: {
        id: true,
        email: true,
        type: true,
        createdAt: true,
        usedAt: true,
        invitedBy: { id: true, email: true },
      },
    });
  }

  async createInvite(
    userId: number,
    type: InviteType = InviteType.PRIVATE,
    email?: string | string[],
  ) {
    console.log('userId ', userId);
    const team = await this.teamService.findById(this.cls.get('tenantId'), {
      id: true,
      name: true,
    });

    if (!team) {
      this.logger.error(`Team ${this.cls.get('tenantId')} not found`);

      throw new BadRequestException(TeamError.TEAM_NOT_FOUND);
    }
    const invites = await Promise.all(
      (Array.isArray(email) ? email : [email]).map((email) =>
        this.create(userId, { email, type, team }),
      ),
    );

    invites.forEach((invite) => {
      const url = `${process.env.FRONTEND_URL}/invited/${invite.uid}`;

      if (invite.type === InviteType.PRIVATE)
        this.eventEmitter.emit(
          UserInviteEvents.CREATE_USER_INVITE,
          new CreateUserInviteEvent(
            team.name,
            url,
            invite?.email,
            team.createdAt,
          ),
        );
    });

    return team;
  }

  async resendInvite(inviteId: number) {
    const invite = await this.userInviteRepository.findOne({
      where: { id: inviteId },
      relations: ['team'],
      select: {
        id: true,
        uid: true,
        email: true,
        type: true,
        team: { id: true, name: true },
      },
    });

    if (!invite) {
      this.logger.error(`Invite ${inviteId} not found`);
      throw new BadRequestException(TeamError.INVITE_TOKEN_NOT_FOUND);
    }

    if (invite.type !== InviteType.PRIVATE) {
      this.logger.error(
        `Invite ${inviteId} is not of type PRIVATE, cannot resend`,
      );
      throw new BadRequestException(TeamError.INVITE_CANNOT_RESEND);
    }

    const [uidPrefix, count] = invite.uid.split(':');
    invite.uid = `${uidPrefix}:${parseInt(count, 10) + 1}`; // update suffix to indicate re-invited

    const updated = await this.userInviteRepository.update(
      { id: invite.id },
      { uid: invite.uid },
    );

    if (updated?.affected === 0) {
      this.logger.error(`Failed to update invite ${invite.id} for resend`);
      throw new BadRequestException(TeamError.INVITE_CREATION_FAILED);
    }

    const url = `${process.env.FRONTEND_URL}/invited/${invite.uid}`;

    this.eventEmitter.emit(
      UserInviteEvents.CREATE_USER_INVITE,
      new CreateUserInviteEvent(invite.team.name, url, invite.email, null),
    );
    return true;
  }

  async getInviteByUid(uid: string) {
    const invite = await this.userInviteRepository.findOne({
      where: { uid },
      select: {
        id: true,
        uid: true,
        email: true,
        type: true,
        updatedAt: true,
        usedAt: true,
      },
    });

    if (!invite) {
      this.logger.error(`Invite with uid ${uid} not found`);
      throw new BadRequestException(TeamError.INVITE_TOKEN_NOT_FOUND);
    }

    if (invite.usedAt) {
      this.logger.error(`Invite with uid ${uid} has already been used`);
      throw new BadRequestException(TeamError.INVITE_TOKEN_ALREADY_USED);
    }

    const now = new Date().getTime();
    const updatedAt = new Date(invite.updatedAt).getTime();

    if (now - updatedAt > USER_INVITE_TOKEN_EXPIRATION) {
      this.logger.error(`Invite with uid ${uid} has expired`);
      throw new BadRequestException(TeamError.INVITE_TOKEN_EXPIRED);
    }

    return invite;
  }

  /**
   * Mark invite as used with usedAt timestamp
   * @param uid
   */
  async useInvite(user: IUserSession, uid: string, type: InviteType) {
    const invite = await this.getInviteByUid(uid);
    if (invite.email !== user.email) {
      this.logger.error(
        `Invite email ${invite.email} does not match user email ${user.email}`,
      );
      throw new BadRequestException(TeamError.INVITE_EMAIL_MISMATCH);
    }

    if (invite.type !== type) {
      this.logger.error(
        `Invite with uid ${uid} is not of type ${type}, cannot use`,
      );
      throw new BadRequestException(TeamError.INVITE_TOKEN_NOT_FOUND);
    }

    const updated = await this.userInviteRepository.update(
      { id: invite.id },
      { usedAt: new Date() },
    );

    if (updated?.affected === 0) {
      this.logger.error(`Failed to mark invite ${invite.id} as used`);
      throw new BadRequestException(TeamError.INVITE_CREATION_FAILED);
    }

    if (type === InviteType.PRIVATE) {
      await this.userTeamService.addUserToTeam(user.id, invite?.team?.id);
    } else {
      // for public invite, create a join request with PENDING status
      const joinRequest = this.userJoinRequestRepository.create({
        user: { id: user.id },
        team: { id: this.cls.get('tenantId') },
        invite: { id: invite.id },
      });
      await this.userJoinRequestRepository.save(joinRequest);
    }

    return true;
  }

  /**
   * Get first public url invite for the team or create new one
   */
  async generateInvitePublicUrl(userIdInvite: number) {
    // get first public url invite for the team, if exists return it else create new
    const existingInvite = await this.userInviteRepository.findOne({
      where: { team: { id: this.cls.get('tenantId') } },
    });
    const dateNow = Date.now();

    if (existingInvite) {
      const hash = await this.cryptoService.hash256(
        `${process.env.SECRET_GENERATE_PUBLIC_INVITE}:${userIdInvite}:${dateNow}:${existingInvite.uid}`,
      );

      return {
        url: `${process.env.FRONTEND_URL}/invited/${existingInvite.uid}?inviter=${userIdInvite}&time=${dateNow}&signature=${hash}`,
        invite: existingInvite,
      };
    }

    const team = await this.teamService.findById(this.cls.get('tenantId'), {
      id: true,
      name: true,
    });

    if (!team) {
      this.logger.error(`Team ${this.cls.get('tenantId')} not found`);

      throw new BadRequestException(TeamError.TEAM_NOT_FOUND);
    }

    const invite = await this.create(userIdInvite, {
      type: InviteType.PUBLIC,
      team,
    });

    const hash = await this.cryptoService.hash256(
      `${process.env.SECRET_GENERATE_PUBLIC_INVITE}:${userIdInvite}:${dateNow}:${invite.uid}`,
    );

    return {
      url: `${process.env.FRONTEND_URL}/invited/${invite.uid}?inviter=${userIdInvite}&time=${dateNow}&signature=${hash}`,
      invite,
    };
  }

  async findAllJoinRequests() {
    const teamId = this.cls.get('tenantId');

    return this.userJoinRequestRepository.find({
      where: { team: { id: teamId } },
      relations: ['user', 'team', 'invite'],
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { id: true, email: true },
        team: { id: true, name: true },
        invite: { id: true, uid: true },
      },
    });
  }

  async actionUserJoinRequest(
    actionUserId: number,
    joinRequestId: number,
    approve: boolean,
  ) {
    const joinRequest = await this.userJoinRequestRepository.findOne({
      where: { id: joinRequestId },
      relations: ['user', 'team'],
      select: {
        id: true,
        status: true,
        user: { id: true },
        team: { id: true },
      },
    });

    if (!joinRequest) {
      this.logger.error(`Join request ${joinRequestId} not found`);
      throw new BadRequestException(TeamError.JOIN_REQUEST_NOT_FOUND);
    }

    if (joinRequest.status !== UserJoinRequestStatus.PENDING) {
      this.logger.error(`Join request ${joinRequestId} already handled`);
      throw new BadRequestException(TeamError.JOIN_REQUEST_ALREADY_HANDLED);
    }

    if (approve) {
      await this.userTeamService.addUserToTeam(
        joinRequest.user.id,
        joinRequest.team.id,
      );

      await this.userJoinRequestRepository.update(joinRequest, {
        status: UserJoinRequestStatus.APPROVED,
        actionBy: { id: actionUserId },
      });
    } else {
      await this.userJoinRequestRepository.update(joinRequest, {
        status: UserJoinRequestStatus.REJECTED,
        actionBy: { id: actionUserId },
      });
    }
    return true;
  }

  @OnEvent(UserInviteEvents.CREATE_USER_INVITE)
  handleCreateUserInviteEvent(event: CreateUserInviteEvent) {
    const { teamName, url, email, time } = event;

    this.mailService.send({
      to: email,
      subject: `[Action required] - You're invited to join ${teamName}`,
      template: 'user-invite',
      context: {
        teamName,
        url,
        time,
      },
    });
  }
}
