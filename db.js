const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'billing.db');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tax_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      percentage REAL NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      mrp REAL NOT NULL,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER DEFAULT 5,
      discount_percent REAL DEFAULT 0,
      tax_rate_id INTEGER REFERENCES tax_rates(id),
      unit TEXT DEFAULT 'pcs',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      cashier_name TEXT DEFAULT 'Cashier 1',
      customer_name TEXT DEFAULT 'Walk-in Customer',
      customer_phone TEXT DEFAULT '',
      subtotal REAL NOT NULL,
      total_discount REAL NOT NULL,
      taxable_amount REAL NOT NULL,
      total_tax REAL NOT NULL,
      round_off REAL NOT NULL,
      grand_total REAL NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      item_count INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      discount_percent REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_percent REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      line_total REAL NOT NULL
    );
  `);

  // Seed default tax rates if empty
  const taxCount = db.prepare('SELECT count(*) as count FROM tax_rates').get().count;
  if (taxCount === 0) {
    const insertTax = db.prepare('INSERT INTO tax_rates (name, percentage) VALUES (?, ?)');
    insertTax.run('Tax Exempt (0%)', 0);
    insertTax.run('GST 5%', 5);
    insertTax.run('GST 12%', 12);
    insertTax.run('GST 18%', 18);
    insertTax.run('GST 28%', 28);
  }

  // Seed sample products if empty
  const productCount = db.prepare('SELECT count(*) as count FROM products').get().count;
  if (productCount === 0) {
    seedProducts(db);
  }
}

function seedProducts(db) {
  const insertProduct = db.prepare(`
    INSERT INTO products (
      barcode, name, category, mrp, price, cost_price,
      stock_quantity, min_stock_alert, discount_percent, tax_rate_id, unit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialProducts = [
    // Groceries & Staples
    { barcode: '8901030000018', name: 'Premium Basmati Rice 1kg', category: 'Groceries', mrp: 160, price: 150, cost: 120, stock: 45, minStock: 10, discount: 5, taxId: 2, unit: 'kg' },
    { barcode: '8901030000025', name: 'Whole Wheat Atta 5kg', category: 'Groceries', mrp: 260, price: 240, cost: 200, stock: 25, minStock: 5, discount: 0, taxId: 2, unit: 'pack' },
    { barcode: '8901030000032', name: 'Refined Sunflower Oil 1L', category: 'Groceries', mrp: 180, price: 165, cost: 140, stock: 3, minStock: 8, discount: 10, taxId: 2, unit: 'bottle' }, // low stock
    { barcode: '8901030000049', name: 'Refined White Sugar 1kg', category: 'Groceries', mrp: 52, price: 48, cost: 40, stock: 60, minStock: 15, discount: 0, taxId: 2, unit: 'kg' },
    
    // Snacks & Confectionery
    { barcode: '8901030000056', name: 'Crunchy Choco Chip Cookies 200g', category: 'Snacks', mrp: 50, price: 50, cost: 35, stock: 40, minStock: 10, discount: 15, taxId: 4, unit: 'pack' },
    { barcode: '8901030000063', name: 'Spicy Potato Wafers 90g', category: 'Snacks', mrp: 30, price: 30, cost: 20, stock: 50, minStock: 10, discount: 0, taxId: 3, unit: 'pack' },
    { barcode: '8901030000070', name: 'Dark Chocolate Bar 80g', category: 'Snacks', mrp: 95, price: 90, cost: 65, stock: 4, minStock: 6, discount: 20, taxId: 4, unit: 'pcs' }, // low stock

    // Beverages
    { barcode: '8901030000087', name: 'Cola Fizz Sparkling Drink 750ml', category: 'Beverages', mrp: 45, price: 45, cost: 30, stock: 35, minStock: 8, discount: 10, taxId: 5, unit: 'bottle' },
    { barcode: '8901030000094', name: 'Natural Mineral Water 1L', category: 'Beverages', mrp: 20, price: 20, cost: 11, stock: 80, minStock: 20, discount: 0, taxId: 4, unit: 'bottle' },
    { barcode: '8901030000100', name: 'Classic Instant Coffee 100g', category: 'Beverages', mrp: 220, price: 210, cost: 160, stock: 15, minStock: 5, discount: 12, taxId: 4, unit: 'jar' },

    // Personal & Home Care
    { barcode: '8901030000117', name: 'Gentle Cleansing Bath Soap 125g', category: 'Personal Care', mrp: 65, price: 60, cost: 42, stock: 55, minStock: 12, discount: 10, taxId: 4, unit: 'pcs' },
    { barcode: '8901030000124', name: 'Herbal Toothpaste Gel 150g', category: 'Personal Care', mrp: 110, price: 105, cost: 75, stock: 2, minStock: 5, discount: 15, taxId: 4, unit: 'pcs' }, // low stock
    { barcode: '8901030000131', name: 'Deep Clean Dishwash Gel 500ml', category: 'Home Care', mrp: 125, price: 115, cost: 85, stock: 28, minStock: 8, discount: 5, taxId: 4, unit: 'bottle' }
  ];

  for (const p of initialProducts) {
    insertProduct.run(
      p.barcode, p.name, p.category, p.mrp, p.price, p.cost,
      p.stock, p.minStock, p.discount, p.taxId, p.unit
    );
  }
}

