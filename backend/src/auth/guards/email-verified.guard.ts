import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const fullUser = await this.usersService.findById(user.userId);

    if (!fullUser.isEmailVerified) {
      throw new ForbiddenException('Please verify your email to access this content');
    }

    return true;
  }
}
