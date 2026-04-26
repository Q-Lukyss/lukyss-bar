import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { router, publicProcedure } from './trpc.init.js';
import { CocktailsService } from '../cocktails/cocktails.service.js';

@Injectable()
export class TrpcService {
  readonly appRouter: ReturnType<typeof this.createRouter>;

  constructor(private readonly cocktailsService: CocktailsService) {
    this.appRouter = this.createRouter();
  }

  private createRouter() {
    return router({
      cocktails: router({
        list: publicProcedure.query(() => this.cocktailsService.list()),
        getById: publicProcedure
          .input(z.object({ id: z.string() }))
          .query(({ input }) => this.cocktailsService.getById(input.id)),
      }),
    });
  }
}

export type AppRouter = TrpcService['appRouter'];
