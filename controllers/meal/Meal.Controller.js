import { uploadToCloudinary } from "../../utils/cloudinary.js";

/* ------------------ Create Meal ------------------ */
export const createMeal = async (req, res) => {
  try {
    // استدعاء ديناميكي للـ Prisma عشان ما ينهار الملف عند التحميل
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const { name, calories, portion, proteins, fats, carbs, ingredients, time, chronicDiseases, imageUrl: bodyImageUrl } = req.body;

    let imageUrl = bodyImageUrl || null;
    if (req.file) {
      try { imageUrl = await uploadToCloudinary(req.file.buffer); } catch (e) { }
    }

    const parseNum = (v) => (v !== undefined && v !== "" ? Number(v) : 0);
    const parseJSON = (v) => {
      if (!v) return [];
      if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return []; } }
      return Array.isArray(v) ? v : [];
    };

    const meal = await prisma.meal.create({
      data: {
        name,
        calories: parseInt(calories) || 0,
        portion,
        proteins: parseNum(proteins),
        fats: parseNum(fats),
        carbs: parseNum(carbs),
        ingredients: parseJSON(ingredients),
        imageUrl,
        time,
      }
    });

    res.status(201).json(meal);
  } catch (error) {
    console.error("DETAILED ERROR:", error);
    res.status(500).json({
      message: "Prisma Failed to Initialize",
      error: error.message,
      hint: "Try running 'prisma generate' or check your DATABASE_URL"
    });
  }
};

export const getAllMeals = async (req, res) => { res.json({ message: "Use POST to test createMeal" }); };
export const getMealById = async (req, res) => { res.json({ message: "OK" }); };
export const updateMeal = async (req, res) => { res.json({ message: "OK" }); };
export const deleteMeal = async (req, res) => { res.json({ message: "OK" }); };
export const seedMealsFromAPI = () => { };
