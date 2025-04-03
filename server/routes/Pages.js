import express from 'express';
import { connectToDatabase } from '../lib/db.js';

const router = express.Router();

// GET all students
router.get('/admin-manage-students', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sql = 'SELECT * FROM students';
    const [result] = await db.query(sql);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// GET all Faculty
router.get('/admin-manage-faculty', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sql = 'SELECT * FROM faculty';
    const [result] = await db.query(sql);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST add student
router.post('/admin-manage-students', async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { StudentID, LastName, FirstName, MiddleName} = req.body;

    // Validate that none of the fields are undefined
    if (!StudentID || !LastName || !FirstName || !MiddleName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = "INSERT INTO students (StudentID, LastName, FirstName, MiddleName) VALUES (?, ?, ?, ?)";
    const [result] = await db.query(sql, [StudentID, LastName, FirstName, MiddleName]);

    res.status(200).json({ message: 'Student added successfully', result });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/admin-manage-students', async (req, res) => {
  try {
     const db = await connectToDatabase();
     const { StudentID, LastName, FirstName, MiddleName} = req.body;

     if (!StudentID) {
        return res.status(400).json({ message: 'Student is required' });
     }

     const sql = 'UPDATE students SET LastName = ?, FirstName = ?, MiddleName = ? WHERE StudentID = ?';
     const [result] = await db.query(sql, [LastName, FirstName, MiddleName, StudentID]);

     if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Student not found' });
     }

     res.status(200).json({ message: 'Student updated successfully', result });
  } catch (err) {
     console.log('Error updating faculty:', err);
     res.status(500).json({ message: 'Server Error' });
  }
});

// POST add faculty
router.post('/admin-manage-faculty', async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { FacultyID, LastName, FirstName, MiddleName, Email } = req.body;

    // Validate that none of the fields are undefined
    if (!FacultyID || !LastName || !FirstName || !MiddleName || !Email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = "INSERT INTO faculty (FacultyID, LastName, FirstName, MiddleName, Email) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [FacultyID, LastName, FirstName, MiddleName, Email]);

    res.status(200).json({ message: 'Student added successfully', result });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.put('/admin-manage-faculty', async (req, res) => {
  try {
     const db = await connectToDatabase();
     const { FacultyID, LastName, FirstName, MiddleName, Email } = req.body;

     if (!FacultyID) {
        return res.status(400).json({ message: 'FacultyID is required' });
     }

     const sql = 'UPDATE faculty SET LastName = ?, FirstName = ?, MiddleName = ?, Email = ? WHERE FacultyID = ?';
     const [result] = await db.query(sql, [LastName, FirstName, MiddleName, Email, FacultyID]);

     if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Faculty not found' });
     }

     res.status(200).json({ message: 'Faculty updated successfully', result });
  } catch (err) {
     console.log('Error updating faculty:', err);
     res.status(500).json({ message: 'Server Error' });
  }
});



// Create Advisory Class and Assign 50 Students to a Faculty Member
router.post("/admin-advisory-classes", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { ClassID, Grade, Section, FacultyID } = req.body;

    if (!ClassID || !Grade || !Section || !FacultyID) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the faculty member exists
    const facultyCheck = "SELECT * FROM faculty WHERE FacultyID = ?";
    const [faculty] = await db.query(facultyCheck, [FacultyID]);

    if (faculty.length === 0) {
      return res.status(400).json({ error: "Invalid FacultyID. Faculty member not found." });
    }

    // Insert class into "classes" table
    const sql = "INSERT INTO classes (ClassID, Grade, Section, FacultyID) VALUES (?, ?, ?, ?)";
    await db.query(sql, [ClassID, Grade, Section, FacultyID]);

    // Fetch 50 students who are NOT in any class advisory
    const studentQuery = `
      SELECT StudentID FROM students 
      WHERE StudentID NOT IN (SELECT DISTINCT StudentID FROM student_classes) 
      ORDER BY RAND() 
      LIMIT 50`;

    const [students] = await db.query(studentQuery);

    if (students.length === 0) {
      return res.status(400).json({ error: "No available students to assign." });
    }

    // Assign students to the new advisory class
    const assignQuery = "INSERT INTO student_classes (ClassID, Grade, Section, StudentID, FacultyID) VALUES ?";
    const studentValues = students.map(student => [ClassID, Grade, Section, student.StudentID, FacultyID]);

    await db.query(assignQuery, [studentValues]);

    res.status(201).json({ 
      message: `Advisory class created successfully under FacultyID: ${FacultyID} with ${students.length} students assigned.`,
      assignedStudents: students
    });

  } catch (error) {
    console.error("Error creating advisory class:", error);
    res.status(500).json({ error: error.message });
  }
});


