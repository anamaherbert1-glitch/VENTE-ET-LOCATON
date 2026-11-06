import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { memoryStorage } from 'multer';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('materials/:materialId')
  @ApiOperation({ summary: 'Uploader une photo pour un matériau' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @Request() req: any,
    @Param('materialId') materialId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadForMaterial(req.user.id, materialId, file);
  }

  @Get('materials/:materialId')
  @ApiOperation({ summary: 'Liste des médias d\'un matériau' })
  list(@Param('materialId') materialId: string) {
    return this.mediaService.listForMaterial(materialId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un média' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.mediaService.delete(req.user.id, id);
  }
}
