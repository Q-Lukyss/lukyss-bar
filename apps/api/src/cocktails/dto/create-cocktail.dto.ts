import { IsInt, IsString, Min } from 'class-validator';

export class CreateCocktailDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  price!: number;
}
