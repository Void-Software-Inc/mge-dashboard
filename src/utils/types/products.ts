export type Product = {
    id: number
    name: string,
    type: string,
    color: string,
    stock: number,
    ttc_price: number,
    ht_price: number,
    description: string,
    image_url: string,
    category: string,
    created_at: string,
    last_update: string,
}

export type ProductRecord = {
    id: number
    name: string,
    type: string,
    color: string,
    stock: number,
    ttc_price: number,
    ht_price: number,
    description: string,
    image_url: string,
    category: string,
    deleted_at: string,
}

export type ProductImage = {
    id: number;
    product_id: number;
    url: string;
}

export type ProductType = {
    value: string;
    name: string;
    category: string;
};

export const productTypes: ProductType[] = [
    { value: "tables", name: "Tables", category: "decoration" },
    { value: "chaises", name: "Chaises", category: "decoration" },
    { value: "nappes", name: "Nappes", category: "decoration" },
    { value: "housses", name: "Housses", category: "decoration" },
    { value: "chapiteau", name: "Chapiteau", category: "decoration" },
    { value: "vaiselle", name: "Vaiselle", category: "decoration" },
    { value: "vaisselleHG", name: "Vaisselle Haut de Gamme", category: "decoration" },
    { value: "centreTable", name: "Centre Table", category: "decoration" },
    { value: "decoration", name: "Decoration", category: "decoration" },
    { value: "acessoires", name: "Accessoires", category: "decoration" },
    { value: "noeudChaise", name: "Noeud de Chaise", category: "decoration" },
    { value: "entrees", name: "Entrées", category: "traiteur" },
    { value: "plats", name: "Plats principaux", category: "traiteur" },
    { value: "desserts", name: "Desserts", category: "traiteur" },
    { value: "boissons", name: "Boissons", category: "traiteur" },
    { value: "buffet", name: "Buffet", category: "traiteur" },
    { value: "cocktail", name: "Cocktail", category: "traiteur" },
    { value: "fromages", name: "Fromages", category: "traiteur" },
    { value: "mignardises", name: "Mignardises", category: "traiteur" },
    { value: "menus", name: "Menus", category: "traiteur" },
    { value: "stands", name: "Stands", category: "traiteur" },
    { value: "outils", name: "Outils", category: "interne" },
    { value: "materiel", name: "Matériel", category: "interne" },
    { value: "equipement", name: "Équipement", category: "interne" },
    { value: "uniforme", name: "Uniformes", category: "interne" },
    { value: "fournitures", name: "Fournitures", category: "interne" },
    { value: "transport", name: "Transport", category: "interne" },
    { value: "nettoyage", name: "Nettoyage", category: "interne" },
    { value: "securite", name: "Sécurité", category: "interne" },
    { value: "autre", name: "Autre", category: "interne" },
];

export type ProductColor = {
    value: string;
    name: string;
    hex: string;
}

export const productColors: ProductColor[] = [
    { value: "noir", name: "Noir", hex: "#000000" },
    { value: "marron", name: "Marron", hex: "#8B4513" },
    { value: "beige", name: "Beige", hex: "#F5F5DC" },
    { value: "gris", name: "Gris", hex: "#808080" },
    { value: "blanc", name: "Blanc", hex: "#FFFFFF" },
    { value: "bleu", name: "Bleu", hex: "#3b82f6" },
    { value: "turquoise", name: "Turquoise", hex: "#40E0D0" },
    { value: "vert", name: "Vert", hex: "#008000" },
    { value: "jaune", name: "Jaune", hex: "#FFFF00" },
    { value: "orange", name: "Orange", hex: "#FFA500" },
    { value: "rouge", name: "Rouge", hex: "#FF0000" },
    { value: "rose", name: "Rose", hex: "#FFE4E1" },
    { value: "violet", name: "Violet", hex: "#800080" },
    { value: "gold", name: "Doré", hex: "#FFD700" },
    { value: "silver", name: "Argenté", hex: "#C0C0C0" },
    { value: "multicolore", name: "Multicolore", hex: "#000000" },
    { value: "transparent", name: "Transparent", hex: "#FFFFFF" },
    { value: "sans", name: "Sans", hex: "#B5B5B4" },
]

export type ProductCategory = {
    value: string;
    name: string;
};

export const productCategories: ProductCategory[] = [
    { value: "decoration", name: "Décoration" },
    { value: "traiteur", name: "Traiteur" },
    { value: "interne", name: "Interne" },
];