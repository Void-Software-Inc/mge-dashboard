export type Product = {
    id: number
    name: string,
    type: string,
    color: string,
    stock: number,
    price: number,
    description: string,
    image_url: string,
    created_at: string,
    last_update: string,
}

export type ProductImage = {
    id: number;
    product_id: number;
    url: string;
}

export type ProductType = {
    value: string;
    name: string;
};

export const productTypes: ProductType[] = [
    { value: "tables", name: "Tables" },
    { value: "chaises", name: "Chaises" },
    { value: "nappes", name: "Nappes" },
    { value: "housses", name: "Housses" },
    { value: "chapiteau", name: "Chapiteau" },
    { value: "vaiselle", name: "Vaiselle" },
    { value: "centreTable", name: "Centre Table" },
    { value: "decoration", name: "Decoration" },
    { value: "acessoires", name: "Acessoires" },
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
    { value: "bleu", name: "Bleu", hex: "#0000FF" },
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
]