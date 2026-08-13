const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uploadToCloudinary = require("../utils/uploadCloudinary");
const { Session } = require("../models/session.model");
const { createSession } = require("./session.controllers");
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      role,
      agreeTerms,
    } = req.body;
    console.log("body", req.body);

    // all field are requied
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !role ||
      !agreeTerms
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please all field are required" });
    }

    // check password match
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passowrd does not matched" });
    }

    // check exisiting email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exits database" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // create user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashPassword,
      role,
      agreeTerms,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      data: newUser,
      message: "User Register Successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // all field are required
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Please all field are required" });
    }

    // check user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials!" });
    }

    // check role
    if (user.role !== role) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role selected" });
    }

    // matched password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials!" });
    }

    // save login info
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // session create
    await createSession(user._id, req);
    // await Session.create({
    //   user: user._id,
    //   device: req.headers["user-agent"] || "Unknown",
    //   location: user.location || "Unknown",
    //   ipAddress: req.ip || "Unknown",
    //   lastActive: new Date(),
    //   status: "Active",
    // });

    // create jwt token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // save cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login Successfully",
      token,
      user: {
        id: user._id,
        name: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const profile = async (req, res) => {
  try {
    const userId = req.user.id;

    const updateData = { ...req.body };

    // Upload profile image
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.profileImage = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { currentPass, newPass } = req.body || {};
    // Validate required fields
    if (!currentPass || !newPass) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }
    // validation new pass
    if (newPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be 6 character long",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User is not found" });
    }

    // check current password
    const checkCurrentPass = await bcrypt.compare(currentPass, user.password);
    if (!checkCurrentPass) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // check new password match current password
    const isSamePassword = await bcrypt.compare(newPass, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);
    user.password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
    return res.status(200).json({
      success: true,
      message: "Logout Successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// const updateProfile = async (req, res) => {
//   try {
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal server error" });
//   }
// };

module.exports = {
  register,
  login,
  profile,
  getProfile,
  changePassword,
  logout,
};
