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
// Update the GET query in the /admin-assign-subject route:
router.get("/admin-assign-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [assignments] = await db.query(`
      SELECT 
        a.SubjectCode as subjectCode,
        a.subjectID,
        a.FacultyID,
        a.advisoryID,
        a.yearID,
        s.SubjectName as subjectName,
        f.LastName as facultyLastName,
        f.FirstName as facultyFirstName,
        CONCAT(f.LastName, ', ', f.FirstName) as facultyName,
        c.Grade as grade,
        c.Section as section,
        sy.year as schoolYear
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
    // Only get faculty with status = 1 (active) or where status is NULL (for backward compatibility)
    const sql = 'SELECT * FROM faculty WHERE status = 1 OR status IS NULL';
    const [result] = await db.query(sql);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching faculty:', err);
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

// Update faculty assigned to advisory class
router.put('/admin-advisory-classes/:advisoryID', async (req, res) => {
  const { advisoryID } = req.params;
  const { facultyID } = req.body;
  if (!facultyID) {
    return res.status(400).json({ error: "Faculty ID is required" });
  }
  try {
    const db = await connectToDatabase();
    const [result] = await db.query(
      "UPDATE advisory SET facultyID = ? WHERE advisoryID = ?",
      [facultyID, advisoryID]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Advisory not found" });
    }
    res.json({ success: true, message: "Advisory class updated successfully" });
  } catch (error) {
    // Enhanced duplicate faculty validation
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('facultyID')) {
      return res.status(400).json({
        error: `This faculty is already assigned as an advisor to another class.`
      });
    }
    console.error("Error updating advisory:", error);
    res.status(500).json({ error: "Failed to update advisory" });
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
    const db = await connectToDatabase();
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Insert subject, SubjectID is auto-incremented
    const [result] = await db.query(
      "INSERT INTO subjects (SubjectName) VALUES (?)",
      [SubjectName]
    );
    res.status(201).json({ SubjectID: result.insertId, SubjectName });
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ error: "Failed to add subject" });
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
// ...existing code...
router.put("/admin-manage-subject/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Check for duplicate (case-insensitive)
    const [dup] = await db.query(
      "SELECT * FROM subjects WHERE LOWER(SubjectName) = LOWER(?) AND SubjectID != ?",
      [SubjectName, id]
    );
    if (dup.length > 0) {
      return res.status(400).json({ error: "Subject name already exists!" });
    }
    await db.query(
      "UPDATE subjects SET SubjectName = ? WHERE SubjectID = ?",
      [SubjectName, id]
    );
    res.json({ success: true, message: "Subject updated successfully" });
  } catch (err) {
    console.error("Error updating subject:", err);
    res.status(500).json({ error: "Failed to update subject" });
  }
});
// ...existing code...



