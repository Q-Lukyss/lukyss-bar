import { Module } from '@nestjs/common';
import { CocktailsController } from './cocktails.controller';
import { CocktailsService } from './cocktails.service';
import { DbModule } from '../db/db.module';
import { CocktailImagesService } from './cocktails-images.service';

@Module({
  imports: [DbModule],
  controllers: [CocktailsController],
  providers: [CocktailsService, CocktailImagesService],
})
export class CocktailsModule {}
