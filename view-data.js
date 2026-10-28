const { getDb } = require('./db.js');

const db = getDb();

console.log('\n=============================================================');
console.log('                 📦 CURRENT PRODUCT INVENTORY               ');
console.log('=============================================================');
const products = db.prepare(`
  SELECT id, barcode, name, price, discount_percent as "disc%", stock_quantity as "stock", min_stock_alert as "min"
  FROM products
  ORDER BY name ASC
`).all();
console.table(products);

console.log('\n=============================================================');
console.log('                 🧾 RECORDED SALES INVOICES                 ');
console.log('=============================================================');
const bills = db.prepare(`
  SELECT id, invoice_no, customer_name, item_count, grand_total as "total(₹)", payment_method, created_at
  FROM bills
  ORDER BY id DESC
`).all();

if (bills.length === 0) {
  console.log('No sales recorded yet.');
} else {
  console.table(bills);
}
console.log('\n');
