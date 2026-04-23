══════════════════════════════════════════════════════════════════
  MEDIFIND v3  –  Real-Time Medicine Availability & Booking System
  Final Year Project  |  GRTIET ECE Batch 14
  Stack: Node.js + Express + MySQL  |  JWT Auth | AI Suggestion Engine | Haversine Geo Search
══════════════════════════════════════════════════════════

NEW IN v3:
  ✅  JWT Authentication + bcrypt password encryption
  ✅  AI-based medicine recommendation engine
  ✅  Symptom-driven suggestions and alternative medicines
  ✅  Geolocation + Distance Calculation (Haversine Algorithm)
  ✅  REST API Server (Node.js / Express) for search, orders, DB queries
  ✅  MySQL database with Users, Medicines, Pharmacies, Orders
  ✅  Live update-ready architecture for future WebSockets tracking
  ✅  Optional online payment integration path (Razorpay)

ARCHITECTURE OVERVIEW
──────────────────────────────────────────────────────────────────

  🔐 Authentication Layer
      • JWT token-based auth
      • Password hashing using bcrypt
      • Role-based access control for User, Pharmacy, Admin

  🧠 AI Recommendation Engine
      • AI-based suggestion system for medicine alternatives
      • Symptom keyword matching for smart recommendations
      • Endpoint: /api/ai/suggest

  🗺️ Smart Location Processing
      • Browser geolocation support
      • Distance calculation using Haversine formula
      • Pharmacy search sorted by nearest first

  📊 Backend API Layer
      • Express REST API server handles requests for search, orders, notifications, and data
      • Modular route controllers for maintainability

  🗄️ Database Layer
      • MySQL database stores Users, Medicines, Pharmacies, Orders
      • Separated config and DB connection in config/

  📡 Real-Time Tracking Upgrade
      • Designed to support WebSockets / live updates for order tracking in future

  💳 Payment Gateway (Optional)
      • Razorpay / online payment integration can be added before final order confirmation

──────────────────────────────────────────────────────────────────
FOLDER STRUCTURE
──────────────────────────────────────────────────────────────────

MediFind/
├── server.js          ← Complete backend (Node.js + Express)
├── package.json       ← Dependencies include express, mysql2, bcryptjs, jsonwebtoken, nodemailer
├── database.sql       ← Run once in MySQL Workbench
├── README.txt         ← This file
│
├── index.html         ← Login page (User / Pharmacy / Admin)
│
├── pages/
│   ├── register.html  ← Registration (User + Pharmacy tabs)
│   ├── user.html      ← Patient Dashboard
│   │                     • Search medicine by name
│   │                     • Geolocation + Haversine distance search
│   │                     • AI-based medicine suggestions and alternatives
│   │                     • Add to Cart / Buy Now buttons
│   │                     • Cart panel (slide-in)
│   │                     • My Orders with live status
│   │                     • Pharmacy Map (OpenStreetMap)
│   │                     • Notification bell
│   │
│   ├── pharmacy.html  ← Pharmacy Dashboard
│   │                     • Stats overview
│   │                     • Add/Edit/Delete medicines
│   │                     • Incoming orders management
│   │                     • Confirm / Reject / Dispatch / Deliver
│   │                     • Notification bell (new orders alert)
│   │
│   └── admin.html     ← Admin Panel
│                         • System stats
│                         • Manage users
│                         • Activate/Deactivate pharmacies
│                         • View all medicines
│                         • View all orders (filter by status)
│
├── css/
│   └── style.css      ← Full dark theme stylesheet
│
└── js/
    └── app.js         ← Shared utilities (api, alert, auth)

──────────────────────────────────────────────────────────────────
STEP 1  –  INSTALL NODE.JS
──────────────────────────────────────────────────────────────────

