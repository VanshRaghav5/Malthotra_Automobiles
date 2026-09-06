import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug!).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse bg-gray-100 h-96 rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
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
        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
          <span className="text-gray-400">Product Image</span>
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

          {product.description && (
            <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>
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

async function getProduct(slug: string) {
  const res = await fetch(`/api/v1/products/${slug}`);
  return res.json();
}
