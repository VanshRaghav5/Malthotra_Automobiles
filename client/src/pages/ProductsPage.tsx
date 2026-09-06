import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { getProducts, getCategories } from '../lib/api';
import type { Product } from '../types';
import { useState } from 'react';
import { useCartStore } from '../stores/cartStore';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, search],
    queryFn: () =>
      getProducts({ category, search }).then((r) => r.data || []),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data || []),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-primary-900 mb-8">Products</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl aspect-square" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.map((product: Product) => (
            <Link
              key={product.id}
              to={`/products/${product.slug}`}
              className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Image</span>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500">{product.brand}</p>
                <h3 className="font-medium text-primary-900 mt-1 line-clamp-2 group-hover:text-accent transition-colors">
                  {product.name}
                </h3>
                <p className="text-accent font-bold mt-2">
                  {product.discount_price
                    ? `$${product.discount_price.toFixed(2)}`
                    : `$${product.price.toFixed(2)}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
