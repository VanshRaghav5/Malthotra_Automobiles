import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';
import { CreateProductInput } from '../types';

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  brand: z.string().optional(),
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

  // GET /api/v1/products - List published products with filters
  router.get('/', async (_req: AuthRequest, res: Response) => {
    const {
      category,
      brand,
      search,
      sort = 'name',
      order = 'asc',
      page = '1',
      limit = '12',
    } = _req.query;

    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('published', true)
      .order(sort as string, { ascending: order === 'asc' });

    if (category) query = query.eq('category_id', category);
    if (brand) query = query.ilike('brand', `%${brand}%`);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const limitNum = parseInt(limit as string, 10) || 12;
    const pageNum = parseInt(page as string, 10) || 1;
    const start = (pageNum - 1) * limitNum;

    query = query.range(start, start + limitNum - 1);

    const { data, error, count } = await query;

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      data,
      pagination: { page: pageNum, limit: limitNum, total: count || 0 },
    });
  });

  // GET /api/v1/products/:slug - Get single product
  router.get('/:slug', async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), product_images(*)')
      .eq('slug', req.params.slug)
      .eq('published', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  });

  // GET /api/v1/products/categories - List categories
  router.get('/categories', async (_req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Admin: POST /api/v1/products - Create product
  router.post('/', async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const { data, error } = await supabase
      .from('products')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  // Admin: PATCH /api/v1/products/:id - Update product
  router.patch('/:id', async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const { data, error } = await supabase
      .from('products')
      .update(parsed.data)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Admin: DELETE /api/v1/products/:id - Soft delete product
  router.delete('/:id', async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error } = await supabase
      .from('products')
      .update({ published: false })
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  return router;
};

export default productsRouter;
