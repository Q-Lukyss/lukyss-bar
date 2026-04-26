import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TrpcService } from './trpc.service.js';
import { TrpcMiddleware } from './trpc.middleware.js';
import { CocktailsModule } from '../cocktails/cocktails.module.js';

@Module({
  imports: [CocktailsModule],
  providers: [TrpcService, TrpcMiddleware],
})
export class TrpcModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TrpcMiddleware).forRoutes('/trpc');
  }
}
