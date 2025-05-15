import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../lib/db.js';

const router = express.Router();

// --- AUTH MIDDLEWARE ---
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No authorization header provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const secretKey = process.env.JWT_SECRET || process.env.JWT_KEY;
    if (!secretKey) {
      return res.status(500).json({ success: false, message: 'Internal server configuration error' });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
        }
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      req.user = {
        id: decoded.AdminID || decoded.FacultyID,
        adminID: decoded.AdminID,
        facultyID: decoded.FacultyID,
        role: decoded.AdminID ? 'admin' : 'faculty',
        name: decoded.FirstName && decoded.LastName ? `${decoded.FirstName} ${decoded.LastName}` : null
      };
      next();
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authentication process failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.adminID) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// --- ADMIN & FACULTY AUTH ROUTES ---

// Admin Registration
router.post('/admin-register', async (req, res) => {
  const { AdminID, FirstName, MiddleName, LastName, Email, Password } = req.body;
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query('SELECT * FROM admin WHERE AdminID = ?', [AdminID]);
    if (rows.length > 0) {
      return res.status(409).json({ error: 'Admin already exists' });
    }
    const hashPassword = await bcrypt.hash(Password, 10);
    await db.query(
      'INSERT INTO admin (AdminID, FirstName, MiddleName, LastName, Email, Password) VALUES (?, ?, ?, ?, ?, ?)',

      [AdminID, FirstName, MiddleName, LastName, Email, hashPassword]
    );
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Login
router.post('/admin-login', async (req, res) => {
  const { AdminID, Password } = req.body;
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query('SELECT * FROM admin WHERE AdminID = ?', [AdminID]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid AdminID or password' });
    }
    const isMatch = await bcrypt.compare(Password, rows[0].Password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid AdminID or password' });
    }
    const token = jwt.sign(
      {
        AdminID: rows[0].AdminID,
        FirstName: rows[0].FirstName,
        LastName: rows[0].LastName
      },
      process.env.JWT_SECRET || process.env.JWT_KEY,
      { expiresIn: '3h' }
    );
    return res.status(201).json({ token, adminID: rows[0].AdminID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Faculty Registration
router.post('/admin-manage-faculty', async (req, res) => {
  const { FacultyID, FirstName, MiddleName, LastName, Email, Password } = req.body;
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query('SELECT * FROM faculty WHERE FacultyID = ?', [FacultyID]);
    if (rows.length > 0) {
      return res.status(409).json({ error: 'Faculty already exists' });
    }
    const hashPassword = await bcrypt.hash(Password, 10);
    await db.query(
      'INSERT INTO faculty (FacultyID, LastName, FirstName, MiddleName, Email, Password) VALUES (?, ?, ?, ?, ?, ?)',

      [FacultyID, LastName, FirstName, MiddleName, Email, hashPassword]
    );
    res.status(201).json({ message: 'Faculty registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Faculty Login
router.post('/faculty-login', async (req, res) => {
  const { FacultyID, Password } = req.body;
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query('SELECT * FROM faculty WHERE FacultyID = ?', [FacultyID]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid FacultyID or password' });
    }
    const isMatch = await bcrypt.compare(Password, rows[0].Password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid FacultyID or password' });
    }
    const token = jwt.sign(
      {
        FacultyID: rows[0].FacultyID,
        FirstName: rows[0].FirstName,
        LastName: rows[0].LastName
      },
      process.env.JWT_SECRET || process.env.JWT_KEY,
      { expiresIn: '3h' }
    );
    return res.status(201).json({ token, facultyID: rows[0].FacultyID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example protected route for admin only
router.get('/admin-dashboard', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Welcome, admin!', adminID: req.user.adminID });
});

// Example protected route for faculty only
router.get('/faculty-dashboard', authenticateToken, async (req, res) => {
  if (!req.user || !req.user.facultyID) {
    return res.status(403).json({ success: false, message: 'Access denied. Faculty privileges required.' });
  }
  res.json({ message: 'Welcome, faculty!', facultyID: req.user.facultyID });
});

export default router;