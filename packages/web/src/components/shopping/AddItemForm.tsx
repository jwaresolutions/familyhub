'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddItem, useStores, useProductSearch } from '@/hooks/useShopping';

interface AddItemFormProps {
  listId: string;
  onClose: () => void;
}

export function AddItemForm({ listId, onClose }: AddItemFormProps) {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  const { data: stores = [] } = useStores();
  const { data: suggestions = [] } = useProductSearch(productName);
  const addItem = useAddItem();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!productName.trim()) return;
    await addItem.mutateAsync({
      listId,
      productName: productName.trim(),
      quantity: parseInt(quantity) || 1,
      unit: unit || undefined,
      notes: notes || undefined,
      storeIds: selectedStores.length > 0 ? selectedStores : undefined,
    });
    setProductName('');
    setQuantity('1');
    setUnit('');
    setNotes('');
    setSelectedStores([]);
  }

  function toggleStore(storeId: string) {
    setSelectedStores(prev =>
      prev.includes(storeId) ? prev.filter(s => s !== storeId) : [...prev, storeId]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="relative">
        <Input
          label="Product"
          value={productName}
          onChange={e => setProductName(e.target.value)}
          placeholder="Start typing..."
          autoFocus
        />
        {suggestions.length > 0 && productName.length >= 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map(p => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setProductName(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Qty" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <Input label="Unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="lbs, each..." />
      </div>
      <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
      {stores.length > 0 && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stores</label>
          <div className="flex flex-wrap gap-1">
            {stores.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStore(s.id)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  selectedStores.includes(s.id)
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!productName.trim()}>Add Item</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Done</Button>
      </div>
    </form>
  );
}
