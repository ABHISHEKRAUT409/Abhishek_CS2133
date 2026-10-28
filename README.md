# 🛒 QuickPOS — Retail Billing & Inventory Management

A fast, lightweight, and modern Point of Sale (POS) and inventory tracking application built for small retail shops, supermarkets, and grocery stores.

---

## 🌟 Key Features

### 1. ⚡ Barcode Scanning & Price Lookup
- **Hardware Barcode Scanner Support**: Works with all standard USB or Bluetooth handheld barcode scanners (keyboard-wedge input). Automatically detects rapid barcode gun inputs and adds items to the active cart with an audio confirmation beep.
- **Camera Barcode Scanner**: Built-in camera scanner using the browser's `BarcodeDetector` API for quick phone/tablet scanning.
- **Instant Product Search**: Type-to-search with autocomplete for quick product lookup by name or barcode.

### 2. 🏷️ Product Discounts
- **Per-Product Discounts**: Configurable percentage discounts (e.g., 5%, 10%, 15%, 20% OFF).
- **Auto-Discount Detection**: Automatically detects promotional discounts when a barcode is scanned and deducts it from the bill total.

### 3. 🧾 Multi-Rate Tax Calculation & Billing
- **Configurable Tax Rates**: Full support for tax rates (GST 0%, 5%, 12%, 18%, 28% or VAT).
- **Line-by-Line Breakdown**: Calculates Gross Amount, Total Discount Savings, Taxable Amount, Tax Breakdown, and Round-off.
- **Thermal Receipt Printer Ready**: Printable receipt formatted for standard 80mm or 58mm thermal POS receipt printers as well as A4 desktop printers (`Ctrl + P`).

### 4. 📦 Real-Time Inventory & Stock Depletion
- **Live Remaining Stock Display**: Displays "Remaining in stock: X" directly in the cart and inventory catalog.
- **Low Stock & Out-of-Stock Badges**: Real-time alert badges when stock falls to or below the minimum threshold.
- **Oversell Prevention**: Automatically prevents cashiers from billing more quantity than available in inventory.
- **Automatic Stock Decrement**: Safely decrements stock levels inside atomic SQLite transactions upon checkout.

### 5. 📊 Sales Ledger & Invoices
- Searchable transaction history with invoice numbers (`INV-YYYYMMDD-XXXX`).
- One-click reprint receipt for past customers.

---

## 🚀 Quick Start

### Method 1: Double-Click Launcher (Windows)
Double-click `start.bat` in this folder. It will launch the local POS server and automatically open the billing desk in your default browser at:
```
http://localhost:3005
```

### Method 2: Command Line
```powershell
node server.js
```
Then visit [http://localhost:3005](http://localhost:3005).

---

## ⌨️ Keyboard Shortcuts
- `Enter` inside search/barcode input: Scan / Add product to cart.
- `F2`: Complete sale and trigger checkout.
- `Escape`: Close any active dialog or receipt modal.
- `Ctrl + P`: Print thermal receipt.

---

## 🛠️ Architecture & Tech Stack
- **Backend**: Node.js HTTP server (zero external npm dependencies required).
- **Database**: Native SQLite via Node's `node:sqlite` (`billing.db`).
- **Frontend**: Responsive Single-Page Application (HTML5, CSS3, ES6 JavaScript) with Web Audio sound effects and thermal printing layout.
