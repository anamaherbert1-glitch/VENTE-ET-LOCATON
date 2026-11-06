import { Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * CinetPay webhook volontairement fermé tant que le flux de paiement complet
 * (checkout serveur, transaction persistée, vérification CinetPay et idempotence)
 * n'est pas configuré.
 *
 * Important : aucune donnée envoyée par le navigateur ou le webhook ne peut
 * activer un abonnement.
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  @Post('payment')
  @ApiOperation({ summary: 'Webhook CinetPay (désactivé jusqu’à intégration sécurisée)' })
  paymentWebhook(): never {
    throw new ServiceUnavailableException(
      'Le traitement CinetPay est temporairement désactivé. Aucun abonnement n’a été activé.',
    );
  }
}
