import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { CodesController } from './codes.controller';
import { CodesService } from './codes.service';

@Module({
  imports: [DbModule],
  controllers: [CodesController],
  providers: [CodesService],
})
export class CodesModule {}
