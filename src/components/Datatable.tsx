"use client"
import React, { useState } from 'react';
import {  DatatableProps } from '../utils/types/datatableTypes';
import Image from 'next/image';

const Datatable: React.FC<DatatableProps> = ({ headers, items }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const lastItemIndex = currentPage * itemsPerPage;
    const firstItemIndex = lastItemIndex - itemsPerPage;
    const currentItems = items.slice(firstItemIndex, lastItemIndex);

    const renderHeaders = () => (
        <tr>
            {headers.map((header, index) => (
                <th className='text-black' key={index}>{header.title}</th>
            ))}
        </tr>
    );

    const renderItems = () => (
        currentItems.map((item, index) => (
            <tr key={index}>
                {headers.map((header, headerIndex) => (
                    <td key={headerIndex}>
                        {header.value === 'image_url' ? (
                            <Image
                                src={item[header.value]}
                                alt="Product Image"
                                width={100} // Set desired width
                                height={100} // Set desired height
                                objectFit="cover"
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
        <div>
            <table className='border-collapse border border-gray-400'>
                <thead>
                    {renderHeaders()}
                </thead>
                <tbody>
                    {renderItems()}
                </tbody>
            </table>
            <button onClick={prevPage}>Previous</button>
            <button onClick={nextPage}>Next</button>
            <button onClick={increaseItemsPerPage}>More Items Per Page</button>
        </div>
    );
};

export default Datatable;