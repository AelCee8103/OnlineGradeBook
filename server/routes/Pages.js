import express from 'express';
import { connectToDatabase } from '../lib/db.js';

import { authenticateToken } from "../middleware/authMiddleware.js";


const router = express.Router();




// GET all students (only active ones)
router.get('/admin-manage-students', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sql = 'SELECT * FROM students WHERE Status = 1';
    const [result] = await db.query(sql);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// =======================
// Faculty: Get students assigned to a subject
// =======================
router.get("/faculty-subject-classes/:subjectCode/students", authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { subjectCode } = req.params;

    const [subjectDetails] = await db.query(
      `SELECT 
        a.SubjectCode,
        s.SubjectName,
        c.Grade,
        c.Section
      FROM assignsubject a
      JOIN subjects s ON a.subjectID = s.SubjectID
      JOIN advisory adv ON a.advisoryID = adv.advisoryID
      JOIN classes c ON adv.classID = c.ClassID
      WHERE a.SubjectCode = ?`,
      [subjectCode]
    );

    if (subjectDetails.length === 0) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }

    const [students] = await db.query(
      `SELECT 
        s.StudentID,
        CONCAT(s.FirstName, ' ', s.MiddleName, ' ', s.LastName) AS fullName
      FROM student_classes sc
      JOIN students s ON sc.StudentID = s.StudentID
      WHERE sc.advisoryID = (
        SELECT advisoryID FROM assignsubject WHERE SubjectCode = ?
      )`,
      [subjectCode]
    );

    res.status(200).json({
      success: true,
      subjectInfo: subjectDetails[0],
      students,
    });
  } catch (error) {
    console.error("Error fetching subject students:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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
router.post('/admin-manage-students', authenticateToken, async (req, res) => {
  const { LastName, FirstName, MiddleName, studentType, grade } = req.body;
  let db;
  
  try {
    db = await connectToDatabase();
    await db.query('START TRANSACTION');

    // Set grade level based on student type
    const studentGrade = studentType === 'new' ? 7 : parseInt(grade);

    // Input validation
    if (!LastName || !FirstName || !MiddleName || !studentType) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    if (studentType === 'transferee' && !grade) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Grade level is required for transferee students'
      });
    }

    // Get current school year
    const [currentYear] = await db.query(
      'SELECT school_yearID FROM schoolyear WHERE status = 1'
    );

    if (!currentYear.length) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'No active school year found'
      });
    }

    // Insert student
    const [studentResult] = await db.query(
      'INSERT INTO students (LastName, FirstName, MiddleName, Status, isNew) VALUES (?, ?, ?, 1, ?)',
      [LastName, FirstName, MiddleName, studentType === 'new' ? 1 : 0]
    );

    const StudentID = studentResult.insertId;

    // Find available advisory for grade level
    const [advisory] = await db.query(`
      SELECT a.advisoryID 
      FROM advisory a 
      JOIN classes c ON a.classID = c.ClassID  
      LEFT JOIN student_classes sc ON a.advisoryID = sc.advisoryID
      JOIN class_year cy ON a.advisoryID = cy.advisoryID
      WHERE c.Grade = ? 
      AND cy.yearID = ?
      GROUP BY a.advisoryID
      HAVING COUNT(sc.StudentID) < 50 OR COUNT(sc.StudentID) IS NULL
      ORDER BY COUNT(sc.StudentID) ASC
      LIMIT 1
    `, [studentGrade, currentYear[0].school_yearID]);

    if (!advisory.length) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `No available section found for Grade ${studentGrade}`
      });
    }

    // Assign student to advisory class
    await db.query(
      'INSERT INTO student_classes (StudentID, school_yearID, advisoryID) VALUES (?, ?, ?)',
      [StudentID, currentYear[0].school_yearID, advisory[0].advisoryID]
    );

    await db.query('COMMIT');

    // Return success response with student data
    res.status(201).json({ 
      success: true, 
      student: {
        StudentID,
        LastName,
        FirstName,
        MiddleName,
        grade: studentGrade,
        advisoryID: advisory[0].advisoryID
      }
    });

  } catch (error) {
    if (db) await db.query('ROLLBACK');
    console.error('Error adding student:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to add student'
    });
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



