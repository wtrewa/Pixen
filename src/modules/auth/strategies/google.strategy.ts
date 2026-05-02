import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('app.google.clientId') || 'GOOGLE_CLIENT_ID_NOT_CONFIGURED',
      clientSecret: config.get<string>('app.google.clientSecret') || 'GOOGLE_CLIENT_SECRET_NOT_CONFIGURED',
      callbackURL: config.get<string>('app.google.callbackUrl') || 'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });

    const clientID = config.get<string>('app.google.clientId');
    const clientSecret = config.get<string>('app.google.clientSecret');

    if (!clientID || !clientSecret) {
      Logger.warn(
        'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth2 disabled',
        'GoogleStrategy',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { name, emails, photos } = profile;
    const user = await this.authService.handleOAuthLogin({
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName ?? ''}`.trim(),
      avatar: photos?.[0]?.value ?? null,
      googleId: profile.id,
    });
    done(null, user);
  }
}
