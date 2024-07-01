'use client'
import React from 'react';

interface TextInputProps {
  product: any;
}



const TextInput: React.FC<TextInputProps> = ({ product }) => {
    function handleClick() {
        console.log(product);
    }
  return (
    <button onClick={handleClick} className="text-black bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded">
        Click me!
    </button>
  );
};

export default TextInput;