import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { FacultyID, FirstName, MiddleName, LastName, Email, Password } = req.body;
  try {
    const db = await connectToDatabase();

    const [rows] = await db.query('SELECT * FROM faculty WHERE FacultyID = ?', [FacultyID]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(Password, 10);

    await db.query(
      'INSERT INTO faculty (FacultyID, `LastName`, `FirstName`, `MiddleName`, `Email`, Password) VALUES (?,?,?,?,?,?)',
      [FacultyID, LastName, FirstName, MiddleName, Email, hashPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


//Login
router.post('/faculty-login', async (req, res) => {
  const { FacultyID, Password } = req.body;
  try {
    const db = await connectToDatabase();

    const [rows] = await db.query('SELECT * FROM faculty WHERE FacultyID = ?', [FacultyID]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not existed" });
    }

    const isMatch = await bcrypt.compare(Password, rows[0].Password);
    if (!isMatch) {
      return res.status(404).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ FacultyID: rows[0].FacultyID }, process.env.JWT_KEY, { expiresIn: '3h' });
    return res.status(201).json({ token: token });  // ✅ 'return' added

  } catch (err) {
    console.error("Database Error:", err.message);
    return res.status(500).json({ error: err.message });  // ✅ 'return' added
  }
});




// Token verification middleware
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(403).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(403).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.FacultyID = decoded.FacultyID; // Ensure this matches your JWT payload
    next();

  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};


// Route for fetching faculty dashboard data
router.get(['/faculty-dashboard', '/faculty-class-advisory', '/faculty-classes', '/faculty-grades', '/faculty-attendance'],verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();

    if (!req.FacultyID) {
      return res.status(400).json({ message: "Invalid FacultyID" });
    }

    const [rows] = await db.query('SELECT * FROM faculty WHERE FacultyID = ?', [req.FacultyID]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: rows[0] });  // 'return' added

  } catch (err) {
    console.error("Error fetching faculty data:", err.message);
    return res.status(500).json({ message: "Server Error", error: err.message }); // 'return' added
  }

  
});



// Admin Registration
router.post('/admin-register', async (req, res) => {
  const { AdminID, FirstName, MiddleName, LastName, Email, Password } = req.body;
  try {
    const db = await connectToDatabase();

    const [rows] = await db.query('SELECT * FROM admin WHERE AdminID = ?', [AdminID]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashPassword = await bcrypt.hash(Password, 10);

    await db.query(
      'INSERT INTO admin (AdminID, LastName, FirstName, MiddleName, Email, Password) VALUES (?,?,?,?,?,?)',
      [AdminID, LastName, FirstName, MiddleName, Email, hashPassword]
    );

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("Database Error:", err.message);
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
      return res.status(404).json({ message: "Admin does not exist" });
    }

    const isMatch = await bcrypt.compare(Password, rows[0].Password);
    if (!isMatch) {
      return res.status(404).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ AdminID: rows[0].AdminID }, process.env.JWT_KEY, { expiresIn: '3h' });
    return res.status(201).json({ token: token });

  } catch (err) {
    console.error("Database Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Token verification middleware for Admin
const verifyAdminToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(403).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(403).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.AdminID = decoded.AdminID;
    next();

  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin Dashboard (Protected Route)
router.get(['/admin-dashboard','/admin-manage-students', '/admin-manage-faculty', '/admin-manage-grades', '/admin-manage-classes', '/admin-validation-request', '/admin-archive-records', '/admin-enrollment'], verifyAdminToken, async (req, res) => {
  try {
    const db = await connectToDatabase();

    if (!req.AdminID) {
      return res.status(400).json({ message: "Invalid AdminID" });
    }

    const [rows] = await db.query('SELECT * FROM admin WHERE AdminID = ?', [req.AdminID]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({ admin: rows[0] });

  } catch (err) {
    console.error("Error fetching admin data:", err.message);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
});



//Subjects
router.post('/admin-enrollment', async (req, res) => {
  const { SubjectCode, SubjectName, gradelevel, Slots } = req.body;
  const GradeLevel = gradelevel; // Use GradeLevel variable in the database query
  // Basic validation
  if (!SubjectCode || !SubjectName || !GradeLevel || !Slots) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const db = await connectToDatabase();

    // Check if subject already exists
    const [existingSubject] = await db.query(
      'SELECT * FROM enrollmentsubject WHERE SubjectCode = ?',
      [SubjectCode]
    );

    if (existingSubject.length > 0) {
      return res.status(400).json({ message: "Subject with this code already exists" });
    }

    // Insert new subject
    await db.query(
      'INSERT INTO enrollmentsubject(SubjectCode, SubjectName, GradeLevel, Slots) VALUES (?, ?, ?, ?)',
      [SubjectCode, SubjectName, GradeLevel, Slots]
    );

    res.status(201).json({ message: "Subject added successfully" });
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


//Get All Subjects
router.get('/get-subjects', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [subjects] = await db.query('SELECT * FROM enrollmentsubject');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { SubjectCode, SubjectName, GradeLevel, Slots } = req.body;

  try {
    const db = await connectToDatabase();
    await db.query(
      'UPDATE subjects SET SubjectCode = ?, SubjectName = ?, GradeLevel = ?, Slots = ? WHERE SubjectID = ?',
      [SubjectCode, SubjectName, GradeLevel, Slots, id]
    );
    res.json({ message: "Subject updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const db = await connectToDatabase();
    await db.query('DELETE FROM subjects WHERE SubjectID = ?', [id]);
    res.json({ message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




export default router;
