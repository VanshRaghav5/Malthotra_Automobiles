-- Seed data for Malhotra Automobiles
-- Run in Supabase SQL Editor after the main migration

-- Categories
INSERT INTO categories (name, slug, description) VALUES
('Engine Parts', 'engine-parts', 'Pistons, rings, gaskets, and engine components'),
('Brakes', 'brakes', 'Brake pads, discs, calipers, and brake fluid'),
('Filters', 'filters', 'Oil filters, air filters, and fuel filters'),
('Suspension', 'suspension', 'Shocks, struts, bushings, and suspension components'),
('Electrical', 'electrical', 'Batteries, alternators, starter motors, and wiring'),
('Transmission', 'transmission', 'Clutch kits, gearboxes, and transmission fluid'),
('Cooling', 'cooling', 'Radiators, thermostats, water pumps, and hoses'),
('Body Parts', 'body-parts', 'Mirrors, lights, bumpers, and exterior trim');

-- Services
INSERT INTO services (name, slug, description, duration_minutes, price) VALUES
('Oil Change', 'oil-change', 'Complete oil and filter change with synthetic or conventional oil', 30, 49.99),
('Brake Inspection & Service', 'brake-inspection', 'Full brake system inspection, pad replacement, and rotor resurfacing', 120, 199.99),
('Tire Rotation & Balance', 'tire-rotation', 'Rotate and balance all four tires for even wear', 45, 39.99),
('AC Service & Recharge', 'ac-service', 'AC system inspection, leak detection, and refrigerant recharge', 90, 149.99),
('Engine Diagnostic', 'engine-diagnostic', 'Computer diagnostic scan to identify check engine light issues', 60, 79.99),
('Battery Test & Replace', 'battery-test', 'Battery load testing and replacement if needed', 30, 89.99);

-- Products
INSERT INTO products (name, slug, brand, sku, price, discount_price, description, availability_status, featured, published, category_id)
SELECT
  p.name, p.slug, p.brand, p.sku, p.price, p.discount_price, p.description, p.availability_status, p.featured, p.published, c.id
FROM (VALUES
  ('Brake Pad Set - Front', 'brake-pad-set-front', 'Bosch', 'BOS-BP-001', 45.99, 39.99, 'High-quality ceramic brake pads for front axles. Quiet, low-dust formula.', 'in_stock', true, true),
  ('Oil Filter', 'oil-filter', 'Mann-Filter', 'MAN-OF-002', 12.99, NULL, 'Premium oil filter compatible with most vehicle makes. Extended life filter media.', 'in_stock', true, true),
  ('Air Filter', 'air-filter', 'Bosch', 'BOS-AF-003', 18.99, 15.99, 'Engine air filter with high filtration capacity. Improves engine performance.', 'in_stock', true, true),
  ('Spark Plug Set (4)', 'spark-plug-set', 'NGK', 'NGK-SP-004', 24.99, NULL, 'Iridium spark plugs for improved ignition and fuel efficiency.', 'in_stock', false, true),
  ('Coolant - 1 Gallon', 'coolant-gallon', 'Valvoline', 'VAL-CL-005', 14.99, NULL, 'All-vehicle coolant/antifreeze. Protects against freezing and boiling.', 'in_stock', false, true),
  ('Windshield Wiper Blades', 'wiper-blades', 'Bosch', 'BOS-WW-006', 22.99, 19.99, 'Beam-style wiper blades for streak-free wiping in all weather.', 'low_stock', true, true),
  ('Car Battery 12V', 'car-battery', 'DieHard', 'DH-BAT-007', 129.99, 109.99, 'Maintenance-free car battery with 3-year warranty. Cold cranking amps: 650.', 'in_stock', true, true),
  ('Transmission Fluid', 'transmission-fluid', 'Valvoline', 'VAL-TF-008', 19.99, NULL, 'Full synthetic transmission fluid for smooth shifting.', 'in_stock', false, true),
  ('Fuel Filter', 'fuel-filter', 'Bosch', 'BOS-FF-009', 16.99, NULL, 'Inline fuel filter for improved fuel delivery and engine performance.', 'out_of_stock', false, true),
  ('Shock Absorber - Front Pair', 'shock-absorber-front', 'Monroe', 'MON-SA-010', 89.99, 79.99, 'Front pair of gas-charged shock absorbers. Smooth ride quality.', 'in_stock', false, true),
  ('Headlight Bulb Kit', 'headlight-bulb-kit', 'Sylvania', 'SYL-HB-011', 29.99, NULL, 'H11 halogen headlight bulbs. Bright white light output.', 'in_stock', false, true),
  ('Radiator Cap', 'radiator-cap', 'Stant', 'STA-RC-012', 12.99, 9.99, 'Pressurized radiator cap. Maintains proper cooling system pressure.', 'low_stock', false, true)
) AS p(name, slug, brand, sku, price, discount_price, description, availability_status, featured, published)
JOIN categories c ON c.slug = CASE
  WHEN p.slug LIKE '%brake%' OR p.slug LIKE '%pad%' THEN 'brakes'
  WHEN p.slug LIKE '%oil%' OR p.slug LIKE '%filter%' THEN 'filters'
  WHEN p.slug LIKE '%spark%' OR p.slug LIKE '%plug%' THEN 'engine-parts'
  WHEN p.slug LIKE '%cool%' OR p.slug LIKE '%radiator%' THEN 'cooling'
  WHEN p.slug LIKE '%battery%' OR p.slug LIKE '%light%' THEN 'electrical'
  WHEN p.slug LIKE '%trans%' THEN 'transmission'
  WHEN p.slug LIKE '%shock%' OR p.slug LIKE '%susp%' THEN 'suspension'
  WHEN p.slug LIKE '%wiper%' THEN 'body-parts'
  ELSE 'engine-parts'
END;

-- Create slots for oil change service (next 2 weeks)
DO $$
DECLARE
  service_id UUID;
  slot_date DATE;
  slot_time TIME;
BEGIN
  SELECT id INTO service_id FROM services WHERE slug = 'oil-change';

  -- Generate slots for next 14 days, 9 AM to 5 PM, every 30 min
  FOR slot_date IN SELECT (CURRENT_DATE + i)::date FROM generate_series(0, 13) AS i
  LOOP
    FOR slot_time IN SELECT ('2000-01-01 09:00:00'::timestamp + (j * interval '30 minutes'))::time FROM generate_series(0, 15) AS j
    LOOP
      INSERT INTO availability_slots (service_id, date, start_time, end_time, status, capacity)
      VALUES (service_id, slot_date, slot_time, (slot_time + interval '30 minutes'), 'available', 2);
    END LOOP;
  END LOOP;
END $$;

-- Create a test admin user profile (create auth user first in Supabase Auth dashboard, then update here)
-- Example: INSERT INTO profiles (auth_user_id, role, name, email) VALUES ('user-uuid-here', 'admin', 'Admin User', 'admin@malhotraautomobiles.com');
