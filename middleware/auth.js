//   Middleware to protext routea

import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.token;
    const decode = JsonWebTokenError.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne(decode.userId).select("-password");

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    console.error("Error in protextRoute middleware:", err);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Unauthorized access",
      error: err.message,
    });
  }
};
