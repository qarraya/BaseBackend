import prisma from "../../lib/prisma.js";
import { kcalFromMacros } from "../../utils/macros.js";

/* ------------------ Get All Meals ------------------ */
export const getAllMeals = async (req, res) => {
  try {
    const meals = await prisma.meal.findMany({
      include: { chromicDiseases: true }, // تجيب الأمراض المرتبطة بالوجبة
    });
    res.status(200).json(meals);
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

    if (!meal) {
      return res.status(404).json({ message: "Meal not found." });
    }

    res.status(200).json(meal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Create Meal ------------------ */
export const createMeal = async (req, res) => {
  try {
    const { name, portion, proteins, fats, carbs, ingredients, time, chronicDiseasesIds } = req.body;

    if (!name || !time) {
      return res.status(400).json({ message: "Name and time are required." });
    }
    if (proteins === undefined || fats === undefined || carbs === undefined) {
      return res.status(400).json({
        message: "proteins, fats, and carbs are required (calories are computed as 4P + 4C + 9F).",
      });
    }

    const calories = kcalFromMacros(proteins, carbs, fats);

    const newMeal = await prisma.meal.create({
      data: {
        name,
        calories,
        portion: portion ?? null,
        proteins: proteins !== undefined ? Number(proteins) : null,
        fats: fats !== undefined ? Number(fats) : null,
        carbs: carbs !== undefined ? Number(carbs) : null,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        time, // MUST match MealTime enum
        chromicDiseases:
          Array.isArray(chronicDiseasesIds) && chronicDiseasesIds.length > 0
            ? {
              create: chronicDiseasesIds.map((id) => ({
                chronicDiseases: { connect: { id: Number(id) } },
              })),
            }
            : undefined,
      },
      include: { chromicDiseases: true },
    });

    res.status(201).json(newMeal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Update Meal ------------------ */
export const updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, portion, proteins, fats, carbs, ingredients, time, chronicDiseasesIds } = req.body;

    const existingMeal = await prisma.meal.findUnique({ where: { id } });

    if (!existingMeal) {
      return res.status(404).json({ message: "Meal not found." });
    }

    const nextP = proteins !== undefined ? Number(proteins) : existingMeal.proteins;
    const nextC = carbs !== undefined ? Number(carbs) : existingMeal.carbs;
    const nextF = fats !== undefined ? Number(fats) : existingMeal.fats;

    if (nextP == null || nextC == null || nextF == null) {
      return res.status(400).json({
        message: "Cannot compute calories: proteins, fats, and carbs must all be set on the meal.",
      });
    }

    const calories = kcalFromMacros(nextP, nextC, nextF);

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        name: name ?? existingMeal.name,
        calories,
        portion: portion !== undefined ? portion : existingMeal.portion,
        proteins: proteins !== undefined ? Number(proteins) : existingMeal.proteins,
        fats: fats !== undefined ? Number(fats) : existingMeal.fats,
        carbs: carbs !== undefined ? Number(carbs) : existingMeal.carbs,
        ingredients: Array.isArray(ingredients) ? ingredients : existingMeal.ingredients,
        time: time ?? existingMeal.time,
        chromicDiseases:
          Array.isArray(chronicDiseasesIds)
            ? {
              deleteMany: {}, // تحذف العلاقات القديمة
              create: chronicDiseasesIds.map((id) => ({
                chronicDiseases: { connect: { id: Number(id) } },
              })),
            }
            : undefined,
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