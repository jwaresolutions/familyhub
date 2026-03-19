'use client';

import { usePriceComparison } from '@/hooks/useShopping';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';

interface PriceCompareProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export function PriceCompare({ productId, productName, onClose }: PriceCompareProps) {
  const { data, isLoading } = usePriceComparison(productId);

  if (isLoading) return <Card className="p-4">Loading prices...</Card>;
  if (!data || data.prices.length === 0) return (
    <Card className="p-4">
      <p className="text-sm text-gray-500">No price data for {productName}</p>
      <button onClick={onClose} className="text-sm text-primary-600 mt-2">Close</button>
    </Card>
  );

  const chartData = data.prices.map(p => ({
    store: p.store.name,
    price: p.latestPrice,
  }));

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{productName} — Price Comparison</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="store" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']} />
            <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1">
        {data.prices.map(p => (
          <div key={p.store.id} className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{p.store.name}</span>
            <span className="font-medium">${p.latestPrice.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
