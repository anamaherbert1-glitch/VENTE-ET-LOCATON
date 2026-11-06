import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';

/** Plans BUILDTRACE — prix en XOF (FCFA) */
export const PLANS = {
  FREE: {
    plan: 'FREE' as SubscriptionPlan,
    name: 'Free',
    price: 0,
    currency: 'XOF',
    features: ['5 matériaux', 'Passeport basique', 'Recherche'],
  },
  STARTER: {
    plan: 'STARTER' as SubscriptionPlan,
    name: 'Starter',
    price: 5000,
    currency: 'XOF',
    features: ['30 matériaux', 'QR codes', 'Support email'],
  },
  PRO: {
    plan: 'PRO' as SubscriptionPlan,
    name: 'Pro',
    price: 15000,
    currency: 'XOF',
    features: ['Illimité', 'IA (50 analyses/mois)', 'Priorité support'],
  },
  BUSINESS: {
    plan: 'BUSINESS' as SubscriptionPlan,
    name: 'Business',
    price: 50000,
    currency: 'XOF',
    features: ['Multi-utilisateurs', 'IA illimitée', 'Dashboard entreprise'],
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  getPlans() {
    return Object.values(PLANS);
  }

  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    return sub ?? { plan: 'FREE', status: 'ACTIVE', price: 0 };
  }

  /**
   * Le checkout reste fermé tant que l'API CinetPay, les clés serveur et
   * l'enregistrement préalable des transactions ne sont pas opérationnels.
   * Cela évite d'afficher un faux lien de paiement ou d'accepter une activation
   * non vérifiée.
   */
  async createCheckout(userId: string, plan: SubscriptionPlan): Promise<never> {
    void userId;
    void plan;
    throw new ServiceUnavailableException(
      'Le paiement en ligne n’est pas encore configuré. Aucun paiement ne peut être lancé.',
    );
  }
}
