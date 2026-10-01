const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Ensure data folder and database file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

if (!fs.existsSync(DB_FILE)) {
  const initialDb = {
    contacts: [
      {
        id: "cnt_101",
        name: "Karthik Subramanian",
        email: "karthik@greenfields.in",
        phone: "+91 98765 11223",
        subject: "50-Acre Drip Irrigation System Inquiry",
        message: "We require automated drip irrigation setup and solar water pump for our coconut and banana farm in Pollachi.",
        status: "New",
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    quotes: [
      {
        id: "qte_201",
        name: "Senthil Kumar",
        company: "Kongu Agri Farms",
        email: "senthil@konguagri.in",
        phone: "+91 94430 88990",
        material: "Polyhouse & Greenhouse System",
        process: "Hi-Tech Climate Controlled Polyhouse",
        thickness: "500 Sq. Meters",
        quantity: "2 Units",
        details: "Requires UV stabilized poly film shade nets and automated mister systems for high-yield horticulture.",
        status: "Pending",
        createdAt: new Date().toISOString()
      }
    ],
    products: [
      {
        id: "prd_1",
        title: "Heavy Duty Tractor Rotavator",
        description: "Multi-speed gearbox rotavator with boron steel blades for deep soil tilling & seedbed prep.",
        price_tag: "Govt Subsidy Approved",
        icon_class: "fas fa-tractor",
        createdAt: new Date().toISOString()
      },
      {
        id: "prd_2",
        title: "Solar Water Pumpset (5HP - 10HP)",
        description: "Submersible DC solar pump with MPPT controller drive & automatic dry-run protection.",
        price_tag: "Complete Kit",
        icon_class: "fas fa-sun",
        createdAt: new Date().toISOString()
      },
      {
        id: "prd_3",
        title: "Modular Polyhouse & Shade Net",
        description: "Hot-dip galvanized steel arc structure with 200-micron UV stabilized poly film & foggers.",
        price_tag: "Custom Acreage",
        icon_class: "fas fa-warehouse",
        createdAt: new Date().toISOString()
      },
      {
        id: "prd_4",
        title: "Automatic Drip Fertigation Kit",
        description: "Includes disc/gravel filters, venturi injector, pressure gauge & clog-resistant drip lines.",
        price_tag: "Ready-to-Install",
        icon_class: "fas fa-droplet",
        createdAt: new Date().toISOString()
      },
      {
        id: "prd_5",
        title: "Organic Farm Waste Shredder",
        description: "High capacity diesel/electric shredder machine for coconut fronds, sugarcane trash & bio-waste.",
        price_tag: "High Performance",
        icon_class: "fas fa-leaf",
        createdAt: new Date().toISOString()
      },
      {
        id: "prd_6",
        title: "Solar Electric Farm Fencing Kit",
        description: "High voltage low amperage solar energizer with backup battery & insulated wire posts.",
        price_tag: "Wild Crop Protection",
        icon_class: "fas fa-shield-halved",
        createdAt: new Date().toISOString()
      }
    ]
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
}

// Helper functions for reading & writing DB
function readData() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.products) data.products = [];
    if (!data.contacts) data.contacts = [];
    if (!data.quotes) data.quotes = [];
    if (!data.users) data.users = [];
    return data;
  } catch (err) {
    return { contacts: [], quotes: [], products: [], users: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// User Registration Route
app.post('/api/register', (req, res) => {
  const { name, phone, email, location, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, Phone Number, Email and Password are required.' });
  }

  const cleanPhone = phone.toString().replace(/\D/g, '');
  const db = readData();

  // Check if user already exists with same phone or email
  const existingUser = db.users.find(u =>
    (u.phone && u.phone.toString().replace(/\D/g, '') === cleanPhone) ||
    (u.email && u.email.toLowerCase() === email.toLowerCase())
  );

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Account already exists with this Phone Number or Email ID!'
    });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name,
    phone: cleanPhone,
    email: email.toLowerCase(),
    location: location || 'Tamil Nadu',
    password,
    createdAt: new Date().toISOString()
  };

  db.users.unshift(newUser);
  saveData(db);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    success: true,
    message: 'Farmer account registered successfully! You can now log in.',
    user: userWithoutPassword
  });
});

