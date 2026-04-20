import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";

const adminPublic = (a) => ({
  id: a.id,
  name: a.name,
  email: a.email,
  lastLogin: a.lastLogin,
  createdAt: a.createdAt,
});

const signAdminToken = (admin) =>
  jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: "admin",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    const token = signAdminToken(admin);

    return res.status(200).json({
      message: "Login successful.",
      token,
      admin: adminPublic(updated),
    });
  } catch (error) {
    console.error("adminLogin:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        lastLogin: new Date(),
      },
    });

    const token = signAdminToken(admin);

    return res.status(201).json({
      message: "Admin registered successfully.",
      token,
      admin: adminPublic(admin),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "An admin with this email already exists." });
    }
    console.error("adminRegister:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const listAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ admins });
  } catch (error) {
    console.error("listAdmins:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (email !== undefined) data.email = String(email).trim().toLowerCase();
    if (password !== undefined && password.length > 0) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const admin = await prisma.admin.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ message: "Admin updated.", admin });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Admin not found." });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email already in use." });
    }
    console.error("updateAdmin:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.admin.delete({ where: { id } });

    return res.status(200).json({ message: "Admin deleted." });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Admin not found." });
    }
    console.error("deleteAdmin:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