router.post("/admin-assign-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { subjectID, FacultyID, advisoryID, school_yearID } = req.body;

    // First check if this subject is already assigned to this advisory in current year
    const [existingAssignment] = await db.query(
      `SELECT * FROM assignsubject 
       WHERE subjectID = ? 
       AND advisoryID = ? 
       AND yearID = ?`,
      [subjectID, advisoryID, school_yearID]
    );

    // If there's an existing assignment, return error
    if (existingAssignment.length > 0) {
      return res.status(409).json({
        error: "This subject is already assigned to this advisory class for the current school year"
      });
    }

    // If no duplicate found, proceed with insert
    const [result] = await db.query(
      `INSERT INTO assignsubject (subjectID, FacultyID, advisoryID, yearID) 
       VALUES (?, ?, ?, ?)`,
      [subjectID, FacultyID, advisoryID, school_yearID]
    );

    res.status(201).json({
      success: true,
      message: "Subject assigned successfully",
      assignmentId: result.insertId
    });

  } catch (error) {
    console.error("Error assigning subject:", error);
    res.status(500).json({ error: "Failed to assign subject" });
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

    // Check if the school year already exists
    const checkSql = "SELECT * FROM schoolyear WHERE school_yearID = ?";
    const [existing] = await db.query(checkSql, [SchoolYear]);

    if (existing.length > 0) {
      return res.status(400).json({ exists: true, message: "School Year already exists." });
    }

    

    // Insert the new school year with status = 0 (inactive by default)
    const insertSql = "INSERT INTO schoolyear (school_yearID, year, status) VALUES (?, ?, 0)";
    const [result] = await db.query(insertSql, [SchoolYear, year]);

    if (result.affectedRows > 0) {
      return res.status(201).json({ success: true, message: "School Year added successfully with inactive status!" });
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
      SELECT a.advisoryID, a.classID, a.facultyID
      FROM advisory a
      INNER JOIN class_year cy ON a.advisoryID = cy.advisoryID
      INNER JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE sy.status = 1
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

// Get students by advisory class
router.get('/admin-view-students/:advisoryID', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { advisoryID } = req.params;

    // Get advisory info
    const [advisoryRows] = await db.query(
      `SELECT a.advisoryID, c.Grade, c.Section, f.LastName AS facultyName
       FROM advisory a
       JOIN classes c ON a.classID = c.ClassID
       LEFT JOIN faculty f ON a.facultyID = f.FacultyID
       WHERE a.advisoryID = ?`,
      [advisoryID]
    );

    if (!advisoryRows.length) {
      return res.status(404).json({ success: false, error: "Advisory not found" });
    }

    const advisoryInfo = advisoryRows[0];

    // Get students in this advisory for the current school year
    const [schoolYearRows] = await db.query(
      "SELECT school_yearID FROM schoolyear WHERE status = 1"
    );
    if (!schoolYearRows.length) {
      return res.status(400).json({ success: false, error: "No active school year" });
    }
    const school_yearID = schoolYearRows[0].school_yearID;

    const [students] = await db.query(
      `SELECT s.StudentID, s.LastName, s.FirstName, s.MiddleName, s.Status
       FROM student_classes sc
       JOIN students s ON sc.StudentID = s.StudentID
       WHERE sc.advisoryID = ? AND sc.school_yearID = ?`,
      [advisoryID, school_yearID]
    );

    res.json({
      success: true,
      advisoryInfo,
      students
    });
  } catch (error) {
    console.error("Error in /admin-view-students/:advisoryID:", error);
    res.status(500).json({ success: false, error: "Server error", details: error.message });
  }
});



// Route to Add a Subject
router.post("/admin-manage-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Insert subject, SubjectID is auto-incremented
    const [result] = await db.query(
      "INSERT INTO subjects (SubjectName) VALUES (?)",
      [SubjectName]
    );
    res.status(201).json({ SubjectID: result.insertId, SubjectName });
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ error: "Failed to add subject" });
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
// ...existing code...
router.put("/admin-manage-subject/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Check for duplicate (case-insensitive)
    const [dup] = await db.query(
      "SELECT * FROM subjects WHERE LOWER(SubjectName) = LOWER(?) AND SubjectID != ?",
      [SubjectName, id]
    );
    if (dup.length > 0) {
      return res.status(400).json({ error: "Subject name already exists!" });
    }
    await db.query(
      "UPDATE subjects SET SubjectName = ? WHERE SubjectID = ?",
      [SubjectName, id]
    );
    res.json({ success: true, message: "Subject updated successfully" });
  } catch (err) {
    console.error("Error updating subject:", err);
    res.status(500).json({ error: "Failed to update subject" });
  }
});
// ...existing code...







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
      SELECT a.advisoryID, a.classID, a.facultyID
      FROM advisory a
      INNER JOIN class_year cy ON a.advisoryID = cy.advisoryID
      INNER JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE sy.status = 1
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

// Get students by advisory class
router.get("/admin-view-students/:advisoryID", authenticateToken, async (req, res) => {
  const db = await connectToDatabase();
  const { advisoryID } = req.params;

  try {
    // First get current school year
    const [currentYear] = await db.query(
      'SELECT school_yearID FROM schoolyear WHERE status = 1'
    );

    if (!currentYear.length) {
      return res.status(400).json({ 
        success: false, 
        error: "No active school year found" 
      });
    }

    // Get advisory info
    const [advisoryInfo] = await db.query(`
      SELECT 
        c.Grade,
        c.Section,
        CONCAT(f.LastName, ', ', f.FirstName) as facultyName
      FROM advisory a
      JOIN classes c ON a.classID = c.ClassID 
      JOIN faculty f ON a.facultyID = f.FacultyID
      WHERE a.advisoryID = ?
    `, [advisoryID]);

    // Get students in the advisory for current year and active status
    const [students] = await db.query(`
      SELECT DISTINCT s.*
      FROM students s
      JOIN student_classes sc ON s.StudentID = sc.StudentID
      WHERE sc.advisoryID = ? 
      AND sc.school_yearID = ?
      AND s.Status = 1
      ORDER BY s.LastName, s.FirstName
    `, [advisoryID, currentYear[0].school_yearID]);

    res.json({
      success: true,
      advisoryInfo: advisoryInfo[0] || null,
      students: students
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students'
    });
  }
});



