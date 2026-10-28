const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const {
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
} = require('./db.js');

const PORT = parseInt(process.env.PORT || '3005', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  // Prevent directory traversal
  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  try {
    // API Routes
    if (pathname.startsWith('/api/')) {
      // 1. Barcode lookup: GET /api/products/barcode/:code
      const barcodeMatch = pathname.match(/^\/api\/products\/barcode\/([^\/]+)$/);
      if (barcodeMatch && method === 'GET') {
        const barcode = decodeURIComponent(barcodeMatch[1]);
        const product = getProductByBarcode(barcode);
        if (!product) {
          return sendError(res, 404, `No product found for barcode: ${barcode}`);
        }
        return sendJson(res, 200, { product });
      }

      // 2. Single product by ID: GET/PUT/DELETE /api/products/:id
      const idMatch = pathname.match(/^\/api\/products\/(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        if (method === 'GET') {
          const product = getProductById(id);
          if (!product) return sendError(res, 404, 'Product not found');
          return sendJson(res, 200, { product });
        }
        if (method === 'PUT') {
          const body = await parseBody(req);
          const updated = updateProduct(id, body);
          return sendJson(res, 200, { product: updated, message: 'Product updated successfully' });
        }
        if (method === 'DELETE') {
          deleteProduct(id);
          return sendJson(res, 200, { success: true, message: 'Product deleted' });
        }
      }

      // 3. Products collection: GET /api/products & POST /api/products
      if (pathname === '/api/products') {
        if (method === 'GET') {
          const search = parsedUrl.query.search || '';
          const category = parsedUrl.query.category || '';
          const products = getAllProducts(search, category);
          return sendJson(res, 200, { products });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          if (!body.barcode || !body.name || !body.price) {
            return sendError(res, 400, 'Barcode, product name, and price are required');
          }
          const existing = getProductByBarcode(body.barcode);
          if (existing) {
            return sendError(res, 409, `Barcode "${body.barcode}" is already registered to "${existing.name}"`);
          }
          const created = createProduct(body);
          return sendJson(res, 201, { product: created, message: 'Product added successfully' });
        }
      }

      // 4. Tax Rates: GET /api/taxes
      if (pathname === '/api/taxes' && method === 'GET') {
        const taxes = getAllTaxRates();
        return sendJson(res, 200, { taxes });
      }

      // 5. Checkout / Process Sale: POST /api/checkout
      if (pathname === '/api/checkout' && method === 'POST') {
        const body = await parseBody(req);
        try {
          const invoice = processCheckout(body);
          return sendJson(res, 200, {
            success: true,
            invoice,
            message: 'Checkout completed successfully'
          });
        } catch (err) {
          return sendError(res, 400, err.message);
        }
      }

      // 6. Sales History: GET /api/sales & GET /api/sales/:id
      const saleIdMatch = pathname.match(/^\/api\/sales\/(\d+)$/);
      if (saleIdMatch && method === 'GET') {
        const id = parseInt(saleIdMatch[1], 10);
        const bill = getBillById(id);
        if (!bill) return sendError(res, 404, 'Bill record not found');
        return sendJson(res, 200, { bill });
      }

      if (pathname === '/api/sales' && method === 'GET') {
        const limit = parseInt(parsedUrl.query.limit || '50', 10);
        const bills = getAllBills(limit);
        return sendJson(res, 200, { bills });
      }

      // 7. Dashboard summary: GET /api/summary
      if (pathname === '/api/summary' && method === 'GET') {
        const summary = getDashboardSummary();
        return sendJson(res, 200, summary);
      }

      return sendError(res, 404, 'Endpoint not found');
    }

    // Static assets
    serveStatic(req, res, pathname);
  } catch (err) {
    console.error('Server error:', err);
    sendError(res, 500, 'Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`🛒 Retail Billing POS Server running at http://localhost:${PORT}`);
});

module.exports = server;
