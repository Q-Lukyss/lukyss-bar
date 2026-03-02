import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCocktailDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  image?: string | null;

  @IsInt()
  @Min(0)
  price!: number;
}
