import os
import json
import time
import sqlite3
from datetime import datetime, timezone
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse

PORT = 5000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
SQLITE_DB = os.path.join(DATA_DIR, 'farming.db')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_db_connection():
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create Contacts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            subject TEXT,
            message TEXT,
            status TEXT DEFAULT 'New',
            createdAt TEXT
        )
    ''')

    # Create Quotes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quotes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            company TEXT,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            material TEXT,
            process TEXT,
            thickness TEXT,
            quantity TEXT,
            details TEXT,
            status TEXT DEFAULT 'Pending',
            createdAt TEXT
        )
    ''')

    # Create Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            price_tag TEXT NOT NULL,
            icon_class TEXT NOT NULL,
            createdAt TEXT
        )
    ''')

    # Insert default products if empty
    cursor.execute('SELECT COUNT(*) FROM products')
    if cursor.fetchone()[0] == 0:
        default_products = [
            ("prd_1", "Heavy Duty Tractor Rotavator", "Multi-speed gearbox rotavator with boron steel blades for deep soil tilling & seedbed prep.", "Govt Subsidy Approved", "fas fa-tractor"),
            ("prd_2", "Solar Water Pumpset (5HP - 10HP)", "Submersible DC solar pump with MPPT controller drive & automatic dry-run protection.", "Complete Kit", "fas fa-sun"),
            ("prd_3", "Modular Polyhouse & Shade Net", "Hot-dip galvanized steel arc structure with 200-micron UV stabilized poly film & foggers.", "Custom Acreage", "fas fa-warehouse"),
            ("prd_4", "Automatic Drip Fertigation Kit", "Includes disc/gravel filters, venturi injector, pressure gauge & clog-resistant drip lines.", "Ready-to-Install", "fas fa-droplet"),
            ("prd_5", "Organic Farm Waste Shredder", "High capacity diesel/electric shredder machine for coconut fronds, sugarcane trash & bio-waste.", "High Performance", "fas fa-leaf"),
            ("prd_6", "Solar Electric Farm Fencing Kit", "High voltage low amperage solar energizer with backup battery & insulated wire posts.", "Wild Crop Protection", "fas fa-shield-halved")
        ]
        now = datetime.now(timezone.utc).isoformat()
        cursor.executemany('INSERT INTO products (id, title, description, price_tag, icon_class, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                           [(p[0], p[1], p[2], p[3], p[4], now) for p in default_products])

    # Insert default contact if empty
    cursor.execute('SELECT COUNT(*) FROM contacts')
    if cursor.fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute('''
            INSERT INTO contacts (id, name, email, phone, subject, message, status, createdAt)
            VALUES ('cnt_101', 'Karthik Subramanian', 'karthik@greenfields.in', '+91 98765 11223',
                    '50-Acre Drip Irrigation System Inquiry',
                    'We require automated drip irrigation setup and solar water pump for our coconut and banana farm in Pollachi.',
                    'New', ?)
        ''', (now,))

    # Insert default quote if empty
    cursor.execute('SELECT COUNT(*) FROM quotes')
    if cursor.fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute('''
            INSERT INTO quotes (id, name, company, email, phone, material, process, thickness, quantity, details, status, createdAt)
            VALUES ('qte_201', 'Senthil Kumar', 'Kongu Agri Farms', 'senthil@konguagri.in', '+91 94430 88990',
                    'Polyhouse & Greenhouse System', 'Hi-Tech Climate Controlled Polyhouse', '500 Sq. Meters', '2 Units',
                    'Requires UV stabilized poly film shade nets and automated mister systems for high-yield horticulture.',
                    'Pending', ?)
        ''', (now,))

    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            location TEXT,
            password TEXT NOT NULL,
            createdAt TEXT
        )
    ''')

    # Insert default user if empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute('''
            INSERT INTO users (id, name, phone, email, location, password, createdAt)
            VALUES ('usr_101', 'Karthik Subramanian', '9876543210', 'karthik@muthufarming.com', 'Pollachi, Coimbatore', 'farmer123', ?)
        ''', (now,))

    conn.commit()
    conn.close()

init_db()

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def get_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length)
            return json.loads(body.decode('utf-8'))
        return {}

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path).path

        if parsed_path == '/' or parsed_path == '':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            login_file = os.path.join(BASE_DIR, 'login.html')
            with open(login_file, 'rb') as f:
                self.wfile.write(f.read())
            return

        if parsed_path == '/api/quotes':
            conn = get_db_connection()
            rows = conn.execute('SELECT * FROM quotes ORDER BY createdAt DESC').fetchall()
            conn.close()
            data = [dict(r) for r in rows]
            self.send_json({"success": True, "count": len(data), "data": data})
            return

        if parsed_path == '/api/contacts':
            conn = get_db_connection()
            rows = conn.execute('SELECT * FROM contacts ORDER BY createdAt DESC').fetchall()
            conn.close()
            data = [dict(r) for r in rows]
            self.send_json({"success": True, "count": len(data), "data": data})
            return

        if parsed_path == '/api/products':
            conn = get_db_connection()
            rows = conn.execute('SELECT * FROM products ORDER BY createdAt DESC').fetchall()
            conn.close()
            data = [dict(r) for r in rows]
            self.send_json({"success": True, "count": len(data), "data": data})
            return

        if parsed_path == '/api/users':
            conn = get_db_connection()
            rows = conn.execute('SELECT id, name, phone, email, location, createdAt FROM users ORDER BY createdAt DESC').fetchall()
            conn.close()
            data = [dict(r) for r in rows]
            self.send_json({"success": True, "count": len(data), "data": data})
            return

        super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path).path

        if parsed_path == '/api/register':
            body = self.get_json_body()
            name = body.get('name')
            phone = str(body.get('phone', '')).strip()
            email = str(body.get('email', '')).strip().lower()
            location = body.get('location', 'Tamil Nadu')
            password = body.get('password')

            if not name or not phone or not email or not password:
                self.send_json({"success": False, "message": "Name, Phone Number, Email and Password are required."}, 400)
                return

            clean_phone = ''.join(filter(str.isdigit, phone))
            uid = "usr_" + str(int(time.time() * 1000))
            now = datetime.now(timezone.utc).isoformat()

            conn = get_db_connection()
            # check existing
            existing = conn.execute('SELECT * FROM users WHERE phone=? OR email=?', (clean_phone, email)).fetchone()
            if existing:
                conn.close()
                self.send_json({"success": False, "message": "Account already exists with this Phone Number or Email ID!"}, 400)
                return

            conn.execute('INSERT INTO users (id, name, phone, email, location, password, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                         (uid, name, clean_phone, email, location, password, now))
            conn.commit()
            conn.close()

            user_data = {"id": uid, "name": name, "phone": clean_phone, "email": email, "location": location, "createdAt": now}
            self.send_json({"success": True, "message": "Farmer account registered successfully! You can now log in.", "user": user_data}, 201)
            return

        if parsed_path == '/api/login':
            body = self.get_json_body()
            identifier = str(body.get('identifier', '')).strip()
            password = body.get('password')
            otp = body.get('otp')

            if not identifier:
                self.send_json({"success": False, "message": "Please enter your Phone Number or Email ID."}, 400)
                return

            clean_id = ''.join(filter(str.isdigit, identifier))
            conn = get_db_connection()
            rows = conn.execute('SELECT * FROM users').fetchall()
            conn.close()

            user = None
            for r in rows:
                u_dict = dict(r)
                u_phone = ''.join(filter(str.isdigit, u_dict.get('phone', '')))
                u_email = u_dict.get('email', '').lower()
                if (clean_id and u_phone and (clean_id in u_phone or u_phone in clean_id)) or (identifier.lower() == u_email):
                    user = u_dict
                    break

            if not user:
                self.send_json({"success": False, "message": "No account found with this Phone Number or Email ID. Please Register first."}, 404)
                return

            if otp:
                user.pop('password', None)
                self.send_json({"success": True, "message": "Login successful via OTP!", "user": user})
                return

            if user.get('password') != password:
                self.send_json({"success": False, "message": "Incorrect Password. Please check your password or use OTP login."}, 401)
                return

            user.pop('password', None)
            self.send_json({"success": True, "message": "Welcome back! Login successful.", "user": user})
            return

        if parsed_path == '/api/contact':
            body = self.get_json_body()
            name = body.get('name')
            email = body.get('email')
            phone = body.get('phone')
            if not name or not email or not phone:
                self.send_json({"success": False, "message": "Name, email and phone are required."}, 400)
                return

            cid = "cnt_" + str(int(time.time() * 1000))
            now = datetime.now(timezone.utc).isoformat()
            subject = body.get('subject', 'General Inquiry')
            message = body.get('message', '')

            conn = get_db_connection()
            conn.execute('INSERT INTO contacts (id, name, email, phone, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                         (cid, name, email, phone, subject, message, 'New', now))
            conn.commit()
            conn.close()

            new_contact = {"id": cid, "name": name, "email": email, "phone": phone, "subject": subject, "message": message, "status": "New", "createdAt": now}
            self.send_json({"success": True, "message": "Thank you! Your contact message has been recorded in SQLite Database.", "data": new_contact}, 201)
            return

        if parsed_path == '/api/quote':
            body = self.get_json_body()
            name = body.get('name')
            email = body.get('email')
            phone = body.get('phone')
            if not name or not email or not phone:
                self.send_json({"success": False, "message": "Name, email and phone are required."}, 400)
                return

            qid = "qte_" + str(int(time.time() * 1000))
            now = datetime.now(timezone.utc).isoformat()
            company = body.get('company', 'N/A')
            material = body.get('material', 'Smart Drip Irrigation')
            process = body.get('process', 'General Crop')
            thickness = body.get('thickness', 'N/A')
            quantity = str(body.get('quantity', '1'))
            details = body.get('details', '')

            conn = get_db_connection()
            conn.execute('INSERT INTO quotes (id, name, company, email, phone, material, process, thickness, quantity, details, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                         (qid, name, company, email, phone, material, process, thickness, quantity, details, 'Pending', now))
            conn.commit()
            conn.close()

            new_quote = {"id": qid, "name": name, "company": company, "email": email, "phone": phone, "material": material, "process": process, "thickness": thickness, "quantity": quantity, "details": details, "status": "Pending", "createdAt": now}
            self.send_json({"success": True, "message": "Quote request submitted successfully to SQLite Database!", "data": new_quote}, 201)
            return

        if parsed_path == '/api/products':
            body = self.get_json_body()
            title = body.get('title')
            description = body.get('description')
            price_tag = body.get('price_tag', 'Custom Quote')
            icon_class = body.get('icon_class', 'fas fa-seedling')

            if not title or not description:
                self.send_json({"success": False, "message": "Title and description are required."}, 400)
                return

            pid = "prd_" + str(int(time.time() * 1000))
            now = datetime.now(timezone.utc).isoformat()

            conn = get_db_connection()
            conn.execute('INSERT INTO products (id, title, description, price_tag, icon_class, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                         (pid, title, description, price_tag, icon_class, now))
            conn.commit()
            conn.close()

            new_product = {"id": pid, "title": title, "description": description, "price_tag": price_tag, "icon_class": icon_class, "createdAt": now}
            self.send_json({"success": True, "message": "Product added successfully to SQLite Database!", "data": new_product}, 201)
            return

        self.send_json({"success": False, "message": "Endpoint not found"}, 404)

    def do_PATCH(self):
        parsed_path = urllib.parse.urlparse(self.path).path

        if parsed_path.startswith('/api/quotes/'):
            quote_id = parsed_path.split('/')[-1]
            body = self.get_json_body()
            status = body.get('status')

            conn = get_db_connection()
            conn.execute('UPDATE quotes SET status=? WHERE id=?', (status, quote_id))
            conn.commit()
            conn.close()

            self.send_json({"success": True, "message": "Quote status updated in SQLite DB"})
            return

        self.send_json({"success": False, "message": "Endpoint not found"}, 404)

    def do_DELETE(self):
        parsed_path = urllib.parse.urlparse(self.path).path

        if parsed_path.startswith('/api/quotes/'):
            quote_id = parsed_path.split('/')[-1]
            conn = get_db_connection()
            conn.execute('DELETE FROM quotes WHERE id=?', (quote_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Quote deleted from SQLite DB"})
            return

        if parsed_path.startswith('/api/contacts/'):
            contact_id = parsed_path.split('/')[-1]
            conn = get_db_connection()
            conn.execute('DELETE FROM contacts WHERE id=?', (contact_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Contact message deleted from SQLite DB"})
            return

        if parsed_path.startswith('/api/products/'):
            product_id = parsed_path.split('/')[-1]
            conn = get_db_connection()
            conn.execute('DELETE FROM products WHERE id=?', (product_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Product deleted from SQLite DB"})
            return

        self.send_json({"success": False, "message": "Endpoint not found"}, 404)

if __name__ == '__main__':
    print("=================================================")
    print(f"Muthu Farming Python SQLite Backend Server Running on Port {PORT}")
    print(f"Local URL: http://localhost:{PORT}")
    print(f"Database Path: {SQLITE_DB}")
    print("=================================================")
    server = HTTPServer(('0.0.0.0', PORT), CustomHandler)
    server.serve_forever()
