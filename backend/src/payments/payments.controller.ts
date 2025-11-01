import { Controller, Post, Get, Delete, Body, UseGuards, Request, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@ApiTags('payments')
@Controller('api/pay')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session for subscription' })
  async createCheckoutSession(
    @Request() req,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckoutSession(
      req.user.userId,
      createCheckoutSessionDto.planType,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, request.rawBody);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription status' })
  async getSubscriptionStatus(@Request() req) {
    return this.paymentsService.getSubscriptionStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscription/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@Request() req) {
    return this.paymentsService.cancelSubscription(req.user.userId);
  }
}
