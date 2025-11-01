import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-10-29.clover',
    });
  }

  async createCheckoutSession(userId: string, planType: 'monthly' | 'annual') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const priceId = planType === 'monthly'
      ? this.configService.get<string>('STRIPE_MONTHLY_PRICE_ID')
      : this.configService.get<string>('STRIPE_ANNUAL_PRICE_ID');

    const session = await this.stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/subscription/cancel`,
      metadata: {
        userId,
        planType,
      },
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const { userId, planType } = session.metadata;
    const subscriptionId = session.subscription as string;

    await this.prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: session.customer as string,
        planType,
        status: 'ACTIVE',
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const status = subscription.status === 'active' ? 'ACTIVE' :
                   subscription.status === 'canceled' ? 'CANCELLED' :
                   subscription.status === 'past_due' ? 'PAST_DUE' : 'EXPIRED';

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
      },
    });
  }

  async getSubscriptionStatus(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      hasActiveSubscription: !!subscription,
      subscription,
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
      },
    });

    return { message: 'Subscription cancelled successfully' };
  }
}
