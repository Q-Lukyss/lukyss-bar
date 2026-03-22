import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateCommandeItemDto {
  @IsString()
  cocktailId!: string;

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
  items!: CreateCommandeItemDto[];
}
