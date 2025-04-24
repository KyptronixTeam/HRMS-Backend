const appRouter = require("express").Router();
const Users = require("../../database/Models/Users.js");
const bcrypt = require("bcrypt");

appRouter.post("/register", async (req, res) => {
  try {
    // get details from body
    const {
      fullName,
      email,
      country,
      phoneNumber,
      password,
      address,
      dateOfBirth,
      userRole
    } = req.body;

    // check if emaill exists
    const checkEmailExists = await Users.findOne({ email });
    if (checkEmailExists)
      return res.status(409).json({
        message: "Email already exists",
        status: "Error",
      });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // create new user
    const newUser = await Users({
      userName: fullName,
      email,
      phoneNumber,
      country,
      address,
      password: hashedPassword,
      dateOfBirth: dateOfBirth,
      userRole
    });
    // save user to database
    await newUser.save();
    // return user details
    res
      .json({
        message: "Account created successfully",
        status: "Success",
      })
      .status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error, status: "Server Error" });
  }
});

module.exports = appRouter;
