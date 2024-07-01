export type Header = {
    title: string; 
    value: string;
    filterable: boolean; 
};

export type Item = {
    [key: string]: any;
};

export interface DatatableProps {
    headers: Header[];
    items: Item[];
}
