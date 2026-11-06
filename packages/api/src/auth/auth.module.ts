import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

/**
 * Supabase Auth is the only identity provider for BUILDTRACE.
 * NestJS validates Supabase access tokens and never issues its own tokens.
 */
@Module({
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
