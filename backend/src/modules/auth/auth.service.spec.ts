import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UsersService } from '../users/users.service';
import { ActiveRole, UserRole } from '../users/enums/user.enum';

const user = {
  id: 'user-1',
  email: 'guest@test.com',
  name: 'Guest User',
  role: UserRole.Guest,
  activeRole: ActiveRole.Guest,
  passwordHash: 'hash',
} as any;

function createRepositoryMock<T>() {
  return {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
    update: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('AuthService refresh and reset tokens', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let passwordResetTokenRepository: jest.Mocked<Repository<PasswordResetToken>>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    } as any;
    jwtService = { sign: jest.fn(() => 'access.jwt') } as any;
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'FRONTEND_URL') return 'http://localhost:3005';
        return undefined;
      }),
    } as any;
    refreshTokenRepository = createRepositoryMock<RefreshToken>();
    passwordResetTokenRepository = createRepositoryMock<PasswordResetToken>();

    service = new AuthService(
      usersService,
      jwtService,
      configService,
      refreshTokenRepository,
      passwordResetTokenRepository,
    );
  });

  it('login creates a hashed refresh token and returns access token with user', async () => {
    usersService.findById.mockResolvedValue(user);
    refreshTokenRepository.save.mockImplementation(async (token: any) => ({
      id: 'refresh-1',
      ...token,
    }));

    const result = await service.login(user);

    expect(result.response.access_token).toBe('access.jwt');
    expect(result.response.user.email).toBe(user.email);
    expect(result.refreshToken).toBeTruthy();
    expect(refreshTokenRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    const savedToken = (refreshTokenRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedToken.tokenHash).not.toBe(result.refreshToken);
    await expect(bcrypt.compare(result.refreshToken, savedToken.tokenHash)).resolves.toBe(true);
  });

  it('refresh rotates a valid refresh token and revokes the old row', async () => {
    const rawToken = 'raw-refresh-token';
    const existingToken = {
      id: 'refresh-1',
      userId: user.id,
      user,
      tokenHash: await bcrypt.hash(rawToken, 10),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByTokenId: null,
    } as RefreshToken;

    refreshTokenRepository.find.mockResolvedValue([existingToken]);
    refreshTokenRepository.save
      .mockResolvedValueOnce({ id: 'refresh-2' } as RefreshToken)
      .mockResolvedValueOnce(existingToken);

    const result = await service.refresh(rawToken);

    expect(result.response.access_token).toBe('access.jwt');
    expect(result.refreshToken).toBeTruthy();
    expect(existingToken.revokedAt).toBeInstanceOf(Date);
    expect(existingToken.replacedByTokenId).toBe('refresh-2');
    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(2);
  });

  it('forgot password stores a hashed reset token and returns dev link in development', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    passwordResetTokenRepository.save.mockImplementation(async (token: any) => token);

    const result = await service.forgotPassword(user.email);

    expect(result.message).toContain('reset link');
    expect(result.devResetToken).toBeTruthy();
    expect(result.resetUrl).toContain('/reset-password?token=');
    expect(passwordResetTokenRepository.update).toHaveBeenCalled();
    const savedToken = (passwordResetTokenRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedToken.tokenHash).not.toBe(result.devResetToken);
    await expect(bcrypt.compare(result.devResetToken!, savedToken.tokenHash)).resolves.toBe(true);
  });

  it('reset password updates the password and revokes active refresh tokens', async () => {
    const rawToken = 'raw-reset-token';
    const resetToken = {
      id: 'reset-1',
      userId: user.id,
      tokenHash: await bcrypt.hash(rawToken, 10),
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    } as PasswordResetToken;

    passwordResetTokenRepository.find.mockResolvedValue([resetToken]);
    passwordResetTokenRepository.save.mockResolvedValue(resetToken);
    usersService.update.mockResolvedValue(user);

    const result = await service.resetPassword(rawToken, 'newpass123');

    expect(result.message).toBe('Password reset successfully');
    expect(usersService.update).toHaveBeenCalledWith(user.id, {
      passwordHash: expect.any(String),
    });
    const updatePayload = (usersService.update as jest.Mock).mock.calls[0][1];
    await expect(bcrypt.compare('newpass123', updatePayload.passwordHash)).resolves.toBe(true);
    expect(resetToken.usedAt).toBeInstanceOf(Date);
    expect(refreshTokenRepository.update).toHaveBeenCalled();
  });
});
