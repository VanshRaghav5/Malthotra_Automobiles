import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { Trash2, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Your cart is empty</h1>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-900 mb-8">Your Cart</h1>

      <div className="space-y-4">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {product.product_images?.[0]?.storage_path ? (
                <img
                  src={`https://rlmmyueiqqegelkvxjxa.supabase.co/storage/v1/object/public/product-images/₹{product.product_images[0].storage_path}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">Image</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-primary-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.brand}</p>
              <p className="text-accent font-bold mt-1">
                ₹{product.price.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100"
              >-</button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100"
              >+</button>
              <button
                onClick={() => removeItem(product.id)}
                className="ml-2 p-2 text-gray-400 hover:text-red-500"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Estimated Total</span>
          <span className="text-2xl font-bold text-primary-900">₹{total().toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Payment is completed at the business. This request reserves the products you selected.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/products"
            className="flex-1 text-center py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Continue Shopping
          </Link>
          <button
            onClick={() => navigate('/request/submit')}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
          >
            Proceed to Request
          </button>
        </div>
      </div>
    </div>
  );
}
