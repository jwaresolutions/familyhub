'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCheckItem, useDeleteItem } from '@/hooks/useShopping';
import type { ShoppingItem, Store } from '@organize/shared';

interface ItemRowProps {
  item: ShoppingItem;
  onCompare: (productId: string, productName: string) => void;
}

export function ItemRow({ item, onCompare }: ItemRowProps) {
  const checkItem = useCheckItem();
  const deleteItem = useDeleteItem();
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [price, setPrice] = useState('');
  const [storeId, setStoreId] = useState(item.stores[0]?.id || '');

  async function handleCheck() {
    if (!item.checked && item.stores.length > 0) {
      setShowPriceInput(true);
      return;
    }
    await checkItem.mutateAsync({ itemId: item.id });
  }

  async function submitCheck() {
    await checkItem.mutateAsync({
      itemId: item.id,
      price: price ? parseFloat(price) : undefined,
      storeId: storeId || undefined,
    });
    setShowPriceInput(false);
  }

  return (
    <div className={`flex flex-col gap-2 p-3 border-b border-gray-100 dark:border-gray-700 ${item.checked ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={handleCheck}
          role="checkbox"
          aria-checked={item.checked}
          aria-label={`Mark ${item.product.name} as ${item.checked ? 'unchecked' : 'checked'}`}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            item.checked ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          {item.checked && '✓'}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${item.checked ? 'line-through' : ''}`}>
              {item.product.name}
            </span>
            {item.quantity > 1 && (
              <span className="text-xs text-gray-500">×{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
            )}
          </div>
          {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
          {item.addedBy && (
            <p className="text-xs text-gray-500 mt-0.5">Added by {item.addedBy.name}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {item.stores.map((s: Store) => (
              <Badge key={s.id} label={s.name} color="#6B7280" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onCompare(item.product.id, item.product.name)} title="Compare prices">$</Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Remove "${item.product.name}" from list?`)) deleteItem.mutate(item.id); }}>✕</Button>
        </div>
      </div>
      {showPriceInput && (
        <div className="flex flex-col gap-2 ml-8">
          <p className="text-xs text-gray-500">Record the price you paid (optional):</p>
          <div className="flex items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="99999"
              placeholder="$0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
              autoFocus
            />
          </div>
          {item.stores.length > 1 && (
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              {item.stores.map((s: Store) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <Button size="sm" onClick={submitCheck}>Done</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowPriceInput(false)}>Skip</Button>
          </div>
        </div>
      )}
    </div>
  );
}
