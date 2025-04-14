'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons"
import { Fee, FeeType, FEE_TYPES } from "@/utils/types/quotes"
import { updateQuoteFee } from "@/services/fees"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuoteFeesProps {
  quoteId: number;
  disabled?: boolean;
  fees: any[];
  onFeesChange: (fees: any[]) => void;
  onFeesSubtotalChange?: (subtotal: number) => void;
}

export function QuoteFees({ quoteId, disabled = false, fees, onFeesChange, onFeesSubtotalChange }: QuoteFeesProps) {
  const [localFees, setLocalFees] = useState<any[]>([]);
  const [newCustomFeeName, setNewCustomFeeName] = useState('');
  const [newCustomFeePrice, setNewCustomFeePrice] = useState('');
  const [newCustomFeeDescription, setNewCustomFeeDescription] = useState('');

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
      setLocalFees(fees);
    }
  }, [fees, onFeesChange]);

  // Calculate subtotal whenever fees change
  useEffect(() => {
    const subtotal = localFees.reduce((sum, fee) => {
      return sum + (fee.enabled ? (fee.price || 0) : 0);
    }, 0);
    onFeesSubtotalChange?.(subtotal);
  }, [localFees, onFeesSubtotalChange]);

  const handleToggleFee = async (feeName: string) => {
    if (disabled) return;
    
    const updatedFees = localFees.map(fee => {
      if (fee.name === feeName) {
        return { ...fee, enabled: !fee.enabled };
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

  const handlePriceChange = async (feeName: string, price: string) => {
    if (disabled) return;
    
    const numPrice = parseFloat(price) || 0;
    const updatedFees = localFees.map(fee => {
      if (fee.name === feeName) {
        return { ...fee, price: numPrice };
      }
      return fee;
    });

    setLocalFees(updatedFees);
    onFeesChange(updatedFees);

    try {
      await updateQuoteFee(quoteId, updatedFees);
    } catch (error) {
      console.error('Error updating fee price:', error);
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

  const handleAddCustomFee = () => {
    if (!newCustomFeeName.trim() || !newCustomFeePrice.trim()) return;

    const newFee = {
      name: newCustomFeeName.trim(),
      price: parseFloat(newCustomFeePrice) || 0,
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

    // Save to database
    updateQuoteFee(quoteId, updatedFees).catch(error => {
      console.error('Error adding custom fee:', error);
    });
  };

  const handleDeleteCustomFee = (feeName: string) => {
    const updatedFees = localFees.filter(fee => fee.name !== feeName);
    setLocalFees(updatedFees);
    onFeesChange(updatedFees);

    // Save to database
    updateQuoteFee(quoteId, updatedFees).catch(error => {
      console.error('Error deleting custom fee:', error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">Frais additionnels</h3>
        <div className="text-sm font-medium">
          Sous-total HT: {localFees.reduce((sum, fee) => sum + (fee.enabled ? (fee.price || 0) : 0), 0).toFixed(2)} €
        </div>
      </div>

      {/* Custom Fee Form */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium mb-3">Ajouter un frais personnalisé</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Nom</Label>
            <Input
              value={newCustomFeeName}
              onChange={(e) => setNewCustomFeeName(e.target.value)}
              disabled={disabled}
              className="border-gray-200 h-8 text-sm"
              placeholder="Nom du frais..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Prix HT</Label>
            <Input
              type="number"
              value={newCustomFeePrice}
              onChange={(e) => setNewCustomFeePrice(e.target.value)}
              disabled={disabled}
              className="border-gray-200 h-8 text-sm"
              placeholder="0.00"
              min="0"
              step="0.01"
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
            onClick={handleAddCustomFee}
            disabled={disabled || !newCustomFeeName.trim() || !newCustomFeePrice.trim()}
            className="h-8 text-sm"
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

          return (
            <Card key={fee.name} className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {fee.isCustom ? fee.name : feeType?.displayName}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {fee.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteCustomFee(fee.name)}
                        disabled={disabled}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                    <Switch
                      checked={fee.enabled}
                      onCheckedChange={() => handleToggleFee(fee.name)}
                      disabled={disabled}
                      className="data-[state=checked]:bg-lime-500"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Prix HT</Label>
                  <Input
                    type="number"
                    value={fee.price || ''}
                    onChange={(e) => handlePriceChange(fee.name, e.target.value)}
                    disabled={!fee.enabled || disabled}
                    className="border-gray-200 h-8 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Description</Label>
                  <Textarea
                    value={fee.description || ''}
                    onChange={(e) => handleDescriptionChange(fee.name, e.target.value)}
                    disabled={!fee.enabled || disabled}
                    className="border-gray-200 text-sm min-h-[60px]"
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