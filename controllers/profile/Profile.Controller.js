import { PrismaClient } from "@prisma/client";
import { generateUserPlan } from "../../utils/planGenerator.js";

const prisma = new PrismaClient();

/* ------------------ Create / Upsert Profile ------------------ */
export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      gender,
      age,
      height,
      currentWeight,
      goal,
      activityLevel,
      chronicDiseasesIds,
    } = req.body;

    /* -------- Validation -------- */
    if (
      gender == null ||
      age == null ||
      height == null ||
      currentWeight == null ||
      goal == null ||
      activityLevel == null
    ) {
      return res.status(400).json({
        message: "Missing required profile fields",
      });
    }

    const commonData = {
      gender,
      age: Number(age),
      height: Number(height),
      currentWeight: Number(currentWeight),
      goal,
      activityLevel,
    };

    /* -------- Chronic Diseases Mapping -------- */
    const chronicDiseasesCreate =
      chronicDiseasesIds && Array.isArray(chronicDiseasesIds)
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

        ...(chronicDiseasesIds !== undefined && {
          chronicDiseases: {
            deleteMany: {},
            create: chronicDiseasesCreate,
          },
        }),
      },

      create: {
        userId,
        ...commonData,

        ...(chronicDiseasesIds && {
          chronicDiseases: {
            create: chronicDiseasesCreate,
          },
        }),
      },

      include: {
        chronicDiseases: {
          include: {
            chronicDisease: true,
          },
        },
      },
    });

    /* ------------------ Trigger Automatic Plan Generation ------------------ */
    try {
      await generateUserPlan(userId);
    } catch (planError) {
      console.error("Automatic Plan Generation Failed on Profile Create:", planError);
    }

    res.status(201).json({
      message: "Profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("CreateProfile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* ------------------ Get Profile by ID ------------------ */
export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { id: Number(id) },
      include: {
        chronicDiseases: {
          include: {
            chronicDisease: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error("GetProfile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* ------------------ Get My Profile ------------------ */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        chronicDiseases: {
          include: {
            chronicDisease: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error("GetMyProfile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------ Get All Profiles ------------------ */
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      include: {
        chronicDiseases: {
          include: {
            chronicDisease: true,
          },
        },
      },
    });

    res.status(200).json({ profiles });
  } catch (error) {
    console.error("GetAllProfiles Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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

    if (chronicDiseasesIds !== undefined) {
      updateData.chronicDiseases = {
        deleteMany: {},
        create:
          chronicDiseasesIds && Array.isArray(chronicDiseasesIds)
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

    /* ------------------ Trigger Automatic Plan Generation ------------------ */
    try {
      // Find userId for this profile to generate plan
      const profileToUpdate = await prisma.profile.findUnique({ where: { id: Number(id) } });
      if (profileToUpdate) {
        await generateUserPlan(profileToUpdate.userId);
      }
    } catch (planError) {
      console.error("Automatic Plan Generation Failed on Profile Update:", planError);
    }

    res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* ------------------ Delete Profile ------------------ */
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.profile.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("DeleteProfile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};