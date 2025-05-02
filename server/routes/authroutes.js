import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/admin-manage-faculty', async (req, res) => {
  const { FacultyID, FirstName, MiddleName, LastName, Email, Password } = req.body;
  try {
    const db = await connectToDatabase();

    const [rows] = await db.query('SELECT * FROM faculty WHERE FacultyID = ?', [FacultyID]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(Password, 10);

    await db.query(
      'INSERT INTO faculty (`LastName`, `FirstName`, `MiddleName`, `Email`, Password) VALUES (?,?,?,?,?)',
      [LastName, FirstName, MiddleName, Email, hashPassword]
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
    req.FacultyID = decoded.FacultyID;
    next();

  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};


// Route for fetching faculty dashboard data
router.get(['/faculty-dashboard', '/faculty-classes', '/faculty-grades', '/faculty-attendance', '/faculty-view-students'],verifyToken, async (req, res) => {
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
router.get(['/admin-dashboard','/admin-manage-students', '/admin-manage-faculty', '/admin-manage-grades', '/admin-adivsory-classes', '/admin-validation-request', '/admin-archive-records', '/admin-enrollment', '/admin-manage-subject'], verifyAdminToken, async (req, res) => {
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


router.get('/auth/admin-manage-students', async (req, res) => {
  try {
    const adminId = req.user.id; // if you're using JWT token, extract ID from token
    const [admin] = await db.query('SELECT FirstName FROM admin WHERE AdminID = ?', [adminId]);
    res.json(admin[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
});


router.get("/faculty-class-advisory", verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const facultyID = req.FacultyID;

    // Get current active school year
    const [currentYear] = await db.query(
      'SELECT school_yearID FROM schoolyear WHERE status = "1" LIMIT 1'
    );
    
    if (currentYear.length === 0) {
      return res.status(400).json({ message: "No active school year found" });
    }
    const currentSchoolYearID = currentYear[0].school_yearID;

    // Rest of your existing code...
    const [faculty] = await db.query(
      'SELECT FirstName, LastName, MiddleName FROM faculty WHERE FacultyID = ?',
      [facultyID]
    );
    
    if (faculty.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const [advisoryClasses] = await db.query(
      `SELECT a.advisoryID, c.Grade, c.Section 
       FROM advisory a
       JOIN classes c ON a.classID = c.ClassID
       JOIN class_year cy ON a.advisoryID = cy.advisoryID
       WHERE a.facultyID = ? AND cy.yearID = ?`,
      [facultyID, currentSchoolYearID]
    );

    if (advisoryClasses.length === 0) {
      return res.status(200).json({
        grade: "",
        section: "",
        advisorName: `${faculty[0].LastName}, ${faculty[0].FirstName}`,
        students: [],
        message: "No advisory class assigned"
      });
    }

    const { Grade, Section } = advisoryClasses[0];
    
    const [students] = await db.query(
      `SELECT s.StudentID, s.FirstName, s.MiddleName, s.LastName
       FROM students s
       JOIN student_classes sc ON s.StudentID = sc.StudentID
       WHERE sc.advisoryID = ? AND sc.school_yearID = ?
       ORDER BY s.LastName, s.FirstName`,
      [advisoryClasses[0].advisoryID, currentSchoolYearID]
    );

    res.status(200).json({
      grade: Grade.toString(),
      section: Section,
      advisorName: `${faculty[0].LastName}, ${faculty[0].FirstName}${
        faculty[0].MiddleName ? ` ${faculty[0].MiddleName.charAt(0)}.` : ''
      }`,
      students: students.map(s => ({
        StudentID: s.StudentID.toString(),
        FirstName: s.FirstName || '',
        MiddleName: s.MiddleName || '',
        LastName: s.LastName || ''
      }))
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: error.message 
    });
  }
});

// Get all assigned subjects for faculty
router.get("/admin-assign-subject", verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const facultyId = req.FacultyID; // Get from decoded token

    if (!facultyId) {
      return res.status(400).json({ error: "Faculty ID not found in token" });
    }

    const sql = `
      SELECT a.ClassID, a.SubjectCode, s.SubjectName , c.Section
      FROM assignsubject a
      JOIN subjects s ON a.SubjectCode = s.SubjectCode
      JOIN classes c ON a.ClassID = c.ClassID
      WHERE a.FacultyID = ?
    `;

    const [results] = await db.query(sql, [facultyId]);
    res.json(results);

  } catch (error) {
    console.error("Error fetching assigned subjects:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get the the assign subject of the faculty
router.get("/faculty-assign-subjects", verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const facultyID = req.FacultyID; // Extracted from JWT in verifyToken middleware

    if (!facultyID) {
      return res.status(400).json({ error: "FacultyID not found in token." });
    }

    const query = `
      SELECT 
        a.SubjectCode AS subjectCode,
        s.SubjectName AS subjectName,
        CONCAT(f.FirstName, ' ', f.LastName) AS facultyName,
        c.Grade AS grade,
        c.Section AS section,
        sy.year AS schoolYear
      FROM assignsubject a
      JOIN subjects s ON a.subjectID = s.SubjectID
      JOIN faculty f ON a.FacultyID = f.FacultyID
      LEFT JOIN advisory ad ON a.advisoryID = ad.advisoryID
      LEFT JOIN classes c ON ad.classID = c.ClassID
      LEFT JOIN schoolyear sy ON a.yearID = sy.school_yearID
      WHERE a.FacultyID = ?;
    `;

    const [rows] = await db.query(query, [facultyID]);

    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error("Error fetching faculty assigned subjects:", error);
    res.status(500).json({ error: "Failed to fetch assigned subjects" });
  }
});






export default router;