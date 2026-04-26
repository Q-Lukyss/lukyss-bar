import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { CommandesController } from './commandes.controller';
import { CommandesService } from './commandes.service';
import { CommandesGateway } from './commandes.gateway';

@Module({
  imports: [DbModule],
  controllers: [CommandesController],
  providers: [CommandesService, CommandesGateway],
})
export class CommandesModule {}