// Queries & Operations
function getAllProducts(search = '', category = '') {
  const db = getDb();
  let query = `
    SELECT p.*, t.name as tax_name, t.percentage as tax_percentage
    FROM products p
    LEFT JOIN tax_rates t ON p.tax_rate_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category && category !== 'All') {
    query += ` AND p.category = ?`;
    params.push(category);
  }

  query += ` ORDER BY p.name ASC`;
  return db.prepare(query).all(...params);
}

function getProductByBarcode(barcode) {
  const db = getDb();
  const query = `
    SELECT p.*, t.name as tax_name, t.percentage as tax_percentage
    FROM products p
    LEFT JOIN tax_rates t ON p.tax_rate_id = t.id
    WHERE p.barcode = ?
  `;
  return db.prepare(query).get(barcode.trim());
}

function getProductById(id) {
  const db = getDb();
  const query = `
    SELECT p.*, t.name as tax_name, t.percentage as tax_percentage
    FROM products p
    LEFT JOIN tax_rates t ON p.tax_rate_id = t.id
    WHERE p.id = ?
  `;
  return db.prepare(query).get(id);
}

function createProduct(data) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO products (
      barcode, name, category, mrp, price, cost_price,
      stock_quantity, min_stock_alert, discount_percent, tax_rate_id, unit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.barcode.trim(),
    data.name.trim(),
    data.category || 'General',
    Number(data.mrp) || Number(data.price),
    Number(data.price),
    Number(data.cost_price || 0),
    parseInt(data.stock_quantity, 10) || 0,
    parseInt(data.min_stock_alert, 10) || 5,
    Number(data.discount_percent || 0),
    parseInt(data.tax_rate_id, 10) || 1,
    data.unit || 'pcs'
  );
  return getProductById(result.lastInsertRowid);
}

function updateProduct(id, data) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE products SET
      barcode = ?,
      name = ?,
      category = ?,
      mrp = ?,
      price = ?,
      cost_price = ?,
      stock_quantity = ?,
      min_stock_alert = ?,
      discount_percent = ?,
      tax_rate_id = ?,
      unit = ?
    WHERE id = ?
  `);
  stmt.run(
    data.barcode.trim(),
    data.name.trim(),
    data.category || 'General',
    Number(data.mrp) || Number(data.price),
    Number(data.price),
    Number(data.cost_price || 0),
    parseInt(data.stock_quantity, 10) || 0,
    parseInt(data.min_stock_alert, 10) || 5,
    Number(data.discount_percent || 0),
    parseInt(data.tax_rate_id, 10) || 1,
    data.unit || 'pcs',
    id
  );
  return getProductById(id);
}

function deleteProduct(id) {
  const db = getDb();
  return db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

function getAllTaxRates() {
  const db = getDb();
  return db.prepare('SELECT * FROM tax_rates WHERE is_active = 1 ORDER BY percentage ASC').all();
}

function generateInvoiceNo(db) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `INV-${yyyy}${mm}${dd}`;

  const row = db.prepare(`SELECT count(*) as count FROM bills WHERE invoice_no LIKE ?`).get(`${datePrefix}%`);
  const seq = String(row.count + 1).padStart(4, '0');
  return `${datePrefix}-${seq}`;
}

