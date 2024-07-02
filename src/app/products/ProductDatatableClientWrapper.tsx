'use client'
import React, { useState } from 'react';
import Datatable from '../../components/Datatable/Datatable';
import { DatatableProps } from '../../utils/types/datatableTypes';


const ProductDatatableClientWrapper = ({ headers, items}: DatatableProps) => {
    const [selectedItems, setSelectedItems] = useState(new Set());
    
    const handleSelectedItemsChange = (selectedItems: Set<number>) => {
        setSelectedItems(selectedItems);
        console.log("Selected Items:", selectedItems);
    };

    const handleDelete = async () => {
        const response = await fetch('/api/products/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: Array.from(selectedItems) }),
        });

        if (response.ok) {
            console.log('Products deleted successfully');
        } else {
            console.error('Error deleting products');
        }
    };

    
    return (
        <>
            <Datatable headers={headers} items={items} onSelectedItemsChange={handleSelectedItemsChange} />
            {/* <button onClick={handleDelete}>Delete Selected Items</button> */}
        </>
    );
};

export default ProductDatatableClientWrapper;