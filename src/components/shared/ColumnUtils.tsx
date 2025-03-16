import { productCategories, productColors, productTypes } from "@/utils/types/products"

// Helper function for getting display column names
export const getDisplayColumnName = (columnId: string): string => {
  const columnNames: Record<string, string> = {
    // Product columns
    name: "Nom",
    category: "Catégorie",
    type: "Type",
    color: "Couleur",
    stock: "Stock",
    price: "Prix",
    description: "Description",
    
    // Client columns
    email: "Email",
    phone: "Téléphone",
    company: "Entreprise",
    address: "Adresse",
    city: "Ville",
    postal_code: "Code Postal",
    country: "Pays",
    created_at: "Date de création",
  };
  
  return columnNames[columnId] || columnId;
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