export interface ShoppingList {
    id: string;
    name: string;
    archived: boolean;
    itemCount: number;
    checkedCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface Product {
    id: string;
    name: string;
}
export interface Store {
    id: string;
    name: string;
}
export interface ShoppingItem {
    id: string;
    shoppingListId: string;
    product: Product;
    quantity: number;
    unit?: string;
    notes?: string;
    checked: boolean;
    position: number;
    stores: Store[];
    createdAt: string;
    updatedAt: string;
}
export interface CreateShoppingItemRequest {
    productName: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    storeIds?: string[];
}
export interface CheckItemRequest {
    price?: number;
    storeId?: string;
}
export interface PriceRecord {
    id: string;
    productId: string;
    storeId: string;
    storeName: string;
    price: number;
    date: string;
}
export interface PriceComparison {
    product: Product;
    prices: {
        store: Store;
        latestPrice: number;
        priceHistory: {
            price: number;
            date: string;
        }[];
    }[];
}
//# sourceMappingURL=shopping.d.ts.map