// Route to Add a Subject
router.post("/admin-manage-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Insert subject, SubjectID is auto-incremented
    const [result] = await db.query(
      "INSERT INTO subjects (SubjectName) VALUES (?)",
      [SubjectName]
    );
    res.status(201).json({ SubjectID: result.insertId, SubjectName });
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ error: "Failed to add subject" });
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
// ...existing code...
router.put("/admin-manage-subject/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Check for duplicate (case-insensitive)
    const [dup] = await db.query(
      "SELECT * FROM subjects WHERE LOWER(SubjectName) = LOWER(?) AND SubjectID != ?",
      [SubjectName, id]
    );
    if (dup.length > 0) {
      return res.status(400).json({ error: "Subject name already exists!" });
    }
    await db.query(
      "UPDATE subjects SET SubjectName = ? WHERE SubjectID = ?",
      [SubjectName, id]
    );
    res.json({ success: true, message: "Subject updated successfully" });
  } catch (err) {
    console.error("Error updating subject:", err);
    res.status(500).json({ error: "Failed to update subject" });
  }
});
// ...existing code...







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
      SELECT a.advisoryID, a.classID, a.facultyID
      FROM advisory a
      INNER JOIN class_year cy ON a.advisoryID = cy.advisoryID
      INNER JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE sy.status = 1
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




//Validation requests

// Simplified validation request route
router.post("/faculty/validate-grades", authenticateToken, async (req, res) => {
  const db = await connectToDatabase();
  
  try {
    const { advisoryID } = req.body;
    const facultyID = req.user.facultyID;
    const requestDate = new Date().toISOString();

    // First check for existing pending requests
    const [existingRequests] = await db.query(
      `SELECT COUNT(*) as count FROM validation_request 
       WHERE advisoryID = ? AND facultyID = ? AND statusID = 0`,
      [advisoryID, facultyID]
    );

    if (existingRequests[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending validation request for this advisory class"
      });
    }

    // Verify faculty's advisory assignment
    const [advisory] = await db.query(
      'SELECT advisoryID FROM advisory WHERE advisoryID = ? AND facultyID = ?',
      [advisoryID, facultyID]
    );

    if (advisory.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this advisory class"
      });
    }

    await db.query('START TRANSACTION');

    // Create a single validation request for the advisory class
    await db.query(
      `INSERT INTO validation_request 
       (facultyID, advisoryID, statusID, requestDate) 
       VALUES (?, ?, 0, ?)`,
      [facultyID, advisoryID, requestDate]
    );

    await db.query('COMMIT');

    res.json({
      success: true,
      message: "Validation request created successfully",
      requestDate: requestDate
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create validation request"
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

// Get students by advisory class
router.get("/admin-view-students/:advisoryID", authenticateToken, async (req, res) => {
  const db = await connectToDatabase();
  const { advisoryID } = req.params;

  try {
    // First get current school year
    const [currentYear] = await db.query(
      'SELECT school_yearID FROM schoolyear WHERE status = 1'
    );

    if (!currentYear.length) {
      return res.status(400).json({ 
        success: false, 
        error: "No active school year found" 
      });
    }

    // Get advisory info
    const [advisoryInfo] = await db.query(`
      SELECT 
        c.Grade,
        c.Section,
        CONCAT(f.LastName, ', ', f.FirstName) as facultyName
      FROM advisory a
      JOIN classes c ON a.classID = c.ClassID 
      JOIN faculty f ON a.facultyID = f.FacultyID
      WHERE a.advisoryID = ?
    `, [advisoryID]);

    // Get students in the advisory for current year and active status
    const [students] = await db.query(`
      SELECT DISTINCT s.*
      FROM students s
      JOIN student_classes sc ON s.StudentID = sc.StudentID
      WHERE sc.advisoryID = ? 
      AND sc.school_yearID = ?
      AND s.Status = 1
      ORDER BY s.LastName, s.FirstName
    `, [advisoryID, currentYear[0].school_yearID]);

    res.json({
      success: true,
      advisoryInfo: advisoryInfo[0] || null,
      students: students
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students'
    });
  }
});



// Route to Add a Subject
router.post("/admin-manage-subject", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Insert subject, SubjectID is auto-incremented
    const [result] = await db.query(
      "INSERT INTO subjects (SubjectName) VALUES (?)",
      [SubjectName]
    );
    res.status(201).json({ SubjectID: result.insertId, SubjectName });
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ error: "Failed to add subject" });
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
// ...existing code...
router.put("/admin-manage-subject/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { SubjectName } = req.body;
    if (!SubjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    // Check for duplicate (case-insensitive)
    const [dup] = await db.query(
      "SELECT * FROM subjects WHERE LOWER(SubjectName) = LOWER(?) AND SubjectID != ?",
      [SubjectName, id]
    );
    if (dup.length > 0) {
      return res.status(400).json({ error: "Subject name already exists!" });
    }
    await db.query(
      "UPDATE subjects SET SubjectName = ? WHERE SubjectID = ?",
      [SubjectName, id]
    );
    res.json({ success: true, message: "Subject updated successfully" });
  } catch (err) {
    console.error("Error updating subject:", err);
    res.status(500).json({ error: "Failed to update subject" });
  }
});



