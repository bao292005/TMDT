/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const { PrismaClient } = require('@prisma/client');
const { randomUUID, randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();
const KEY_LENGTH = 64;

function generateHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Starting seed...");

  // -------------------------
  // 1. Identity (Users)
  // -------------------------
  const adminId = randomUUID();
  const customerId = randomUUID();

  await prisma.users.create({
    data: {
      id: adminId,
      email: 'admin@example.com',
      password_hash: generateHash('admin123'),
      role: 'admin',
      account_status: 'active',
      full_name: 'Admin User',
      phone: '0901234567',
    }
  });

  await prisma.users.create({
    data: {
      id: customerId,
      email: 'customer@example.com',
      password_hash: generateHash('customer123'),
      role: 'customer',
      account_status: 'active',
      full_name: 'Customer User',
      phone: '0911223344',
      addresses: {
        create: [
          { address_line: '123 Nguyen Hue, Ho Chi Minh', position: 1 },
          { address_line: '456 Le Loi, Ha Noi', position: 2 }
        ]
      }
    }
  });

  console.log("Users created");

  // -------------------------
  // 2. Catalog (Products & Variants)
  // -------------------------
  const catalogSeeds = [
    {
      id: 'p-ao-thun-basic-den',
      slug: 'ao-thun-basic-den',
      name: 'Áo thun basic màu đen',
      category: 'ao-thun',
      description: 'Áo thun cotton form regular, phù hợp mặc hằng ngày.',
      price_minor: 199000,
      thumbnail_url: '/products/ao-thun-basic-den.jpg',
      media: ['/products/ao-thun-basic-den.jpg'],
      variants: [
        { size: 'm', color: 'den', stock: 18, variant_code: 'ATBD-M-DEN' },
        { size: 'l', color: 'den', stock: 0, variant_code: 'ATBD-L-DEN' },
      ],
      is_active: true,
    },
    {
      id: 'p-ao-thun-basic-trang',
      slug: 'ao-thun-basic-trang',
      name: 'Áo thun basic màu trắng',
      category: 'ao-thun',
      description: 'Áo thun cotton mềm, dễ phối cùng quần jean hoặc chân váy.',
      price_minor: 199000,
      thumbnail_url: '/products/ao-thun-basic-trang.jpg',
      media: ['/products/ao-thun-basic-trang.jpg'],
      variants: [
        { size: 'm', color: 'trang', stock: 7, variant_code: 'ATBT-M-TRANG' },
        { size: 'l', color: 'trang', stock: 12, variant_code: 'ATBT-L-TRANG' },
      ],
      is_active: true,
    },
    {
      id: 'p-quan-jean-slim-xanh',
      slug: 'quan-jean-slim-xanh',
      name: 'Quần jean slim xanh đậm',
      category: 'quan-jean',
      description: 'Quần jean slim fit co giãn nhẹ, phù hợp phong cách năng động.',
      price_minor: 499000,
      thumbnail_url: '/products/quan-jean-slim-xanh.jpg',
      media: ['/products/quan-jean-slim-xanh.jpg'],
      variants: [
        { size: 'm', color: 'xanh', stock: 9, variant_code: 'QJSX-M-XANH' },
        { size: 'l', color: 'xanh', stock: 4, variant_code: 'QJSX-L-XANH' },
      ],
      is_active: true,
    },
    {
      id: 'p-vay-midi-hoa',
      slug: 'vay-midi-hoa',
      name: 'Váy midi họa tiết hoa',
      category: 'vay',
      description: 'Váy midi chất voan nhẹ, họa tiết hoa nổi bật cho dịp dạo phố.',
      price_minor: 599000,
      thumbnail_url: '/products/vay-midi-hoa.jpg',
      media: ['/products/vay-midi-hoa.jpg'],
      variants: [
        { size: 's', color: 'do', stock: 6, variant_code: 'VMH-S-DO' },
        { size: 'm', color: 'do', stock: 2, variant_code: 'VMH-M-DO' },
      ],
      is_active: true,
    },
  ];

  const seededProducts = [];
  for (const seed of catalogSeeds) {
    const created = await prisma.products.create({
      data: {
        id: seed.id,
        slug: seed.slug,
        name: seed.name,
        category: seed.category,
        description: seed.description,
        price_minor: seed.price_minor,
        thumbnail_url: seed.thumbnail_url,
        is_active: seed.is_active,
        variants: {
          create: seed.variants.map((variant) => ({
            ...variant,
            is_active: true,
          })),
        },
        media: {
          create: seed.media.map((url, index) => ({
            url,
            position: index,
          })),
        },
      },
      include: { variants: true },
    });

    seededProducts.push(created);
  }

  const productA = seededProducts[0];

  console.log("Products and Variants created");

  // -------------------------
  // 3. Cart
  // -------------------------
  const cart = await prisma.carts.create({
    data: {
      user_id: customerId,
      items: {
        create: [
          { product_variant_id: productA.variants[0].id, quantity: 2 }
        ]
      }
    }
  });

  console.log("Carts created");

  // -------------------------
  // 4. Order & Payment & Shipment
  // -------------------------
  
  // Order 1: Paid Online
  const order1_id = randomUUID();
  await prisma.orders.create({
    data: {
      id: order1_id,
      user_id: customerId,
      status: 'paid',
      selected_address: '123 Nguyen Hue, Ho Chi Minh',
      selected_shipping_method: 'standard',
      subtotal_minor: 300000,
      shipping_fee_minor: 30000,
      discount_minor: 0,
      total_minor: 330000,
      items: {
        create: [
          {
            product_variant_id: productA.variants[0].id,
            product_slug_snapshot: 'ao-thun-basic',
            title_snapshot: 'Áo Thun Basic - M, White',
            price_minor_snapshot: 150000,
            quantity: 2
          }
        ]
      },
      payment_transactions: {
        create: {
          method: 'online',
          status: 'paid',
          amount_minor: 330000,
          provider: 'momo',
          provider_reference: 'MOMO123456',
          last_idempotency_key: 'idempotent_order1',
          callbacks: {
            create: [
              {
                order_id: order1_id,
                idempotency_key: 'idempotent_order1',
                provider_reference: 'MOMO123456',
                raw_status: 'SUCCESS',
                mapped_status: 'paid',
                raw_payload: '{"status": "SUCCESS"}'
              }
            ]
          }
        }
      },
      shipment: {
        create: {
          tracking_number: 'TRACK123456',
          carrier: 'GHN',
          status: 'shipped',
          events: {
            create: [
              { status: 'shipped', event_time: new Date(), source: 'GHN_WEBHOOK', payload: '{"event":"shipped"}' }
            ]
          }
        }
      },
      audit_logs: {
        create: [
          {
            actor_id: customerId,
            action: 'PLACE_ORDER',
            metadata: '{"source": "seed"}'
          },
          {
            action: 'PAYMENT_CALLBACK',
            before_status: 'pending_payment',
            after_status: 'paid',
            metadata: '{"provider": "momo"}'
          }
        ]
      }
    }
  });

  console.log("Orders, Payments, Shipments seeded");

  // -------------------------
  // 5. Reporting (Export Jobs)
  // -------------------------
  await prisma.export_jobs.createMany({
    data: [
      {
        user_id: adminId,
        report_type: 'Revenue',
        format: 'CSV',
        status: 'Completed',
        start_date: new Date('2026-04-01T00:00:00.000Z'),
        end_date: new Date('2026-04-15T23:59:59.999Z'),
        download_url: '/api/admin/reports/download/demo-revenue-csv',
      },
      {
        user_id: adminId,
        report_type: 'Order',
        format: 'PDF',
        status: 'Processing',
        start_date: new Date('2026-04-10T00:00:00.000Z'),
        end_date: new Date('2026-04-15T23:59:59.999Z'),
      },
    ],
  });

  console.log("Reporting export jobs seeded");
  console.log("Seed completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
