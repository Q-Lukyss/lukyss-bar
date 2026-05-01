import { Controller, UseGuards } from '@nestjs/common';
import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';

import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateCommandeStatusDto } from './dto/update-commande-status.dto';
import type {
  CommandeRow,
  CommandeView,
} from '../../domain/entities/commandes';

@Controller('commandes')
export class CommandesController {
  constructor(private readonly service: CommandesService) {}

  @TypedRoute.Post()
  create(@TypedBody() dto: CreateCommandeDto): Promise<CommandeView> {
    return this.service.create(dto);
  }

  @TypedRoute.Get('public/:token')
  getByPublicToken(@TypedParam('token') token: string): Promise<CommandeView> {
    return this.service.getByPublicToken(token);
  }

  @TypedRoute.Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAll(): Promise<CommandeRow[]> {
    return this.service.listAll();
  }

  @TypedRoute.Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@TypedParam('id') id: string): Promise<CommandeView> {
    return this.service.getById(id);
  }

  @TypedRoute.Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@TypedParam('id') id: string): Promise<{ message: string }> {
    return this.service.delete(id);
  }

  @TypedRoute.Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(
    @TypedParam('id') id: string,
    @TypedBody() dto: UpdateCommandeStatusDto,
  ): Promise<CommandeRow> {
    return this.service.updateStatus(id, dto.status);
  }
}
