import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const DB = Symbol('DB');

@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) throw new Error('DATABASE_URL est manquant dans env');

        const pool = new Pool({ connectionString: url });
        return drizzle(pool);
      },
    },
  ],
  exports: [DB],
})
export class DbModule {}
