import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmailService } from './infrastructure/email/email.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);
  const recipient = 'sauarbh.pandey@pucho.ai';

  console.log(`🚀 Starting Full Email Suite Test for: ${recipient}`);
  
  try {
    // 1. OTP Email
    console.log('Sending OTP Email...');
    await emailService.sendOtpEmail(recipient, '882200');
    
    // 2. Welcome Email
    console.log('Sending Welcome Email...');
    await emailService.sendWelcomeEmail(recipient, 'Saurabh Pandey');
    
    // 3. Gallery Delivery Email
    console.log('Sending Gallery Delivery Email...');
    await emailService.sendGalleryDeliveryEmail(
      recipient, 
      'Royal Wedding: Ansh & Diya', 
      'http://localhost:3002/gallery/test-uuid'
    );

    console.log('✅ All test emails dispatched successfully!');
  } catch (err) {
    console.error('❌ Email Suite Test failed:', err);
  }

  await app.close();
}

bootstrap();
