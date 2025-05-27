import StatusCodes from "http-status-codes";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../liv/utils.js";
import cloudinary from "../liv/cloudinary.js";
//  Sign up a new user

export const signup = async (req, res) => {
  const { email, fullName, password, bio } = req.body;
  try {
    // Check if user already exists
    if (!email || !fullName || !password || !bio) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email,
      fullName,
      password: hashedPassword,
      bio,
    });
    const token = generateToken(newUser._id);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User created successfully",
      userData: newUser,
      token,
    });
  } catch (err) {
    console.error("Error in signup:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Login a user
export const login = async (req, res) => {
  try {
    const { email, password } = res.body;
    const userData = await User.findOne({ email });
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(userData._id);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Login successfully",
      userData,
      token,
    });
  } catch (err) {
    console.error("Error in login:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const checkAuth = async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "User is authenticated",
    userData: req.user,
  });
};

// controller to update user profile

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      userData: updatedUser,
    });
  } catch (err) {
    console.error("Error in updateProfile:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
