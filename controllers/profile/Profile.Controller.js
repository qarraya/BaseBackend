
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ------------------ Create Profile ------------------ */
export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Use authenticated userId
    const {
      gender,
      age,
      height,
      currentWeight,
      goal,
      activityLevel,
      chronicDiseasesIds,
    } = req.body;

    const commonData = {
      gender,
      age: age ? Number(age) : null,
      height: height ? Number(height) : null,
      currentWeight: currentWeight ? Number(currentWeight) : null,
      goal,
      activityLevel,
    };

    const chronicDiseasesCreate = (chronicDiseasesIds && Array.isArray(chronicDiseasesIds))
      ? chronicDiseasesIds.map((id) => ({
        chronicDisease: {
          connect: { id: Number(id) },
        },
      }))
      : [];

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...commonData,
        chronicDiseases: {
          deleteMany: {}, // Clear existing only on update
          create: chronicDiseasesCreate,
        },
      },
      create: {
        userId,
        ...commonData,
        chronicDiseases: {
          create: chronicDiseasesCreate, // No deleteMany on create
        },
      },
      include: {
        chronicDiseases: {
          include: {
            chronicDisease: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("CreateProfile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------ Get Profile by ID ------------------ */
export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { id: Number(id) },
    });

    if (!profile)
      return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({ profile });
  } catch (error) {
    console.error("GetProfile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------ Get All Profiles ------------------ */
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany();
    res.status(200).json({ profiles });
  } catch (error) {
    console.error("GetAllProfiles Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------ Update Profile ------------------ */
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      gender,
      age,
      height,
      currentWeight,
      goal,
      activityLevel,
      chronicDiseasesIds,
    } = req.body;

    const updateData = {
      gender,
      age: age ? Number(age) : undefined,
      height: height ? Number(height) : undefined,
      currentWeight: currentWeight ? Number(currentWeight) : undefined,
      goal,
      activityLevel,
    };

    // Only update chronicDiseases if the field is provided in the request
    if (chronicDiseasesIds !== undefined) {
      updateData.chronicDiseases = {
        deleteMany: {}, // Clear existing associations
        create: (chronicDiseasesIds && Array.isArray(chronicDiseasesIds))
          ? chronicDiseasesIds.map((id) => ({
            chronicDisease: {
              connect: { id: Number(id) },
            },
          }))
          : [],
      };
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        chronicDiseases: {
          include: {
            chronicDisease: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------ Delete Profile ------------------ */
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.profile.delete({ where: { id: Number(id) } });

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("DeleteProfile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};