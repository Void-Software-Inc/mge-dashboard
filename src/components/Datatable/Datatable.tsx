"use client"
import React, { useState } from 'react';
import { DatatableProps } from '../../utils/types/datatableTypes';
import Image from 'next/image';

interface DatatableComponentProps extends DatatableProps {
    onSelectedItemsChange: (selectedItems: Set<number>) => void;
}

const Datatable: React.FC<DatatableComponentProps> = ({ headers, items, onSelectedItemsChange }) => {
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

    const toggleItemSelection = (id: number) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedItems(newSelection);
        onSelectedItemsChange(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
            onSelectedItemsChange(new Set());
        } else {
            const newSelection = new Set<number>();
            items.forEach(item => newSelection.add(item.id));
            setSelectedItems(newSelection);
            onSelectedItemsChange(newSelection);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const lastItemIndex = currentPage * itemsPerPage;
    const firstItemIndex = lastItemIndex - itemsPerPage;
    const currentItems = items.slice(firstItemIndex, lastItemIndex);

    const renderHeaders = () => (
        <tr>
            <th className='px-4 py-2 font-medium text-gray-900'>
                <input
                    type="checkbox"
                    checked={selectedItems.size === currentItems.length}
                    onChange={toggleSelectAll}
                    className='accent-gray-300'
                />
            </th>
            {headers.map((header, index) => (
                <th className='saira whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-start' key={index}>{header.title}</th>
            ))}
        </tr>
    );

    const renderItems = () => (
        currentItems.map((item, index) => (
            <tr key={index} className="h-28">
                <td className='px-4 py-2 text-gray-700 border-b border-gray-200'>
                    <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className='accent-gray-300'
                    />
                </td>
                {headers.map((header, headerIndex) => (
                    <td className='saira whitespace-nowrap px-4 py-2 text-gray-700 text-start border-b border-gray-200' key={headerIndex}>
                        {header.value === 'image_url' ? (
                            <Image
                                src={item[header.value]}
                                alt="Product Image"
                                width={100}
                                height={100}
                            />
                        ) : (
                            item[header.value]
                        )}
                    </td>
                ))}
            </tr>
        ))
    );

    const nextPage = () => {
        setCurrentPage(prev => prev + 1);
    };

    const prevPage = () => {
        setCurrentPage(prev => prev > 1 ? prev - 1 : 1);
    };

    const increaseItemsPerPage = () => {
        setItemsPerPage(prev => prev + 10);
    };

    return (
        <div className="w-[90vw]">
            <div className="overflow-x-auto rounded-t-md h-[70vh] bg-white">
                <table className='min-w-full divide-y-2 divide-gray-200 bg-white text-sm'>
                    <thead className='bg-gray-200 sticky top-0'>
                        {renderHeaders()}
                    </thead>
                    <tbody>
                        {renderItems()}
                    </tbody>
                </table>
            </div>
            <div className="rounded-b-md border-t border-gray-200 bg-white px-4 py-2">
                <button onClick={prevPage}>Previous</button>
                <button onClick={nextPage}>Next</button>
                <button onClick={increaseItemsPerPage}>More Items Per Page</button>
            </div>
        </div>
    );
};

export default Datatable;