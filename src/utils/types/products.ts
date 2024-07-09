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