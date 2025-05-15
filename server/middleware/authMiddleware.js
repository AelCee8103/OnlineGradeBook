import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided"
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    
    // Use the correct secret key - check both possible env vars
    const secretKey = process.env.JWT_SECRET || process.env.JWT_KEY;
    
    if (!secretKey) {
      console.error("JWT secret key is not defined in environment variables");
      return res.status(500).json({
        success: false,
        message: "Internal server configuration error"
      });
    }
    
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err.name, err.message);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: "Token has expired. Please login again."
          });
        }
        
        return res.status(403).json({
          success: false,
          message: "Invalid token"
        });
      }
      
      // Log the decoded token for debugging
      console.log("Decoded token:", JSON.stringify(decoded, null, 2));
      
      // Normalize the user data
      req.user = {
        id: decoded.AdminID || decoded.FacultyID,
        adminID: decoded.AdminID,
        facultyID: decoded.FacultyID,
        role: decoded.role || (decoded.AdminID ? 'admin' : 'faculty'),
        name: decoded.name || null
      };
      
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication process failed"
    });
  }
};