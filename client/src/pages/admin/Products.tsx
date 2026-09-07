import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage } from '../../lib/api';
import type { Product, ProductImage } from '../../types';
import { Plus, Edit2, Trash2, X, Check, Upload, Image as ImageIcon, Camera } from 'lucide-react';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', brand: '', sku: '', price: '', discount_price: '',
    description: '', category_id: '', featured: false, published: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getProducts({}).then((r) => (r.data?.data as Product[]) || []),
  });

  const resetForm = () => {
    setForm({ name: '', brand: '', sku: '', price: '', discount_price: '', description: '', category_id: '', featured: false, published: true });
    setEditingId(null);
    setPreviewImage(null);
  };

  const startEdit = (product: Product) => {
    setForm({
      name: product.name, brand: product.brand || '', sku: product.sku || '',
      price: product.price.toString(), discount_price: product.discount_price?.toString() || '',
      description: product.description || '', category_id: product.category_id || '',
      featured: product.featured, published: product.published,
    });
    setEditingId(product.id);
    setPreviewImage(product.product_images?.[0]?.storage_path ?
      `https://rlmmyueiqqegelkvxjxa.supabase.co/storage/v1/object/public/product-images/${product.product_images[0].storage_path}` : null);
    setShowForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : undefined,
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        const res = await createProduct(payload);
        if (res.data?.id) setEditingId(res.data.id);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadImage(productId, base64);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (productId: string, base64: string) => {
    setUploadingImage(productId);
    try {
      await uploadProductImage(productId, base64);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      // Update preview if editing
      if (editingId === productId) {
        setPreviewImage(base64);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Unpublish this product? It will no longer be visible to customers.')) return;
    try {
      await deleteProduct(id);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary-900">Products</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary-900">{editingId ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input name="name" required value={form.name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input name="brand" value={form.brand} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input name="sku" value={form.sku} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input name="price" type="number" step="0.01" required value={form.price} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                <input name="discount_price" type="number" step="0.01" value={form.discount_price} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} value={form.description} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange}
                  className="w-4 h-4 text-accent rounded" />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="published" checked={form.published} onChange={handleChange}
                  className="w-4 h-4 text-accent rounded" />
                <span className="text-sm text-gray-700">Published</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium">
                <Check size={18} /> {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Brand</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Price</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product: Product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {product.product_images?.[0]?.storage_path ? (
                      <img src={`https://rlmmyueiqqegelkvxjxa.supabase.co/storage/v1/object/public/product-images/${product.product_images[0].storage_path}`} loading="lazy"
                        alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon size={24} className="text-gray-400" />
                      </div>
                    )}
                    {/* Image upload button */}
                    <label className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline cursor-pointer">
                      <Camera size={12} />
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => uploadImage(product.id, reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={uploadingImage === product.id} />
                      {uploadingImage === product.id ? 'Uploading...' : 'Add Image'}
                    </label>
                  </td>
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-gray-500">{product.brand || '-'}</td>
                  <td className="px-6 py-4">₹{product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.published ? 'Published' : 'Draft'}
                    </span>
                    {product.featured && (
                      <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(product)} className="p-1.5 text-gray-400 hover:text-accent rounded hover:bg-gray-100">
                        <Edit2 size={16} />
                      </button>
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(product.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
