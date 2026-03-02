import { Module } from '@nestjs/common';
import { CocktailsController } from './cocktails.controller';
import { CocktailsService } from './cocktails.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [CocktailsController],
  providers: [CocktailsService],
})
export class CocktailsModule {}
