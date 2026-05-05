import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, AuthProvider } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { VendorsRepository } from '../vendors/vendors.repository';
import { EmailService } from '../../infrastructure/email/email.service';
import { Role } from '../../common/enums/roles.enum';

interface OAuthProfile {
  email: string;
  fullName: string;
  avatar: string | null;
  googleId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly vendorsRepository: VendorsRepository,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = this.userRepo.create({
      ...dto,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });
    await this.userRepo.save(user);

    if (user.role === Role.VENDOR) {
      await this.vendorsRepository.create({
        userId: user.id,
        businessName: `${user.fullName}'s Studio`,
        businessDescription: '',
        category: 'Wedding',
        city: '',
        address: '',
      });
    }

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { emailVerificationToken: token },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'isEmailVerified', 'emailVerificationToken', 'emailVerificationExpires', 'avatar'],
    });

    if (!user) throw new BadRequestException('Invalid or expired verification token');
    if (user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user);
    const { emailVerificationToken: _t, emailVerificationExpires: _e, ...safeUser } = user as any;
    return { message: 'Email verified successfully', data: { user: safeUser, ...tokens } };
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('No account found with this email');
    if (user.isEmailVerified) throw new BadRequestException('Email is already verified');

    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await this.userRepo.save(user);

    await this.emailService.sendVerificationEmail(user.email, verificationToken);
    return { message: 'Verification email sent. Please check your inbox.' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'role', 'isActive', 'fullName', 'isEmailVerified'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    const { password: _pw, ...safeUser } = user as any;
    return { message: 'Login successful', data: { user: safeUser, ...tokens } };
  }

  async refresh(userId: string, rawToken: string) {
    if (!userId || userId.trim() === '') {
      throw new UnauthorizedException('Invalid user context');
    }
    const record = await this.refreshRepo.findOne({
      where: { userId, isRevoked: false },
    });
    if (!record) throw new UnauthorizedException('Invalid refresh token');

    const valid = await bcrypt.compare(rawToken, record.token);
    if (!valid || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    await this.refreshRepo.delete({ userId });
    const tokens = await this.generateTokens(user);
    return { message: 'Token refreshed', data: tokens };
  }

  async logout(userId: string) {
    if (userId && userId.trim() !== '') {
      await this.refreshRepo.delete({ userId });
    }
    return { message: 'Logged out successfully' };
  }

  async handleOAuthLogin(profile: OAuthProfile) {
    let user = await this.userRepo.findOne({ where: { email: profile.email } });

    if (!user) {
      user = this.userRepo.create({
        email: profile.email,
        fullName: profile.fullName,
        avatar: profile.avatar,
        googleId: profile.googleId,
        provider: AuthProvider.GOOGLE,
        isEmailVerified: true,
      });
      await this.userRepo.save(user);
    } else if (!user.googleId) {
      user.googleId = profile.googleId;
      user.isEmailVerified = true;
      if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
      await this.userRepo.save(user);
    }

    return user;
  }

  async generateTokensForUser(user: User) {
    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('jwt.accessSecret'),
        expiresIn: this.config.get('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: this.config.get('jwt.refreshExpiresIn'),
      }),
    ]);

    const hashed = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshRepo.delete({ userId: user.id });
    await this.refreshRepo.save(
      this.refreshRepo.create({ userId: user.id, token: hashed, expiresAt }),
    );

    return { accessToken, refreshToken };
  }
}
