export default function CocktailDetail() {
  const cocktail = {
    name: "Mojito",
    ingredients: ["Rhum", "Citron", "Sucre"],
  };

  return (
    <div>
      <h1 className="text-amber-600 font-monoton">
        Cocktail : {cocktail.name}
      </h1>
      <div>
        <h2>Ingrédients</h2>
        <ul>
          {cocktail.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