// Get archived students
router.get('/admin-archive-students', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [students] = await db.query(
      'SELECT StudentID, LastName, FirstName, MiddleName FROM students WHERE Status = 0'
    );
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch archived students' });
  }
});

// Get archived faculty
router.get('/admin-archive-faculty', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [faculty] = await db.query(
      'SELECT FacultyID, LastName, FirstName, MiddleName, Email FROM faculty WHERE status = 0'
    );
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch archived faculty' });
  }
});


// Restore archived student
router.put('/admin-archive-students/restore/:studentId', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { studentId } = req.params;
    const [result] = await db.query(
      'UPDATE students SET Status = 1 WHERE StudentID = ?',
      [studentId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to restore student' });
  }
});

// Restore archived faculty
router.put('/admin-archive-faculty/restore/:facultyId', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { facultyId } = req.params;
    const [result] = await db.query(
      'UPDATE faculty SET status = 1 WHERE FacultyID = ?',
      [facultyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, message: 'Faculty restored successfully' });
  } catch ( error) {
    res.status(500).json({ success: false, message: 'Failed to restore faculty' });
  }
});

// Archive a student (set Status = 0)
router.put('/admin-manage-students/archive/:studentID', async (req, res) => {
  const db = await connectToDatabase();
  const { studentID } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE students SET Status = 0 WHERE StudentID = ?',
      [studentID]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, message: "Student archived" });
  } catch (error) {
    console.error("Error archiving student:", error);
    res.status(500).json({ success: false, message: "Failed to archive student" });
  }
});


// Make sure this route is added if not already there:

