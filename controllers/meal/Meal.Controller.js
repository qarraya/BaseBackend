import prisma from "../../lib/prisma.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

export const getAllMeals = async (req, res) => {
  try {
    const meals = await prisma.meal.findMany({ include: { chromicDiseases: true } });
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meals." });
  }
};

export const getMealById = async (req, res) => {
  try {
    const meal = await prisma.meal.findUnique({
      where: { id: req.params.id },
      include: { chromicDiseases: true }
    });
    if (!meal) return res.status(404).json({ message: "Meal not found." });
    res.status(200).json(meal);
  } catch (error) {
    res.status(500).json({ message: "Error." });
  }
};

export const createMeal = async (req, res) => {
  try {
    const { name, calories, portion, proteins, fats, carbs, ingredients, time, chronicDiseases, imageUrl: bodyImageUrl } = req.body;

    let imageUrl = bodyImageUrl || null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
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
      }
    });

    res.status(201).json(meal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create meal." });
  }
};

export const updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, calories, portion, proteins, fats, carbs, ingredients, time, chronicDiseases, imageUrl: bodyImageUrl } = req.body;

    const existing = await prisma.meal.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Meal not found." });

    let imageUrl = bodyImageUrl || existing.imageUrl;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const parseNum = (v, fallback) => (v !== undefined && v !== "" ? Number(v) : fallback);
    const parseJSON = (v, fallback) => {
      if (v === undefined) return fallback;
      if (typeof v === "string") { try { return JSON.parse(v); } catch (e) { return fallback; } }
      return Array.isArray(v) ? v : fallback;
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
  try {
    await prisma.meal.delete({ where: { id: req.params.id } });
    res.status(200).json({ message: "Deleted successfully." });
  } catch (e) { res.status(500).json({ message: "Delete failed." }); }
};

export const seedMealsFromAPI = async (req, res) => {
  res.status(200).json({ message: "Seed endpoint restored." });
};
