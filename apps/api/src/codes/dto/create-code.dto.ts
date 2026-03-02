import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCodeDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  code?: string;
}
