import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCocktailDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}
