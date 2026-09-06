const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set. Copy .env.example to .env and add your service role key.');
  process.exit(1);
}

const supabase = createClient(
  'https://rlmmyueiqqegelkvxjxa.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  // Categories
  const categories = [
    { name: 'Engine Parts', slug: 'engine-parts', description: 'Pistons, rings, gaskets, and engine components' },
    { name: 'Brakes', slug: 'brakes', description: 'Brake pads, discs, calipers, and brake fluid' },
    { name: 'Filters', slug: 'filters', description: 'Oil filters, air filters, and fuel filters' },
    { name: 'Suspension', slug: 'suspension', description: 'Shocks, struts, bushings, and suspension components' },
    { name: 'Electrical', slug: 'electrical', description: 'Batteries, alternators, starter motors, and wiring' },
    { name: 'Transmission', slug: 'transmission', description: 'Clutch kits, gearboxes, and transmission fluid' },
    { name: 'Cooling', slug: 'cooling', description: 'Radiators, thermostats, water pumps, and hoses' },
    { name: 'Body Parts', slug: 'body-parts', description: 'Mirrors, lights, bumpers, and exterior trim' },
  ];

  const catRes = await supabase.from('categories').insert(categories).select('id, slug');
  console.log('Categories:', catRes.data?.length || 0, 'inserted');

  // Services
  const services = [
    { name: 'Oil Change', slug: 'oil-change', description: 'Complete oil and filter change with synthetic or conventional oil', duration_minutes: 30, price: 49.99 },
    { name: 'Brake Inspection & Service', slug: 'brake-inspection', description: 'Full brake system inspection, pad replacement, and rotor resurfacing', duration_minutes: 120, price: 199.99 },
    { name: 'Tire Rotation & Balance', slug: 'tire-rotation', description: 'Rotate and balance all four tires for even wear', duration_minutes: 45, price: 39.99 },
    { name: 'AC Service & Recharge', slug: 'ac-service', description: 'AC system inspection, leak detection, and refrigerant recharge', duration_minutes: 90, price: 149.99 },
    { name: 'Engine Diagnostic', slug: 'engine-diagnostic', description: 'Computer diagnostic scan to identify check engine light issues', duration_minutes: 60, price: 79.99 },
    { name: 'Battery Test & Replace', slug: 'battery-test', description: 'Battery load testing and replacement if needed', duration_minutes: 30, price: 89.99 },
  ];

  const svcRes = await supabase.from('services').insert(services).select('id, slug');
  console.log('Services:', svcRes.data?.length || 0, 'inserted');

  // Products - map slug to category slug
  const products = [
    { name: 'Brake Pad Set - Front', slug: 'brake-pad-set-front', brand: 'Bosch', sku: 'BOS-BP-001', price: 45.99, discount_price: 39.99, description: 'High-quality ceramic brake pads for front axles. Quiet, low-dust formula.', availability_status: 'in_stock', featured: true, published: true, category_slug: 'brakes' },
    { name: 'Oil Filter', slug: 'oil-filter', brand: 'Mann-Filter', sku: 'MAN-OF-002', price: 12.99, discount_price: null, description: 'Premium oil filter compatible with most vehicle makes. Extended life filter media.', availability_status: 'in_stock', featured: true, published: true, category_slug: 'filters' },
    { name: 'Air Filter', slug: 'air-filter', brand: 'Bosch', sku: 'BOS-AF-003', price: 18.99, discount_price: 15.99, description: 'Engine air filter with high filtration capacity. Improves engine performance.', availability_status: 'in_stock', featured: true, published: true, category_slug: 'filters' },
    { name: 'Spark Plug Set (4)', slug: 'spark-plug-set', brand: 'NGK', sku: 'NGK-SP-004', price: 24.99, discount_price: null, description: 'Iridium spark plugs for improved ignition and fuel efficiency.', availability_status: 'in_stock', featured: false, published: true, category_slug: 'engine-parts' },
    { name: 'Coolant - 1 Gallon', slug: 'coolant-gallon', brand: 'Valvoline', sku: 'VAL-CL-005', price: 14.99, discount_price: null, description: 'All-vehicle coolant/antifreeze. Protects against freezing and boiling.', availability_status: 'in_stock', featured: false, published: true, category_slug: 'cooling' },
    { name: 'Windshield Wiper Blades', slug: 'wiper-blades', brand: 'Bosch', sku: 'BOS-WW-006', price: 22.99, discount_price: 19.99, description: 'Beam-style wiper blades for streak-free wiping in all weather.', availability_status: 'low_stock', featured: true, published: true, category_slug: 'body-parts' },
    { name: 'Car Battery 12V', slug: 'car-battery', brand: 'DieHard', sku: 'DH-BAT-007', price: 129.99, discount_price: 109.99, description: 'Maintenance-free car battery with 3-year warranty. Cold cranking amps: 650.', availability_status: 'in_stock', featured: true, published: true, category_slug: 'electrical' },
    { name: 'Transmission Fluid', slug: 'transmission-fluid', brand: 'Valvoline', sku: 'VAL-TF-008', price: 19.99, discount_price: null, description: 'Full synthetic transmission fluid for smooth shifting.', availability_status: 'in_stock', featured: false, published: true, category_slug: 'transmission' },
    { name: 'Fuel Filter', slug: 'fuel-filter', brand: 'Bosch', sku: 'BOS-FF-009', price: 16.99, discount_price: null, description: 'Inline fuel filter for improved fuel delivery and engine performance.', availability_status: 'out_of_stock', featured: false, published: true, category_slug: 'filters' },
    { name: 'Shock Absorber - Front Pair', slug: 'shock-absorber-front', brand: 'Monroe', sku: 'MON-SA-010', price: 89.99, discount_price: 79.99, description: 'Front pair of gas-charged shock absorbers. Smooth ride quality.', availability_status: 'in_stock', featured: false, published: true, category_slug: 'suspension' },
    { name: 'Headlight Bulb Kit', slug: 'headlight-bulb-kit', brand: 'Sylvania', sku: 'SYL-HB-011', price: 29.99, discount_price: null, description: 'H11 halogen headlight bulbs. Bright white light output.', availability_status: 'in_stock', featured: false, published: true, category_slug: 'electrical' },
    { name: 'Radiator Cap', slug: 'radiator-cap', brand: 'Stant', sku: 'STA-RC-012', price: 12.99, discount_price: 9.99, description: 'Pressurized radiator cap. Maintains proper cooling system pressure.', availability_status: 'low_stock', featured: false, published: true, category_slug: 'cooling' },
  ];

  // Build lookup
  const catMap = {};
  catRes.data?.forEach(c => catMap[c.slug] = c.id);
  console.log('Category map:', JSON.stringify(catMap));

  const productInserts = products.map(p => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    sku: p.sku,
    price: p.price,
    discount_price: p.discount_price,
    description: p.description,
    availability_status: p.availability_status,
    featured: p.featured,
    published: p.published,
    category_id: catMap[p.category_slug],
  }));

  const prodRes = await supabase.from('products').insert(productInserts).select('count');
  console.log('Products:', prodRes.data?.[0]?.count, 'inserted');

  // Create slots for Oil Change service (next 14 days)
  const oilServiceId = svcRes.data?.find(s => s.slug === 'oil-change')?.id;
  if (oilServiceId) {
    const slots = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = 0; d < 14; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      // Generate slots from 9:00 to 16:30 every 30 min
      for (let h = 9; h < 17; h++) {
        for (let m = 0; m < 60; m += 30) {
          if (h === 16 && m === 30) continue; // last slot ends at 17:00
          const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const endMin = m + 30;
          const endHour = endMin >= 60 ? h + 1 : h;
          const end = `${String(endHour).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
          slots.push({ service_id: oilServiceId, date: dateStr, start_time: start, end_time: end, status: 'available', capacity: 2 });
        }
      }
    }
    console.log(`Inserting ${slots.length} slots for oil-change...`);
    const slotRes = await supabase.from('availability_slots').insert(slots);
    console.log('Slots inserted:', slotRes.data ? 'ok' : slotRes.error?.message || 'error');
  }

  console.log('\nDone! Visit http://localhost:5173 to see the site with data.');
}

seed().catch(err => console.error('Seed failed:', err.message));
