import { Router, Response, NextFunction } from 'express';
import { shoppingService } from './shopping.service';
import { registerModule } from '../../lib/module-registry';
import { validate } from '../../middleware/validate';
import { AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/require-admin';
import { createShoppingListSchema, createShoppingItemSchema, checkItemSchema, createStoreSchema } from '@organize/shared';
import { badRequest, notFound } from '../../lib/errors';

const router = Router();

// === LISTS ===
router.get('/lists', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const archived = req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined;
    const lists = await shoppingService.findAllLists(archived);
    res.json(lists);
  } catch (err) { next(err); }
});

router.post('/lists', validate(createShoppingListSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const list = await shoppingService.createList(req.body.name);
    res.status(201).json(list);
  } catch (err) { next(err); }
});

router.get('/lists/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await shoppingService.findListItems(req.params.id);
    res.json(items);
  } catch (err) { next(err); }
});

router.patch('/lists/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const list = await shoppingService.updateList(req.params.id, req.body);
    res.json(list);
  } catch (err) { next(err); }
});

router.delete('/lists/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await shoppingService.deleteList(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

// === ITEMS ===
// NOTE: /items/reorder MUST come before /items/:id to avoid "reorder" being treated as an id
router.patch('/items/reorder', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await shoppingService.reorderItems(req.body.items);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/lists/:id/items', validate(createShoppingItemSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await shoppingService.addItem(req.params.id, req.body, req.userId!);
    res.status(201).json(item);
  } catch (err) { next(err); }
});

router.patch('/items/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await shoppingService.updateItem(req.params.id, req.body);
    res.json(item);
  } catch (err) { next(err); }
});

router.delete('/items/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await shoppingService.deleteItem(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post('/items/:id/check', validate(checkItemSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const check = await shoppingService.checkItem(req.params.id, req.userId!, req.body);
    res.json(check);
  } catch (err) { next(err); }
});

// === STORES ===
router.get('/stores', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stores = await shoppingService.findAllStores();
    res.json(stores);
  } catch (err) { next(err); }
});

router.post('/stores', validate(createStoreSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = await shoppingService.createStore(req.body.name);
    res.status(201).json(store);
  } catch (err) { next(err); }
});

// === PRODUCTS & PRICES ===
// NOTE: /products/search and /products/compare MUST come before /products/:id/prices
router.get('/products/search', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const products = await shoppingService.searchProducts(q);
    res.json(products);
  } catch (err) { next(err); }
});

router.get('/products/compare', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.query.productId as string;
    if (!productId) return next(badRequest('productId required', 'MISSING_PARAMS'));
    const comparison = await shoppingService.comparePrices(productId);
    if (!comparison) return next(notFound('Product'));
    res.json(comparison);
  } catch (err) { next(err); }
});

router.get('/products/:id/prices', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.query.storeId as string | undefined;
    const prices = await shoppingService.getProductPrices(req.params.id, storeId);
    res.json(prices);
  } catch (err) { next(err); }
});

registerModule({
  name: 'Shopping',
  prefix: '/shopping',
  router,
  icon: 'shopping-cart',
  description: 'Shopping lists with price tracking',
});

export default router;
