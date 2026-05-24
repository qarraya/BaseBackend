import prisma from "../../lib/prisma.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

/* ------------------ Get All Meals ------------------ */
export const getAllMeals = async (req, res) => {
  try {
    const meals = await prisma.meal.findMany({
      include: { chromicDiseases: true },
    });

    const timeMap = {
      BREAKFAST: "Breakfast",
      LUNCH: "Lunch",
      DINNER: "Dinner",
      SNACK: "Snack",
    };

    const formattedMeals = meals.map((meal) => ({
      ...meal,
      displayTime: timeMap[meal.time] || meal.time,
    }));

    res.status(200).json(formattedMeals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Get Meal By ID ------------------ */
export const getMealById = async (req, res) => {
  try {
    const { id } = req.params;
    const meal = await prisma.meal.findUnique({
      where: { id },
      include: { chromicDiseases: true },
    });

    if (!meal) return res.status(404).json({ message: "Meal not found." });

    const timeMap = { BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACK: "Snack" };
    const formattedMeal = { ...meal, displayTime: timeMap[meal.time] || meal.time };
    res.status(200).json(formattedMeal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Create Meal ------------------ */
export const createMeal = async (req, res) => {
  try {
    const { name, calories, portion, proteins, fats, carbs, ingredients, time, chronicDiseases, imageUrl: bodyImageUrl } = req.body;

    if (!name || !time) return res.status(400).json({ message: "Name and time are required." });

    const existingMeal = await prisma.meal.findFirst({ where: { name } });
    if (existingMeal) return res.status(400).json({ message: "Meal already exists." });

    let imageUrl = bodyImageUrl || null;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer);
      } catch (err) {
        console.error("Cloudinary error:", err);
      }
    }

    const parseNum = (val) => (val !== undefined && val !== "" ? Number(val) : 0);
    const parseJSON = (val) => {
      if (!val) return [];
      if (typeof val === "string") { try { return JSON.parse(val); } catch (e) { return []; } }
      return Array.isArray(val) ? val : [];
    };

    const meal = await prisma.meal.create({
      data: {
        name,
        calories: parseInt(calories) || 0,
        portion: portion || null,
        proteins: parseNum(proteins),
        fats: parseNum(fats),
        carbs: parseNum(carbs),
        ingredients: parseJSON(ingredients),
        imageUrl,
        time,
        chromicDiseases: {
          create: parseJSON(chronicDiseases).map((id) => ({
            chronicDiseases: { connect: { id: parseInt(id) } },
          })),
        },
      },
      include: { chromicDiseases: true },
    });

    res.status(201).json(meal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/* ------------------ Update Meal ------------------ */
export const updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, calories, portion, proteins, fats, carbs, ingredients, time, chronicDiseases, imageUrl: bodyImageUrl } = req.body;

    const existingMeal = await prisma.meal.findUnique({ where: { id } });
    if (!existingMeal) return res.status(404).json({ message: "Meal not found." });

    let imageUrl = bodyImageUrl || existingMeal.imageUrl;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer);
      } catch (err) {
        console.error("Cloudinary error:", err);
      }
    }

    const parseNum = (val, fb) => (val !== undefined && val !== "" ? Number(val) : fb);
    const parseJSON = (val, fb) => {
      if (val === undefined) return fb;
      if (typeof val === "string") { try { return JSON.parse(val); } catch (e) { return fb; } }
      return Array.isArray(val) ? val : fb;
    };

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        name: name || existingMeal.name,
        calories: calories !== undefined ? parseInt(calories) : existingMeal.calories,
        portion: portion !== undefined ? portion : existingMeal.portion,
        proteins: parseNum(proteins, existingMeal.proteins),
        fats: parseNum(fats, existingMeal.fats),
        carbs: parseNum(carbs, existingMeal.carbs),
        ingredients: parseJSON(ingredients, existingMeal.ingredients),
        imageUrl,
        time: time || existingMeal.time,
        chromicDiseases: chronicDiseases !== undefined ? {
          deleteMany: {},
          create: parseJSON(chronicDiseases, []).map((diseaseId) => ({
            chronicDiseases: { connect: { id: parseInt(diseaseId) } },
          })),
        } : undefined,
      },
      include: { chromicDiseases: true },
    });

    res.status(200).json(updatedMeal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Delete Meal ------------------ */
export const deleteMeal = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.meal.delete({ where: { id } });
    res.status(200).json({ message: "Meal deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const seedMealsFromAPI = async (req, res) => {
  res.status(200).json({ message: "Seeding is disabled for safety during debugging." });
};
