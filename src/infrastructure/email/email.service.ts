import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendMailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('email.host');
    const user = config.get<string>('email.user');
    const pass = config.get<string>('email.pass');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('email.port'),
        secure: config.get<boolean>('email.secure'),
        auth: { user, pass },
      });
    }
  }

  private getLayout(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0F0F0F; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F0F0F;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #1A1A1A; border-radius: 32px; overflow: hidden; border: 1px solid rgba(200,169,106,0.15);">
                  <!-- Header/Logo -->
                  <tr>
                    <td align="center" style="padding: 48px 40px 24px 40px;">
                      <div style="font-size: 24px; font-weight: 800; color: #C8A96A; letter-spacing: 4px;">PIXEN</div>
                      <div style="width: 40px; height: 1px; background-color: #C8A96A; margin: 16px auto 0; opacity: 0.3;"></div>
                    </td>
                  </tr>
                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 0 48px 48px 48px;">
                      ${content}
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 32px 48px; background-color: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.03);">
                      <p style="color: rgba(255,255,255,0.3); font-size: 11px; line-height: 1.8; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
                        &copy; ${new Date().getFullYear()} Pixen &middot; Luxury Photography Marketplace <br>
                        Elevating how the world shares its finest moments.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    this.logger.warn(`[OTP VERIFICATION] ${email} → ${otp}`);

    const content = `
      <h2 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 16px; text-align: center;">Verify Your Account</h2>
      <p style="color: rgba(255,255,255,0.5); font-size: 15px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
        Welcome to the elite circle. Please use the verification code below to secure your identity. This code expires in 15 minutes.
      </p>
      <div style="background-color: rgba(200,169,106,0.08); border: 1px dashed rgba(200,169,106,0.4); border-radius: 16px; padding: 32px; text-align: center;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 700; color: #C8A96A; letter-spacing: 12px; margin-left: 12px;">
          ${otp}
        </span>
      </div>
      <p style="color: rgba(255,255,255,0.3); font-size: 13px; margin: 32px 0 0; text-align: center;">
        If you did not request this, please disregard this transmission.
      </p>
    `;

    await this.send({
      to: email,
      subject: `[PIXEN] Verification Code: ${otp}`,
      html: this.getLayout('Verification', content),
    });
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
    this.logger.warn(`[PASSWORD RESET] ${email} → ${otp}`);

    const content = `
      <h2 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 16px; text-align: center;">Reset Your Password</h2>
      <p style="color: rgba(255,255,255,0.5); font-size: 15px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
        We received a request to reset your password. Use the code below to set a new one. This code expires in 15 minutes.
      </p>
      <div style="background-color: rgba(200,169,106,0.08); border: 1px dashed rgba(200,169,106,0.4); border-radius: 16px; padding: 32px; text-align: center;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 700; color: #C8A96A; letter-spacing: 12px; margin-left: 12px;">
          ${otp}
        </span>
      </div>
      <p style="color: rgba(255,255,255,0.3); font-size: 13px; margin: 32px 0 0; text-align: center;">
        If you did not request a password reset, please ignore this email — your password will remain unchanged.
      </p>
    `;

    await this.send({
      to: email,
      subject: '[PIXEN] Password Reset Code',
      html: this.getLayout('Password Reset', content),
    });
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    const content = `
      <h2 style="color: #FFFFFF; font-size: 26px; font-weight: 700; margin: 0 0 16px; text-align: center;">Welcome, ${fullName}</h2>
      <p style="color: rgba(255,255,255,0.6); font-size: 16px; line-height: 1.8; margin: 0 0 32px; text-align: center;">
        You have successfully joined the world's most exclusive photography marketplace. 
        Start exploring curated portfolios or showcase your own masterpieces to the world.
      </p>
      <div style="text-align: center;">
        <a href="${this.config.get('FRONTEND_URL')}/dashboard" style="display: inline-block; background-color: #C8A96A; color: #0F0F0F; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; letter-spacing: 1px; text-transform: uppercase;">
          Enter Your Workspace
        </a>
      </div>
    `;

    await this.send({
      to: email,
      subject: 'Welcome to Pixen',
      html: this.getLayout('Welcome to Pixen', content),
    });
  }

  async sendGalleryDeliveryEmail(email: string, galleryTitle: string, accessLink: string): Promise<void> {
    const content = `
      <h2 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0 0 16px; text-align: center;">Your Memories Have Arrived</h2>
      <p style="color: rgba(255,255,255,0.5); font-size: 15px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
        Your collection "<strong>${galleryTitle}</strong>" is ready for viewing. 
        Each shot has been curated to perfection. Experience them now in high resolution.
      </p>
      <div style="text-align: center;">
        <a href="${accessLink}" style="display: inline-block; background-color: #FFFFFF; color: #0F0F0F; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; letter-spacing: 1px; text-transform: uppercase;">
          View Your Gallery
        </a>
      </div>
      <p style="color: rgba(255,255,255,0.3); font-size: 13px; margin: 32px 0 0; text-align: center;">
        Secure Access Provided by Pixen Delivery Engine.
      </p>
    `;

    await this.send({
      to: email,
      subject: `Your Gallery is Ready: ${galleryTitle}`,
      html: this.getLayout('Gallery Ready', content),
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3002';
    const verifyUrl = `${frontendUrl}/auth/verify?token=${token}`;

    // Always log the URL so developers can verify accounts without real SMTP
    this.logger.warn(`[EMAIL VERIFICATION] ${email} → ${verifyUrl}`);

    await this.send({
      to: email,
      subject: 'Verify your Pixen email',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#111;color:#fff;border-radius:16px">
          <h2 style="color:#C8A96A;margin:0 0 12px">Verify your email</h2>
          <p style="color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 28px">
            Thanks for signing up for Pixen! Click the button below to verify your email address.
            This link expires in <strong style="color:#fff">24 hours</strong>.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:#C8A96A;color:#0F0F0F;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
            Verify Email Address
          </a>
          <p style="margin-top:28px;font-size:12px;color:rgba(255,255,255,0.3)">
            If you didn't create a Pixen account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async send(payload: SendMailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[Email skipped – SMTP not configured] "${payload.subject}" → ${payload.to}`);
      return;
    }
    try {
      const from = this.config.get<string>('email.from');
      await this.transporter.sendMail({ from, ...payload });
      this.logger.log(`Email sent: "${payload.subject}" → ${payload.to}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[SMTP failed] "${payload.subject}" → ${payload.to}: ${msg}`);
    }
  }
}