// POST create new class
router.post('/admin-advisory-classes', async (req, res) => {
  const { Grade, Section } = req.body;

  if (!Grade || !Section) {
    return res.status(400).json({ error: 'Grade and Section are required' });
  }

  let db;
  try {
    db = await connectToDatabase();
    await db.query('START TRANSACTION');

    // Insert new class
    const [result] = await db.query(
      'INSERT INTO classes (Grade, Section) VALUES (?, ?)',
      [Grade, Section]
    );

    // Get the newly created class
    const [newClass] = await db.query(
      'SELECT ClassID, Grade, Section FROM classes WHERE ClassID = ?',
      [result.insertId]
    );

    await db.query('COMMIT');
    res.status(201).json(newClass[0]);

  } catch (error) {
    if (db) await db.query('ROLLBACK');
    console.error('Error creating class:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: `Grade ${Grade} Section ${Section} already exists` 
      });
    }
    
    res.status(500).json({ error: 'Failed to create class' });
  }
});






// Get all school years
router.get("/schoolyear", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const query = `
      SELECT 
        school_yearID,
        year,
        status
      FROM schoolyear
      ORDER BY year DESC
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

// GET endpoint for fetching advisory classes
router.get('/admin-advisory-classes', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [classes] = await db.query(`
      SELECT ClassID, Grade, Section 
      FROM classes 
      ORDER BY Grade, Section
    `);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// PUT update class
router.put('/admin-advisory-classes/:id', async (req, res) => {
  const { id } = req.params;
  const { Grade, Section } = req.body;

  if (!Grade || !Section) {
    return res.status(400).json({ error: 'Grade and Section are required' });
  }

  try {
    const db = await connectToDatabase();
    await db.query(
      'UPDATE classes SET Grade = ?, Section = ? WHERE ClassID = ?',
      [Grade, Section, id]
    );

    // Get the updated class
    const [updatedClass] = await db.query(
      'SELECT ClassID, Grade, Section FROM classes WHERE ClassID = ?',
      [id]
    );

    res.json(updatedClass[0]);
  } catch (error) {
    console.error('Error updating class:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: `Grade ${Grade} Section ${Section} already exists` 
      });
    }
    
    res.status(500).json({ error: 'Failed to update class' });
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
        CAST(sg.GradeScore AS DECIMAL(5,2)) as GradeScore
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
          quarters: {}
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



router.post("/admin-assign-subject", async (req, res) => {
  try {
    const { SubjectCode, subjectID, FacultyID, school_yearID, advisoryID } = req.body;
    
    // Validate all required fields
    if (!SubjectCode || !subjectID || !FacultyID || !school_yearID || !advisoryID) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const db = await connectToDatabase();
    
    // Verify advisory exists
    const [advisoryCheck] = await db.query(
      "SELECT advisoryID FROM advisory WHERE advisoryID = ?", 
      [advisoryID]
    );
    if (!advisoryCheck.length) {
      return res.status(400).json({ error: "Specified advisory class does not exist" });
    }

    // Verify faculty exists
    const [facultyCheck] = await db.query(
      "SELECT FacultyID FROM faculty WHERE FacultyID = ?", 
      [FacultyID]
    );
    if (!facultyCheck.length) {
      return res.status(400).json({ error: "Specified faculty does not exist" });
    }

    // Verify subject exists
    const [subjectCheck] = await db.query(
      "SELECT SubjectID FROM subjects WHERE SubjectID = ?", 
      [subjectID]
    );
    if (!subjectCheck.length) {
      return res.status(400).json({ error: "Specified subject does not exist" });
    }

    // Verify school year exists
    const [yearCheck] = await db.query(
      "SELECT school_yearID FROM schoolyear WHERE school_yearID = ?", 
      [school_yearID]
    );
    if (!yearCheck.length) {
      return res.status(400).json({ error: "Specified school year does not exist" });
    }

    // Create assignment
    await db.query(`
      INSERT INTO assignsubject 
        (SubjectCode, subjectID, FacultyID, yearID, advisoryID)
      VALUES (?, ?, ?, ?, ?)`,
      [SubjectCode, subjectID, FacultyID, school_yearID, advisoryID]
    );
    
    res.status(201).json({ message: "Assignment created successfully" });
  } catch (error) {
    console.error("Error creating assignment:", error);
    
    // More specific error messages
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: "Reference error - one of the referenced IDs doesn't exist",
        details: error.sqlMessage
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create assignment",
      details: error.message 
    });
  }
});





// Get all assigned subjects (updated to join with subjects table for name if needed)
router.get("/admin-assign-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [assignments] = await db.query(`
      SELECT 
      a.SubjectCode,
      a.subjectID,
      a.FacultyID,
      a.yearID AS schoolYearID,
      s.subjectName,
      a.advisoryID
    FROM assignsubject a
    JOIN subjects s ON a.subjectID = s.SubjectID
    ORDER BY a.advisoryID, a.SubjectCode
    `);
    
    // Format the data to match your frontend needs
    const formattedAssignments = assignments.map(assignment => ({
      SubjectCode: assignment.SubjectCode,
      subjectID: assignment.subjectID,
      FacultyID: assignment.FacultyID,
      yearID: assignment.schoolYearID,
      schoolYear: assignment.SchoolYear,
      advisoryID: assignment.advisoryID
    }));
    
    res.status(200).json(formattedAssignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});


router.post("/admin-dashboard", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { SchoolYear, year } = req.body;

    if (!SchoolYear || !year) {
      return res.status(400).json({ error: "Both School Year ID and Year are required." });
    }
aaaa
    // Check if the school year already exists
    const checkSql = "SELECT * FROM schoolyear WHERE school_yearID = ?";
    const [existing] = await db.query(checkSql, [SchoolYear]);

    if (existing.length > 0) {
      return res.status(400).json({ exists: true, message: "School Year already exists." });
    }

    // Insert the new school year with status = 1
    const insertSql = "INSERT INTO schoolyear (school_yearID, year, status) VALUES (?, ?, 1)";
    const [result] = await db.query(insertSql, [SchoolYear, year]);

    if (result.affectedRows > 0) {
      return res.status(201).json({ success: true, message: "School Year added successfully with active status!" });
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




//CREATE THE ADVISORY CLASS AND ASSIGN STUDENTS TO IT

// POST create new advisory class and assign students
router.post('/admin-create-advisory', async (req, res) => {
  const { classID, facultyID, schoolYearID } = req.body;

  if (!classID || !facultyID || !schoolYearID) {
    return res.status(400).json({ error: 'Class, Faculty, and School Year are required' });
  }

  let db;
  try {
    db = await connectToDatabase();

    // Check 1: Verify if faculty exists
    const [facultyCheck] = await db.query(
      'SELECT FacultyID FROM faculty WHERE FacultyID = ?',
      [facultyID]
    );
    if (facultyCheck.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Check 2: Verify if class exists
    const [classCheck] = await db.query(
      'SELECT ClassID FROM classes WHERE ClassID = ?',
      [classID]
    );
    if (classCheck.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check 3: Verify if school year exists
    const [yearCheck] = await db.query(
      'SELECT school_yearID FROM schoolyear WHERE school_yearID = ?',
      [schoolYearID]
    );
    if (yearCheck.length === 0) {
      return res.status(404).json({ error: 'School year not found' });
    }

    // Check 4: Check if faculty is already assigned to ANY class in this school year
    const [facultyAssignment] = await db.query(`
      SELECT a.advisoryID, c.Grade, c.Section
      FROM advisory a
      JOIN class_year cy ON a.advisoryID = cy.advisoryID
      JOIN classes c ON a.classID = c.ClassID
      WHERE a.facultyID = ? AND cy.yearID = ?
    `, [facultyID, schoolYearID]);

    if (facultyAssignment.length > 0) {
      const assignedClass = facultyAssignment[0];
      return res.status(400).json({
        error: `This faculty is already assigned to Grade ${assignedClass.Grade}-${assignedClass.Section} for this school year`
      });
    }

    // Check 5: Check if class already has an assigned faculty in this school year
    const [classAssignment] = await db.query(`
      SELECT a.advisoryID, f.FirstName, f.LastName
      FROM advisory a
      JOIN class_year cy ON a.advisoryID = cy.advisoryID
      JOIN faculty f ON a.facultyID = f.FacultyID
      WHERE a.classID = ? AND cy.yearID = ?
    `, [classID, schoolYearID]);

    if (classAssignment.length > 0) {
      const assignedFaculty = classAssignment[0];
      return res.status(400).json({
        error: `This class already has an assigned faculty (${assignedFaculty.FirstName} ${assignedFaculty.LastName}) for this school year`
      });
    }

    // Start transaction if all checks pass
    await db.query('START TRANSACTION');

    // 1. Create advisory class
    const [advisoryResult] = await db.query(
      'INSERT INTO advisory (classID, facultyID) VALUES (?, ?)',
      [classID, facultyID]
    );
    const advisoryID = advisoryResult.insertId;

    // 2. Insert into class_year table
    await db.query(
      'INSERT INTO class_year (advisoryID, yearID) VALUES (?, ?)',
      [advisoryID, schoolYearID]
    );

    // 3. Get 50 active students not assigned to any class this year
    const [students] = await db.query(`
      SELECT s.StudentID 
      FROM students s
      LEFT JOIN student_classes sc ON s.StudentID = sc.StudentID AND sc.school_yearID = ?
      WHERE s.status = 1 
      AND sc.StudentID IS NULL
      ORDER BY s.StudentID
      LIMIT 50
    `, [schoolYearID]);

    // 4. Assign students to this advisory class
    for (const student of students) {
      await db.query(
        'INSERT INTO student_classes (StudentID, school_yearID, advisoryID) VALUES (?, ?, ?)',
        [student.StudentID, schoolYearID, advisoryID]
      );
    }

    await db.query('COMMIT');

    // 5. Get the created advisory class with details
    const [newAdvisory] = await db.query(`
      SELECT a.advisoryID, a.classID, a.facultyID, 
             c.Grade, c.Section,
             f.FirstName, f.LastName,
             sy.school_yearID, sy.year AS SchoolYear
      FROM advisory a
      LEFT JOIN classes c ON a.classID = c.ClassID
      LEFT JOIN faculty f ON a.facultyID = f.FacultyID
      LEFT JOIN class_year cy ON a.advisoryID = cy.advisoryID
      LEFT JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE a.advisoryID = ?
    `, [advisoryID]);

    res.status(201).json({
      message: 'Advisory class created successfully',
      advisory: newAdvisory[0],
      assignedStudents: students.length
    });

  } catch (error) {
    if (db) await db.query('ROLLBACK');
    console.error('Error creating advisory class:', error);

    // Handle duplicate faculty assignment (unique constraint violation)
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('facultyID')) {
      return res.status(400).json({
        error: 'This faculty is already assigned to another class (database constraint)'
      });
    }

    res.status(500).json({ 
      error: 'Failed to create advisory class',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


router.get('/admin-create-advisory', async (req, res) => {
  let db;
  try {
    db = await connectToDatabase();
    const [advisories] = await db.query(`
      SELECT advisoryID, classID, facultyID 
      FROM advisory
    `);

    res.status(200).json(advisories);
  } catch (error) {
    console.error('Error fetching advisory classes:', error);
    res.status(500).json({ error: 'Failed to fetch advisory classes' });
  }
});

// Get advisory classes with faculty and class info for active school year
router.get('/admin/manage-grades', async (req, res) => {
  try {
    const db = await connectToDatabase();

    const [rows] = await db.query(`
      SELECT 
        adv.advisoryID,
        adv.classID,
        CONCAT(f.FirstName, ' ', f.MiddleName, ' ', f.LastName) AS facultyName,
        c.Grade AS grade,
        c.Section AS section,
        sy.year AS SchoolYear
      FROM advisory adv
      JOIN faculty f ON adv.facultyID = f.FacultyID
      JOIN classes c ON adv.classID = c.ClassID
      JOIN class_year cy ON adv.advisoryID = cy.advisoryID
      JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE sy.status = 1
      ORDER BY c.Grade, c.Section
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching advisory class data for grades:", error);
    res.status(500).json({ error: "Failed to retrieve advisory class data." });
  }
});

