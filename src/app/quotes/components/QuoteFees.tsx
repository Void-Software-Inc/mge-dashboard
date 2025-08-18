'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons"
import { FEE_TYPES } from "@/utils/types/quotes"
import { updateQuoteFee } from "@/services/fees"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuoteFeesProps {
  quoteId: number;
  disabled?: boolean;
  fees: any[];
  onFeesChange: (fees: any[]) => void;
  onFeesSubtotalChange?: (subtotal: number) => void;
  onFeesToDeleteChange?: (feesToDelete: Set<string>) => void;
}

export function QuoteFees({ quoteId, disabled = false, fees, onFeesChange, onFeesSubtotalChange, onFeesToDeleteChange }: QuoteFeesProps) {
  const [localFees, setLocalFees] = useState<any[]>([]);
  const [newCustomFeeName, setNewCustomFeeName] = useState('');
  const [newCustomFeePrice, setNewCustomFeePrice] = useState('');
  const [newCustomFeeDescription, setNewCustomFeeDescription] = useState('');
  const [feesToDelete, setFeesToDelete] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState<string>('');
  const [feeInputErrors, setFeeInputErrors] = useState<Set<string>>(new Set());

  // Initialize local fees from props
  useEffect(() => {
    if (!fees || fees.length === 0) {
      const initialFees = FEE_TYPES.filter(feeType => !feeType.isCustom).map(feeType => ({
        name: feeType.name,
        price: 0,
        enabled: false,
        description: feeType.description
      }));
      setLocalFees(initialFees);
      onFeesChange(initialFees);
    } else {
      // Only reset feesToDelete if the number of fees has changed
      // This indicates an actual deletion has occurred
      if (fees.length !== localFees.length) {
        setFeesToDelete(new Set());
      }
      setLocalFees(fees);
    }
  }, [fees, onFeesChange]);

  // Calculate subtotal whenever fees change
  useEffect(() => {
    const subtotal = localFees.reduce((sum, fee) => {
      // Don't include fees marked for deletion in the subtotal
      if (feesToDelete.has(fee.name)) return sum;
      return sum + (fee.enabled ? (fee.price || 0) : 0);
    }, 0);
    onFeesSubtotalChange?.(subtotal);
  }, [localFees, onFeesSubtotalChange, feesToDelete]);

  const handleToggleFee = async (feeName: string, checked?: boolean) => {
    if (disabled) return;
    
    const updatedFees = localFees.map(fee => {
      if (fee.name === feeName) {
        return { ...fee, enabled: checked !== undefined ? checked : !fee.enabled };
      }
      return fee;
    });

    setLocalFees(updatedFees);
    onFeesChange(updatedFees);

    try {
      await updateQuoteFee(quoteId, updatedFees);
    } catch (error) {
      console.error('Error updating fee:', error);
    }
  };

  // Helper function to parse number with both . and , as decimal separators
  const parseFlexibleNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    
    // Replace comma with dot for parsing
    const normalizedValue = value.replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to check if a string represents a valid number
  const isValidNumber = (value: string): boolean => {
    if (!value || value.trim() === '') return true; // Empty is valid (will be 0)
    
    const trimmedValue = value.trim();
    
    // Replace comma with dot for parsing
    const normalizedValue = trimmedValue.replace(',', '.');
    
    // Check if the normalized value matches a valid number pattern
    // This regex allows: optional minus, digits, optional decimal point with digits
    const numberPattern = /^-?\d+(\.\d+)?$/;
    
    // First check if it matches the pattern
    if (!numberPattern.test(normalizedValue)) {
      return false;
    }
    
    // Then check if parseFloat gives a valid result
    const parsed = parseFloat(normalizedValue);
    return !isNaN(parsed) && isFinite(parsed);
  };

  const handlePriceChangeTTC = async (feeName: string, priceTTC: string) => {
    if (disabled) return;
    
    // Update input errors state
    const newErrors = new Set(feeInputErrors);
    if (!isValidNumber(priceTTC)) {
      newErrors.add(`${feeName}-priceTTC`);
    } else {
      newErrors.delete(`${feeName}-priceTTC`);
    }
    setFeeInputErrors(newErrors);
    
    const numPriceTTC = parseFlexibleNumber(priceTTC);
    const numPriceHT = numPriceTTC / 1.20; // Convert TTC to HT
    const updatedFees = localFees.map(fee => {
      if (fee.name === feeName) {
        return { ...fee, price: numPriceHT, priceTTCInput: priceTTC };
      }
      return fee;
    });

    setLocalFees(updatedFees);
    onFeesChange(updatedFees);

    // Only save to backend if the number is valid
    if (isValidNumber(priceTTC)) {
      try {
        await updateQuoteFee(quoteId, updatedFees);
      } catch (error) {
        console.error('Error updating fee price:', error);
      }
    }
  };

  const handleDescriptionChange = async (feeName: string, description: string) => {
    if (disabled) return;
    
    const updatedFees = localFees.map(fee => {
      if (fee.name === feeName) {
        return { ...fee, description };
      }
      return fee;
    });

    setLocalFees(updatedFees);
    onFeesChange(updatedFees);

    try {
      await updateQuoteFee(quoteId, updatedFees);
    } catch (error) {
      console.error('Error updating fee description:', error);
    }
  };

  const handleAddCustomFee = (e?: React.MouseEvent) => {
    // Prevent any event propagation that might trigger form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newCustomFeeName.trim() || !newCustomFeePrice.trim()) return;

    // Check for duplicate fee names (case-insensitive)
    const normalizedNewName = newCustomFeeName.trim().toLowerCase();
    const isDuplicate = localFees.some(fee => 
      fee.name.toLowerCase() === normalizedNewName
    );

    if (isDuplicate) {
      setNameError('Un frais avec ce nom existe déjà');
      return;
    }

    // Check if price is valid
    if (!isValidNumber(newCustomFeePrice)) {
      return; // Don't add if price is invalid
    }

    // Convert TTC to HT (the input is TTC, but we store as HT)
    const priceTTC = parseFlexibleNumber(newCustomFeePrice);
    const priceHT = priceTTC / 1.20;

    const newFee = {
      name: newCustomFeeName.trim(),
      price: priceHT, // Store as HT
      enabled: true,
      description: newCustomFeeDescription.trim(),
      isCustom: true
    };

    const updatedFees = [...localFees, newFee];
    setLocalFees(updatedFees);
    onFeesChange(updatedFees);

    // Reset form
    setNewCustomFeeName('');
    setNewCustomFeePrice('');
    setNewCustomFeeDescription('');
    setNameError('');
  };

  const handleMarkForDeletion = (feeName: string, e?: React.MouseEvent) => {
    // Prevent any event propagation that might trigger form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (disabled) return;
    
    // Create new Set to ensure state update
    const newFeesToDelete = new Set(feesToDelete);
    
    // Toggle fee in the Set
    const isBeingMarkedForDeletion = !newFeesToDelete.has(feeName);
    
    if (newFeesToDelete.has(feeName)) {
      newFeesToDelete.delete(feeName);
    } else {
      newFeesToDelete.add(feeName);
    }
    
    // Update the fee's enabled state based on deletion status
    const updatedFees = localFees.map(fee => {
      if (fee.name === feeName) {
        return { 
          ...fee, 
          enabled: isBeingMarkedForDeletion ? false : fee.enabled // Disable when marked for deletion
        };
      }
      return fee;
    });

    // Update local fees state
    setLocalFees(updatedFees);
    onFeesChange(updatedFees);
        
    // Update local state
    setFeesToDelete(newFeesToDelete);
    
    // Notify parent component
    if (onFeesToDeleteChange) {
      onFeesToDeleteChange(newFeesToDelete);
    }

    // Save to backend if not marked for deletion (when re-enabling)
    if (!isBeingMarkedForDeletion) {
      try {
        updateQuoteFee(quoteId, updatedFees);
      } catch (error) {
        console.error('Error updating fee:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">Frais additionnels</h3>
      </div>

      {/* Custom Fee Form */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium mb-3">Ajouter un frais personnalisé</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Nom</Label>
            <Input
              value={newCustomFeeName}
              onChange={(e) => {
                setNewCustomFeeName(e.target.value);
                setNameError(''); // Clear error when user types
              }}
              disabled={disabled}
              className={`border-gray-200 h-8 text-sm ${nameError ? 'border-red-500' : ''}`}
              placeholder="Nom du frais..."
            />
            {nameError && (
              <p className="text-xs text-red-500 mt-1">{nameError}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Prix TTC</Label>
            <Input
              value={newCustomFeePrice}
              onChange={(e) => setNewCustomFeePrice(e.target.value)}
              disabled={disabled}
              className={`border-gray-200 h-8 text-sm ${!isValidNumber(newCustomFeePrice) && newCustomFeePrice.trim() !== '' ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Description</Label>
            <Input
              value={newCustomFeeDescription}
              onChange={(e) => setNewCustomFeeDescription(e.target.value)}
              disabled={disabled}
              className="border-gray-200 h-8 text-sm"
              placeholder="Description..."
            />
          </div>
        </div>
        <div className="mt-3">
          <Button
            onClick={(e) => handleAddCustomFee(e)}
            disabled={disabled || !newCustomFeeName.trim() || !newCustomFeePrice.trim() || !isValidNumber(newCustomFeePrice)}
            className="bg-white h-8 text-sm border border-lime-500 text-lime-500 hover:bg-lime-50 disabled:bg-gray-50"
            type="button"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {localFees.map((fee) => {
          const feeType = FEE_TYPES.find(ft => ft.name === fee.name);
          if (!feeType && !fee.isCustom) return null;
          
          const isMarkedForDeletion = feesToDelete.has(fee.name);

          return (
            <Card 
              key={fee.name} 
              className={`border-gray-200 ${isMarkedForDeletion ? 'bg-red-50 border-red-200' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-medium ${isMarkedForDeletion ? 'line-through text-gray-500' : ''}`}>
                    {fee.isCustom ? fee.name : feeType?.displayName}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {fee.isCustom && (
                      <Button
                        variant={isMarkedForDeletion ? "destructive" : "ghost"}
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkForDeletion(fee.name, e)}
                        disabled={disabled}
                        type="button"
                      >
                        <TrashIcon className={`h-4 w-4 ${isMarkedForDeletion ? 'text-white' : 'text-red-500'}`} />
                      </Button>
                    )}
                    <Switch
                      checked={fee.enabled}
                      onCheckedChange={(checked: boolean) => handleToggleFee(fee.name, checked)}
                      disabled={disabled || isMarkedForDeletion}
                      className="data-[state=checked]:bg-lime-500"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Prix TTC</Label>
                  <Input
                    value={fee.priceTTCInput !== undefined ? fee.priceTTCInput : (fee.price ? (fee.price * 1.20).toFixed(2) : '')}
                    onChange={(e) => handlePriceChangeTTC(fee.name, e.target.value)}
                    disabled={!fee.enabled || disabled || isMarkedForDeletion}
                    className={`border-gray-200 h-8 text-sm ${isMarkedForDeletion ? 'opacity-50' : ''} ${feeInputErrors.has(`${fee.name}-priceTTC`) ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Description</Label>
                  <Textarea
                    value={fee.description || ''}
                    onChange={(e) => handleDescriptionChange(fee.name, e.target.value)}
                    disabled={!fee.enabled || disabled || isMarkedForDeletion}
                    className={`border-gray-200 text-sm min-h-[60px] ${isMarkedForDeletion ? 'opacity-50' : ''}`}
                    placeholder="Description des frais..."
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
