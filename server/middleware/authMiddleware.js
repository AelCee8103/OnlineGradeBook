import jwt from "jsonwebtoken";

// Common function to verify tokens
const verifyToken = (token, secretKey) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

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
      
      // Set user info in request object
      req.user = {
        id: decoded.AdminID || decoded.FacultyID,
        adminID: decoded.AdminID,
        facultyID: decoded.FacultyID,
        role: decoded.AdminID ? 'admin' : 'faculty',
        name: decoded.FirstName ? `${decoded.FirstName} ${decoded.LastName}` : null
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

export const verifyAdminToken = (token) => {
  try {
    const secretKey = process.env.JWT_SECRET || process.env.JWT_KEY;
    
    if (!token || !secretKey) {
      return null;
    }
    
    const decoded = jwt.verify(token, secretKey);
    
    // Check if this is an admin token
    if (!decoded.AdminID) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error("Admin token verification failed:", error);
    return null;
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.adminID) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
  next();
};