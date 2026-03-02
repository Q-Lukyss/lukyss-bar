import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @Length(1, 64)
  name!: string;

  @IsOptional()
  @IsBoolean()
  stock?: boolean;
}
