import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

type SupabaseUser = {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, unknown>;
};

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string | null;
    phone: string | null;
    fullName: string | null;
  };
};

/**
 * Validates Supabase access tokens against the Auth server.
 * No second JWT issuer, password store, or refresh-token store exists in NestJS.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly supabaseUrl: string;
  private readonly publishableKey: string;

  constructor(config: ConfigService) {
    this.supabaseUrl = config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    this.publishableKey =
      config.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
      config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton Supabase requis.');
    }

    const accessToken = authorization.slice('Bearer '.length).trim();
    if (!accessToken) {
      throw new UnauthorizedException('Jeton Supabase invalide.');
    }

    let response: Response;
    try {
      response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          apikey: this.publishableKey,
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Le service Supabase Auth est temporairement indisponible.',
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('Session Supabase invalide ou expirée.');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Impossible de vérifier la session auprès de Supabase Auth.',
      );
    }

    const user = (await response.json()) as SupabaseUser;
    if (!user?.id) {
      throw new UnauthorizedException('Identité Supabase invalide.');
    }

    const metadata = user.user_metadata ?? {};
    const fullName =
      typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : null;

    request.user = {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      fullName,
    };

    return true;
  }
}
