import { IsInt, IsString, Min } from 'class-validator';

export class AddCocktailIngredientDto {
  @IsString()
  ingredientId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  unity!: string;
}
