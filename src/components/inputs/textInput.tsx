import React from 'react';

interface TextInputProps {
  type: string;
  name: string;
  placeholder: string;
  className?: string;
  error?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ type, name, placeholder, className, error }) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      className={`text-black saira p-2 bg-transparent border-b-2 border-gray-300 rounded-none focus:outline-none ${error ? 'border-red-500 text-red-500 placeholder:text-red-500' : 'border-gray-300'} ${className}`}
    />
  );
};

export default TextInput;