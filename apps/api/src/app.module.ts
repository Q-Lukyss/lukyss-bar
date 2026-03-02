import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { CocktailsModule } from './cocktails/cocktails.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ".env", // optionnel (par défaut il lit .env)
    }),
    DbModule,
    AuthModule,
    CocktailsModule,
  ],
})
export class AppModule {}
