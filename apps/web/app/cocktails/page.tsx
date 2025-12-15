export default function Cocktails() {
  const cocktails = ["mojito", "margarita"];

  return (
    <div>
      <h1 className="text-amber-600 font-monoton">Liste desCocktails</h1>
      <ul>
        {cocktails.map((cocktail) => (
          <li key={cocktail}>{cocktail}</li>
        ))}
      </ul>
    </div>
  );
}
