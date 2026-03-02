import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Bienvenue dans mon Bar, le LukyssBar!',
      author: 'Quentin Lachery',
      routes: {
        cocktails: '/cocktails pour la liste des cocktails',
        ingredients: '/ingredients pour la liste des ingrédients',
      },
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }
}
