
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createUser = async (req, res) => {
  try {
    const { username, email, password, gender, currentWeight, activityLevel, height, goal } = req.body;
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password,
        gender,
        currentWeight,
        activityLevel,
        height,
        goal,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2️⃣ جلب كل المستخدمين
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3️⃣ جلب مستخدم واحد بالـ id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { chronicDiseases: true, plans: true, progress: true, notifications: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4️⃣ تحديث مستخدم
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body; // يحتوي على أي حقل بدك تعدليه
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5️⃣ حذف مستخدم
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};