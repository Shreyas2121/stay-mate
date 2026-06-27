import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '../../modules/users/enums/user.enum';
import { Roles } from '../guards/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'User not logged in (Invalid JWT)',
    }),
    ApiForbiddenResponse({
      description: 'User does not have the required role',
    }),
  );
}
