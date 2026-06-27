import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    await seedService.seedBookingsAndPayments();
    console.log('Booking/payment seeding complete!');
  } catch (error) {
    console.error('Booking/payment seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
