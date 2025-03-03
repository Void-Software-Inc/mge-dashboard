import { productCategories, productColors, productTypes } from "@/utils/types/products"

// Helper function for getting display column names
export const getDisplayColumnName = (columnId: string): string => {
  switch (columnId) {
    case "name": return "Produit";
    case "category": return "Catégorie";
    case "type": return "Type";
    case "color": return "Couleur";
    case "stock": return "Stock";
    case "price": return "Prix";
    case "description": return "Description";
    default: return columnId;
  }
};

// Helper function for getting display filter values
export const getDisplayFilterValue = (columnId: string, value: string): string => {
  if (columnId === "category") {
    const category = productCategories.find(c => c.value === value);
    return category ? category.name : value;
  }
  if (columnId === "type") {
    const type = productTypes.find(t => t.value === value);
    return type ? type.name : value;
  }
  if (columnId === "color") {
    const color = productColors.find(c => c.value === value);
    return color ? color.name : value;
  }
  return value;
}; 