'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ShoppingList, ShoppingItem, Store, Product, PriceComparison } from '@organize/shared';

export function useShoppingLists(archived?: boolean, options?: { refetchInterval?: number }) {
  const params = archived !== undefined ? `?archived=${archived}` : '';
  return useQuery({
    queryKey: ['shopping-lists', archived],
    queryFn: () => api.get<ShoppingList[]>(`/shopping/lists${params}`),
    ...(options?.refetchInterval !== undefined && {
      refetchInterval: options.refetchInterval,
      placeholderData: keepPreviousData,
    }),
  });
}

export function useListItems(listId: string | null) {
  return useQuery({
    queryKey: ['shopping-items', listId],
    queryFn: () => api.get<ShoppingItem[]>(`/shopping/lists/${listId}`),
    enabled: !!listId,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<ShoppingList>('/shopping/lists', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-lists'] }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; archived?: boolean }) =>
      api.patch(`/shopping/lists/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-lists'] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/shopping/lists/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-lists'] }),
  });
}

export function useAddItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, ...data }: { listId: string } & { productName: string; quantity?: number; unit?: string; notes?: string; storeIds?: string[] }) =>
      api.post<ShoppingItem>(`/shopping/lists/${listId}/items`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-items'] });
      qc.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; quantity?: number; unit?: string; notes?: string; checked?: boolean }) =>
      api.patch(`/shopping/items/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-items'] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/shopping/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-items'] });
      qc.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}

export function useCheckItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, ...data }: { itemId: string; price?: number; storeId?: string }) =>
      api.post(`/shopping/items/${itemId}/check`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-items'] });
      qc.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => api.get<Store[]>('/shopping/stores'),
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Store>('/shopping/stores', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['product-search', query],
    queryFn: () => api.get<Product[]>(`/shopping/products/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}

export function usePriceComparison(productId: string | null) {
  return useQuery({
    queryKey: ['price-compare', productId],
    queryFn: () => api.get<PriceComparison>(`/shopping/products/compare?productId=${productId}`),
    enabled: !!productId,
  });
}