// Update Advisory Class
router.put("/admin-advisory-classes", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { ClassID, Grade, Section, FacultyID } = req.body;

    if (!ClassID) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    const sql = `
      UPDATE classes 
      SET Grade = ?, Section = ?, FacultyID = ?
      WHERE ClassID = ?`;

    const [result] = await db.query(sql, [Grade, Section, FacultyID, ClassID]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ message: "Advisory class updated successfully" });
  } catch (err) {
    console.error("Error updating advisory class:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET all advisory classes
router.get("/admin-advisory-classes", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sql = "SELECT * FROM classes";
  
    const [results] = await db.query(sql);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Route to Add a Subject
router.post("/admin-manage-subject", async (req, res) => {
  try {
    const db = await connectToDatabase(); // Connect to database

    const { SubjectCode, SubjectName, FacultyID } = req.body;

    // Validate input fields
    if (!SubjectCode || !SubjectName || !FacultyID) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // SQL Query
    const sql = "INSERT INTO subjects (SubjectCode, SubjectName, FacultyID) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [SubjectCode, SubjectName, FacultyID]);


    // Respond with success
    res.status(201).json({ message: "Subject added successfully!", subjectID: result.insertId });

  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});



// GET all advisory classes
router.get("/admin-manage-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sql = "SELECT * FROM subjects";
  
    const [results] = await db.query(sql);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Assign Subject to Advisory Class
router.post("/admin-assign-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { SubjectCode, FacultyID, ClassID } = req.body;

    if (!SubjectCode || !FacultyID || !ClassID) {
      return res.status(400).json({ error: "SubjectCode, FacultyID, and ClassID are required" });
    }

    // Check if the faculty exists
    const [faculty] = await db.query("SELECT * FROM faculty WHERE FacultyID = ?", [FacultyID]);
    if (faculty.length === 0) {
      return res.status(400).json({ error: "Faculty not found" });
    }

    // Check if the class exists
    const [classCheck] = await db.query("SELECT * FROM classes WHERE ClassID = ?", [ClassID]);
    if (classCheck.length === 0) {
      return res.status(400).json({ error: "Class not found" });
    }

    // Check if the subject exists
    const [subjectCheck] = await db.query("SELECT * FROM subjects WHERE SubjectCode = ?", [SubjectCode]);
    if (subjectCheck.length === 0) {
      return res.status(400).json({ error: "Subject not found" });
    }

    // Check if the subject is already assigned to this class
    const [existingAssignment] = await db.query(
      "SELECT * FROM assignsubject WHERE ClassID = ? AND SubjectCode = ?",
      [ClassID, SubjectCode]
    );

    if (existingAssignment.length > 0) {
      return res.status(400).json({ error: "This subject is already assigned to this class" });
    }

    // Insert the assignment
    const sql = `
      INSERT INTO assignsubject (ClassID, SubjectCode, FacultyID)
      VALUES (?, ?, ?)
    `;
    
    await db.query(sql, [ClassID, SubjectCode, FacultyID]);

    res.status(201).json({ 
      message: "Subject assigned to advisory class successfully",
      assignment: {
        ClassID,
        SubjectCode,
        FacultyID
      }
    });

  } catch (error) {
    console.error("Error assigning subject to advisory class:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});

// Get all assigned subjects (updated to join with subjects table for name if needed)
router.get("/admin-assign-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sql = `
      SELECT a.ClassID, a.SubjectCode, s.SubjectName, a.FacultyID 
      FROM assignsubject a
      JOIN subjects s ON a.SubjectCode = s.SubjectCode
    `;
    const [results] = await db.query(sql);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); 




export default router;
