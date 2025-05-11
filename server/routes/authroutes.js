import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { format } from 'date-fns';

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

    // Create token
    const token = jwt.sign(
      { FacultyID: rows[0].FacultyID }, 
      process.env.JWT_KEY, 
      { expiresIn: '3h' }
    );

    // ✅ Include facultyID in the response
    return res.status(201).json({ 
      token: token, 
      facultyID: rows[0].FacultyID 
    });

  } catch (err) {
    console.error("Database Error:", err.message);
    return res.status(500).json({ error: err.message });
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


router.get('/admin-manage-students', async (req, res) => {
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

    // Get faculty details
    const [faculty] = await db.query(
      'SELECT FirstName, LastName, MiddleName FROM faculty WHERE FacultyID = ?',
      [facultyID]
    );
    
    if (faculty.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Get advisory class details
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
        advisoryID: null,
        facultyID: facultyID,
        students: [],
        message: "No advisory class assigned"
      });
    }

    const { advisoryID, Grade, Section } = advisoryClasses[0];
    
    // Get students in advisory class
    const [students] = await db.query(
      `SELECT s.StudentID, s.FirstName, s.MiddleName, s.LastName
       FROM students s
       JOIN student_classes sc ON s.StudentID = sc.StudentID
       WHERE sc.advisoryID = ? AND sc.school_yearID = ?
       ORDER BY s.LastName, s.FirstName`,
      [advisoryID, currentSchoolYearID]
    );

    res.status(200).json({
      grade: Grade.toString(),
      section: Section,
      advisorName: `${faculty[0].LastName}, ${faculty[0].FirstName}${
        faculty[0].MiddleName ? ` ${faculty[0].MiddleName.charAt(0)}.` : ''
      }`,
      advisoryID: advisoryID,
      facultyID: facultyID,
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



// Mark attendance for a student
router.post('/faculty-mark-attendance', verifyToken, async (req, res) => {
  try {
      const { SubjectCode, StudentID, StatusID } = req.body;
      const date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

      // Validate input
      if (!SubjectCode || !StudentID || !StatusID) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Check if faculty teaches this subject
      const facultySubjectCheck = await db.query(
          'SELECT * FROM assignsubject WHERE FacultyID = ? AND SubjectCode = ?',
          [req.user.id, SubjectCode]
      );

      if (facultySubjectCheck.length === 0) {
          return res.status(403).json({ 
              success: false, 
              message: 'You are not assigned to teach this subject' 
          });
      }

      // Check if student is enrolled in this class
      const advisoryCheck = await db.query(
          `SELECT sc.advisoryID 
           FROM student_classes sc
           JOIN advisory a ON sc.advisoryID = a.advisoryID
           WHERE sc.StudentID = ? AND a.advisoryID IN (
               SELECT advisoryID FROM assignsubject WHERE SubjectCode = ?
           )`,
          [StudentID, SubjectCode]
      );

      if (advisoryCheck.length === 0) {
          return res.status(400).json({ 
              success: false, 
              message: 'Student is not enrolled in this subject' 
          });
      }

      // Get status name
      const statusResult = await db.query(
          'SELECT StatusName FROM status WHERE StatusID = ?',
          [StatusID]
      );
      
      if (statusResult.length === 0) {
          return res.status(400).json({ 
              success: false, 
              message: 'Invalid attendance status' 
          });
      }
      
      const StatusName = statusResult[0].StatusName;

      // Check if attendance already marked for today
      const existingAttendance = await db.query(
          'SELECT * FROM attendance WHERE StudentID = ? AND SubjectCode = ? AND Date = ?',
          [StudentID, SubjectCode, date]
      );

      if (existingAttendance.length > 0) {
          // Update existing attendance
          await db.query(
              'UPDATE attendance SET StatusID = ? WHERE AttendanceID = ?',
              [StatusID, existingAttendance[0].AttendanceID]
          );
      } else {
          // Create new attendance record
          await db.query(
              'INSERT INTO attendance (SubjectCode, StudentID, StatusID, Date) VALUES (?, ?, ?, ?)',
              [SubjectCode, StudentID, StatusID, date]
          );
      }

      res.json({ 
          success: true, 
          message: 'Attendance marked successfully',
          StatusName 
      });

  } catch (error) {
      console.error('Error marking attendance:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Server error while marking attendance' 
      });
  }
});

// Get attendance records for a subject on a specific date
router.get('/faculty-subject-attendance/:SubjectCode', verifyToken, async (req, res) => {
  try {
      const { SubjectCode } = req.params;
      const { date } = req.query;

      if (!SubjectCode || !date) {
          return res.status(400).json({ 
              success: false, 
              message: 'Subject code and date are required' 
          });
      }

      // Check if faculty teaches this subject
      const facultySubjectCheck = await db.query(
          'SELECT * FROM assignsubject WHERE FacultyID = ? AND SubjectCode = ?',
          [req.user.id, SubjectCode]
      );

      if (facultySubjectCheck.length === 0) {
          return res.status(403).json({ 
              success: false, 
              message: 'You are not assigned to teach this subject' 
          });
      }

      // Get attendance records for the specified date
      const attendanceRecords = await db.query(
          `SELECT a.StudentID, a.StatusID, s.StatusName, 
           CONCAT(st.FirstName, ' ', st.LastName) AS fullName
           FROM attendance a
           JOIN status s ON a.StatusID = s.StatusID
           JOIN students st ON a.StudentID = st.StudentID
           WHERE a.SubjectCode = ? AND DATE(a.Date) = ?`,
          [SubjectCode, date]
      );

      res.json({ 
          success: true, 
          attendance: attendanceRecords 
      });

  } catch (error) {
      console.error('Error fetching attendance records:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Server error while fetching attendance records' 
      });
  }
});

// Get students enrolled in a subject
router.get('/faculty-subject-classes/:SubjectCode/students', verifyToken, async (req, res) => {
  try {
      const { SubjectCode } = req.params;

      // Check if faculty teaches this subject
      const facultySubjectCheck = await db.query(
          'SELECT * FROM assignsubject WHERE FacultyID = ? AND SubjectCode = ?',
          [req.user.id, SubjectCode]
      );

      if (facultySubjectCheck.length === 0) {
          return res.status(403).json({ 
              success: false, 
              message: 'You are not assigned to teach this subject' 
          });
      }

      // Get subject info
      const subjectInfo = await db.query(
          `SELECT a.SubjectCode, s.SubjectName, c.Grade, c.Section 
           FROM assignsubject a
           JOIN subjects s ON a.subjectID = s.SubjectID
           JOIN advisory adv ON a.advisoryID = adv.advisoryID
           JOIN classes c ON adv.classID = c.ClassID
           WHERE a.SubjectCode = ?`,
          [SubjectCode]
      );

      if (subjectInfo.length === 0) {
          return res.status(404).json({ 
              success: false, 
              message: 'Subject not found' 
          });
      }

      // Get students enrolled in this subject's advisory class
      const students = await db.query(
          `SELECT s.StudentID, CONCAT(s.FirstName, ' ', s.LastName) AS fullName 
           FROM students s
           JOIN student_classes sc ON s.StudentID = sc.StudentID
           WHERE sc.advisoryID = ?
           ORDER BY s.LastName, s.FirstName`,
          [facultySubjectCheck[0].advisoryID]
      );

      res.json({ 
          success: true, 
          students, 
          subjectInfo: subjectInfo[0] 
      });

  } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Server error while fetching students' 
      });
  }
});


