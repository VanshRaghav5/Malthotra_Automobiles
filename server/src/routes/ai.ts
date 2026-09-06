import { Router, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { generateGeminiResponse } from '../services/ai';
import { AuthRequest } from '../middleware/auth';

const aiRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // POST /api/v1/ai/chat - AI chat endpoint
  router.post('/chat', async (req: AuthRequest, res: Response) => {
    const { message, customer_context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch relevant business context
    let businessContext = '';
    try {
      const { data: products } = await supabase.from('products').select('name, brand, price, category_id').limit(20);
      const { data: services } = await supabase.from('services').select('name, price, duration_minutes').limit(10);

      if (products) {
        businessContext += `\nProducts: ${products.map(p => `${p.name} (${p.brand}) - $${p.price}`).join(', ')}`;
      }
      if (services) {
        businessContext += `\nServices: ${services.map(s => `${s.name} - $${s.price} (${s.duration_minutes} min)`).join(', ')}`;
      }
    } catch (e) {
      console.error('Failed to fetch business context:', e);
    }

    const response = await generateGeminiResponse(message, {
      businessContext,
      customerContext: customer_context,
    });

    res.json({ reply: response });
  });

  // POST /api/v1/ai/faq - FAQ endpoint
  router.post('/faq', async (req: AuthRequest, res: Response) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const faqContext = `
      Malhotra Automobiles FAQ context:
      - We sell genuine automobile parts and accessories
      - Services include oil change, tire rotation, brake service, battery replacement
      - Bookings require customer to visit the shop for payment
      - Processing time is typically 1-2 business days
      - Contact: info@malhotraautomobiles.com
    `;

    const response = await generateGeminiResponse(question, { businessContext: faqContext });
    res.json({ reply: response });
  });

  return router;
};

export default aiRouter;
