import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  // PUBLIC
  @Get()
  list() {
    return this.service.list();
  }

  // PUBLIC
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  // ADMIN
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateIngredientDto) {
    return this.service.create(dto);
  }

  // ADMIN (update name/stock)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.service.update(id, dto);
  }

  // ADMIN (stock true)
  @Patch(':id/in-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  inStock(@Param('id') id: string) {
    return this.service.setInStock(id);
  }

  // ADMIN (stock false)
  @Patch(':id/out-of-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  outOfStock(@Param('id') id: string) {
    return this.service.setOutOfStock(id);
  }

  // ADMIN
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
