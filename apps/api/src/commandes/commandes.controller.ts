import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateCommandeStatusDto } from './dto/update-commande-status.dto';

@Controller('commandes')
export class CommandesController {
  constructor(private readonly service: CommandesService) {}

  @Post()
  create(@Body() dto: CreateCommandeDto) {
    return this.service.create(dto);
  }

  @Get('public/:token')
  getByPublicToken(@Param('token') token: string) {
    return this.service.getByPublicToken(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAll() {
    return this.service.listAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCommandeStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
