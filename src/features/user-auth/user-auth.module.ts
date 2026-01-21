import { CryptoModule } from '@features/crypto';
import { AuthSerializer } from '@features/passport';
import { UserInviteModule, UserModule } from '@features/users';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserLocalStrategy } from './strategies';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';

@Module({
  imports: [
    UserModule,
    CryptoModule,
    PassportModule.register({ session: true }),
    UserInviteModule,
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, AuthSerializer, UserLocalStrategy],
  exports: [UserAuthService],
})
export class UserAuthModule {}