// Get students for attendance
router.get('/:subjectCode',verifyToken, async (req, res) => {
  try {
      const db = await connectToDatabase();
      const { subjectCode } = req.params;
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      // Get students enrolled in this subject
      const [students] = await db.query(`
          SELECT s.StudentID, s.LastName, s.FirstName, s.MiddleName, 
                 a.AttendanceID, a.StatusID, a.Date
          FROM students s
          JOIN student_classes sc ON s.StudentID = sc.StudentID
          JOIN advisory ad ON sc.advisoryID = ad.advisoryID
          JOIN assignsubject ass ON ad.advisoryID = ass.advisoryID
          LEFT JOIN attendance a ON s.StudentID = a.StudentID 
              AND a.SubjectCode = ass.SubjectCode 
              AND a.Date = ?
          WHERE ass.SubjectCode = ?
          ORDER BY s.LastName, s.FirstName
      `, [today, subjectCode]);

      res.json({ success: true, data: students });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update attendance status
router.post('/update', verifyToken,async (req, res) => {
  try {
     const db = await connectToDatabase();
      const { studentID, subjectCode, statusID } = req.body;
      const today = new Date().toISOString().split('T')[0];

      // Check if attendance record already exists for today
      const [existing] = await db.query(`
          SELECT AttendanceID FROM attendance 
          WHERE StudentID = ? AND SubjectCode = ? AND Date = ?
      `, [studentID, subjectCode, today]);

      if (existing.length > 0) {
          // Update existing record
          await db.query(`
              UPDATE attendance SET StatusID = ? 
              WHERE AttendanceID = ?
          `, [statusID, existing[0].AttendanceID]);
      } else {
          // Create new record
          await db.query(`
              INSERT INTO attendance (SubjectCode, StudentID, StatusID, Date)
              VALUES (?, ?, ?, ?)
          `, [subjectCode, studentID, statusID, today]);
      }

      res.json({ success: true });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

// subjectRoutes.js

router.get('/subject-info/:subjectCode', verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
      const { subjectCode } = req.params;

      const [subjectInfo] = await db.query(`
          SELECT s.SubjectName, c.Grade, c.Section, sy.year AS schoolYear
          FROM assignsubject ass
          JOIN subjects s ON ass.subjectID = s.SubjectID
          JOIN advisory ad ON ass.advisoryID = ad.advisoryID
          JOIN classes c ON ad.classID = c.ClassID
          JOIN schoolyear sy ON ass.yearID = sy.school_yearID
          WHERE ass.SubjectCode = ?
      `, [subjectCode]);

      if (subjectInfo.length === 0) {
          return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      res.json({ success: true, data: subjectInfo[0] });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

// View attendance for a subject
router.get('/attendance/view/:subjectCode', verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { subjectCode } = req.params;
    const { date } = req.query;
    const today = format(new Date(), 'yyyy-MM-dd');

    // Get students and their attendance status
    const [students] = await db.query(`
      SELECT 
        s.StudentID,
        s.LastName,
        s.FirstName,
        s.MiddleName,
        COALESCE(a.StatusID, 0) as StatusID,
        a.AttendanceID,
        a.Date
      FROM students s
      JOIN student_classes sc ON s.StudentID = sc.StudentID
      JOIN advisory ad ON sc.advisoryID = ad.advisoryID
      JOIN assignsubject ass ON ad.advisoryID = ass.advisoryID
      LEFT JOIN attendance a ON (
        s.StudentID = a.StudentID 
        AND a.SubjectCode = ass.SubjectCode 
        AND DATE(a.Date) = ?
      )
      WHERE ass.SubjectCode = ?
      ORDER BY s.LastName, s.FirstName
    `, [today, subjectCode]);

    res.json({
      success: true,
      data: students,
      date: today
    });

  } catch (error) {
    console.error('Attendance view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance data',
      error: error.message
    });
  }
});

// Update attendance status
router.post('/attendance/update', verifyToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { studentID, subjectCode, statusID } = req.body;
    const today = format(new Date(), 'yyyy-MM-dd');

    // Validate input
    if (!studentID || !subjectCode || !statusID) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if student is enrolled in the subject
    const [enrollment] = await db.query(`
      SELECT 1 FROM students s
      JOIN student_classes sc ON s.StudentID = sc.StudentID
      JOIN advisory ad ON sc.advisoryID = ad.advisoryID
      JOIN assignsubject ass ON ad.advisoryID = ass.advisoryID
      WHERE s.StudentID = ? AND ass.SubjectCode = ?
    `, [studentID, subjectCode]);

    if (enrollment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not enrolled in this subject'
      });
    }

    // Check existing attendance
    const [existing] = await db.query(`
      SELECT AttendanceID FROM attendance 
      WHERE StudentID = ? AND SubjectCode = ? AND DATE(Date) = ?
    `, [studentID, subjectCode, today]);

    if (existing.length > 0) {
      // Update existing record
      await db.query(`
        UPDATE attendance 
        SET StatusID = ?, 
            UpdatedAt = CURRENT_TIMESTAMP 
        WHERE AttendanceID = ?
      `, [statusID, existing[0].AttendanceID]);
    } else {
      // Create new record
      await db.query(`
        INSERT INTO attendance (
          SubjectCode, 
          StudentID, 
          StatusID, 
          Date, 
          CreatedAt
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [subjectCode, studentID, statusID, today]);
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully'
    });

  } catch (error) {
    console.error('Attendance update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message
    });
  }
});

export default router;