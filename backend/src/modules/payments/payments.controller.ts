import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  RawBody,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session')
  @Auth()
  @ApiOperation({ summary: 'Create a Stripe Checkout Session for booking payment' })
  @ApiResponse({ status: 201, description: 'Checkout session created, returns clientSecret and bookingId' })
  @ApiResponse({ status: 400, description: 'Validation failed (invalid dates, unavailable, etc.)' })
  @ApiResponse({ status: 404, description: 'Listing or coupon not found' })
  async createCheckoutSession(
    @CurrentUser() user: User,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckoutSession(user.id, dto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook endpoint — receives payment events' })
  @ApiResponse({ status: 200, description: 'Webhook event received and processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
