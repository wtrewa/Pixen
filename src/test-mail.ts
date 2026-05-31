import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmailService } from './infrastructure/email/email.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  console.log('Sending test email to sauarbh.pandey@pucho.ai...');
  
  try {
    await emailService.send({
      to: 'sauarbh.pandey@pucho.ai',
      subject: 'Pixen Test Email',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#111;color:#fff;border-radius:16px">
          <h2 style="color:#C8A96A;margin:0 0 12px">Pixen System Test</h2>
          <p style="color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 28px">
            This is a test email to verify that your SMTP configuration is working correctly.
          </p>
          <div style="padding:16px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:12px;color:rgba(255,255,255,0.4)">
            Timestamp: ${new Date().toISOString()}<br>
            Recipient: sauarbh.pandey@pucho.ai
          </div>
        </div>
      `,
    });
    console.log('✅ Test email sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send test email:', err);
  }

  await app.close();
}

bootstrap();
