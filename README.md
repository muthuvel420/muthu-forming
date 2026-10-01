# 🚀 Muthu Forming - Metal Fabrication Website & Backend System

A world-class, responsive, multi-themed web application and REST API backend for Muthu Forming.

---

## 🛠️ Tech Stack & Features

- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, 5 Live Themes), JavaScript ES6+
- **Backend**: Node.js, Express.js, REST API Architecture
- **Database**: Local JSON Storage / Persistence Engine (`data/database.json`)
- **Admin Portal**: Dedicated dashboard for quotation requests and contact inquiry management ([admin.html](file:///c:/Users/haris/OneDrive/Desktop/Muthu%20forming/admin.html))

---

## ⚙️ How to Run the Backend Server

### 1️⃣ Install Node.js
If Node.js is not already installed on your machine, download and install Node.js from [nodejs.org](https://nodejs.org).

### 2️⃣ Install Dependencies
Open your terminal inside the project directory (`c:\Users\haris\OneDrive\Desktop\Muthu forming`) and run:
```bash
npm install
```

### 3️⃣ Start the Express Backend Server
Run the following command to start the server on port 5000:
```bash
npm start
```

Your server will be live at: `http://localhost:5000`

---

## 🔑 Admin Portal Access

Open `admin.html` in your browser or visit `http://localhost:5000/admin.html` to access the Admin Management Portal:

- **View Quotation Requests**: Customer contact info, materials, processes, thickness, quantity, details.
- **Update Quote Status**: Change status to *Pending*, *Quoted*, or *Completed*.
- **Manage Contact Messages**: View customer messages and delete processed inquiries.

---

## ⚡ Fallback Mode (No Server Needed)
Even if the Node.js server is offline, the website automatically stores all form submissions directly in your browser's `localStorage` and loads them inside [admin.html](file:///c:/Users/haris/OneDrive/Desktop/Muthu%20forming/admin.html)!
