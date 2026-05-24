/* ------------------ Meal Controller (Safe Mode) ------------------ */
export const getAllMeals = async (req, res) => {
  res.status(200).json({ message: "Server is ALIVE! Prisma is currently detached for debugging." });
};

export const getMealById = async (req, res) => {
  res.status(200).json({ message: "Server is ALIVE!" });
};

export const createMeal = async (req, res) => {
  const { name, imageUrl } = req.body;
  res.status(201).json({
    success: true,
    message: "ULTRA SUCCESS! The server is NOT broken. The problem was the Prisma Import.",
    receivedData: { name, imageUrl }
  });
};

export const updateMeal = async (req, res) => {
  res.status(200).json({ message: "Server is ALIVE!" });
};

export const deleteMeal = async (req, res) => {
  res.status(200).json({ message: "Server is ALIVE!" });
};

export const seedMealsFromAPI = async (req, res) => {
  res.status(200).json({ message: "Server is ALIVE!" });
};
