import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { CocktailsModule } from './cocktails/cocktails.module';
import { CodesModule } from './codes/codes.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommandesModule } from './commandes/commandes.module';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ".env", // optionnel (par défaut il lit .env)
    }),
    DbModule,
    AuthModule,
    CocktailsModule,
    CodesModule,
    IngredientsModule,
    CommandesModule,
    TrpcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
