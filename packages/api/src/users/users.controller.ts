import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté' })
  getMe(@Request() req: any) {
    return this.usersService.getMe(req.user.id);
  }
}
