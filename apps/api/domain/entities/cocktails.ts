export type CocktailRow = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CocktailIngredientView = {
  id: string;
  ingredientId: string;
  name: string;
  stock: boolean;
  quantity: number;
  unity: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CocktailView = CocktailRow & {
  ingredients: CocktailIngredientView[];
};

export type CocktailIngredientLinkRow = {
  id: string;
  cocktailId: string;
  ingredientId: string;
  quantity: number;
  unity: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CocktailIngredientListItem = {
  id: string;
  cocktailId: string;
  ingredientId: string;
  quantity: number;
  unity: string;
  createdAt: Date;
  updatedAt: Date;
  ingredientName: string;
  ingredientStock: boolean;
};

export type DeleteMessage = {
  message: string;
};
