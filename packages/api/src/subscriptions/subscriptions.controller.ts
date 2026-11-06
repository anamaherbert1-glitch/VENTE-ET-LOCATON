import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from '@prisma/client';

import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Liste des plans disponibles' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon abonnement actuel' })
  getMine(@Request() req: any) {
    return this.subscriptionsService.getMySubscription(req.user.id);
  }

  @Post('checkout')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier un paiement d\'abonnement (CinetPay)' })
  checkout(@Request() req: any, @Body('plan') plan: SubscriptionPlan) {
    return this.subscriptionsService.createCheckout(req.user.id, plan);
  }
}
