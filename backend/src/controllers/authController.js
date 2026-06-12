const bcrypt = require("bcrypt");
const prisma = require("../prisma");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!email || !password || !name) {
      const error = new Error("Name, email, and password are required.");
      error.statusCode = 400;
      error.errorCode = "BAD_REQUEST";
      throw error;
    }

    const emailLower = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      const error = new Error("User already exists.");
      error.statusCode = 400;
      error.errorCode = "EMAIL_ALREADY_EXISTS";
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        password: hashedPassword,
        role,
        mustResetPassword: true,
        isActive: true,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
};