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
}

export function QuoteFees({ quoteId, disabled = false, fees, onFeesChange }: QuoteFeesProps) {
  const [localFees, setLocalFees] = useState<any[]>([]);

  useEffect(() => {
    if (!fees || fees.length === 0) {
      const initialFees = FEE_TYPES.map(feeType => ({
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

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Frais additionnels</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {localFees.map((fee) => {
          const feeType = FEE_TYPES.find(ft => ft.name === fee.name);
          if (!feeType) return null;

          return (
            <Card key={fee.name} className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {feeType.displayName}
                  </CardTitle>
                  <Switch
                    checked={fee.enabled}
                    onCheckedChange={() => handleToggleFee(fee.name)}
                    disabled={disabled}
                    className="data-[state=checked]:bg-lime-500"
                  />
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