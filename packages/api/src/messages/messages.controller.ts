import {
  Controller, Get, Post, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message' })
  send(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.messagesService.send(req.user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Liste des conversations' })
  conversations(@Request() req: any) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de messages non lus' })
  unreadCount(@Request() req: any) {
    return this.messagesService.getUnreadCount(req.user.id);
  }

  @Get('thread/:partnerId')
  @ApiOperation({ summary: 'Conversation avec un utilisateur' })
  thread(@Request() req: any, @Param('partnerId') partnerId: string) {
    return this.messagesService.getThread(req.user.id, partnerId);
  }
}