router.get("/faculty/check-pending-request/:advisoryID", authenticateToken, async (req, res) => {
  console.log("Received advisoryID:", req.params.advisoryID); // Log the advisoryID received

  const { advisoryID } = req.params;
  try {
    const db = await connectToDatabase();

    // Get current active quarter
    const [[activeQuarterRow]] = await db.query(
      "SELECT quarter FROM quarter WHERE status = 1 LIMIT 1"
    );
    const activeQuarter = activeQuarterRow ? activeQuarterRow.quarter : null;

    // Get latest validation request for this advisory (regardless of faculty)
    const [request] = await db.query(
      `SELECT requestID, requestDate, statusID,
        CASE 
          WHEN statusID = 0 THEN 'pending'
          WHEN statusID = 1 THEN 'approved'
          WHEN statusID = 2 THEN 'rejected'
        END as status
       FROM validation_request 
       WHERE advisoryID = ?  
       ORDER BY requestDate DESC 
       LIMIT 1`,
      [advisoryID]
    );

    const response = {
      success: true,
      status: request.length > 0 ? request[0].status : null,
      lastRequestDate: request.length > 0 ? request[0].requestDate : null,
      activeQuarter
    };

     // Log the response sent to frontend
console.log("Validation status response:", response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to check pending requests" });
  }
});


// Prevent duplicate validation requests for the same faculty/advisory with pending status
router.post('/faculty/validate-grades', authenticateToken, async (req, res) => {
  const { advisoryID } = req.body;
  const facultyID = req.user.id || FacultyID; // Support both token structures
  let db;
  try {
    db = await connectToDatabase();

    // 1. Check for existing pending request for this faculty/advisory
    // statusID: 0 = Pending (adjust if your DB uses a different value)
    const [existing] = await db.query(
      `SELECT requestID, statusID FROM validation_request 
       WHERE facultyID = ? AND advisoryID = ? AND statusID = 0
       ORDER BY requestDate DESC LIMIT 1`,
      [facultyID, advisoryID]
    );

    if (existing.length >  0) {
      // There is already a pending request
      return res.status(409).json({
        success: false,
        message: "A validation request is already pending for this advisory. Please wait for it to be processed before submitting another.",
        requestID: existing[0].requestID
      });
    }

    // 2. If no pending request, create a new one
    const [result] = await db.query(
      `INSERT INTO validation_request (advisoryID, facultyID, statusID, requestDate)
       VALUES (?, ?, 0, NOW())`,
      [advisoryID, facultyID]
    );

    return res.status(201).json({
      success: true,
      message: "Validation request submitted successfully.",
      requestID: result.insertId
    });
   } catch (error) {
    console.error("Error submitting validation request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit validation request.",
      error: error.message
    });
  }
});

// Archive a faculty (set Status = 0)
router.put('/admin-manage-faculty/archive/:facultyID', async (req, res) => {
  const db = await connectToDatabase();
  const { facultyID } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE faculty SET Status = 0 WHERE FacultyID = ?',
      [facultyID]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }
    res.json({ success: true, message: "Faculty archived" });
  } catch (error) {
    console.error("Error archiving faculty:", error);
    res.status(500).json({ success: false, message: "Failed to archive faculty" });

  }
});

// Add after your other /admin-assign-subject routes

router.put("/admin-assign-subject/:advisoryID/:subjectCode", async (req, res) => {
  const { advisoryID, subjectCode } = req.params;
  const { subjectID, FacultyID, school_yearID } = req.body;

  try {
    const db = await connectToDatabase();

    // Update the assignment
    const [result] = await db.query(
      `UPDATE assignsubject 
       SET subjectID = ?, FacultyID = ?, yearID = ?
       WHERE advisoryID = ? AND SubjectCode = ?`,
      [subjectID, FacultyID, school_yearID, advisoryID, subjectCode]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Subject assignment not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Subject assignment updated successfully" 
    });

  } catch (error) {
    console.error("Error updating subject assignment:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update subject assignment" 
    });
  }
});

