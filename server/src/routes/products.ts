import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { config } from '../config';

// Guard: disable products if feature flag is set
const assertProductsEnabled = (res: Response) => {
  if (config.PRODUCTS_ENABLED === false) {
    return res.status(404).json({ error: 'Not found' });
  }
  return null;
};

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  brand: z.string().optional().default(''),
  sku: z.string().optional(),
  price: z.number().positive(),
  discount_price: z.number().optional(),
  description: z.string().optional(),
  specifications: z.record(z.any()).optional(),
  compatibility: z.record(z.any()).optional(),
  availability_status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  category_id: z.string().uuid().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

const productsRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // GET /api/v1/products
  router.get('/', async (_req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    const { category, brand, search, sort = 'name', order = 'asc', page = '1', limit = '12' } = _req.query;
    let query = supabase.from('products').select('*, categories(name, slug)', { count: 'exact' })
      .eq('published', true).order(sort as string, { ascending: order === 'asc' });
    if (category) query = query.eq('category_id', category);
    if (brand) query = query.ilike('brand', `%${brand}%`);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    const limitNum = parseInt(limit as string, 10) || 12;
    const pageNum = parseInt(page as string, 10) || 1;
    query = query.range((pageNum - 1) * limitNum, pageNum * limitNum - 1);
    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data, pagination: { page: pageNum, limit: limitNum, total: count || 0 } });
  });

  // GET /api/v1/products/categories
  router.get('/categories', async (_req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET /api/v1/products/:slug
  router.get('/:slug', async (req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    const { data, error } = await supabase.from('products').select('*, categories(*), product_images(*)')
      .eq('slug', req.params.slug).eq('published', true).single();
    if (error || !data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  });

  // POST /api/v1/products
  router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const slug = (parsed.data.slug || parsed.data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `product-${Date.now()}`;
    const { data, error } = await supabase.from('products').insert({ ...parsed.data, slug, published: true }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  // PATCH /api/v1/products/:id
  router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const { data, error } = await supabase.from('products').update(parsed.data).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // DELETE /api/v1/products/:id
  router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { error } = await supabase.from('products').update({ published: false }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // POST /api/v1/products/:id/images - Upload product image (base64)
  router.post('/:id/images', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { image } = req.body as { image?: string };
    if (!image) return res.status(400).json({ error: 'Image data required' });

    // Check product exists
    const { data: product } = await supabase.from('products').select('id').eq('id', req.params.id).single();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Decode base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to storage
    const fileName = `${req.params.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, buffer, { contentType: 'image/jpeg' });
    if (uploadError) return res.status(500).json({ error: 'Upload failed' });

    // Save record
    const { data: img, error: insertError } = await supabase.from('product_images').insert({
      product_id: req.params.id,
      storage_path: fileName,
      sort_order: 0,
    }).select().single();
    if (insertError) return res.status(500).json({ error: 'Failed to save image' });

    res.status(201).json(img);
  });

  // DELETE /api/v1/products/:id/images/:imageId
  router.delete('/:id/images/:imageId', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (assertProductsEnabled(res)) return;
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { data: image } = await supabase.from('product_images').select('storage_path')
      .eq('id', req.params.imageId).eq('product_id', req.params.id).single();
    if (!image) return res.status(404).json({ error: 'Image not found' });
    await supabase.storage.from('product-images').remove([image.storage_path]);
    await supabase.from('product_images').delete().eq('id', req.params.imageId);
    res.json({ success: true });
  });

  return router;
};

export default productsRouter;
