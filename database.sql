-- ══════════════════════════════════════════════════════════════
--  MediFind v3  –  Run ALL in MySQL Workbench
--  Select All (Ctrl+A) → Execute (Ctrl+Shift+Enter)
-- ══════════════════════════════════════════════════════════════

DROP DATABASE IF EXISTS medifind_db;
CREATE DATABASE medifind_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medifind_db;

CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  phone      VARCHAR(20) DEFAULT '',
  address    TEXT,
  latitude   DOUBLE DEFAULT 0,
  longitude  DOUBLE DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pharmacies (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  owner_name    VARCHAR(100) NOT NULL,
  pharmacy_name VARCHAR(150) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  phone         VARCHAR(20) DEFAULT '',
  address       TEXT,
  city          VARCHAR(100) DEFAULT '',
  latitude      DOUBLE DEFAULT 0,
  longitude     DOUBLE DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicines (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  pharmacy_id           INT NOT NULL,
  medicine_name         VARCHAR(150) NOT NULL,
  brand                 VARCHAR(100) DEFAULT '',
  category              VARCHAR(100) DEFAULT 'General',
  price                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity        INT DEFAULT 0,
  unit                  VARCHAR(50) DEFAULT 'Tablet',
  requires_prescription TINYINT(1) DEFAULT 0,
  delivery_available    TINYINT(1) DEFAULT 1,
  description           TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  pharmacy_id      INT NOT NULL,
  total_price      DECIMAL(10,2) NOT NULL,
  delivery_type    ENUM('PICKUP','HOME_DELIVERY') DEFAULT 'PICKUP',
  delivery_address TEXT,
  status           ENUM('PENDING','CONFIRMED','REJECTED','DISPATCHED','DELIVERED') DEFAULT 'PENDING',
  order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  price       DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT DEFAULT NULL,
  pharmacy_id INT DEFAULT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(50) DEFAULT 'INFO',
  is_read     TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════ SEED DATA ════

INSERT INTO pharmacies (owner_name, pharmacy_name, email, password, phone, address, city, latitude, longitude) VALUES
('Ravi Kumar',   'MedPlus Pharmacy',   'ravi@medplus.com',    'ravi123',   '9876543210', '12, Anna Salai, Chennai', 'Chennai', 13.0827, 80.2707),
('Priya Singh',  'Apollo Pharmacy',    'priya@apollo.com',    'priya123',  '9876543211', '34, T.Nagar, Chennai',    'Chennai', 13.0418, 80.2341),
('Suresh Babu',  'LifeCare Medical',   'suresh@lifecare.com', 'suresh123', '9876543212', '56, Adyar, Chennai',      'Chennai', 13.0067, 80.2554),
('Meena Devi',   'HealthPoint Pharma', 'meena@healthpt.com',  'meena123',  '9876543213', '78, Velachery, Chennai',  'Chennai', 12.9783, 80.2209),
('Karthik R',    'CureMart Pharmacy',  'karthik@curemart.com','karthik123','9876543214', '90, Tambaram, Chennai',   'Chennai', 12.9249, 80.1000);

INSERT INTO medicines (pharmacy_id, medicine_name, brand, category, price, stock_quantity, unit, requires_prescription, delivery_available, description) VALUES
(1, 'Paracetamol 500mg', 'Crocin',    'Pain Relief', 5.50, 200, 'Tablet', 0, 1, 'Fever and mild pain relief'),
(1, 'Amoxicillin 250mg', 'Mox',       'Antibiotic', 18.00, 80, 'Capsule', 1, 1, 'Broad spectrum antibiotic'),
(1, 'Cetirizine 10mg',   'Zyrtec',    'Allergy',     8.00, 150, 'Tablet', 0, 1, '24-hour allergy relief'),
(1, 'Metformin 500mg',   'Glucophage','Diabetes',   12.00, 60, 'Tablet', 1, 1, 'Type 2 diabetes management'),
(1, 'Omeprazole 20mg',   'Prilosec',  'Gastric',    15.00, 100, 'Capsule', 0, 1, 'Acidity and heartburn'),
(2, 'Paracetamol 650mg', 'Dolo-650',  'Pain Relief', 6.00, 400, 'Tablet', 0, 1, 'Higher dose for adults'),
(2, 'Ibuprofen 400mg',   'Brufen',    'Pain Relief',10.00, 120, 'Tablet', 0, 1, 'Anti-inflammatory pain relief'),
(2, 'Azithromycin 500mg','Azee',      'Antibiotic', 65.00, 40, 'Tablet', 1, 0, 'Z-pack antibiotic course'),
(2, 'Atorvastatin 10mg', 'Lipitor',   'Cardiac',    35.00, 90, 'Tablet', 1, 1, 'Cholesterol management'),
(2, 'Pantoprazole 40mg', 'Pan-D',     'Gastric',    18.00, 110, 'Tablet', 0, 1, 'Gastric acid protection'),
(3, 'Cetirizine 10mg',   'Alerid',    'Allergy',     7.50, 200, 'Tablet', 0, 1, 'Non-drowsy antihistamine'),
(3, 'Metformin 1000mg',  'Glycomet', 'Diabetes',    20.00, 50, 'Tablet', 1, 1, 'Extended release diabetes'),
(3, 'Vitamin D3 60K',    'Calcirol',  'Supplement', 55.00, 75, 'Capsule', 0, 1, 'Weekly vitamin D supplement'),
(3, 'Paracetamol 500mg', 'Calpol',    'Pain Relief', 5.00, 300, 'Tablet', 0, 1, 'For fever and pain'),
(3, 'Montelukast 10mg',  'Singulair', 'Allergy',    45.00, 60, 'Tablet', 1, 1, 'Asthma and allergy control'),
(4, 'Metformin 500mg',   'Glyciphage','Diabetes',   11.00, 80, 'Tablet', 1, 1, 'Standard diabetes medicine'),
(4, 'Amlodipine 5mg',    'Norvasc',  'Cardiac',    22.00, 65, 'Tablet', 1, 1, 'Blood pressure control'),
(4, 'Paracetamol 500mg', 'Metacin',   'Pain Relief', 4.50, 250, 'Tablet', 0, 1, 'Fever and pain relief'),
(4, 'Ranitidine 150mg',  'Aciloc',    'Gastric',     9.00, 90, 'Tablet', 0, 1, 'Reduces stomach acid'),
(4, 'Cetirizine 5mg',    'Okacet',    'Allergy',     6.00, 130, 'Tablet', 0, 1, 'Antihistamine tablet'),
(5, 'Amoxicillin 500mg', 'Novamox',  'Antibiotic', 25.00, 70, 'Capsule', 1, 1, 'Stronger antibiotic dose'),
(5, 'Ibuprofen 200mg',   'Advil',    'Pain Relief', 8.00, 160, 'Tablet', 0, 1, 'Standard OTC pain relief'),
(5, 'Vitamin C 500mg',   'Limcee',   'Supplement', 12.00, 200, 'Tablet', 0, 1, 'Immunity booster'),
(5, 'Omeprazole 40mg',   'Omez',     'Gastric',    22.00, 80, 'Capsule', 0, 1, 'Higher dose acid reducer'),
(5, 'Paracetamol 500mg', 'Paracip',  'Pain Relief', 5.00, 180, 'Tablet', 0, 1, 'For pain and fever');

INSERT INTO users (full_name, email, password, phone, address, latitude, longitude) VALUES
('Test User','user@test.com','user123','9000000001','No.5, Sample Street, Chennai',13.0500,80.2500);

SELECT 'Database ready!' AS Status;
SELECT COUNT(*) AS pharmacies FROM pharmacies;
SELECT COUNT(*) AS medicines FROM medicines;
SELECT COUNT(*) AS users FROM users;
