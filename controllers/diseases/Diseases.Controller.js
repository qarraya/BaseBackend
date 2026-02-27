

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});

/* ------------------ Get All ------------------ */
export const getAllChronicDiseases = async (req, res) => {
  try {
    const diseases = await prisma.chronicDiseases.findMany();
    res.status(200).json(diseases);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Get By Id ------------------ */
export const getChronicDiseaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const disease = await prisma.chronicDiseases.findUnique({
      where: { id: Number(id) },
    });

    if (!disease) {
      return res.status(404).json({ message: "Not found." });
    }

    res.status(200).json(disease);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Create ------------------ */
export const createChronicDisease = async (req, res) => {
  try {
    const { name, type } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        message: "Name and type are required.",
      });
    }

    const newDisease = await prisma.chronicDiseases.create({
      data: {
        name,
        type, // لازم تكون DISEASE أو ALLERGY
      },
    });

    res.status(201).json(newDisease);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Update ------------------ */
export const updateChronicDisease = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const existing = await prisma.chronicDiseases.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ message: "Not found." });
    }

    const updated = await prisma.chronicDiseases.update({
      where: { id: Number(id) },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

/* ------------------ Delete ------------------ */
export const deleteChronicDisease = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.chronicDiseases.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      message: "Deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};