function processCheckout({ cashierName, customerName, customerPhone, paymentMethod, items }) {
  const db = getDb();
  if (!items || items.length === 0) {
    throw new Error('Cart is empty. Please add items before checking out.');
  }

  // Validate stock availability first
  const productLookups = [];
  for (const item of items) {
    const product = db.prepare(`
      SELECT p.*, t.percentage as tax_percentage
      FROM products p
      LEFT JOIN tax_rates t ON p.tax_rate_id = t.id
      WHERE p.id = ?
    `).get(item.productId);

    if (!product) {
      throw new Error(`Product not found (ID: ${item.productId})`);
    }

    if (product.stock_quantity < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
    }

    productLookups.push({
      item,
      product
    });
  }

  // Calculate bill totals
  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let totalTax = 0;
  let totalItemsCount = 0;

  const processedItems = productLookups.map(({ item, product }) => {
    const qty = parseInt(item.quantity, 10);
    const unitPrice = Number(product.price);
    const lineGross = unitPrice * qty;
    
    // Discount calculation
    const discountPercent = Number(product.discount_percent || 0);
    const discountAmount = Number(((lineGross * discountPercent) / 100).toFixed(2));
    const lineAfterDiscount = lineGross - discountAmount;

    // Tax calculation
    const taxPercent = Number(product.tax_percentage || 0);
    const taxAmount = Number(((lineAfterDiscount * taxPercent) / 100).toFixed(2));
    const lineFinalTotal = Number((lineAfterDiscount + taxAmount).toFixed(2));

    subtotal += lineGross;
    totalDiscount += discountAmount;
    taxableAmount += lineAfterDiscount;
    totalTax += taxAmount;
    totalItemsCount += qty;

    return {
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      unitPrice,
      quantity: qty,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      lineTotal: lineFinalTotal
    };
  });

  const rawGrandTotal = taxableAmount + totalTax;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  // Atomic transaction
  db.exec('BEGIN');
  try {
    const invoiceNo = generateInvoiceNo(db);
    const billStmt = db.prepare(`
      INSERT INTO bills (
        invoice_no, cashier_name, customer_name, customer_phone,
        subtotal, total_discount, taxable_amount, total_tax,
        round_off, grand_total, payment_method, item_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const billResult = billStmt.run(
      invoiceNo,
      cashierName || 'Cashier 1',
      customerName || 'Walk-in Customer',
      customerPhone || '',
      Number(subtotal.toFixed(2)),
      Number(totalDiscount.toFixed(2)),
      Number(taxableAmount.toFixed(2)),
      Number(totalTax.toFixed(2)),
      roundOff,
      roundedGrandTotal,
      paymentMethod || 'Cash',
      totalItemsCount
    );

    const billId = billResult.lastInsertRowid;

    const itemStmt = db.prepare(`
      INSERT INTO bill_items (
        bill_id, product_id, product_name, barcode, unit_price,
        quantity, discount_percent, discount_amount, tax_percent, tax_amount, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const stockDecrementStmt = db.prepare(`
      UPDATE products
      SET stock_quantity = stock_quantity - ?
      WHERE id = ?
    `);

    for (const line of processedItems) {
      itemStmt.run(
        billId,
        line.productId,
        line.productName,
        line.barcode,
        line.unitPrice,
        line.quantity,
        line.discountPercent,
        line.discountAmount,
        line.taxPercent,
        line.taxAmount,
        line.lineTotal
      );

      stockDecrementStmt.run(line.quantity, line.productId);
    }

    db.exec('COMMIT');

    return getBillById(billId);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function getBillById(id) {
  const db = getDb();
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
  if (!bill) return null;

  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(id);
  return {
    ...bill,
    items
  };
}

function getAllBills(limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM bills ORDER BY id DESC LIMIT ?').all(limit);
}

function getDashboardSummary() {
  const db = getDb();
  
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todaySales = db.prepare(`
    SELECT 
      COALESCE(SUM(grand_total), 0) as totalRevenue,
      COUNT(*) as totalOrders,
      COALESCE(SUM(item_count), 0) as itemsSold
    FROM bills 
    WHERE created_at LIKE ?
  `).get(`${todayPrefix}%`);

  const productStats = db.prepare(`
    SELECT 
      COUNT(*) as totalProducts,
      COALESCE(SUM(stock_quantity), 0) as totalInventoryUnits,
      SUM(CASE WHEN stock_quantity <= min_stock_alert THEN 1 ELSE 0 END) as lowStockCount,
      SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount
    FROM products
  `).get();

  const lowStockItems = db.prepare(`
    SELECT id, barcode, name, category, stock_quantity, min_stock_alert, price
    FROM products
    WHERE stock_quantity <= min_stock_alert
    ORDER BY stock_quantity ASC
    LIMIT 10
  `).all();

  return {
    todaySales,
    productStats,
    lowStockItems
  };
}

module.exports = {
  getDb,
  getAllProducts,
  getProductByBarcode,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllTaxRates,
  processCheckout,
  getBillById,
  getAllBills,
  getDashboardSummary
};
