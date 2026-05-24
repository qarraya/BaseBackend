import prisma from "../../lib/prisma.js";
import { kcalFromMacros } from "../../utils/macros.js";
import cloudinary, { uploadToCloudinary } from "../../utils/cloudinary.js";
import { mealCategories } from "../../lib/mealCategories.js";

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
      displayTime: timeMap[meal.time] || meal.time, // نضيف حقل جديد للعرض ولا نحذف الأصلي
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

    if (!meal) {
      return res.status(404).json({ message: "Meal not found." });
    }

    const timeMap = {
      BREAKFAST: "Breakfast",
      LUNCH: "Lunch",
      DINNER: "Dinner",
      SNACK: "Snack",
    };

    const formattedMeal = {
      ...meal,
      displayTime: timeMap[meal.time] || meal.time,
    };

    res.status(200).json(formattedMeal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Create Meal ------------------ */
export const createMeal = async (req, res) => {
  try {
    const {
      name,
      calories,
      portion,
      proteins,
      fats,
      carbs,
      ingredients,
      time,
      chronicDiseases,
      imageUrl: bodyImageUrl,
    } = req.body;

    if (!name || !time) {
      return res.status(400).json({ message: "Name and time are required." });
    }

    // Check if meal with the same name already exists
    const existingMeal = await prisma.meal.findFirst({ where: { name } });
    if (existingMeal) {
      return res.status(400).json({ message: "Meal with this name already exists." });
    }

    let imageUrl = bodyImageUrl || null;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, "meals");
      imageUrl = uploadResult.secure_url;
    }

    // Helper functions for safety
    const parseNum = (val) => (val !== undefined && val !== "" ? Number(val) : 0);
    const parseJSON = (val) => {
      if (!val) return [];
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { return []; }
      }
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
        time, // Must be BREAKFAST, LUNCH, DINNER, SNACK
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
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Update Meal ------------------ */
export const updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id?.trim();

    const {
      name,
      calories,
      portion,
      proteins,
      fats,
      carbs,
      ingredients,
      time,
      chronicDiseases,
      imageUrl: bodyImageUrl,
    } = req.body;

    console.log(`Attempting to update meal: ${cleanId}`);

    const existingMeal = await prisma.meal.findUnique({ where: { id: cleanId } });
    if (!existingMeal) {
      console.error(`Meal not found for update: ${cleanId}`);
      return res.status(404).json({ message: "Meal not found." });
    }

    let imageUrl = bodyImageUrl || existingMeal.imageUrl;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, "meals");
      imageUrl = uploadResult.secure_url;
    }

    // Helper functions for safety
    const parseNum = (val, fb) => (val !== undefined && val !== "" ? Number(val) : fb);
    const parseJSON = (val, fb) => {
      if (val === undefined) return fb;
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { return fb; }
      }
      return Array.isArray(val) ? val : fb;
    };

    // Ensure 'time' is a valid enum value and not the formatted label
    let finalTime = time;
    if (time === "Breakfast") finalTime = "BREAKFAST";
    if (time === "Lunch") finalTime = "LUNCH";
    if (time === "Dinner") finalTime = "DINNER";
    if (time === "Snack") finalTime = "SNACK";

    const updatedMeal = await prisma.meal.update({
      where: { id: cleanId },
      data: {
        name: name || existingMeal.name,
        calories: calories !== undefined ? (parseInt(calories) || 0) : existingMeal.calories,
        portion: portion !== undefined ? portion : existingMeal.portion,
        proteins: parseNum(proteins, existingMeal.proteins),
        fats: parseNum(fats, existingMeal.fats),
        carbs: parseNum(carbs, existingMeal.carbs),
        ingredients: parseJSON(ingredients, existingMeal.ingredients),
        imageUrl,
        time: finalTime || existingMeal.time,
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
    const cleanId = id?.trim();

    console.log(`Attempting to delete meal: ${cleanId}`);

    const existingMeal = await prisma.meal.findUnique({ where: { id: cleanId } });
    if (!existingMeal) {
      console.error(`Meal not found for deletion: ${cleanId}`);
      return res.status(404).json({ message: "Meal not found." });
    }

    await prisma.meal.delete({ where: { id: cleanId } });

    res.status(200).json({ message: "Meal deleted successfully." });
  } catch (error) {
    console.error("Delete Meal Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Seed Meals From API ------------------ */
export const seedMealsFromAPI = async (req, res) => {
  try {
    let results = [];
    for (const category of mealCategories) {
      const { time, meals } = category;

      for (const mealData of meals) {
        const { name, calories, portion, proteins, fats, carbs, ingredients, imageUrl } = mealData;

        let finalImageUrl = imageUrl;
        if (imageUrl && !imageUrl.includes("cloudinary.com")) {
          try {
            const uploadResult = await uploadToCloudinary(imageUrl, "meals");
            finalImageUrl = uploadResult.secure_url;
          } catch (uploadError) {
            console.error(`Failed to upload image for ${name}:`, uploadError);
          }
        }

        const existingMeal = await prisma.meal.findFirst({ where: { name } });

        let result;
        const mealFields = {
          calories: Number(calories),
          portion: portion ?? null,
          proteins: proteins !== undefined ? Number(proteins) : null,
          fats: fats !== undefined ? Number(fats) : null,
          carbs: carbs !== undefined ? Number(carbs) : null,
          ingredients: Array.isArray(ingredients) ? ingredients : [],
          imageUrl: finalImageUrl,
          time,
        };

        if (existingMeal) {
          result = await prisma.meal.update({
            where: { id: existingMeal.id },
            data: mealFields,
          });
        } else {
          result = await prisma.meal.create({
            data: {
              name,
              ...mealFields,
            },
          });
        }
        results.push(result);
      }
    }

    res.status(200).json({
      message: `Successfully seeded ${results.length} meals and migrated images to Cloudinary.`,
      count: results.length,
    });
  } catch (error) {
    console.error("Seed API Error:", error);
    res.status(500).json({ message: "Internal server error during seeding." });
  }
};