// Create or update a student's grade for a specific subject, quarter, and year
router.post("/faculty/update-grade", authenticateToken, async (req, res) => {
  const { StudentID, subject_code, Quarter, GradeScore } = req.body;

  try {
    const db = await connectToDatabase();

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Get current active quarter and school year
      const [[activeQuarter]] = await db.query(
        "SELECT quarter FROM quarter WHERE status = 1 LIMIT 1"
      );
      const [[activeYear]] = await db.query(
        "SELECT school_yearID FROM schoolyear WHERE status = 1 LIMIT 1"
      );

      if (!activeQuarter || activeQuarter.quarter !== Quarter) {
        throw new Error("Cannot update grade for inactive quarter");
      }

      if (!activeYear) {
        throw new Error("No active school year found");
      }

      // Insert or update the grade
      await db.query(
        `INSERT INTO subjectgrades (subject_code, StudentID, Quarter, GradeScore, yearID) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE GradeScore = ?`,
        [subject_code, StudentID, Quarter, GradeScore, activeYear.school_yearID, GradeScore]
      );

      // Calculate new average grade
      const [grades] = await db.query(
        `SELECT GradeScore 
         FROM subjectgrades 
         WHERE StudentID = ? AND subject_code = ? AND yearID = ?`,
        [StudentID, subject_code, activeYear.school_yearID]
      );

      // Calculate average only if there are grades
      let averageGrade = null;
      if (grades.length > 0) {
        const sum = grades.reduce((acc, curr) => acc + Number(curr.GradeScore), 0);
        averageGrade = sum / grades.length;
        
        // Round to 2 decimal places
        averageGrade = Math.round(averageGrade * 100) / 100;

        // Only insert/update average if it's a valid number
        if (!isNaN(averageGrade)) {
          await db.query(
            `INSERT INTO averagegrades (StudentID, subject_code, AverageGrade, yearID)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE AverageGrade = ?`,
            [StudentID, subject_code, averageGrade, activeYear.school_yearID, averageGrade]
          );
        }
      }

      await db.query('COMMIT');
      res.json({ 
        success: true, 
        message: "Grade updated successfully",
        averageGrade: averageGrade
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to update grade"
    });
  }
});