// Bulk upload students
router.post('/admin-manage-students/bulk', async (req, res) => {
  const db = await connectToDatabase();
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ success: false, message: "No students provided" });
  }

  // Get current school year
  const [currentYear] = await db.query(
    'SELECT school_yearID FROM schoolyear WHERE status = 1'
  );
  if (!currentYear.length) {
    return res.status(400).json({ success: false, message: "No active school year found" });
  }
  const school_yearID = currentYear[0].school_yearID;

  const addedStudents = [];
  const errors = [];

  for (const student of students) {
    const { LastName, FirstName, MiddleName, studentType, grade } = student;
    if (!LastName || !FirstName || !MiddleName || !studentType) {
      errors.push(`Missing required fields for student: ${FirstName || ""} ${LastName || ""}`);
      continue;
    }
    try {
      // Set grade level based on student type
      const studentGrade = studentType === 'new' ? 7 : parseInt(grade);

      // Insert student
      const [result] = await db.query(
        "INSERT INTO students (LastName, FirstName, MiddleName, Status, isNew) VALUES (?, ?, ?, 1, ?)",
        [LastName, FirstName, MiddleName, studentType === 'new' ? 1 : 0]
      );
      const studentID = result.insertId;

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
      `, [studentGrade, school_yearID]);

      if (!advisory.length) {
        errors.push(`No available section found for Grade ${studentGrade} for student: ${FirstName} ${LastName}`);
        continue;
      }

      // Assign student to advisory class
      await db.query(
        'INSERT INTO student_classes (StudentID, school_yearID, advisoryID) VALUES (?, ?, ?)',
        [studentID, school_yearID, advisory[0].advisoryID]
      );

      addedStudents.push({
        StudentID: studentID,
        LastName,
        FirstName,
        MiddleName,
        Status: 1,
        isNew: studentType === 'new' ? 1 : 0,
        grade: studentGrade,
        advisoryID: advisory[0].advisoryID
      });
    } catch (err) {
      errors.push(`Failed to add student: ${FirstName || ""} ${LastName || ""}`);
    }
  }

  if (addedStudents.length === 0) {
    return res.status(400).json({ success: false, message: "No students added", errors });
  }

  res.json({ success: true, addedStudents, errors });
});


// GET all validation requests for admin
router.get('/admin/validation-requests', async (req, res) => {
  try {
    const db = await connectToDatabase();
    // Join with faculty, advisory, classes, and schoolyear for details
    const [requests] = await db.query(`
      SELECT 
        vr.requestID,
        vr.facultyID,
        CONCAT(f.LastName, ', ', f.FirstName) AS facultyName,
        adv.advisoryID,
        c.Grade,
        c.Section,
        sy.year AS schoolYear,
        vr.requestDate,
        vr.statusID
      FROM validation_request vr
      JOIN faculty f ON vr.facultyID = f.FacultyID
      JOIN advisory adv ON vr.advisoryID = adv.advisoryID
      JOIN classes c ON adv.classID = c.ClassID
      JOIN class_year cy ON adv.advisoryID = cy.advisoryID
      JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE sy.status = 1
      ORDER BY vr.requestDate DESC
    `);

    res.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching validation requests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch validation requests" });
  }
});


router.post("/admin/process-validation", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { requestID, action } = req.body;

    // Validate input
    if (!requestID || !["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    // Set statusID: 1 = Approved, 2 = Rejected
    const statusID = action === "approve" ? 1 : 2;

    // Update the validation_request status
    const [result] = await db.query(
      "UPDATE validation_request SET statusID = ? WHERE requestID = ?",
      [statusID, requestID]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    res.json({ success: true, message: "Request processed" });
  } catch (error) {
    console.error("Error processing validation request:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process request" });
  }
});


// Promote to next school year (calls stored procedure)
router.post("/admin/promote-school-year", async (req, res) => {
  const { currentYearId, nextYearId } = req.body;
  if (!currentYearId || !nextYearId) {
    return res.status(400).json({ success: false, message: "Missing year IDs" });
  }
  try {
    const db = await connectToDatabase();
    // Call the stored procedure
    await db.query("CALL promote_students_new_year(?, ?)", [nextYearId, currentYearId]);
    res.json({ success: true, message: "Promotion completed" });
  } catch (error) {
    console.error("Error promoting school year:", error);
    res.status(500).json({ success: false, message: error.message || "Promotion failed" });
  }
});


// Get student details by StudentID
router.get("/students/:studentID", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { studentID } = req.params;

    const [students] = await db.query(
      `SELECT StudentID, LastName, FirstName, MiddleName, Status
       FROM students
       WHERE StudentID = ?`,
      [studentID]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(students[0]);
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Failed to fetch student details" });
  }
});



// Get student info for faculty (by StudentID)
router.get("/faculty/student-info/:studentID", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { studentID } = req.params;

    const [students] = await db.query(
      `SELECT StudentID, LastName, FirstName, MiddleName, Status
       FROM students
       WHERE StudentID = ?`,
      [studentID]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(students[0]);
  } catch (error) {
    console.error("Error fetching student info:", error);
    res.status(500).json({ message: "Failed to fetch student info" });
  }
});

router.get("/student-classes/:studentID/:schoolYearID", async (req, res) => {
  const db = await connectToDatabase();
  const { studentID, schoolYearID } = req.params;
  const [rows] = await db.query(
    "SELECT advisoryID FROM student_classes WHERE StudentID = ? AND school_yearID = ?",
    [studentID, schoolYearID]
  );
  res.json(rows[0] || {});
});
export default router;