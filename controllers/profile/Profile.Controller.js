import prisma from "../../lib/prisma.js";
import { generateUserPlan } from "../../utils/planGenerator.js";
import { createSystemNotification } from "../../utils/notificationService.js";
import * as progressService from "../../services/progress.service.js";

/* ------------------ Create / Upsert Profile ------------------ */
export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      gender,
      age,
      height,
      currentWeight,
      targetWeight,
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
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
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

    const priorProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { currentWeight: true },
    });

    const newWeightVal = Number(currentWeight);

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

    /* ------------------ Progress tracking (weight) ------------------ */
    try {
      if (!priorProfile) {
        await progressService.recordWeightSnapshot(userId, newWeightVal, newWeightVal);
      } else if (priorProfile.currentWeight == null) {
        await progressService.recordWeightSnapshot(userId, newWeightVal, newWeightVal);
      } else {
        const prev = Number(priorProfile.currentWeight);
        if (newWeightVal !== prev) {
          await progressService.recordWeightSnapshot(userId, newWeightVal, prev);
        }
      }
    } catch (progressErr) {
      console.error("Progress record on profile upsert failed:", progressErr);
    }

    /* ------------------ Trigger Automatic Plan Generation ------------------ */
    try {
      await generateUserPlan(userId);
    } catch (planError) {
      console.error("Automatic Plan Generation Failed on Profile Create:", planError);
    }

    /* ------------------ Send Notification ------------------ */
    await createSystemNotification(
      userId,
      "تم حفظ بياناتك بنجاح! 📊",
      "تم الإرسال بنجاح! لقد تم تحديث بياناتك الصحية وتجهيز خطتك الغذائية.",
      "SUCCESS"
    );

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
    const profileId = Number(id);

    const {
      gender,
      age,
      height,
      currentWeight,
      targetWeight,
      goal,
      activityLevel,
      chronicDiseasesIds,
    } = req.body;

    const existing = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const updateData = {
      gender,
      age: age ? Number(age) : undefined,
      height: height ? Number(height) : undefined,
      currentWeight: currentWeight ? Number(currentWeight) : undefined,
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
      goal,
      activityLevel,
    };

    if (chronicDiseasesIds !== undefined) {
      updateData.chronicDiseases = {
        deleteMany: {},
        create:
          chronicDiseasesIds && Array.isArray(chronicDiseasesIds)
            ? chronicDiseasesIds.map((cid) => ({
              chronicDisease: {
                connect: { id: Number(cid) },
              },
            }))
            : [],
      };
    }

    if (currentWeight !== undefined && currentWeight !== null) {
      try {
        const newW = Number(currentWeight);
        if (!Number.isNaN(newW)) {
          if (existing.currentWeight == null) {
            await progressService.recordWeightSnapshot(existing.userId, newW, newW);
          } else {
            const oldW = Number(existing.currentWeight);
            if (!Number.isNaN(oldW) && newW !== oldW) {
              await progressService.recordWeightSnapshot(existing.userId, newW, oldW);
            }
          }
        }
      } catch (progressErr) {
        console.error("Progress record on profile update failed:", progressErr);
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: updateData,
      include: {
        chronicDiseases: {
          include: {
            chronicDisease: true,
          },
        },
      },
    });

    /* ------------------ Trigger Automatic Plan Generation & Notifications ------------------ */
    try {
      await generateUserPlan(existing.userId);

      const newWeight =
        currentWeight !== undefined && currentWeight !== null
          ? Number(currentWeight)
          : updatedProfile.currentWeight;
      const oldWeight = existing.currentWeight;
      const userGoal = goal ?? existing.goal;

        let achievementMessage = "لقد قمت بتحديث بياناتك بنجاح وتم إعادة ضبط خطتك بناءً على ذلك.";
        let achievementTitle = "تم تحديث بياناتك بنجاح! 📊";

        // Check for progress achievement
        if (newWeight && oldWeight) {
          if (userGoal === "LOSE" && newWeight < oldWeight) {
            achievementTitle = "إنجاز رائع! نزل وزنك 🎉";
            achievementMessage = `لقد خسرت ${Math.abs(oldWeight - newWeight).toFixed(1)} كغم من وزنك! استمر في الالتزام بخطتك للوصول لهدفك. 💪`;
          } else if (userGoal === "GAIN" && newWeight > oldWeight) {
            achievementTitle = "إنجاز كفؤ! زاد وزنك 💪";
            achievementMessage = `لقد نجحت في زيادة ${Math.abs(newWeight - oldWeight).toFixed(1)} كغم! أنت تقترب من هدفك في التضخيم. 🔥`;
          }
        }

      await createSystemNotification(
        existing.userId,
        achievementTitle,
        achievementMessage,
        "SUCCESS"
      );
    } catch (planError) {
      console.error("Automatic Plan Generation/Notification Failed on Profile Update:", planError);
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

/* ------------------ Update My Profile (Dynamic) ------------------ */
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From Token

    const {
      gender,
      age,
      height,
      currentWeight,
      targetWeight,
      goal,
      activityLevel,
      chronicDiseasesIds,
    } = req.body;

    // Find the profile for this user
    const existing = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Reuse the update logic (shared with updateProfile)
    const updateData = {
      gender,
      age: age ? Number(age) : undefined,
      height: height ? Number(height) : undefined,
      currentWeight: currentWeight ? Number(currentWeight) : undefined,
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
      goal,
      activityLevel,
    };

    if (chronicDiseasesIds !== undefined) {
      updateData.chronicDiseases = {
        deleteMany: {},
        create: (chronicDiseasesIds && Array.isArray(chronicDiseasesIds))
          ? chronicDiseasesIds.map((cid) => ({
            chronicDisease: { connect: { id: Number(cid) } },
          }))
          : [],
      };
    }

    // Progress record logic
    if (currentWeight !== undefined && currentWeight !== null) {
      try {
        const newW = Number(currentWeight);
        if (!Number.isNaN(newW)) {
          if (existing.currentWeight == null) {
            await progressService.recordWeightSnapshot(userId, newW, newW);
          } else {
            const oldW = Number(existing.currentWeight);
            if (!Number.isNaN(oldW) && newW !== oldW) {
              await progressService.recordWeightSnapshot(userId, newW, oldW);
            }
          }
        }
      } catch (progressErr) {
        console.error("Progress record on profile update failed:", progressErr);
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        chronicDiseases: {
          include: { chronicDisease: true },
        },
      },
    });

    // Notify & Regenerate Plan
    try {
      await generateUserPlan(userId);

      const newWeight = currentWeight !== undefined && currentWeight !== null ? Number(currentWeight) : updatedProfile.currentWeight;
      const oldWeight = existing.currentWeight;
      const userGoal = goal ?? existing.goal;

      let achievementMessage = "لقد قمت بتحديث بياناتك بنجاح وتم إعادة ضبط خطتك بناءً على ذلك.";
      let achievementTitle = "تم تحديث بياناتك بنجاح! 📊";

      if (newWeight && oldWeight) {
        if (userGoal === "LOSE" && newWeight < oldWeight) {
          achievementTitle = "إنجاز رائع! نزل وزنك 🎉";
          achievementMessage = `لقد خسرت ${Math.abs(oldWeight - newWeight).toFixed(1)} كغم من وزنك! استمر في الالتزام بخطتك للوصول لهدفك. 💪`;
        } else if (userGoal === "GAIN" && newWeight > oldWeight) {
          achievementTitle = "إنجاز كفؤ! زاد وزنك 💪";
          achievementMessage = `لقد نجحت في زيادة ${Math.abs(newWeight - oldWeight).toFixed(1)} كغم! أنت تقترب من هدفك في التضخيم. 🔥`;
        }
      }

      await createSystemNotification(userId, achievementTitle, achievementMessage, "SUCCESS");
    } catch (err) {
      console.error("Post-update tasks failed:", err);
    }

    res.status(200).json({
      message: "Profile updated successfully (me)",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("updateMyProfile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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