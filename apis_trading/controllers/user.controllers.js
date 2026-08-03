const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

const profile = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, location, bio } = req.body;
    const userId = req.user.id;
    console.log("userId", userId);

    const user = await User.findById(userId).select("-password");
    console.log("id", userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    ((user.phoneNumber = phoneNumber), (user.location = location));
    user.bio = bio;

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

const updateProfile = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  profile,
  logout,
};
