import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {
    const secret = config.get<string>('jwt.accessSecret') || process.env.JWT_ACCESS_SECRET || 'dev_secret_key_change_in_prod';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.userRepo.findOne({ 
      where: { id: payload.sub },
      relations: ['vendor']
    });
    
    if (!user || !user.isActive) throw new UnauthorizedException();
    
    // Attach vendorId to the user object for convenience in controllers
    if (user.vendor) {
      (user as any).vendorId = user.vendor.id;
    }
    
    return user;
  }
}
