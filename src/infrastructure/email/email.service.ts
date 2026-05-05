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
