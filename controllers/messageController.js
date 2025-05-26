// Get all users except the logged-in user
import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../liv/cloudinary.js";
import { io, userSocketMap } from "../server.js";

export const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUser = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );
    const unseenMessages = {};

    const promise = filteredUser.map(async (user) => {
      const message = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (message.length > 0) {
        unseenMessages[user._id] = message.length;
      }
    });

    await Promise.all(promise);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Users fetched successfully",
      users: filteredUser,
      unseenMessages,
    });
    // count number of message not seen
  } catch (err) {
    console.error("Error in getUserForSidebar:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// get all message for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.param;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        {
          senderId: selectedUserId,
          receiverId: myId,
        },
      ],
    });
    await Message.updateMany(
      {
        senderId: selectedUserId,
        receiverId: myId,
      },
      { seen: true }
    );
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Messages fetched successfully",
      messages,
    });
  } catch (err) {
    console.error("Error in getMessages:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// api to mark message as seen using message id

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.param;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Message marked as seen successfully",
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

//  send message to selected user

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // emit the new message to the receiver's socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Message sent successfully",
      message: newMessage,
    });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
