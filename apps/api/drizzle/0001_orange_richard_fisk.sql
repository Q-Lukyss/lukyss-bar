ALTER TABLE "ingredients"
  ALTER COLUMN "stock" TYPE boolean
  USING (stock <> 0);
