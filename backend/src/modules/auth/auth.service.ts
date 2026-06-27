import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { ActiveRole } from '../users/enums/user.enum';
import { HostStatus } from '../host-profiles/enums/host-profile.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, activeRole: user.activeRole };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const { password, ...rest } = registerDto;
    const user = await this.usersService.create({
      ...rest,
      passwordHash: password,
    });
    const { passwordHash, ...result } = user;
    return result;
  }

  async switchRole(userId: string, newRole: ActiveRole) {
    const user = await this.usersService.findById(userId, { hostProfile: true });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (newRole === ActiveRole.Host) {
      if (!user.hostProfile || user.hostProfile.status !== HostStatus.Verified) {
        throw new ForbiddenException(
          'Your host profile must be verified before switching to Host mode',
        );
      }
    }

    const updatedUser = await this.usersService.update(userId, { activeRole: newRole });
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      activeRole: updatedUser.activeRole,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        activeRole: updatedUser.activeRole,
      },
    };
  }
}
