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

  async send(payload: SendMailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[Email skipped – SMTP not configured] "${payload.subject}" → ${payload.to}`);
      return;
    }
    try {
      const from = this.config.get<string>('email.from');
      await this.transporter.sendMail({ from, ...payload });
      this.logger.log(`Email sent: "${payload.subject}" → ${payload.to}`);
    } catch (err) {
      this.logger.error(`Email failed for ${payload.to}: ${err.message}`);
    }
  }
}
