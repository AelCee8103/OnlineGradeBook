// In your middleware/auth.js or similar file
const checkAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

router.get("/faculty-class-advisory", authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [rows] = await db.query(`
      SELECT 
        c.Grade AS grade,
        c.Section AS section,
        CONCAT(f.FirstName, ' ', f.LastName) AS advisorName,
        sy.year AS schoolYear
      FROM advisory a
      JOIN classes c ON a.classID = c.ClassID
      JOIN faculty f ON a.facultyID = f.FacultyID
      JOIN class_year cy ON a.advisoryID = cy.advisoryID
      JOIN schoolyear sy ON cy.yearID = sy.school_yearID
      WHERE a.facultyID = ?
      AND sy.status = 1
    `, [req.user.id]);

    if (rows.length === 0) {
      return res.json({ 
        message: "No advisory class assigned",
        advisorName: req.user.name
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});