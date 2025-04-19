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


// Get all assigned subjects (subject classes) with advisory info
router.get("/admin-assign-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [assignments] = await db.query(`
      SELECT 
        a.SubjectCode AS subjectCode, a.subjectID, a.FacultyID, a.advisoryID, a.yearID,
        s.SubjectName AS subjectName,
        CONCAT(f.FirstName, ' ', f.MiddleName, ' ', f.LastName) AS facultyName,
        c.Grade AS grade, c.Section AS section,
        sy.year AS schoolYear
      FROM assignsubject a
      JOIN subjects s ON a.subjectID = s.SubjectID
      JOIN faculty f ON a.FacultyID = f.FacultyID
      JOIN advisory adv ON a.advisoryID = adv.advisoryID
      JOIN classes c ON adv.classID = c.ClassID
      JOIN schoolyear sy ON a.yearID = sy.school_yearID
    `);
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
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



router.post('/admin-advisory-classes', async (req, res) => {
  const { ClassID, Grade, Section, FacultyID, school_yearID } = req.body;

  let db; // Declare db outside the try block

  try {
    db = await connectToDatabase();

    // Start transaction manually
    await db.query('START TRANSACTION');

    // Insert class details
    await db.query(
      'INSERT INTO classes (ClassID, Grade, Section, FacultyID) VALUES (?, ?, ?, ?)',
      [ClassID, Grade, Section, FacultyID] // <== FacultyID is needed if it's stored in `classes`
    );

    // Insert class-year relationship
    await db.query(
      'INSERT INTO class_year (advisoryID, yearID) VALUES (?, ?)',
      [ClassID, school_yearID]
    );

    // Get 50 students with status 1 (active) who aren't assigned
    const [students] = await db.query(`
      SELECT StudentID FROM students 
      WHERE status = 1 
      AND StudentID NOT IN (
        SELECT StudentID FROM student_classes WHERE school_yearID = ?
      )
      LIMIT 50
    `, [school_yearID]);

    // Insert students into student_classes table individually
    for (const student of students) {
      await db.query(
        'INSERT INTO student_classes (StudentID, school_yearID, advisoryID) VALUES (?, ?, ?)',
        [student.StudentID, school_yearID, ClassID]
      );
    }

    await db.query('COMMIT'); // Commit manually

    // Fetch the created class with only ClassID, Grade, Section
    const [createdClass] = await db.query(`
      SELECT ClassID, Grade, Section 
      FROM classes 
      WHERE ClassID = ?
    `, [ClassID]);

    res.status(201).json({
      message: 'Advisory class created successfully',
      createdClass: createdClass[0],
      assignedStudents: students.length
    });

  } catch (error) {
    if (db) await db.query('ROLLBACK'); // Use manual rollback only if db is initialized
    console.error('Error creating advisory class:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Class ID already exists' });
    }

    res.status(500).json({ error: 'Failed to create advisory class' });

  }
});






// Get all school years
router.get("/schoolyear", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const query = `
      SELECT 
        sy.school_yearID,
        sy.year AS SchoolYear
      FROM schoolyear sy
      ORDER BY sy.school_yearID
    `;
    const [schoolYears] = await db.query(query);
    
    res.status(200).json(schoolYears);
  } catch (error) {
    console.error("Error fetching school years:", error);
    res.status(500).json({ 
      error: "Failed to fetch school years",
      details: error.message 
    });
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
// GET endpoint - Get all advisory classes
// GET endpoint for fetching advisory classes
router.get('/admin-advisory-classes', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [classes] = await db.query(`
      SELECT 
        c.ClassID, 
        c.Grade, 
        c.Section
      FROM classes c
    `);

    res.json(classes);
  } catch (error) {
    console.error('Error fetching advisory classes:', error);
    res.status(500).json({ error: 'Failed to fetch advisory classes' });
  }
});


// Get grades for a specific student
router.get("/student/:studentID/grades", async (req, res) => {
  const { studentID } = req.params;

  try {
    const db = await connectToDatabase();

    // Get subject grades (per quarter)
    const [grades] = await db.query(`
      SELECT 
        sg.subject_code,
        s.SubjectName,
        sg.Quarter,
        sg.GradeScore
      FROM subjectgrades sg
      JOIN assignsubject a ON sg.subject_code = a.SubjectCode
      JOIN subjects s ON a.subjectID = s.SubjectID
      WHERE sg.StudentID = ?
      ORDER BY sg.subject_code, sg.Quarter
    `, [studentID]);

    // Organize into a map: subject_code => { name, grades by quarter }
    const groupedGrades = {};
    grades.forEach(({ subject_code, SubjectName, Quarter, GradeScore }) => {
      if (!groupedGrades[subject_code]) {
        groupedGrades[subject_code] = {
          subjectName: SubjectName,
          quarters: {},
        };
      }
      groupedGrades[subject_code].quarters[Quarter] = GradeScore;
    });

    res.status(200).json(groupedGrades);

  } catch (error) {
    console.error("Error fetching student grades:", error);
    res.status(500).json({ message: "Failed to fetch grades" });
  }
});


// Get students by advisory class
// Get students by advisoryID instead of ClassID
router.get("/students-in-advisory/:advisoryID", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { advisoryID } = req.params;

    const [students] = await db.query(
      `SELECT s.StudentID, s.FirstName, s.MiddleName, s.LastName
       FROM students s
       JOIN student_classes sc ON s.StudentID = sc.StudentID
       WHERE sc.advisoryID = ?`,
      [advisoryID]
    );

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});



// Route to Add a Subject
router.post("/admin-manage-subject", async (req, res) => {
  try {
    const db = await connectToDatabase(); // Connect to database

    const { SubjectID, SubjectName } = req.body;

    // Validate input fields
    if (!SubjectID || !SubjectName) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // SQL Query
    const sql = "INSERT INTO subjects (SubjectID, SubjectName) VALUES (?, ?)";
    const [result] = await db.query(sql, [SubjectID, SubjectName]);


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
  const { SubjectCode, subjectID, FacultyID, advisoryID, yearID } = req.body;

  if (!SubjectCode || !subjectID || !FacultyID || !advisoryID || !yearID) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const db = await connectToDatabase();

    // Check if referenced advisory exists
    const [advisoryCheck] = await db.query(
      "SELECT advisoryID FROM advisory WHERE advisoryID = ?",
      [advisoryID]
    );
    if (advisoryCheck.length === 0) {
      return res.status(400).json({ error: "Advisory ID not found." });
    }

    // Check if school year exists
    const [yearCheck] = await db.query(
      "SELECT school_yearID FROM schoolyear WHERE school_yearID = ?",
      [yearID]
    );
    if (yearCheck.length === 0) {
      return res.status(400).json({ error: "School Year ID not found." });
    }

    // Insert assignment
    await db.query(
      `INSERT INTO assignsubject (SubjectCode, subjectID, FacultyID, advisoryID, yearID)
       VALUES (?, ?, ?, ?, ?)`,
      [SubjectCode, subjectID, FacultyID, advisoryID, yearID]
    );

    res.status(201).json({ message: "Subject assigned successfully." });
  } catch (error) {
    console.error("Error assigning subject:", error);
    res.status(500).json({ error: "Failed to assign subject." });
  }
});



// Get all assigned subjects (updated to join with subjects table for name if needed)
router.get("/admin-assign-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [assignments] = await db.query(`
      SELECT 
        a.SubjectCode, a.subjectID, a.FacultyID, a.ClassID, a.yearID,
        s.SubjectName,
        f.FirstName AS FacultyFirstName, f.LastName AS FacultyLastName,
        c.Grade, c.Section,
        sy.year AS SchoolYear
      FROM assignsubject a
      JOIN subjects s ON a.SubjectID = s.SubjectID
      JOIN faculty f ON a.FacultyID = f.FacultyID
      JOIN classes c ON a.ClassID = c.ClassID
      JOIN schoolyear sy ON a.yearID = sy.school_yearID
    `);
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});


router.post("/admin-dashboard", async (req, res) => {
  try {
      const db = await connectToDatabase();
      const { SchoolYear, year } = req.body;  // Ensure correct field names

      if (!SchoolYear || !year) {
          return res.status(400).json({ error: "Both School Year ID and Year are required." });
      }

      // Check if school year already exists
      const checkSql = "SELECT * FROM schoolyear WHERE school_yearID = ?";
      const [existing] = await db.query(checkSql, [SchoolYear]);
      if (existing.length > 0) {
          return res.status(400).json({ exists: true, message: "School Year already exists." });
      }

      // Insert the new school year
      const sql = "INSERT INTO schoolyear (school_yearID, year) VALUES (?, ?)";
      const [result] = await db.query(sql, [SchoolYear, year]);

      if (result.affectedRows > 0) {
          return res.status(201).json({ success: true, message: "School Year added successfully!" });
      }

      res.status(500).json({ error: "Failed to insert school year." });
  } catch (err) {
      console.error("Error adding School Year:", err);
      res.status(500).json({ error: "Internal server error." });
  }

});

router.get("/admin-subject-classes/:subjectCode/students", async (req, res) => {
  const { subjectCode } = req.params;

  try {
    const db = await connectToDatabase();

    // Get subject class info
    const [subjectInfoRows] = await db.query(`
      SELECT 
        a.SubjectCode,
        a.advisoryID,
        sub.SubjectName,
        c.Grade,
        c.Section,
        CONCAT(f.FirstName, ' ', f.MiddleName, ' ', f.LastName) AS facultyName,
        sy.year AS schoolYear,
        adv.classID AS classID
      FROM assignsubject a
      JOIN subjects sub ON a.subjectID = sub.SubjectID
      JOIN advisory adv ON a.advisoryID = adv.advisoryID
      JOIN classes c ON adv.classID = c.ClassID
      JOIN faculty f ON a.FacultyID = f.FacultyID
      JOIN schoolyear sy ON a.yearID = sy.school_yearID
      WHERE a.SubjectCode = ?
      LIMIT 1
    `, [subjectCode]);

    if (subjectInfoRows.length === 0) {
      return res.status(404).json({ message: "Subject class not found." });
    }

    const subjectInfo = subjectInfoRows[0];

    // Get students via advisoryID
    const [studentRows] = await db.query(`
      SELECT 
        s.StudentID,
        CONCAT(s.FirstName, ' ', s.MiddleName, ' ', s.LastName) AS fullName
      FROM student_classes sc
      JOIN students s ON s.StudentID = sc.StudentID
      WHERE sc.advisoryID = ?
    `, [subjectInfo.advisoryID]);

    res.status(200).json({
      subjectInfo: {
        subjectName: subjectInfo.SubjectName,
        subjectCode: subjectInfo.SubjectCode,
        grade: subjectInfo.Grade,
        section: subjectInfo.Section,
        facultyName: subjectInfo.facultyName,
        schoolYear: subjectInfo.schoolYear
      },
      students: studentRows
    });
    

  } catch (error) {
    console.error("Error fetching subject class details:", error);
    res.status(500).json({ error: "Failed to fetch subject class details." });
  }
});









export default router;