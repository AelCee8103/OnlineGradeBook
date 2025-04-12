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



router.post("/admin-advisory-classes", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { ClassID, Grade, Section, FacultyID, school_yearID } = req.body;

    // Validate required fields
    if (!ClassID || !Grade || !Section || !FacultyID || !school_yearID) {
      return res.status(400).json({ error: "All fields are required including school year" });
    }

    console.log("Received request:", req.body);

    // Check if the faculty member exists
    const [faculty] = await db.query("SELECT * FROM faculty WHERE FacultyID = ?", [FacultyID]);
    if (!faculty[0] || faculty[0].length === 0) {
      return res.status(400).json({ error: "Invalid FacultyID. Faculty member not found." });
    }

    // Check if the school year exists
    const [yearResult] = await db.query(
      "SELECT school_yearID FROM schoolyear WHERE school_yearID = ?", 
      [school_yearID]
    );
    
    if (!yearResult || yearResult.length === 0) {
      return res.status(400).json({ error: "Invalid school year selected" });
    }

    const currentSchoolYearID = yearResult[0].school_yearID;
    console.log("Valid faculty and school year found.");

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Insert into classes table
      console.log("Inserting into classes...");
      await db.query(
        `INSERT INTO classes (ClassID, Grade, Section, FacultyID) 
         VALUES (?, ?, ?, ?)`,
        [ClassID, Grade, Section, FacultyID]
      );

      // Insert into class_year table
      console.log("Inserting into class_year...");
      const [classYearResult] = await db.query(
        `INSERT INTO class_year (classID, facultyID, Grade, Section, yearID) 
         VALUES (?, ?, ?, ?, ?)`,
        [ClassID, FacultyID, Grade, Section, currentSchoolYearID]
      );

      // Get the inserted ClassYearID
      const classYearID = classYearResult.insertId;

      // 🔧 Update classes table with the new classyearID
      await db.query(
        "UPDATE classes SET classyearID = ? WHERE ClassID = ?",
        [classYearID, ClassID]
      );

      // Fetch ACTIVE students (Status = '1')
      console.log("Fetching active students...");
      const [students] = await db.query(
        `SELECT StudentID FROM students WHERE Status = '1'`
      );

      if (!students.length) {
        console.log("No active students found. Rolling back...");
        await db.query("ROLLBACK");
        return res.status(400).json({ error: "No active students available for assignment" });
      }

      console.log(`Found ${students.length} active students. Assigning to class...`);

      // Assign students to class_year
      const studentValues = students.map(student => [
        ClassID,
        student.StudentID,
        FacultyID,
        classYearID
      ]);

      await db.query(
        `INSERT INTO student_classes (ClassID, StudentID, FacultyID, ClassYearID) 
         VALUES ${students.map(() => "(?, ?, ?, ?)").join(", ")}`, 
        studentValues.flat()
      );

      // Commit transaction
      await db.query("COMMIT");

      console.log(`Advisory class created successfully with ${students.length} assigned students.`);

      res.status(201).json({ 
        success: true,
        message: `Advisory class created with ${students.length} active students assigned`,
        newClass: {
          ClassID,
          Grade,
          Section,
          FacultyID,
          school_yearID: currentSchoolYearID
        },
        assignedStudentsCount: students.length
      });

    } catch (error) {
      await db.query("ROLLBACK");
      console.error("Transaction error:", error);
      res.status(500).json({ 
        error: "Database operation failed",
        details: error.message,
        sqlError: error.sqlMessage || "No additional SQL error info"
      });
    }

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ 
      error: "Server error",
      details: error.message,
      sqlError: error.sqlMessage || "No additional SQL error info"
    });
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
router.get("/admin-advisory-classes", async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    const query = `
      SELECT 
        c.ClassID,
        c.Grade,
        c.Section,
        c.FacultyID,
        cy.yearID,
        sy.year
      FROM classes c
      JOIN class_year cy ON c.classyearID = cy.ClassYearID
      JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      ORDER BY c.ClassID
    `;
    
    const [classes] = await db.query(query);
    
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching advisory classes:", error);
    res.status(500).json({ 
      error: "Failed to fetch advisory classes",
      details: error.message 
    });
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
  const { SubjectCode, subjectID, FacultyID, ClassID, school_yearID } = req.body;

  if (!SubjectCode || !subjectID || !FacultyID || !ClassID || !school_yearID) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const db = await connectToDatabase();

    // Verify the school_yearID exists
    const [schoolYearRows] = await db.query(
      `SELECT school_yearID FROM schoolyear WHERE school_yearID = ? OR year = ?`,
      [school_yearID, school_yearID]
    );

    if (schoolYearRows.length === 0) {
      return res.status(400).json({ error: `School year with ID '${school_yearID}' not found.` });
    }

    // Insert assignment with only school_yearID
    await db.query(
      `INSERT INTO assignsubject (SubjectCode, subjectID, FacultyID, ClassID, yearID)
       VALUES (?, ?, ?, ?, ?)`,
      [SubjectCode, subjectID, FacultyID, ClassID, school_yearID]
    );

    res.status(201).json({ message: "Subject assigned successfully" });
  } catch (error) {
    console.error("Error assigning subject:", error);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        error: "Invalid reference. Please check if Faculty, Class, Subject, or Year exist."
      });
    }

    res.status(500).json({ error: "Failed to assign subject" });
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






export default router;
