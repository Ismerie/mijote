import type { Aisle } from "./aisles";
import { type Unit } from "./units";

// Comment on achète un ingrédient (type `purchase_mode` de la base).
export type PurchaseMode = "weight" | "piece" | "pack";

// Un ingrédient du catalogue du foyer.
export type Ingredient = {
  id: string;
  name: string;
  aisle: Aisle;
  purchaseMode: PurchaseMode;
  packName: string | null;
  packSize: number | null;
  packUnit: Unit | null;
  alwaysInStock: boolean;
};

// Ligne telle que renvoyée par Supabase (colonnes en snake_case).
export type IngredientRow = {
  id: string;
  name: string;
  aisle: Aisle;
  purchase_mode: PurchaseMode;
  pack_name: string | null;
  pack_size: number | string | null;
  pack_unit: Unit | null;
  always_in_stock: boolean;
};

export const INGREDIENT_COLUMNS =
  "id, name, aisle, purchase_mode, pack_name, pack_size, pack_unit, always_in_stock";

export function toIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    aisle: row.aisle,
    purchaseMode: row.purchase_mode,
    packName: row.pack_name,
    packSize: row.pack_size === null ? null : Number(row.pack_size),
    packUnit: row.pack_unit,
    alwaysInStock: row.always_in_stock,
  };
}