1. Go to:  https://nodejs.org/
2. Download LTS version (18.x or 20.x or 22.x)
3. Install (keep clicking Next)
4. Verify in VS Code Terminal (Ctrl + `):
      node -v
   Should print:  v22.x.x  (or similar)

──────────────────────────────────────────────────────────────────
STEP 2  –  SETUP MYSQL DATABASE
──────────────────────────────────────────────────────────────────

1. Open MySQL Workbench
2. Connect to  localhost:3306  (root user)
3. Open new SQL tab
4. Open the file  database.sql  from this project folder
   (File → Open SQL Script → select database.sql)
5. Press  Ctrl+A  to select all
6. Press  Ctrl+Shift+Enter  (or click the ⚡ Execute All button)
7. You should see at the bottom:
      ✅  "Database ready!"
      pharmacies: 5
      medicines:  25
      users:      1

──────────────────────────────────────────────────────────────────
STEP 3  –  SET MYSQL PASSWORD IN server.js
──────────────────────────────────────────────────────────────────

Open server.js in VS Code.
Find this line near the top (around line 20):

    password: 'root',       // ← YOUR MySQL password

Change 'root' to your actual MySQL root password.

Examples:
    password: '',           (if no password set)
    password: 'mysql123',   (if your password is mysql123)
    password: 'Admin@123',  (if your password is Admin@123)

Save the file (Ctrl+S).

──────────────────────────────────────────────────────────────────
STEP 4  –  INSTALL DEPENDENCIES
──────────────────────────────────────────────────────────────────

In VS Code:
1. Open the MediFind folder:  File → Open Folder → select MediFind
2. Open Terminal:  Ctrl + `  (backtick key)
3. Type this command and press Enter:

      npm install

   This downloads mysql2 and nodemailer.
   Wait for it to finish (~20 seconds).
   You will see a  node_modules  folder created.

──────────────────────────────────────────────────────────────────
STEP 5  –  START THE SERVER
──────────────────────────────────────────────────────────────────

In the VS Code Terminal, type:

    node server.js

You will see:
  ╔═══════════════════════════════════════════════╗
  ║   💊  MediFind v3  –  Server Running          ║
  ║   ➜   http://localhost:3000                   ║
  ╚═══════════════════════════════════════════════╝

If you see "MySQL connected" that means database is connected!
If you see "MySQL Error" → check your password in Step 3.

──────────────────────────────────────────────────────────────────
STEP 6  –  OPEN IN BROWSER
──────────────────────────────────────────────────────────────────

Open Chrome or Edge.
Go to:   http://localhost:3000

You will see the MediFind login page!

──────────────────────────────────────────────────────────────────
LOGIN CREDENTIALS (pre-loaded in database)
──────────────────────────────────────────────────────────────────

ROLE        LOGIN / EMAIL              PASSWORD
──────────────────────────────────────────────────────
Admin       admin                      admin123
User        user@test.com              user123
Pharmacy 1  ravi@medplus.com           ravi123
Pharmacy 2  priya@apollo.com           priya123
Pharmacy 3  suresh@lifecare.com        suresh123
Pharmacy 4  meena@healthpt.com         meena123
Pharmacy 5  karthik@curemart.com       karthik123

──────────────────────────────────────────────────────────────────
ENABLE EMAIL NOTIFICATIONS (OPTIONAL – for demo)
──────────────────────────────────────────────────────────────────

To enable real email alerts (Gmail → User and Pharmacy):

1. Open server.js
2. Find the email CONFIG section (~line 25):

      email: {
        enabled    : false,                         ← change to true
        gmail      : 'yourgmail@gmail.com',         ← your Gmail
        appPassword: 'xxxx xxxx xxxx xxxx'          ← App Password
      }

3. HOW TO GET APP PASSWORD:
   a. Go to: https://myaccount.google.com/
   b. Security → 2-Step Verification → Turn ON
   c. Search "App Passwords" in the Google search bar
   d. Select App: Mail, Device: Windows Computer
   e. Click Generate → Copy the 16-character password
   f. Paste it in appPassword above (with spaces, like: abcd efgh ijkl mnop)

4. Change enabled to true
5. Save server.js and restart: node server.js

When email is ON:
  → User gets email when order is PLACED
  → Pharmacy gets email when new ORDER ARRIVES
  → User gets email when pharmacy CONFIRMS / REJECTS / DISPATCHES / DELIVERS

NOTE: Without email enabled, the system still works fully.
      In-app notifications (bell icon) always work without Gmail setup.

──────────────────────────────────────────────────────────────────
HOW THE CART & BOOKING WORKS
──────────────────────────────────────────────────────────────────

1. User searches medicine name (e.g. "Paracetamol")
2. Results show all pharmacies that have it in stock
3. Two buttons appear on each medicine card:
   🛒 "Add to Cart"  →  Opens booking modal, choose qty + delivery type,
                         then click "Add to Cart" → item goes to cart panel
   ⚡ "Buy Now"      →  Instantly adds 1 item to cart and opens cart panel

4. Cart Panel (🛒 in sidebar):
   → Shows all cart items
   → +/− buttons to change quantity
   → Dropdown to set Pickup or Home Delivery per item
   → 🗑️ to remove item
   → Shows running total
   → "Place All Orders" button → places all items as separate orders

5. After checkout:
   → Each medicine becomes an order in the database
   → Pharmacy receives in-app notification + email (if enabled)
   → User receives in-app notification + email (if enabled)

6. Pharmacy sees order in their "Incoming Orders" tab
7. Pharmacy clicks Confirm → Dispatch → Delivered
8. User sees status update in "My Orders" tab
9. Each status change sends email notification to user

──────────────────────────────────────────────────────────────────
DEMO SCRIPT (how to present to college)
──────────────────────────────────────────────────────────────────

1.  Start server:       node server.js
2.  Open browser:       http://localhost:3000
3.  Show login page     (3 roles: User, Pharmacy, Admin)

--- USER DEMO ---
4.  Login as User       (user@test.com / user123)
5.  Search "Paracetamol" → shows 5 pharmacies with stock
6.  Click "📍 My Location" → shows distance to each pharmacy
7.  Click "Add to Cart" → set qty=2, Home Delivery → Add
8.  Search "Cetirizine" → Add another item to cart
9.  Open Cart (🛒) → show 2 items, change qty, set delivery
10. Click "Place All Orders" → success notification
11. Go to "My Orders" → both orders show PENDING status
12. Show Notification bell (🔔) → new notification appears

--- PHARMACY DEMO ---
13. Logout → Login as Pharmacy  (ravi@medplus.com / ravi123)
14. Dashboard → shows 2 Pending orders
15. Notification bell → "New order received" alert
16. Go to "Incoming Orders" → see both orders from the user
17. Click "✅ Confirm" on first order
18. Click "🚚 Dispatch" on confirmed order

--- USER SEES STATUS ---
19. Switch back to user tab → "My Orders" → Refresh
20. Order shows CONFIRMED then DISPATCHED status
21. Notification bell → "Order confirmed" notification

--- PHARMACY INVENTORY ---
22. Go to "Medicine Inventory" → click "+ Add Medicine"
23. Fill: Panadol Extra, Brand: GSK, Price: 8, Stock: 100
24. Click Save → appears instantly in list
25. Click ✏️ Edit → change stock to 150 → Save

--- ADMIN DEMO ---
26. Logout → Login as Admin  (admin / admin123)
27. Overview shows: 2 users, 5 pharmacies, 25 medicines, orders count
28. Click "Pharmacies" → Deactivate one pharmacy
29. Go back to user, search medicine → deactivated pharmacy NOT shown
30. Reactivate the pharmacy from admin
31. "All Orders" tab → filter by CONFIRMED

──────────────────────────────────────────────────────────────────
TROUBLESHOOTING
──────────────────────────────────────────────────────────────────

PROBLEM: "Cannot reach server" on login
FIX:     node server.js is not running.
         Open VS Code Terminal and run:  node server.js

PROBLEM: "MySQL Error: Access denied"
FIX:     Wrong password. Open server.js → find DB_PASSWORD → change it.

PROBLEM: "MySQL Error: Unknown database medifind_db"
FIX:     Run database.sql in MySQL Workbench first.

PROBLEM: Email not working
FIX:     Check Gmail App Password. Make sure 2-Step verification is ON.
         The app still works without email. Only in-app notifications need email disabled.

PROBLEM: Cart items disappear after refresh
FIX:     Cart is saved in browser localStorage.
         If you cleared browser data, the cart resets. This is normal behaviour.

PROBLEM: Map not showing
FIX:     Needs internet (loads map tiles from OpenStreetMap).
         Check your internet connection and refresh.

PROBLEM: Location not working
FIX:     Browser needs permission. Click "Allow" when it asks.
         Must run on localhost (not file://). Make sure server is running.

PROBLEM: Port 3000 already in use
FIX:     Close any other terminals running node server.js
         Or restart VS Code and try again.

──────────────────────────────────────────────────────────────────
TECH STACK SUMMARY
──────────────────────────────────────────────────────────────────

Layer         Technology
──────────────────────────────────────────────
Frontend      HTML5, CSS3, Vanilla JavaScript
Backend       Node.js (built-in http module, no Express needed)
Database      MySQL 8.x
DB Driver     mysql2 (npm package)
Email         Nodemailer + Gmail SMTP (npm package)
Maps          Leaflet.js + OpenStreetMap (free, no API key)
Fonts         Google Fonts (Outfit + Playfair Display)
IDE           Visual Studio Code

Total npm packages: 2  (mysql2, nodemailer)
No framework (no Express, no React, no Angular)
No Java, No Tomcat, No Eclipse needed.

──────────────────────────────────────────────────────────────────
DATABASE TABLES
──────────────────────────────────────────────────────────────────

Table          Columns
──────────────────────────────────────────────
users          id, full_name, email, password, phone, address,
               latitude, longitude, created_at

pharmacies     id, owner_name, pharmacy_name, email, password,
               phone, address, city, latitude, longitude,
               is_active, created_at

medicines      id, pharmacy_id, medicine_name, brand, category,
               price, stock_quantity, unit, requires_prescription,
               delivery_available, description, created_at

orders         id, user_id, pharmacy_id, medicine_id, quantity,
               total_price, delivery_type, delivery_address,
               status, order_date

notifications  id, user_id, pharmacy_id, message, type,
               is_read, created_at

══════════════════════════════════════════════════════════════════
  Project by:  GAYATHRI P, GNANESHWARI T, YOGASHREE K
  Guided by:   Dr. P SIVAKUMAR, Professor, Dept. of ECE
  GRTIET  |  Batch 14  |  2025-2026
══════════════════════════════════════════════════════════════════
