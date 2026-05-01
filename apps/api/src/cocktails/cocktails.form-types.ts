export type CreateCocktailFormData = {
  name: string;
  price: number;
  description?: string | null;
  image?: File | null;
};

export type UpdateCocktailFormData = {
  name?: string;
  price?: number;
  description?: string | null;
  image?: File | null;
};
