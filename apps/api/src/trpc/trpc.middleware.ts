import { Injectable, NestMiddleware } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Request, Response, NextFunction } from 'express';
import { TrpcService } from './trpc.service.js';
import { createContext } from './trpc.init.js';

@Injectable()
export class TrpcMiddleware implements NestMiddleware {
  constructor(private readonly trpcService: TrpcService) {}

  use(req: Request, res: Response, next: NextFunction) {
    return createExpressMiddleware({
      router: this.trpcService.appRouter,
      createContext,
    })(req, res, next);
  }
}
