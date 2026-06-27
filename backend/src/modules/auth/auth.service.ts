import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { IsNull, Repository } from 'typeorm';
import { HostStatus } from '../host-profiles/enums/host-profile.enum';
import { User } from '../users/entities/user.entity';
import { ActiveRole } from '../users/enums/user.enum';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  private readonly refreshCookieName = 'refresh_token';
  private readonly refreshTokenTtlMs = 7 * 24 * 60 * 60 * 1000;
  private readonly passwordResetTtlMs = 60 * 60 * 1000;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
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
    const loadedUser = await this.usersService.findById(user.id);
    if (!loadedUser) {
      throw new NotFoundException('User not found');
    }

    const refreshToken = await this.createRefreshToken(loadedUser.id);
    return {
      refreshToken: refreshToken.rawToken,
      response: {
        access_token: this.signAccessToken(loadedUser),
        user: this.toAuthUser(loadedUser),
      },
    };
  }

  async refresh(rawRefreshToken?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const activeTokens = await this.refreshTokenRepository.find({
      where: { revokedAt: IsNull() },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    const currentToken = await this.findMatchingRefreshToken(
      rawRefreshToken,
      activeTokens,
    );

    if (!currentToken || currentToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const nextRefreshToken = await this.createRefreshToken(currentToken.userId);
    currentToken.revokedAt = new Date();
    currentToken.replacedByTokenId = nextRefreshToken.tokenRecord.id;
    await this.refreshTokenRepository.save(currentToken);

    return {
      refreshToken: nextRefreshToken.rawToken,
      response: {
        access_token: this.signAccessToken(currentToken.user),
        user: this.toAuthUser(currentToken.user),
      },
    };
  }

  async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return;

    const activeTokens = await this.refreshTokenRepository.find({
      where: { revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    const token = await this.findMatchingRefreshToken(rawRefreshToken, activeTokens);
    if (token) {
      token.revokedAt = new Date();
      await this.refreshTokenRepository.save(token);
    }
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

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If an account exists, a reset link has been prepared.' };
    }

    await this.passwordResetTokenRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const rawToken = this.generateOpaqueToken();
    const tokenHash = await bcrypt.hash(rawToken, 10);
    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.passwordResetTtlMs),
      }),
    );

    const response: Record<string, string> = {
      message: 'If an account exists, a reset link has been prepared.',
    };

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3005';
      response.devResetToken = rawToken;
      response.resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    }

    return response;
  }

  async resetPassword(rawToken: string, password: string) {
    const token = await this.findMatchingPasswordResetToken(rawToken);
    if (!token || token.expiresAt <= new Date() || token.usedAt) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersService.update(token.userId, { passwordHash });

    token.usedAt = new Date();
    await this.passwordResetTokenRepository.save(token);
    await this.refreshTokenRepository.update(
      { userId: token.userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return { message: 'Password reset successfully' };
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

    return {
      access_token: this.signAccessToken(updatedUser),
      user: this.toAuthUser(updatedUser),
    };
  }

  setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(this.refreshCookieName, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/api/v1/auth',
      maxAge: this.refreshTokenTtlMs,
    });
  }

  clearRefreshCookie(res: Response) {
    res.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/api/v1/auth',
    });
  }

  private signAccessToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      activeRole: user.activeRole,
    });
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeRole: user.activeRole,
    };
  }

  private async createRefreshToken(userId: string) {
    const rawToken = this.generateOpaqueToken();
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const tokenRecord = await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
      }),
    );
    return { rawToken, tokenRecord };
  }

  private async findMatchingRefreshToken(
    rawToken: string,
    candidates: RefreshToken[],
  ) {
    for (const candidate of candidates) {
      if (await bcrypt.compare(rawToken, candidate.tokenHash)) {
        return candidate;
      }
    }
    return null;
  }

  private async findMatchingPasswordResetToken(rawToken: string) {
    const candidates = await this.passwordResetTokenRepository.find({
      where: { usedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    for (const candidate of candidates) {
      if (await bcrypt.compare(rawToken, candidate.tokenHash)) {
        return candidate;
      }
    }
    return null;
  }

  private generateOpaqueToken() {
    return randomBytes(48).toString('base64url');
  }
}
