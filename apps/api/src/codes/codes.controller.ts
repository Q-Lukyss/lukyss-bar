import { Controller, UseGuards } from '@nestjs/common';

import { CodesService } from './codes.service';
import { CreateCodeDto } from './dto/create-code.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';
import { CodeRow } from 'domain/entities/code';

@Controller('codes')
export class CodesController {
  constructor(private readonly service: CodesService) {}

  @TypedRoute.Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@TypedBody() dto: CreateCodeDto): Promise<CodeRow> {
    return this.service.create(dto.code);
  }

  @TypedRoute.Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@TypedParam('id') id: string): Promise<CodeRow> {
    return this.service.deleteById(id);
  }

  @TypedRoute.Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  list(): Promise<CodeRow[]> {
    return this.service.list();
  }
}
