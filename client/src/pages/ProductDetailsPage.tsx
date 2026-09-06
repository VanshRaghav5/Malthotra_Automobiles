import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProduct } from '../lib/api';
import { ShoppingCart, Package } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';
import type { Product } from '../types';

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug!).then((r) => r.data as Product),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse bg-gray-100 h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-primary-900">Product not found</h1>
        <Link to="/products" className="text-accent mt-4 inline-block">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/products" className="hover:text-primary-900">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-primary-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
          {product.product_images?.[0]?.storage_path ? (
            <img
              src={`https://rlmmyueiqqegelkvxjxa.supabase.co/storage/v1/object/public/product-images/${product.product_images[0].storage_path}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={64} className="text-gray-400" />
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h1 className="text-3xl font-bold text-primary-900 mt-2">{product.name}</h1>
          <p className="text-2xl text-accent font-bold mt-4">
            {product.discount_price
              ? `$${product.discount_price.toFixed(2)}`
              : `$${product.price.toFixed(2)}`}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              product.availability_status === 'in_stock' ? 'bg-green-100 text-green-700' :
              product.availability_status === 'low_stock' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {product.availability_status.replace('_', ' ')}
            </span>
          </div>

          {product.description && (
            <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-primary-900 mb-3">Specifications</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key}>
                    <dt className="text-gray-500">{key}</dt>
                    <dd className="font-medium">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                className="px-4 py-2 hover:bg-gray-100"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >-</button>
              <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
              <button
                className="px-4 py-2 hover:bg-gray-100"
                onClick={() => setQuantity(quantity + 1)}
              >+</button>
            </div>
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
              onClick={() => {
                for (let i = 0; i < quantity; i++) addItem(product);
              }}
            >
              <ShoppingCart size={20} />
              Add to Cart
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Payment is completed at the business. This request reserves your selected products.
          </p>
        </div>
      </div>
    </div>
  );
}