router.get('/faculty/student/:studentID/grades/:subjectCode', authenticateToken, async (req, res) => {
  const { studentID, subjectCode } = req.params;

  try {
    const db = await connectToDatabase();

    // Get current active quarter and school year
    const [[activeQuarter]] = await db.query(
      "SELECT quarter FROM quarter WHERE status = 1 LIMIT 1"
    );
    const [[activeYear]] = await db.query(
      "SELECT school_yearID FROM schoolyear WHERE status = 1 LIMIT 1"
    );

    if (!activeYear) {
      return res.status(400).json({ success: false, message: "No active school year found" });
    }

    // Get existing grades for this year
    const [grades] = await db.query(
      `SELECT Quarter, GradeScore 
       FROM subjectgrades 
       WHERE StudentID = ? AND subject_code = ? AND yearID = ?
       ORDER BY Quarter ASC`,
      [studentID, subjectCode, activeYear.school_yearID]
    );

    // Get average grade for this year
    const [[averageRow]] = await db.query(
      `SELECT AverageGrade 
       FROM averagegrades 
       WHERE StudentID = ? AND subject_code = ? AND yearID = ?`,
      [studentID, subjectCode, activeYear.school_yearID]
    );

    // Create a default structure for all 4 quarters
    const allQuarters = [1, 2, 3, 4].map(quarter => {
      const existing = grades.find(g => g.Quarter === quarter);
      return existing || { Quarter: quarter, GradeScore: null };
    });

    res.json({
      success: true,
      grades: allQuarters,
      averageGrade: averageRow?.AverageGrade || null,
      activeQuarter: activeQuarter?.quarter || null
    });
  } catch (err) {
    console.error('Error fetching student grades:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this to your Pages.js
router.get('/admin-advisory-classes/:advisoryID', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { advisoryID } = req.params;
    
    const [advisory] = await db.query(`
      SELECT 
        a.advisoryID,
        a.classID,
        a.facultyID,
        c.Grade,
        c.Section,
        CONCAT(f.FirstName, ' ', f.MiddleName, ' ', f.LastName) AS facultyName,
        sy.year AS SchoolYear
      FROM advisory a
      JOIN classes c ON a.classID = c.ClassID
      JOIN faculty f ON a.facultyID = f.FacultyID
      JOIN class_year cy ON a.advisoryID = cy.advisoryID
      JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE a.advisoryID = ?
    `, [advisoryID]);

    if (advisory.length === 0) {
      return res.status(404).json({ message: "Advisory not found" });
    }

    res.status(200).json(advisory[0]);
  } catch (error) {
    console.error("Error fetching advisory:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Add this new route to get student details
router.get('/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [student] = await db.query(
      'SELECT * FROM students WHERE StudentID = ?',
      [req.params.studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this new endpoint for faculty view
router.get('/faculty/student-info/:studentId', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { studentId } = req.params;

    const [student] = await db.query(`
      SELECT 
        s.*,
        c.Grade,
        c.Section,
        CONCAT(f.FirstName, ' ', f.LastName) as advisorName,
        sy.year as schoolYear
      FROM students s
      JOIN student_classes sc ON s.StudentID = sc.StudentID
      JOIN advisory a ON sc.advisoryID = a.advisoryID
      JOIN classes c ON a.classID = c.ClassID
      JOIN faculty f ON a.facultyID = f.FacultyID
      JOIN class_year cy ON a.advisoryID = cy.advisoryID
      JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE s.StudentID = ? AND sy.status = 1
    `, [studentId]);

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentInfo = student[0];
    const advisoryInfo = {
      Grade: studentInfo.Grade,
      Section: studentInfo.Section,
      facultyName: studentInfo.advisorName,
      SchoolYear: studentInfo.schoolYear
    };

    res.json({
      ...studentInfo,
      advisoryInfo
    });
  } catch (error) {
    console.error('Error fetching student info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




// Get advisory class details and students
router.get('/admin-view-students/:advisoryID', async (req, res) => {
  try {
    console.log(`Fetching data for advisoryID: ${req.params.advisoryID}`); // Debug log
    
    const db = await connectToDatabase();
    const { advisoryID } = req.params;
    
    // 1. First verify the advisory exists
    const [advisoryCheck] = await db.query(
      'SELECT 1 FROM advisory WHERE advisoryID = ?', 
      [advisoryID]
    );
    
    if (!advisoryCheck || advisoryCheck.length === 0) {
      console.log(`No advisory found with ID: ${advisoryID}`);
      return res.status(404).json({ 
        error: 'Advisory not found',
        advisoryID: advisoryID
      });
    }

    // 2. Get advisory details
    const [advisoryInfo] = await db.query(`
      SELECT 
        c.Grade,
        c.Section,
        CONCAT(f.FirstName, ' ', COALESCE(f.MiddleName, ''), ' ', f.LastName) AS facultyName,
        sy.year AS SchoolYear
      FROM advisory a
      JOIN classes c ON a.classID = c.ClassID
      JOIN faculty f ON a.facultyID = f.FacultyID
      JOIN class_year cy ON a.advisoryID = cy.advisoryID
      JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE a.advisoryID = ?
    `, [advisoryID]);

    // 3. Get students
    const [students] = await db.query(`
      SELECT 
        s.StudentID,
        s.FirstName,
        COALESCE(s.MiddleName, '') AS MiddleName,
        s.LastName
      FROM students s
      JOIN student_classes sc ON s.StudentID = sc.StudentID
      WHERE sc.advisoryID = ?
      ORDER BY s.LastName, s.FirstName
    `, [advisoryID]);

    console.log(`Found ${students.length} students for advisory ${advisoryID}`); // Debug log
    
    res.status(200).json({
      success: true,
      advisoryInfo: advisoryInfo[0] || null,
      students: students || [],
      studentCount: students.length
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message 
    });
  }
});




//ATTENDANCE PAGE
// Mark attendance for students in a subject

// Mark attendance for a student
router.post('/faculty-mark-attendance', authenticateToken, async (req, res) => {
  try {
      const db = await connectToDatabase();
      const { SubjectCode, StudentID, StatusID } = req.body;
      const date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

      // Validate input
      if (!SubjectCode || !StudentID || !StatusID) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Check if attendance already marked for this date
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

    // Get status name for response
    const statusResult = await db.query(
        'SELECT StatusName FROM status WHERE StatusID = ?',
        [StatusID]
    );
    
    const StatusName = statusResult[0]?.StatusName || 'Unknown';

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
router.get('/faculty-subject-attendance/:SubjectCode', authenticateToken, async (req, res) => {
  try {
      const db = await connectToDatabase();
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
router.get('/faculty-subject-classes/:SubjectCode/students', authenticateToken, async (req, res) => {
  try {
      const db = await connectToDatabase();
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

// Promote students to the next school year
router.post('/admin/promote-school-year', authenticateToken, async (req, res) => {
  const { currentYearId, nextYearId } = req.body;
  
  try {
    const db = await connectToDatabase();
    
    // Verify years exist and next year is not active
    const [years] = await db.query(
      `SELECT school_yearID, year, status 
       FROM schoolyear 
       WHERE school_yearID IN (?, ?)`,
      [currentYearId, nextYearId]
    );

    if (years.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid school year IDs'
      });
    }

    const nextYear = years.find(y => y.school_yearID === nextYearId);
    if (nextYear.status === 1) {
      return res.status(400).json({
        success: false,
        message: 'Next school year is already active'
      });
    }

    // Execute promotion procedure
    await db.query('CALL promote_students_new_year(?, ?)', [nextYearId, currentYearId]);

    // Update school year status
    await db.query(
      'UPDATE schoolyear SET status = CASE school_yearID ' +
      'WHEN ? THEN 0 ' +  // Deactivate current year
      'WHEN ? THEN 1 ' +  // Activate next year
      'ELSE status END',
      [currentYearId, nextYearId]
    );

    res.json({
      success: true,
      message: 'School year promotion completed successfully'
    });

  } catch (error) {
    console.error('Error promoting school year:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote school year',
      error: error.message
    });
  }
});



export default router;