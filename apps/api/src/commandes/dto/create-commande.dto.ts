import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateCommandeItemDto {
  @IsString()
  cocktailId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateCommandeDto {
  @IsString()
  customerName!: string;

  @IsString()
  promoCode!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCommandeItemDto)
  items!: CreateCommandeItemDto[];
}
