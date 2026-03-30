export type CreateCocktailFormData = {
  name: string;
  price: number;
  image?: File | null;
};

export type UpdateCocktailFormData = {
  name?: string;
  price?: number;
  image?: File | null;
};
