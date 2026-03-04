
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ------------------ Create Profile ------------------ */
export const createProfile = async (req, res) => {
  try {
    const {
      userId,
      email,
      gender,
      age,
      height,
      currentWeight,
      goal,
      activityLevel,
      chronicDiseasesIds,
    } = req.body;

    let targetUserId = userId;

    if (!targetUserId && email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (user) {
        targetUserId = user.id;
      } else {
        return res.status(404).json({ message: "User with this email not found" });
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ message: "userId or email is required to create a profile" });
    }

    const newProfile = await prisma.profile.create({
      data: {
        userId: targetUserId,
        gender,
        age: age ? Number(age) : null,
        height: height ? Number(height) : null,
        currentWeight: currentWeight ? Number(currentWeight) : null,
        goal,
        activityLevel,
        chronicDiseases: {
          create: (chronicDiseasesIds && Array.isArray(chronicDiseasesIds))
            ? chronicDiseasesIds.map((id) => ({
              chronicDisease: {
                connect: { id: Number(id) },
              },
            }))
            : [],
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
      message: "Profile created successfully",
      profile: newProfile,
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
    const data = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { id: Number(id) },
      data: {
        ...data,
        age: data.age ? Number(data.age) : undefined,
        height: data.height ? Number(data.height) : undefined,
        currentWeight: data.currentWeight ? Number(data.currentWeight) : undefined,
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