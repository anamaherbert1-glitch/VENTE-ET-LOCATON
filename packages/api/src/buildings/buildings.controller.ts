import {
  Controller, Get, Post, Body, Param, Patch, UseGuards, Request,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';

@ApiTags('Buildings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('buildings')
export class BuildingsController {
  constructor(private buildingsService: BuildingsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un bâtiment' })
  create(@Request() req: any, @Body() dto: CreateBuildingDto) {
    return this.buildingsService.create(req.user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Mes bâtiments' })
  findMine(@Request() req: any) {
    return this.buildingsService.findMyBuildings(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un bâtiment' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.buildingsService.findOne(id, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un bâtiment' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: CreateBuildingDto,
  ) {
    return this.buildingsService.update(id, req.user.id, dto);
  }
}
