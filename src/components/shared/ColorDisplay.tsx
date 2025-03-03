"use client"

import { productColors } from "@/utils/types/products"

// Helper function for metallic colors
export const getMetallicBackground = (color: string) => {
  if (color === 'gold') {
    return `linear-gradient(45deg, #B8860B, #FFD700, #DAA520)`;
  } else if (color === 'silver') {
    return `linear-gradient(45deg, #C0C0C0, #E8E8E8, #A9A9A9)`;
  }
  return '';
};

// Shared component for displaying color circles
export const ColorDisplay = ({ colorValue, className = "" }: { colorValue: string, className?: string }) => {
  const color = productColors.find(c => c.value === colorValue);
  
  if (!color) return null;
  
  if (color.value === 'transparent') {
    return (
      <div className={`w-4 h-4 rounded-full overflow-hidden border border-gray-300 bg-white relative ${className}`}>
        <div className="absolute inset-0 bg-gray-200 bg-opacity-50" style={{
          backgroundImage: `
            linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%)
          `,
          backgroundSize: '4px 4px',
          backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
        }} />
      </div>
    );
  } else if (color.value === 'multicolore') {
    return (
      <div className={`w-4 h-4 rounded-full overflow-hidden flex flex-wrap ${className}`}>
        <div className="w-2 h-2 bg-yellow-400"></div>
        <div className="w-2 h-2 bg-green-500"></div>
        <div className="w-2 h-2 bg-pink-400"></div>
        <div className="w-2 h-2 bg-blue-500"></div>
      </div>
    );
  } else if (color.value === 'gold' || color.value === 'silver') {
    return (
      <div 
        className={`w-4 h-4 rounded-full ${className}`}
        style={{ background: getMetallicBackground(color.value) }}
      />
    );
  } else {
    return (
      <div 
        className={`w-4 h-4 rounded-full ${color.value === 'blanc' ? 'border border-gray-300' : ''} ${className}`}
        style={{ backgroundColor: color.hex }}
      />
    );
  }
};