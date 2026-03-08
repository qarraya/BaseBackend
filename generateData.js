import fs from 'fs';

const mealCategories = {
    BREAKFAST: [
        { name: "زيادي يوناني مع التوت", calories: 320, protein: 18, carbs: 42, fat: 8, servingSize: "250g", ingredients: ["200ml زيادي يوناني", "50g توت أزرق", "15g عسل", "10g لوز"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777" },
        { name: "شوفان بالحليب والموز", calories: 350, protein: 15, carbs: 55, fat: 7, servingSize: "300g", ingredients: ["50g شوفان", "200ml حليب خالي الدسم", "موزة متوسطة", "ملعقة صغيرة قرفة"], imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc" },
        { name: "بيض مسلوق مع خبز أسمر", calories: 280, protein: 20, carbs: 25, fat: 10, servingSize: "200g", ingredients: ["بيضة عدد 2", "شريحة خبز أسمر", "خيار وطماطم"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8" },
        { name: "أومليت بالخضار", calories: 310, protein: 22, carbs: 10, fat: 20, servingSize: "250g", ingredients: ["بيضة عدد 3", "فلفل رومي", "بصل", "سبانخ"], imageUrl: "https://images.unsplash.com/photo-1494597564530-811f0a97ac3d" },
        { name: "توست الأفوكادو", calories: 340, protein: 10, carbs: 30, fat: 22, servingSize: "180g", ingredients: ["شريحة خبز أسمر", "نصف أفوكادو", "رشة ملح وفلفل", "بذور الكتان"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8" }
    ],
    LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 420, protein: 38, carbs: 12, fat: 28, servingSize: "350g", ingredients: ["150g صدر دجاج مشوي", "خس", "خيار", "طماطم", "زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" },
        { name: "سلمون مشوي مع أرز بني", calories: 550, protein: 45, carbs: 40, fat: 25, servingSize: "400g", ingredients: ["150g سلمون", "100g أرز بني مطهو", "هليون مشوي"], imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288" },
        { name: "مكرونة قمح كامل بصلصة الطماطم", calories: 480, protein: 15, carbs: 70, fat: 12, servingSize: "350g", ingredients: ["80g مكرونة قمح كامل", "صلصة طماطم منزلية", "ريحان", "ملعقة زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1473093226795-af9932fe5856" },
        { name: "كفتة مشوية مع سلطة", calories: 450, protein: 35, carbs: 15, fat: 30, servingSize: "300g", ingredients: ["150g لحم مفروم قليل الدسم", "بقدونس وبصل", "سلطة عربية"], imageUrl: "https://images.unsplash.com/photo-1529006557870-17482574e48b" },
        { name: "عدس مطهو (شوربة أو مجدرة)", calories: 400, protein: 18, carbs: 60, fat: 10, servingSize: "400g", ingredients: ["كوب عدس", "بصل مشوح", "كمون", "خبز محمص قليل"], imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd" }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 480, protein: 42, carbs: 32, fat: 18, servingSize: "350g", ingredients: ["150g سمك", "كوسا", "جزر", "بروكلي مشوي"], imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288" },
        { name: "تونة مع سلطة خضراء", calories: 300, protein: 35, carbs: 10, fat: 12, servingSize: "250g", ingredients: ["علبة تونة بالماء", "خس", "نعناع", "ليمون"], imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" },
        { name: "صدر دجاج بالليمون والثوم", calories: 350, protein: 40, carbs: 15, fat: 15, servingSize: "300g", ingredients: ["150g صدر دجاج", "ثوم", "ليمون", "فاصوليا خضراء"], imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435" },
        { name: "جبنة قريش مع فواكه", calories: 250, protein: 25, carbs: 20, fat: 5, servingSize: "200g", ingredients: ["150g جبنة قريش", "قطع تفاح", "رشة قرفة"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777" },
        { name: "شوربة خضار دافئة", calories: 200, protein: 10, carbs: 30, fat: 5, servingSize: "400g", ingredients: ["بطاطس", "جزر", "كوسا", "كرفس", "مرق دجاج"], imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd" }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 180, protein: 6, carbs: 22, fat: 9, servingSize: "150g", ingredients: ["تفاحة متوسطة", "10 حبات لوز نيء"], imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af" },
        { name: "مكسرات مشكلة", calories: 200, protein: 7, carbs: 8, fat: 18, servingSize: "30g", ingredients: ["لوز", "جوز", "فستق"], imageUrl: "https://images.unsplash.com/photo-1536620453303-34e2c94d688c" },
        { name: "زبادي سادة", calories: 120, protein: 10, carbs: 12, fat: 3, servingSize: "150g", ingredients: ["زبادي قليل الدسم"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777" },
        { name: "تمر وجوز", calories: 220, protein: 4, carbs: 35, fat: 10, servingSize: "50g", ingredients: ["3 حبات تمر", "3 حبات جوز"], imageUrl: "https://images.unsplash.com/photo-1505253505346-6330b6e9273c" }
    ]
};

const days = [];
for (let i = 1; i <= 40; i++) {
    days.push({
        day: i,
        breakfast: mealCategories.BREAKFAST[i % mealCategories.BREAKFAST.length],
        lunch: mealCategories.LUNCH[i % mealCategories.LUNCH.length],
        dinner: mealCategories.DINNER[i % mealCategories.DINNER.length],
        snack: mealCategories.SNACK[i % mealCategories.SNACK.length]
    });
}

fs.writeFileSync('meals_data.json', JSON.stringify(days, null, 2));
console.log('Generated 40 days of meals in meals_data.json');
