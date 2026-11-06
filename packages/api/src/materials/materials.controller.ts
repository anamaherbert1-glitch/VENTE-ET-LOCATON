import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { MaterialStatus } from '@prisma/client';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un matériau (brouillon)' })
  create(@Request() req: any, @Body() dto: CreateMaterialDto) {
    return this.materialsService.create(req.user.id, dto);
  }


  @Get('mine')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes matériaux (tous statuts)' })
  findMine(@Request() req: any) {
    return this.materialsService.findMine(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des matériaux publiés' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  findAll(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.materialsService.findAll({
      status: MaterialStatus.PUBLISHED,
      category,
      city,
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un matériau + passeport' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    return this.materialsService.findOne(id, userId);
  }

  @Patch(':id/publish')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier un matériau' })
  publish(@Param('id') id: string, @Request() req: any) {
    return this.materialsService.publish(id, req.user.id);
  }
}
