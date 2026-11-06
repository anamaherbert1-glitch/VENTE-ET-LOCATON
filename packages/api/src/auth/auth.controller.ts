import { Controller, GoneException, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Post('register')
  @ApiOperation({ summary: 'Inscription gérée exclusivement par Supabase Auth' })
  register(): never {
    throw new GoneException(
      'Inscription désactivée sur cette API. Utilisez Supabase Auth depuis l’application BUILDTRACE.',
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion gérée exclusivement par Supabase Auth' })
  login(): never {
    throw new GoneException(
      'Connexion désactivée sur cette API. Utilisez Supabase Auth depuis l’application BUILDTRACE.',
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renouvellement de session géré par Supabase Auth' })
  refresh(): never {
    throw new GoneException(
      'Renouvellement désactivé sur cette API. Utilisez le refresh token géré par Supabase Auth.',
    );
  }
}
