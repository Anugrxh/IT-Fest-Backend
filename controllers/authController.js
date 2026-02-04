const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // You need to install bcryptjs
const { User } = require("../models");
const { signToken } = require("../utils/jwt");

exports.signup = async (req, res) => {
  try {
    // 1. Hash Password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    // 2. Create User
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      collegeId: req.body.collegeId,
      department: req.body.department,
      phone: req.body.phone,
      role: "student", // Default to student
    });

    const token = signToken(newUser.id);

    // Remove password from output
    newUser.password = undefined;

    res.status(201).json({
      status: "success",
      token,
      data: { user: newUser },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email & password exist
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // 2. Check if user exists & password is correct
    // Note: We have to explicitly select password if you hid it in model
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    // 3. Send Token
    const token = signToken(user.id);
    res.status(200).json({ status: "success", token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
