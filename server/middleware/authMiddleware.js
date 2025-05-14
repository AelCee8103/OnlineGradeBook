import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "No token provided." 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: err.message.includes("expired") 
          ? "Token expired. Please login again." 
          : "Invalid token." 
      });
    }

    // Standardize the user object
    req.user = {
      id: decoded.FacultyID || decoded.facultyID || decoded.AdminID || decoded.adminID,
      facultyID: decoded.FacultyID || decoded.facultyID,
      role: decoded.role || (decoded.FacultyID || decoded.facultyID ? 'faculty' : 'admin')
    };
    
    next();
  });
};