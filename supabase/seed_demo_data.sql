-- Mimu App - Database Seeding Script for Demo and Testing
-- This script registers the 4 demo accounts (client, company, provider, admin),
-- configures their wallets with 500,000.00 AOA balance, and registers services
-- in all 10 categories with future events and reviews.

BEGIN;

-- 1. CLEAN UP existing demo data to allow re-runs
DELETE FROM public.wallet_transactions WHERE wallet_id IN (
  SELECT id FROM public.wallets WHERE user_id IN (
    'ca100000-0000-0000-0000-000000000001',
    'ca200000-0000-0000-0000-000000000002',
    'ca300000-0000-0000-0000-000000000003',
    'ca400000-0000-0000-0000-000000000004'
  )
);

DELETE FROM public.wallets WHERE user_id IN (
  'ca100000-0000-0000-0000-000000000001',
  'ca200000-0000-0000-0000-000000000002',
  'ca300000-0000-0000-0000-000000000003',
  'ca400000-0000-0000-0000-000000000004'
);

DELETE FROM public.reviews WHERE client_id = 'ca100000-0000-0000-0000-000000000001' OR service_id IN (
  SELECT id FROM public.services WHERE owner_id IN (
    'ca200000-0000-0000-0000-000000000002',
    'ca300000-0000-0000-0000-000000000003'
  )
);

DELETE FROM public.orders WHERE client_id = 'ca100000-0000-0000-0000-000000000001' OR owner_id IN (
  'ca200000-0000-0000-0000-000000000002',
  'ca300000-0000-0000-0000-000000000003'
);

DELETE FROM public.services WHERE owner_id IN (
  'ca200000-0000-0000-0000-000000000002',
  'ca300000-0000-0000-0000-000000000003'
);

DELETE FROM public.events WHERE created_by IN (
  'ca200000-0000-0000-0000-000000000002',
  'ca300000-0000-0000-0000-000000000003'
);

DELETE FROM public.notifications WHERE user_id IN (
  'ca100000-0000-0000-0000-000000000001',
  'ca200000-0000-0000-0000-000000000002',
  'ca300000-0000-0000-0000-000000000003',
  'ca400000-0000-0000-0000-000000000004'
);

DELETE FROM public.profiles WHERE id IN (
  'ca100000-0000-0000-0000-000000000001',
  'ca200000-0000-0000-0000-000000000002',
  'ca300000-0000-0000-0000-000000000003',
  'ca400000-0000-0000-0000-000000000004'
);

DELETE FROM auth.users WHERE id IN (
  'ca100000-0000-0000-0000-000000000001',
  'ca200000-0000-0000-0000-000000000002',
  'ca300000-0000-0000-0000-000000000003',
  'ca400000-0000-0000-0000-000000000004'
);

-- 2. INSERT users into auth.users (encrypted password is '123456')
-- Client
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, is_sso_user)
VALUES ('ca100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cliente@demo.ao', crypt('123456', gen_salt('bf', 10)), now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"sub":"ca100000-0000-0000-0000-000000000001","email":"cliente@demo.ao","email_verified":true,"phone_verified":false}'::jsonb, false, now(), now(), false);

-- Company
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, is_sso_user)
VALUES ('ca200000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'empresa@demo.ao', crypt('123456', gen_salt('bf', 10)), now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"sub":"ca200000-0000-0000-0000-000000000002","email":"empresa@demo.ao","email_verified":true,"phone_verified":false}'::jsonb, false, now(), now(), false);

-- Provider
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, is_sso_user)
VALUES ('ca300000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prestador@demo.ao', crypt('123456', gen_salt('bf', 10)), now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"sub":"ca300000-0000-0000-0000-000000000003","email":"prestador@demo.ao","email_verified":true,"phone_verified":false}'::jsonb, false, now(), now(), false);

