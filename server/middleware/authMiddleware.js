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

    // Console log for debugging
    console.log("Token decoded:", decoded);

    // Standardize the user object to handle both faculty and admin tokens
    req.user = {
      facultyID: decoded.FacultyID || decoded.facultyID,
      adminID: decoded.AdminID || decoded.adminID,
      // Set appropriate role based on which ID is present
      role: decoded.AdminID ? 'admin' : 'faculty'
    };

    next();
  });
};