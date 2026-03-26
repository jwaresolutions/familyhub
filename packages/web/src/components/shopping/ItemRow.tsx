'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCheckItem, useDeleteItem, useUpdateItem, useStores } from '@/hooks/useShopping';
import type { ShoppingItem, Store } from '@organize/shared';

interface ItemRowProps {
  item: ShoppingItem;
  onCompare: (productId: string, productName: string) => void;
}

export function ItemRow({ item, onCompare }: ItemRowProps) {
  const checkItem = useCheckItem();
  const deleteItem = useDeleteItem();
  const updateItem = useUpdateItem();
  const { data: stores = [] } = useStores();

  const [showPriceInput, setShowPriceInput] = useState(false);
  const [price, setPrice] = useState('');
  const [storeId, setStoreId] = useState(item.stores[0]?.id || '');

  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(item.quantity));
  const [editUnit, setEditUnit] = useState(item.unit || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [editStoreIds, setEditStoreIds] = useState<string[]>(item.stores.map(s => s.id));

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

  function openEditPanel(e: React.MouseEvent) {
    // Don't open the edit panel if clicking the checkbox or action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit || '');
    setEditNotes(item.notes || '');
    setEditStoreIds(item.stores.map(s => s.id));
    setShowEditPanel(true);
  }

  async function handleSaveEdit() {
    await updateItem.mutateAsync({
      id: item.id,
      quantity: parseInt(editQuantity) || 1,
      unit: editUnit || undefined,
      notes: editNotes || undefined,
      storeIds: editStoreIds,
    });
    setShowEditPanel(false);
  }

  function toggleEditStore(sid: string) {
    setEditStoreIds(prev =>
      prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]
    );
  }

  return (
    <div className={`flex flex-col gap-2 p-3 border-b border-gray-100 dark:border-gray-700 ${item.checked ? 'opacity-50' : ''}`}>
      <div
        className={`flex items-center gap-3 ${!item.checked ? 'cursor-pointer' : ''}`}
        onClick={!item.checked ? openEditPanel : undefined}
        title={!item.checked ? 'Click to edit' : undefined}
      >
        <button
          onClick={e => { e.stopPropagation(); handleCheck(); }}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={e => { e.stopPropagation(); onCompare(item.product.id, item.product.name); }}
            title="Compare prices"
          >$</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => { e.stopPropagation(); if (confirm(`Remove "${item.product.name}" from list?`)) deleteItem.mutate(item.id); }}
          >✕</Button>
        </div>
      </div>

      {showEditPanel && (
        <div className="flex flex-col gap-3 ml-8 mt-1 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Edit item</p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Qty"
              type="number"
              min="1"
              value={editQuantity}
              onChange={e => setEditQuantity(e.target.value)}
            />
            <Input
              label="Unit"
              value={editUnit}
              onChange={e => setEditUnit(e.target.value)}
              placeholder="lbs, each..."
            />
          </div>
          <Input
            label="Notes"
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            placeholder="Optional notes"
          />
          {stores.length > 0 && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Stores</label>
              <div className="flex flex-wrap gap-1">
                {stores.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleEditStore(s.id)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      editStoreIds.includes(s.id)
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
            <Button size="sm" onClick={handleSaveEdit} disabled={updateItem.isPending}>
              {updateItem.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowEditPanel(false)}>Cancel</Button>
          </div>
        </div>
      )}

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
