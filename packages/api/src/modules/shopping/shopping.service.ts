import { prisma } from '../../db/client';

export const shoppingService = {
  // === LISTS ===
  async findAllLists(archived?: boolean) {
    const where: any = {};
    if (archived !== undefined) where.archived = archived;

    // Auto-create main list if none exists
    const mainList = await prisma.shoppingList.findFirst({ where: { isMain: true } });
    if (!mainList) {
      await prisma.shoppingList.create({ data: { name: 'Groceries', isMain: true } });
    }

    const lists = await prisma.shoppingList.findMany({
      where,
      include: {
        _count: { select: { items: true } },
        items: { where: { checked: true }, select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return lists.map(l => ({
      id: l.id,
      name: l.name,
      archived: l.archived,
      isMain: l.isMain,
      itemCount: l._count.items,
      checkedCount: l.items.length,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
  },

  async createList(name: string) {
    return prisma.shoppingList.create({ data: { name } });
  },

  async updateList(id: string, data: { name?: string; archived?: boolean }) {
    return prisma.shoppingList.update({ where: { id }, data });
  },

  async deleteList(id: string) {
    const list = await prisma.shoppingList.findUnique({ where: { id }, select: { isMain: true } });
    if (list?.isMain) {
      throw Object.assign(new Error('Cannot delete the main grocery list'), { statusCode: 400 });
    }
    return prisma.shoppingList.delete({ where: { id } });
  },

  // === ITEMS ===
  async findListItems(listId: string) {
    const items = await prisma.shoppingItem.findMany({
      where: { shoppingListId: listId },
      include: {
        product: true,
        itemStores: { include: { store: true } },
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ checked: 'asc' }, { position: 'asc' }],
    });

    return items.map(i => ({
      id: i.id,
      shoppingListId: i.shoppingListId,
      product: i.product,
      quantity: i.quantity,
      unit: i.unit,
      notes: i.notes,
      checked: i.checked,
      position: i.position,
      stores: i.itemStores.map(is => is.store),
      addedBy: i.requestedBy,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));
  },

  async addItem(listId: string, data: {
    productName: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    storeIds?: string[];
  }, userId: string) {
    // Find or create product
    const product = await prisma.product.upsert({
      where: { name: data.productName },
      update: {},
      create: { name: data.productName },
    });

    // Get next position
    const maxPos = await prisma.shoppingItem.aggregate({
      where: { shoppingListId: listId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    const item = await prisma.shoppingItem.create({
      data: {
        shoppingListId: listId,
        productId: product.id,
        quantity: data.quantity || 1,
        unit: data.unit,
        notes: data.notes,
        position,
        requestedById: userId,
        itemStores: data.storeIds?.length
          ? { create: data.storeIds.map(storeId => ({ storeId })) }
          : undefined,
      },
      include: {
        product: true,
        itemStores: { include: { store: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    return {
      ...item,
      stores: item.itemStores.map(is => is.store),
      itemStores: undefined,
      addedBy: item.requestedBy,
      requestedBy: undefined,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  },

  async updateItem(id: string, data: {
    quantity?: number;
    unit?: string;
    notes?: string;
    checked?: boolean;
  }) {
    return prisma.shoppingItem.update({
      where: { id },
      data,
      include: {
        product: true,
        itemStores: { include: { store: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });
  },

  async deleteItem(id: string) {
    return prisma.shoppingItem.delete({ where: { id } });
  },

  async checkItem(itemId: string, userId: string, data: { price?: number; storeId?: string }) {
    // Mark item as checked
    await prisma.shoppingItem.update({
      where: { id: itemId },
      data: { checked: true },
    });

    // Create check record
    const check = await prisma.shoppingCheck.create({
      data: {
        shoppingItemId: itemId,
        userId,
        price: data.price,
        storeId: data.storeId,
      },
    });

    // If price provided, also create a price record for the product
    if (data.price && data.storeId) {
      const item = await prisma.shoppingItem.findUnique({
        where: { id: itemId },
        select: { productId: true },
      });
      if (item) {
        await prisma.priceRecord.create({
          data: {
            productId: item.productId,
            storeId: data.storeId,
            price: data.price,
          },
        });
      }
    }

    return check;
  },

  async reorderItems(items: { id: string; position: number }[]) {
    await prisma.$transaction(
      items.map(item =>
        prisma.shoppingItem.update({ where: { id: item.id }, data: { position: item.position } })
      )
    );
  },

  // === STORES ===
  async findAllStores() {
    return prisma.store.findMany({ orderBy: { name: 'asc' } });
  },

  async createStore(name: string) {
    return prisma.store.create({ data: { name } });
  },

  // === PRODUCTS & PRICES ===
  async searchProducts(query: string) {
    return prisma.product.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 10,
      orderBy: { name: 'asc' },
    });
  },

  async getProductPrices(productId: string, storeId?: string) {
    const where: any = { productId };
    if (storeId) where.storeId = storeId;

    const records = await prisma.priceRecord.findMany({
      where,
      include: { store: true },
      orderBy: { date: 'desc' },
      take: 50,
    });

    return records.map(r => ({
      id: r.id,
      productId: r.productId,
      storeId: r.storeId,
      storeName: r.store.name,
      price: Number(r.price),
      date: r.date.toISOString(),
    }));
  },

  async comparePrices(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return null;

    // Get latest price per store
    const stores = await prisma.store.findMany();
    const prices = [];

    for (const store of stores) {
      const records = await prisma.priceRecord.findMany({
        where: { productId, storeId: store.id },
        orderBy: { date: 'desc' },
        take: 10,
      });

      if (records.length > 0) {
        prices.push({
          store: { id: store.id, name: store.name },
          latestPrice: Number(records[0].price),
          priceHistory: records.map(r => ({
            price: Number(r.price),
            date: r.date.toISOString(),
          })),
        });
      }
    }

    return { product, prices };
  },
};
