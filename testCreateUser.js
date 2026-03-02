import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting test script...");

    const hashedPassword = await bcrypt.hash("455884", 10);

    try {
        const newUser = await prisma.user.create({
            data: {
                username: "test_user_from_script",
                email: "test_script@example.com",
                password: hashedPassword,
                gender: "FEMALE",
                currentWeight: 70,
                activityLevel: "LIGHT",
                height: 160,
                goal: "MAINTAIN",
                isVerified: true,
                chronicDiseases: {
                    create: [{
                        chronicDiseases: {
                            connect: { id: 1 }, // الربط مع "السكري"
                        },
                    }],
                },
            },
            include: {
                chronicDiseases: true,
            },
        });
        console.log("Success! User created:", newUser.id);
        console.dir(newUser.chronicDiseases, { depth: null });
    } catch (error) {
        console.error("Test Script Error:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
