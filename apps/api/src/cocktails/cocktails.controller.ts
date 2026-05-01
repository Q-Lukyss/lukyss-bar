import { Controller, UseGuards } from '@nestjs/common';
import { TypedBody, TypedFormData, TypedParam, TypedRoute } from '@nestia/core';

import { CocktailsService } from './cocktails.service';
import { CocktailImagesService } from './cocktails-images.service';
import { AddCocktailIngredientDto } from './dto/add-cocktail-ingredient.dto';
import { UpdateCocktailIngredientDto } from './dto/update-cocktail-ingredient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import Multer from 'multer';

import type {
  CocktailIngredientLinkRow,
  CocktailIngredientListItem,
  CocktailRow,
  CocktailView,
  DeleteMessage,
} from '../../domain/entities/cocktails';
import type {
  CreateCocktailFormData,
  UpdateCocktailFormData,
} from './cocktails.form-types';

@Controller('cocktails')
export class CocktailsController {
  constructor(
    private readonly service: CocktailsService,
    private readonly imagesService: CocktailImagesService,
  ) {}

  @TypedRoute.Get()
  list(): Promise<CocktailRow[]> {
    return this.service.list();
  }

  @TypedRoute.Get(':id')
  getById(@TypedParam('id') id: string): Promise<CocktailView> {
    return this.service.getById(id);
  }

  @TypedRoute.Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(
    @TypedFormData.Body(() => Multer()) input: CreateCocktailFormData,
  ): Promise<CocktailRow> {
    const imagePath = await this.imagesService.saveImage(input.image ?? null);

    return this.service.create({
      name: input.name,
      price: input.price,
      description: input.description ?? null,
      image: imagePath,
    });
  }

  @TypedRoute.Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(
    @TypedParam('id') id: string,
    @TypedFormData.Body(() => Multer()) input: UpdateCocktailFormData,
  ): Promise<CocktailRow> {
    const imagePath =
      input.image !== undefined
        ? await this.imagesService.saveImage(input.image)
        : undefined;

    return this.service.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(imagePath !== undefined ? { image: imagePath } : {}),
    });
  }

  @TypedRoute.Get(':cocktailId/ingredients')
  getCocktailIngredients(
    @TypedParam('cocktailId') cocktailId: string,
  ): Promise<CocktailIngredientListItem[]> {
    return this.service.getCocktailIngredients(cocktailId);
  }

  @TypedRoute.Post(':cocktailId/ingredients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  addIngredient(
    @TypedParam('cocktailId') cocktailId: string,
    @TypedBody() dto: AddCocktailIngredientDto,
  ): Promise<CocktailIngredientLinkRow> {
    return this.service.addIngredientToCocktail(cocktailId, dto);
  }

  @TypedRoute.Patch(':cocktailId/ingredients/:cocktailIngredientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateIngredient(
    @TypedParam('cocktailId') cocktailId: string,
    @TypedParam('cocktailIngredientId') cocktailIngredientId: string,
    @TypedBody() dto: UpdateCocktailIngredientDto,
  ): Promise<CocktailIngredientLinkRow> {
    return this.service.updateCocktailIngredient(
      cocktailId,
      cocktailIngredientId,
      dto,
    );
  }

  @TypedRoute.Delete(':cocktailId/ingredients/:cocktailIngredientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteIngredient(
    @TypedParam('cocktailId') cocktailId: string,
    @TypedParam('cocktailIngredientId') cocktailIngredientId: string,
  ): Promise<DeleteMessage> {
    return this.service.deleteCocktailIngredient(
      cocktailId,
      cocktailIngredientId,
    );
  }
}