-- Admin
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, is_sso_user)
VALUES ('ca400000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@demo.ao', crypt('123456', gen_salt('bf', 10)), now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"sub":"ca400000-0000-0000-0000-000000000004","email":"admin@demo.ao","email_verified":true,"phone_verified":false}'::jsonb, false, now(), now(), false);


-- 3. INSERT profiles into public.profiles
-- Get geographical IDs first for Luanda and Benguela
DO $$
DECLARE
  luanda_prov UUID;
  luanda_mun UUID;
  talatona_mun UUID;
  viana_mun UUID;
  benguela_prov UUID;
  benguela_mun UUID;
BEGIN
  SELECT id INTO luanda_prov FROM public.provinces WHERE name = 'Luanda' LIMIT 1;
  SELECT id INTO luanda_mun FROM public.municipalities WHERE name = 'Luanda' LIMIT 1;
  SELECT id INTO talatona_mun FROM public.municipalities WHERE name = 'Talatona' LIMIT 1;
  SELECT id INTO viana_mun FROM public.municipalities WHERE name = 'Viana' LIMIT 1;
  SELECT id INTO benguela_prov FROM public.provinces WHERE name = 'Benguela' LIMIT 1;
  SELECT id INTO benguela_mun FROM public.municipalities WHERE name = 'Benguela' LIMIT 1;

  -- Profile Client
  INSERT INTO public.profiles (id, role, name, phone, province, city, status, created_at, updated_at, email, province_id, municipality_id)
  VALUES ('ca100000-0000-0000-0000-000000000001', 'client', 'Osvaldo Cliente Demo', '924000001', 'Luanda', 'Talatona', 'active', now(), now(), 'cliente@demo.ao', luanda_prov, talatona_mun);

  -- Profile Company
  INSERT INTO public.profiles (id, role, name, company_name, phone, province, city, description, status, hours, created_at, updated_at, email, province_id, municipality_id, logo_url)
  VALUES ('ca200000-0000-0000-0000-000000000002', 'company', 'Responsável Empresa', 'Mimu Empresa Demo Lda', '924000002', 'Luanda', 'Luanda', 'Plataforma oficial de demonstração corporativa para a Mimu App.', 'active', 'Segunda a Sexta: 08:00 - 18:00', now(), now(), 'empresa@demo.ao', luanda_prov, luanda_mun, 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=150&q=80');

  -- Profile Provider
  INSERT INTO public.profiles (id, role, name, phone, province, city, description, status, hours, created_at, updated_at, email, province_id, municipality_id, avatar_url)
  VALUES ('ca300000-0000-0000-0000-000000000003', 'provider', 'Carlos Prestador Demo', '924000003', 'Benguela', 'Benguela', 'Profissional com mais de 10 anos de experiência prestando os melhores serviços na região.', 'active', 'Todos os dias: 09:00 - 20:00', now(), now(), 'prestador@demo.ao', benguela_prov, benguela_mun, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80');

  -- Profile Admin
  INSERT INTO public.profiles (id, role, name, phone, province, city, status, created_at, updated_at, email, province_id, municipality_id)
  VALUES ('ca400000-0000-0000-0000-000000000004', 'admin', 'Mimu Administrador', '924000004', 'Luanda', 'Talatona', 'active', now(), now(), 'admin@demo.ao', luanda_prov, talatona_mun);

  -- 4. INSERT wallets for the accounts
  INSERT INTO public.wallets (id, user_id, balance, currency, is_active, created_at, updated_at)
  VALUES 
    (uuid_generate_v4(), 'ca100000-0000-0000-0000-000000000001', 500000.00, 'AOA', true, now(), now()),
    (uuid_generate_v4(), 'ca200000-0000-0000-0000-000000000002', 500000.00, 'AOA', true, now(), now()),
    (uuid_generate_v4(), 'ca300000-0000-0000-0000-000000000003', 500000.00, 'AOA', true, now(), now()),
    (uuid_generate_v4(), 'ca400000-0000-0000-0000-000000000004', 500000.00, 'AOA', true, now(), now());

  -- 5. INSERT services in all 10 categories
  -- Categoria: estadia (Dormir & Estadia)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type, promocao_activa, desconto, preco_promocional)
  VALUES (
    '8c000000-0000-0000-0000-000000000001',
    'ca200000-0000-0000-0000-000000000002',
    'estadia',
    'Hotéis',
    'Hotel Vista Mar',
    'Experimente uma estadia premium com vista panorâmica sobre o Oceano Atlântico. Quartos luxuosos e serviço impecável.',
    45000.00,
    'Kz',
    'perNight',
    'Ilha de Luanda, Luanda',
    ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    ARRAY['Wi-Fi Grátis', 'Piscina', 'Pequeno Almoço Incluso', 'Ar Condicionado', 'Estacionamento'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'rooms',
    true,
    15,
    38250.00
  );

  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000002',
    'ca300000-0000-0000-0000-000000000003',
    'estadia',
    'Apartamentos por diária',
    'Benguela Beach Resort',
    'Bangalós aconchegantes a poucos passos da praia. O refúgio perfeito para as suas férias em família em Benguela.',
    35000.00,
    'Kz',
    'perNight',
    'Praia Morena, Benguela',
    ARRAY['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'],
    ARRAY['Piscina', 'Acesso Direto à Praia', 'Cozinha Equipada', 'Ar Condicionado'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    benguela_prov,
    benguela_mun,
    'rooms'
  );

  -- Categoria: comer (Comer, Beber & Experiências)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000003',
    'ca200000-0000-0000-0000-000000000002',
    'comer',
    'Restaurantes',
    'Restaurante Lookal Mar',
    'Especialistas em marisco fresco e gastronomia tradicional angolana com vista incrível da Baía de Luanda.',
    22000.00,
    'Kz',
    'perPerson',
    'Ilha de Luanda, Luanda',
    ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
    ARRAY['Vista Mar', 'Estacionamento Privativo', 'Esplanada', 'Bar de Cocktails'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'table'
  );

  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000004',
    'ca200000-0000-0000-0000-000000000002',
    'comer',
    'Restaurantes',
    'Restaurante Baía',
    'Pratos requintados com ingredientes locais selecionados. Ambiente elegante e acolhedor ideal para jantares de negócios.',
    18000.00,
    'Kz',
    'perPerson',
    'Talatona, Luanda',
    ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'],
    ARRAY['Ar Condicionado', 'Salas Privadas', 'Carta de Vinhos Premium'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    talatona_mun,
    'table'
  );

  -- Categoria: festas (Festas & Eventos)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000005',
    'ca200000-0000-0000-0000-000000000002',
    'festas',
    'Salões de Eventos',
    'Salão de Festas Pérola',
    'Salão espaçoso e luxuoso totalmente decorado e preparado para casamentos, batizados e eventos corporativos.',
    150000.00,
    'Kz',
    'service',
    'Viana, Luanda',
    ARRAY['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&q=80'],
    ARRAY['Gerador Industrial', 'Segurança Privada', 'Palco Integrado', 'Sistema de Som Premium'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    viana_mun,
    'standard'
  );

  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type, promocao_activa, desconto, preco_promocional)
  VALUES (
    '8c000000-0000-0000-0000-000000000006',
    'ca300000-0000-0000-0000-000000000003',
    'festas',
    'DJs',
    'DJ Sunset Experience',
    'Performance musical ao vivo de alta vibração com repertório variado (Afro House, Semba, Kizomba e sucessos internacionais).',
    60000.00,
    'Kz',
    'service',
    'Luanda e arredores',
    ARRAY['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80'],
    ARRAY['Mesa de Mistura Própria', 'Iluminação LED Básica'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'slots',
    true,
    10,
    54000.00
  );

  -- Categoria: transporte (Transporte & Mobilidade)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000007',
    'ca200000-0000-0000-0000-000000000002',
    'transporte',
    'Rent-a-car',
    'Kupapula Rent-a-Car',
    'Aluguer de viaturas SUV e 4x4 modernas, totalmente inspecionadas e com seguro contra todos os riscos incluído.',
    28000.00,
    'Kz',
    'perDay',
    'Aeroporto de Luanda, Luanda',
    ARRAY['https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80'],
    ARRAY['Ar Condicionado', 'Seguro Incluído', 'Opção de Condutor Privado'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'standard'
  );

  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000008',
    'ca300000-0000-0000-0000-000000000003',
    'transporte',
    'Transfers',
    'Táxi Executivo Luanda',
    'Serviço personalizado de transfer executivo entre o aeroporto e qualquer ponto de Luanda. Pontualidade e conforto garantidos.',
    15000.00,
    'Kz',
    'session',
    'Aeroporto de Luanda - Cidade',
    ARRAY['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80'],
    ARRAY['Garrafa de Água', 'Wi-Fi Grátis a Bordo', 'Carregador de Telemóvel'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'slots'
  );

  -- Categoria: beleza (Beleza, Bem-Estar & Saúde)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000009',
    'ca300000-0000-0000-0000-000000000003',
    'beleza',
    'Spa',
    'Musa Estadia & Spa',
    'Massagens relaxantes e terapêuticas, tratamentos faciais de luxo e cuidados de pele num ambiente zen único.',
    25000.00,
    'Kz',
    'session',
    'Talatona, Luanda',
    ARRAY['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'],
    ARRAY['Chá de Boas-Vindas', 'Estacionamento Grátis', 'Duche Privado'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    talatona_mun,
    'slots'
  );

  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000010',
    'ca300000-0000-0000-0000-000000000003',
    'beleza',
    'Barbearias',
    'Barbearia VIP Luanda',
    'Corte de cabelo masculino clássico e moderno, serviço de barba com toalha quente e finalização com produtos premium.',
    45000.00,
    'Kz',
    'session',
    'Alvalade, Luanda',
    ARRAY['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80'],
    ARRAY['Café/Bebida Grátis', 'Ar Condicionado', 'PlayStation de Espera'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'slots'
  );

  -- Categoria: casa (Casa, Reparações & Mudanças)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000011',
    'ca300000-0000-0000-0000-000000000003',
    'casa',
    'Electricista',
    'Electricidade e Frio Geral',
    'Resolução de curto-circuitos, instalação de tomadas, reparação e manutenção de ar-condicionados e sistemas de frio.',
    12000.00,
    'Kz',
    'service',
    'Benguela Central',
    ARRAY['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80'],
    ARRAY['Garantia de 30 dias', 'Profissional Certificado'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    benguela_prov,
    benguela_mun,
    'slots'
  );

  -- Categoria: automovel (Serviços Automóvel)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000012',
    'ca200000-0000-0000-0000-000000000002',
    'automovel',
    'Lavagem de Viaturas',
    'Lavagem e Detalhe Auto Lookal',
    'Lavagem ecológica profissional de chassi, motor e higienização profunda de estofos a seco. Deixamos o seu carro como novo.',
    8500.00,
    'Kz',
    'session',
    'Talatona, Luanda',
    ARRAY['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80'],
    ARRAY['Sala de Espera AC', 'Cafetaria'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    talatona_mun,
    'slots'
  );

  -- Categoria: entregas (Entregas & Logística Local)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000013',
    'ca300000-0000-0000-0000-000000000003',
    'entregas',
    'Motoboys',
    'Motoboy Expresso Luanda',
    'Recolha e entrega expresso de envelopes, documentos urgentes e pequenas encomendas em toda a zona metropolitana de Luanda.',
    3500.00,
    'Kz',
    'session',
    'Luanda Central',
    ARRAY['https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&q=80'],
    ARRAY['Acompanhamento em Tempo Real', 'Entrega Segura'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'slots'
  );

  -- Categoria: profissionais (Profissionais & Serviços Empresariais)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000014',
    'ca200000-0000-0000-0000-000000000002',
    'profissionais',
    'Consultores',
    'HC Business Consulting',
    'Assessoria de gestão de negócios de topo, planeamento financeiro, contabilidade e consultoria fiscal para PMEs angolanas.',
    50000.00,
    'Kz',
    'consultation',
    'Talatona, Luanda',
    ARRAY['https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80'],
    ARRAY['Sala de Reuniões Equipada', 'Auditória Inclusa'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    talatona_mun,
    'slots'
  );

  -- Categoria: formacao (Formação & Capacitação)
  INSERT INTO public.services (id, owner_id, category_id, service_type, name, description, price, currency, price_type, location, images, amenities, rating, review_count, status, created_at, updated_at, province_id, municipality_id, booking_type)
  VALUES (
    '8c000000-0000-0000-0000-000000000015',
    'ca300000-0000-0000-0000-000000000003',
    'formacao',
    'Explicadores',
    'Explicador de Matemática & Física',
    'Explicações dinâmicas presenciais ou virtuais para o ensino secundário e universitário. Preparação rigorosa para exames nacionais.',
    5000.00,
    'Kz',
    'session',
    'Maianga, Luanda',
    ARRAY['https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80'],
    ARRAY['Material Didático Próprio', 'Suporte pós-aula via WhatsApp'],
    5.0,
    0,
    'approved',
    now(),
    now(),
    luanda_prov,
    luanda_mun,
    'slots'
  );


  -- 6. INSERT dynamic events in the future (July & August 2026)
  INSERT INTO public.events (id, title, description, image_url, location, date, created_by, type, max_participants, participants_count, status, price, activity_type, category)
  VALUES 
    (
      'ea100000-0000-0000-0000-000000000001',
      'Festival Gastronómico de Luanda',
      'O maior evento gastronómico da capital angolana reuniu os melhores chefes da cidade para degustações incríveis, música ao vivo e workshops interativos.',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
      'Esplanada Lookal, Ilha de Luanda',
      '2026-07-25 14:00:00+00',
      'ca200000-0000-0000-0000-000000000002',
      'empresa',
      300,
      142,
      'approved',
      '2500',
      'Gastronomia',
      'comer'
    ),
    (
      'ea100000-0000-0000-0000-000000000002',
      'Festa Sun & Beats',
      'Celebre o pôr-do-sol com os melhores ritmos africanos ao som de DJs de referência num ambiente inesquecível de praia.',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
      'Baía Farta Beach Club, Benguela',
      '2026-08-10 16:00:00+00',
      'ca300000-0000-0000-0000-000000000003',
      'prestador',
      500,
      89,
      'approved',
      '5000',
      'Música',
      'festas'
    );


  -- 7. INSERT reviews to populate initial ratings and trigger db triggers
  INSERT INTO public.reviews (id, client_id, provider_id, service_id, rating, comment, created_at)
  VALUES
    (
      uuid_generate_v4(),
      'ca100000-0000-0000-0000-000000000001',
      'ca200000-0000-0000-0000-000000000002',
      '8c000000-0000-0000-0000-000000000001', -- Hotel Vista Mar
      5,
      'Estadia excelente! A vista para o mar é simplesmente incrível e o atendimento de toda a equipa do hotel foi de primeira classe.',
      now() - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      'ca100000-0000-0000-0000-000000000001',
      'ca200000-0000-0000-0000-000000000002',
      '8c000000-0000-0000-0000-000000000003', -- Lookal Mar
      4,
      'O marisco estava muito fresco e o prato bem servido. Experiência fantástica na Ilha, voltarei de certeza.',
      now() - INTERVAL '5 days'
    ),
    (
      uuid_generate_v4(),
      'ca100000-0000-0000-0000-000000000001',
      'ca300000-0000-0000-0000-000000000003',
      '8c000000-0000-0000-0000-000000000009', -- Spa
      5,
      'Uma massagem maravilhosa! Ambiente calmo, limpo e música relaxante. A terapeuta foi super atenciosa.',
      now() - INTERVAL '1 day'
    );

END $$;

COMMIT;
