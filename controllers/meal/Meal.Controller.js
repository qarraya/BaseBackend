import prisma from "../../lib/prisma.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

/* ------------------ Get All Meals ------------------ */
export const getAllMeals = async (req, res) => {
  try {
    const meals = await prisma.meal.findMany({ include: { chromicDiseases: true } });
    const timeMap = { BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACK: "Snack" };
    res.status(200).json(meals.map(m => ({ ...m, displayTime: timeMap[m.time] || m.time })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching meals." });
  }
};

/* ------------------ Get Meal By ID ------------------ */
export const getMealById = async (req, res) => {
  try {
    const meal = await prisma.meal.findUnique({ where: { id: req.params.id }, include: { chromicDiseases: true } });
    if (!meal) return res.status(404).json({ message: "Meal not found." });
    const timeMap = { BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACK: "Snack" };
    res.status(200).json({ ...meal, displayTime: timeMap[meal.time] || meal.time });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error." });
  }
};

/* ------------------ Create Meal ------------------ */
export const createMeal = async (req, res) => {
  try {
    const { name, calories, portion, proteins, fats, carbs, ingredients, time, chronicDiseases, imageUrl: bodyImageUrl } = req.body;
    if (!name || !time) return res.status(400).json({ message: "Name and time are required." });

    let imageUrl = bodyImageUrl || null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer);
      } catch (err) {
        console.error("Cloudinary error:", err);
      }
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
        chromicDiseases: {
          create: parseJSON(chronicDiseases).map(id => ({
            chronicDiseases: { connect: { id: parseInt(id) } }
          }))
        }
      },
      include: { chromicDiseases: true }
    });
    res.status(201).json(meal);
  } catch (error) {
    console.error("Create Meal Error:", error);
    res.status(500).json({ message: "Failed to create meal.", details: error.message });
  }
};

/* ------------------ Update Meal ------------------ */
export const updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, calories, portion, proteins, fats, carbs, ingredients, time, chronicDiseases, imageUrl: bodyImageUrl } = req.body;
    const existing = await prisma.meal.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found." });

    let imageUrl = bodyImageUrl || existing.imageUrl;
    if (req.file) {
      try { imageUrl = await uploadToCloudinary(req.file.buffer); } catch (e) { }
    }

    const parseNum = (v, fb) => (v !== undefined && v !== "" ? Number(v) : fb);
    const parseJSON = (v, fb) => {
      if (v === undefined) return fb;
      if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return fb; } }
      return Array.isArray(v) ? v : fb;
    };

    const updated = await prisma.meal.update({
      where: { id },
      data: {
        name: name || existing.name,
        calories: calories ? parseInt(calories) : existing.calories,
        portion: portion !== undefined ? portion : existing.portion,
        proteins: parseNum(proteins, existing.proteins),
        fats: parseNum(fats, existing.fats),
        carbs: parseNum(carbs, existing.carbs),
        ingredients: parseJSON(ingredients, existing.ingredients),
        imageUrl,
        time: time || existing.time,
        chromicDiseases: chronicDiseases ? {
          deleteMany: {},
          create: parseJSON(chronicDiseases, []).map(id => ({
            chronicDiseases: { connect: { id: parseInt(id) } }
          }))
        } : undefined
      }
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed." });
  }
};

export const deleteMeal = async (req, res) => {
  await prisma.meal.delete({ where: { id: req.params.id } });
  res.status(200).json({ message: "Deleted." });
};

export const seedMealsFromAPI = () => { };
