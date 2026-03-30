import { Controller, UseGuards } from '@nestjs/common';
import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';

import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IngredientRow } from 'domain/entities/ingredients';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  @TypedRoute.Get()
  list(): Promise<IngredientRow[]> {
    return this.service.list();
  }

  @TypedRoute.Get(':id')
  getById(@TypedParam('id') id: string): Promise<IngredientRow> {
    return this.service.getById(id);
  }

  @TypedRoute.Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@TypedBody() dto: CreateIngredientDto): Promise<IngredientRow> {
    return this.service.create(dto);
  }

  @TypedRoute.Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @TypedParam('id') id: string,
    @TypedBody() dto: UpdateIngredientDto,
  ): Promise<IngredientRow> {
    return this.service.update(id, dto);
  }

  @TypedRoute.Patch(':id/in-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  inStock(@TypedParam('id') id: string): Promise<IngredientRow> {
    return this.service.setInStock(id);
  }

  @TypedRoute.Patch(':id/out-of-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  outOfStock(@TypedParam('id') id: string): Promise<IngredientRow> {
    return this.service.setOutOfStock(id);
  }

  @TypedRoute.Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@TypedParam('id') id: string): Promise<IngredientRow> {
    return this.service.delete(id);
  }
}
