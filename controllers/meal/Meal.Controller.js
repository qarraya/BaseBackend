
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const { name, calories, time, chronicDiseasesIds } = req.body;

    if (!name || calories === undefined || !time) {
      return res.status(400).json({ message: "Name, calories and time are required." });
    }

    const newMeal = await prisma.meal.create({
      data: {
        name,
        calories: Number(calories),
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
    const { name, calories, time, chronicDiseasesIds } = req.body;

    const existingMeal = await prisma.meal.findUnique({ where: { id } });

    if (!existingMeal) {
      return res.status(404).json({ message: "Meal not found." });
    }

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        name: name ?? existingMeal.name,
        calories: calories !== undefined ? Number(calories) : existingMeal.calories,
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