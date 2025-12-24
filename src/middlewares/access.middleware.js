import ApiError from "../utils/ApiError.js";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Check if user exists
    if (!req.user || !req.user.specialRoles) {
      throw new ApiError(403, "Access denied: No roles found");
    }

    // 2. Check if user has AT LEAST ONE of the allowed roles
    // We use .some() to check for intersection between user roles and allowed roles
    const hasPermission = req.user.specialRoles.some(userRole => 
      allowedRoles.includes(userRole)
    );

    if (!hasPermission) {
      throw new ApiError(403, "Access denied: Insufficient permissions");
    }
    next();
  };
};
