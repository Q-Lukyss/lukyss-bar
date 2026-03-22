import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCocktailIngredientDto {
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  unity?: string;
}
