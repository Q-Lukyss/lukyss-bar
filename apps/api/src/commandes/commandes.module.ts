import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { CommandesController } from './commandes.controller';
import { CommandesService } from './commandes.service';

@Module({
  imports: [DbModule],
  controllers: [CommandesController],
  providers: [CommandesService],
})
export class CommandesModule {}
