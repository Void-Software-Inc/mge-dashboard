import React from 'react';
import { QuoteItem } from "@/utils/types/quotes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface QuoteItemListProps {
  items: QuoteItem[];
}

export function QuoteItemList({ items }: QuoteItemListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Identifiant Produit</TableHead>
          <TableHead>Quantité commandée</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.product_id}</TableCell>
            <TableCell>{item.quantity}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}