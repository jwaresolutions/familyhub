'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ItemRow } from './ItemRow';
import { AddItemForm } from './AddItemForm';
import { PriceCompare } from './PriceCompare';
import {
  useShoppingLists, useListItems, useCreateList, useDeleteList, useStores, useCreateStore,
} from '@/hooks/useShopping';

export function ShoppingListView() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showNewStore, setShowNewStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [compareProduct, setCompareProduct] = useState<{ id: string; name: string } | null>(null);

  const { data: lists = [] } = useShoppingLists(false);
  const { data: items = [] } = useListItems(selectedListId);
  const { data: stores = [] } = useStores();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const createStore = useCreateStore();

  const selectedList = lists.find(l => l.id === selectedListId);

  const filteredItems = storeFilter
    ? items.filter(i => i.stores.some(s => s.id === storeFilter))
    : items;

  async function handleCreateList() {
    if (!newListName.trim()) return;
    const list = await createList.mutateAsync(newListName.trim());
    setNewListName('');
    setShowNewList(false);
    setSelectedListId(list.id);
  }

  async function handleCreateStore() {
    if (!newStoreName.trim()) return;
    await createStore.mutateAsync(newStoreName.trim());
    setNewStoreName('');
    setShowNewStore(false);
  }

  return (
    <div className="flex gap-4 flex-col md:flex-row">
      {/* List selector sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Lists</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowNewList(true)}>+ New</Button>
        </div>
        {showNewList && (
          <div className="flex gap-1">
            <Input
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder="List name"
              onKeyDown={e => e.key === 'Enter' && handleCreateList()}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateList}>Add</Button>
          </div>
        )}
        {lists.map(list => (
          <Card
            key={list.id}
            className={`cursor-pointer transition-colors ${
              selectedListId === list.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedListId(list.id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{list.name}</span>
              <Badge label={`${list.checkedCount}/${list.itemCount}`} color="#6B7280" />
            </div>
          </Card>
        ))}

        {/* Stores management */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Stores</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNewStore(true)}>+ New</Button>
          </div>
          {showNewStore && (
            <div className="flex gap-1 mb-2">
              <Input
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                placeholder="Store name"
                onKeyDown={e => e.key === 'Enter' && handleCreateStore()}
                autoFocus
              />
              <Button size="sm" onClick={handleCreateStore}>Add</Button>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {stores.map(s => (
              <Badge key={s.id} label={s.name} color="#6B7280" className="cursor-default" />
            ))}
          </div>
        </div>
      </div>

      {/* Items area */}
      <div className="flex-1">
        {selectedList ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedList.name}</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddItem(true)}>+ Add Item</Button>
                <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this list and all its items?')) { deleteList.mutate(selectedListId!); setSelectedListId(null); } }}>Delete List</Button>
              </div>
            </div>

            {/* Store filter */}
            {stores.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${!storeFilter ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300'}`}
                  onClick={() => setStoreFilter('')}
                >All</button>
                {stores.map(s => (
                  <button
                    key={s.id}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${storeFilter === s.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300'}`}
                    onClick={() => setStoreFilter(storeFilter === s.id ? '' : s.id)}
                  >{s.name}</button>
                ))}
              </div>
            )}

            {showAddItem && (
              <AddItemForm listId={selectedListId!} onClose={() => setShowAddItem(false)} />
            )}

            <Card className="divide-y divide-gray-100 dark:divide-gray-700 p-0 overflow-hidden">
              {filteredItems.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">No items yet. Add your first item!</p>
              ) : (
                filteredItems.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onCompare={(id, name) => setCompareProduct({ id, name })}
                  />
                ))
              )}
            </Card>

            {compareProduct && (
              <PriceCompare
                productId={compareProduct.id}
                productName={compareProduct.name}
                onClose={() => setCompareProduct(null)}
              />
            )}
          </div>
        ) : (
          <Card className="flex items-center justify-center min-h-[300px]">
            <p className="text-gray-500">Select a list or create a new one</p>
          </Card>
        )}
      </div>
    </div>
  );
}