// User Login Route (by Phone Number or Email ID)
app.post('/api/login', (req, res) => {
  const { identifier, password, loginType, otp } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Please enter your Phone Number or Email ID.' });
  }

  const db = readData();
  const inputStr = identifier.toString().trim().toLowerCase();
  const cleanPhoneInput = inputStr.replace(/\D/g, '');

  // Find user by phone number or email ID
  const user = db.users.find(u => {
    const userPhoneClean = (u.phone || '').toString().replace(/\D/g, '');
    const userEmailClean = (u.email || '').toLowerCase();
    return (userPhoneClean && userPhoneClean.length > 0 && (cleanPhoneInput.endsWith(userPhoneClean) || userPhoneClean.endsWith(cleanPhoneInput))) ||
           (userEmailClean && userEmailClean === inputStr);
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this Phone Number or Email ID. Please Register first.'
    });
  }

  // Handle OTP mode vs Password mode
  if (otp) {
    // Simulated OTP verification
    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      success: true,
      message: 'Login successful via OTP!',
      user: userWithoutPassword
    });
  }

  if (user.password && user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect Password. Please check your password or use OTP login.'
    });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    message: 'Welcome back! Login successful.',
    user: userWithoutPassword
  });
});

// Get Users List (Admin)
app.get('/api/users', (req, res) => {
  const db = readData();
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json({ success: true, count: safeUsers.length, data: safeUsers });
});

// 1. Submit Contact Form
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Name, email and phone are required.' });
  }

  const db = readData();
  const newContact = {
    id: 'cnt_' + Date.now(),
    name,
    email,
    phone,
    subject: subject || 'General Inquiry',
    message: message || '',
    status: 'New',
    createdAt: new Date().toISOString()
  };

  db.contacts.unshift(newContact);
  saveData(db);

  res.status(201).json({
    success: true,
    message: 'Thank you! Your contact message has been recorded in database.',
    data: newContact
  });
});

// 2. Submit Quote Form
app.post('/api/quote', (req, res) => {
  const { name, company, email, phone, material, process, thickness, quantity, details } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Name, email and phone are required.' });
  }

  const db = readData();
  const newQuote = {
    id: 'qte_' + Date.now(),
    name,
    company: company || 'N/A',
    email,
    phone,
    material: material || 'Smart Drip Irrigation',
    process: process || 'General Crop',
    thickness: thickness || 'N/A',
    quantity: quantity || '1',
    details: details || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  db.quotes.unshift(newQuote);
  saveData(db);

  res.status(201).json({
    success: true,
    message: 'Quote request submitted successfully to database!',
    data: newQuote
  });
});

// 3. Get All Quotes (Admin)
app.get('/api/quotes', (req, res) => {
  const db = readData();
  res.json({ success: true, count: db.quotes.length, data: db.quotes });
});

// 4. Get All Contacts (Admin)
app.get('/api/contacts', (req, res) => {
  const db = readData();
  res.json({ success: true, count: db.contacts.length, data: db.contacts });
});

// 5. Products Routes (GET, POST, DELETE)
app.get('/api/products', (req, res) => {
  const db = readData();
  res.json({ success: true, count: db.products.length, data: db.products });
});

app.post('/api/products', (req, res) => {
  const { title, description, price_tag, icon_class } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required.' });
  }

  const db = readData();
  const newProduct = {
    id: 'prd_' + Date.now(),
    title,
    description,
    price_tag: price_tag || 'Custom Quote',
    icon_class: icon_class || 'fas fa-seedling',
    createdAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveData(db);

  res.status(201).json({
    success: true,
    message: 'Product added successfully to database!',
    data: newProduct
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readData();
  db.products = db.products.filter(p => p.id !== id);
  saveData(db);
  res.json({ success: true, message: 'Product deleted from database' });
});

// 6. Update Quote Status
app.patch('/api/quotes/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readData();
  const quote = db.quotes.find(q => q.id === id);
  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  if (status) quote.status = status;
  saveData(db);

  res.json({ success: true, message: 'Quote status updated in database', data: quote });
});

// 7. Delete Quote
app.delete('/api/quotes/:id', (req, res) => {
  const { id } = req.params;
  const db = readData();
  db.quotes = db.quotes.filter(q => q.id !== id);
  saveData(db);
  res.json({ success: true, message: 'Quote deleted successfully from database' });
});

// 8. Delete Contact Message
app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  const db = readData();
  db.contacts = db.contacts.filter(c => c.id !== id);
  saveData(db);
  res.json({ success: true, message: 'Contact message deleted from database' });
});

// Default root route serves login.html first
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Fallback for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Muthu Farming Express Backend Server Running on Port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Database File: ${DB_FILE}`);
  console.log(`=================================================`);
});
