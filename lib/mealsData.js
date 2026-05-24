import "../loadEnv.js";
import { PrismaClient } from "@prisma/client";
import { kcalFromMacros } from "../utils/macros.js";

const prisma = new PrismaClient();

// calories: قيمة مرجعية (4P + 4C + 9F)؛ ما يُحفظ في DB يُشتق دائماً من الماكروز عبر kcalFromMacros
const mealCategories = {
    BREAKFAST: [
        { name: "زبادي يوناني مع التوت", calories: 221, portion: "200غ", fats: 8.3, proteins: 12.5, carbs: 24, ingredients: ["150غ زبادي يوناني", "50غ توت", "ملعقة عسل"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: [] },
        { name: "شوفان بالحليب والموز", calories: 422, portion: "250غ", fats: 11.3, proteins: 14, carbs: 66, ingredients: ["نصف كوب شوفان", "كوب حليب", "موزة مقطعة"], imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", incompatibleDiseases: ["السكري"] },
        { name: "بيض مسلوق مع خبز أسمر", calories: 296, portion: "150غ", fats: 12, proteins: 18, carbs: 29, ingredients: ["حبتين بيض مسلوق", "شريحتين خبز أسمر"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "أومليت بالخضار", calories: 288, portion: "200غ", fats: 24, proteins: 13, carbs: 5, ingredients: ["حبتين بيض", "ربع كوب خضار مشكلة", "ملعقة زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1588580261949-f17eacb905c9?q=80&w=387&auto=format&fit=crop", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "توست الأفوكادو", calories: 236, portion: "150غ", fats: 12, proteins: 5, carbs: 27, ingredients: ["شريحة خبز توست", "نصف حبة أفوكادو مهروسة", "رشة ملح وفلفل"], imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=1200", incompatibleDiseases: [] },
        {
            name: "بان كيك الشوفان الصحي",
            calories: 300,
            portion: "200غ",
            fats: 8,
            proteins: 12,
            carbs: 45,
            ingredients: ["نصف كوب شوفان مطحون", "بيضة واحدة", "نصف موزة مهروسة", "رشة قرفة"],
            imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80",
            incompatibleDiseases: []

        },
        {
            name: "شكشوكة بالخضار",
            calories: 308,
            portion: "250غ",
            fats: 20,
            proteins: 14,
            carbs: 18,
            ingredients: ["بيضتان", "طماطم وبصل", "فليفلة خضراء", "ملعقة زيت زيتون", "شريحة خبز أسمر"],
            imageUrl: "https://images.unsplash.com/photo-1582492710145-d723e0a219f8?q=80&w=749&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            incompatibleDiseases: ["ارتفاع الكوليسترول"]
        },
        {
            name: "سموذي أخضر",
            calories: 198,
            portion: "300مل",
            fats: 2,
            proteins: 5,
            carbs: 40,
            ingredients: ["كوب سبانخ", "نصف تفاحة خضراء", "ربع حبة أفوكادو", "كوب ماء أو حليب لوز"],
            imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=600&q=80",
            incompatibleDiseases: []
        },
        {
            name: "بودنج بذور الشيا",
            calories: 262,
            portion: "200غ",
            fats: 14,
            proteins: 8,
            carbs: 26,
            ingredients: ["ملعقتان بذور شيا", "نصف كوب حليب", "قطع فراولة", "قطرة فانيليا"],
            imageUrl: "https://images.unsplash.com/photo-1651256785597-4efe48fd71f9?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            incompatibleDiseases: []
        },
        {
            name: "فول مدمس بملعقة زيت زيتون",
            calories: 359,
            portion: "250غ",
            fats: 15,
            proteins: 16,
            carbs: 40,
            ingredients: ["كوب فول مدمس", "ملعقة زيت زيتون", "طماطم وبصل", "ربع رغيف خبز أسمر"],
            imageUrl: "https://mediaaws-live.almasryalyoum.com/AMAYLivePictures/portalimages/news/large/2021/04/18/1516705_0.jpeg",
            incompatibleDiseases: ["القولون العصبي"]
        },
        {
            name: "جبنة حلوم مشوية مع خضار",
            calories: 346,
            portion: "200غ",
            fats: 26,
            proteins: 18,
            carbs: 10,
            ingredients: ["3 شرائح جبن حلوم", "طماطم كرزية", "خيار", "نعناع"],
            imageUrl: "https://images.unsplash.com/photo-1723476647983-cc0e6311104a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fCVEOCVBQyVEOCVBOCVEOSU4NiVEOCVBOSUyMCVEOCVBRCVEOSU4NCVEOSU4OCVEOSU4NSUyMCVEOSU4NSVEOCVCNCVEOSU4OCVEOSU4QSVEOCVBOSUyMCVEOSU4NSVEOCVCOSUyMCVEOCVBRSVEOCVCNiVEOCVBNyVEOCVCMXxlbnwwfHwwfHx8MA%3D%3D",
            incompatibleDiseases: ["ارتفاع ضغط الدم"]
        },
        {
            name: "ساندويتش ديك رومي",
            calories: 279,
            portion: "200غ",
            fats: 7,
            proteins: 22,
            carbs: 32,
            ingredients: ["شريحتان خبز توست أسمر", "شريحتا حبش مدخن", "خس وطماطم", "مسحة خردل"],
            imageUrl: "https://plus.unsplash.com/premium_photo-1664472757995-3260cd26e477?q=80&w=761&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            incompatibleDiseases: []
        },
        {
            name: "زبدة الفول السوداني مع موز وتوست أسمر",
            calories: 352,
            portion: "150غ",
            fats: 16,
            proteins: 10,
            carbs: 42,
            ingredients: ["شريحة توست أسمر", "ملعقة زبدة فول سوداني", "نصف موزة مقطعة"],
            imageUrl: "https://images.unsplash.com/photo-1742883836775-16fddfaa9af3?q=80&w=435&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            incompatibleDiseases: ["حساسية المكسرات"]
        },
        {
            name: "رقائق نخالة مع حليب",
            calories: 223,
            portion: "200غ",
            fats: 3,
            proteins: 9,
            carbs: 40,
            ingredients: ["كوب رقائق نخالة", "كوب حليب خالي الدسم"],
            imageUrl: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?q=80&w=785&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            incompatibleDiseases: ["حساسية اللاكتوز"]
        },
        {
            name: "بيض مخفوق مع فطر وسبانخ",
            calories: 246,
            portion: "200غ",
            fats: 18,
            proteins: 15,
            carbs: 6,
            ingredients: ["بيضتان", "نصف كوب فطر", "كوب سبانخ", "ملعقة زيت صغيرة"],
            imageUrl: "https://images.unsplash.com/photo-1692296979796-c1a254126640?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8RWdnJTIwc3BpbmFjaCUyMG11c2hyb29tfGVufDB8fDB8fHww",
            incompatibleDiseases: ["ارتفاع الكوليسترول"]
        }

    ],
LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 344, portion: "300غ", fats: 20, proteins: 32, carbs: 9, ingredients: ["150غ صدر دجاج مشوي", "كوبين خس", "طماطم وخيار", "ملعقتين صلصة خل وزيت"], imageUrl: "https://www.greatgrubdelicioustreats.com/wp-content/uploads/2022/05/Grilled_Chicken_Salad_13.jpg", incompatibleDiseases: [] },
        { name: "سلمون مشوي مع أرز بني", calories: 540, portion: "350غ", fats: 20, proteins: 40, carbs: 50, ingredients: ["150غ فيليه سلمون", "كوب أرز بني مسلوق", "نصف كوب خضار سوتيه"], imageUrl: "https://shamlola.s3.amazonaws.com/Shamlola_Images/5/src/c6b35a1040af8d023392c6f9a328b2d43e2b8f80.jpg", incompatibleDiseases: [] },
        { name: "معكرونة قمح كامل بصلصة الطماطم", calories: 305, portion: "300غ", fats: 4.5, proteins: 12, carbs: 54, ingredients: ["كوب مكرونة مسلوقة", "نصف كوب صلصة طماطم طبيعية", "ملعقة جبن مبشور"], imageUrl: "https://fortheloveofcooking.net/wp-content/uploads/2012/04/DSC_6314-2-scaled.jpg", incompatibleDiseases: ["السكري"] },
        { name: "كفتة مشوية مع سلطة", calories: 334, portion: "250غ", fats: 21.5, proteins: 26.5, carbs: 8.5, ingredients: ["150غ لحم مفروم مشوي", "بصل وبقدونس", "سلطة تبولة صغيرة"], imageUrl: "https://images.themodernproper.com/production/posts/2020/Beef-Kofta-12.jpg?w=1200&h=1200&q=60&fm=jpg&fit=crop&dm=1683266321&s=51d6a810051f11ed9a22ea54dd0bba1f", incompatibleDiseases: ["أمراض القلب", "ارتفاع ضغط الدم"] },
        { name: "مجدرة", calories: 397, portion: "350غ", fats: 5, proteins: 18, carbs: 70, ingredients: ["كوب عدس مطبوخ", "نصف كوب أرز مسلوق", "بصل مقلي", "بهارات"], imageUrl: "https://static01.nyt.com/images/2025/05/15/multimedia/ND-Mujadara-kzgm/ND-Mujadara-kzgm-mediumSquareAt3X.jpg", incompatibleDiseases: [] },
        { name: "كبسة دجاج صحية", calories: 486, portion: "350غ", fats: 14, proteins: 35, carbs: 55, ingredients: ["150غ صدر دجاج", "كوب أرز بسمتي مطبوخ", "جزر وبازلاء", "بهارات كبسة"], imageUrl: "https://images.unsplash.com/photo-1593787614841-5d53fca8a33d?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", incompatibleDiseases: [] },
        { name: "شريحة لحم بقر مشوية مع بطاطا حلوة", calories: 526, portion: "350غ", fats: 22, proteins: 40, carbs: 42, ingredients: ["150غ ستيك بقري", "حبة بطاطا حلوة مشوية", "بروكلي مسلوق"], imageUrl: "https://images.unsplash.com/photo-1609222094635-05954e29229a?q=80&w=435&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", incompatibleDiseases: ["أمراض القلب"] },
        { name: "سمك فيليه مشوي مع كينوا", calories: 448, portion: "300غ", fats: 16, proteins: 38, carbs: 38, ingredients: ["150غ سمك فيليه أبيض", "نصف كوب كينوا مطبوخة", "سلطة خضراء بليمون وزيت"], imageUrl: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RmlzaCUyMGFuZCUyMHF1aW5vYXxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "سلطة تونة بالذرة والفاصوليا", calories: 330, portion: "300غ", fats: 10, proteins: 28, carbs: 32, ingredients: ["علبة تونة بالماء", "ربع كوب ذرة", "ربع كوب فاصوليا حمراء", "خس وليمون"], imageUrl: "https://images.unsplash.com/photo-1680933613514-4cbbdc878ad9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fFR1bmElMjBzYWxhZCUyMHdpdGglMjBjb3JuJTIwYW5kJTIwcmVkJTIwYmVhbnN8ZW58MHx8MHx8fDA%3D", incompatibleDiseases: [] },
        { name: "شيش طاووق مع حمص وسلطة", calories: 414, portion: "350غ", fats: 18, proteins: 38, carbs: 25, ingredients: ["أسياخ دجاج مشوي", "ملعقتان حمص", "سلطة خضراء", "ربع رغيف خبز عربي"], imageUrl: "https://images.unsplash.com/photo-1573126161855-f9633aa8a9f0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fENoaWNrZW4lMjBzb3V2bGFraSUyMHdpdGglMjBodW1tdXMlMjBhbmQlMjBzYWxhZHxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "شوربة عدس مع خبز محمص", calories: 344, portion: "350مل", fats: 8, proteins: 18, carbs: 50, ingredients: ["كوب شوربة عدس", "قطعة خبز أسمر محمص", "بصل وليمون"], imageUrl: "https://images.unsplash.com/photo-1718801594192-61189a49fc3c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8JUQ4JUI0JUQ5JTg4JUQ4JUIxJUQ4JUE4JUQ4JUE5JTIwJUQ4JUI5JUQ4JUFGJUQ4JUIzJTIwJUQ5JTg1JUQ4JUI5JTIwJUQ4JUFFJUQ4JUE4JUQ4JUIyJTIwJUQ5JTg1JUQ4JUFEJUQ5JTg1JUQ4JUI1fGVufDB8fDB8fHww", incompatibleDiseases: [] },
        { name: "مكرونة بالجمبري وصلصة بيضاء خفيفة", calories: 463, portion: "300غ", fats: 15, proteins: 30, carbs: 52, ingredients: ["كوب مكرونة مسلوقة", "100غ جمبري", "صلصة حليب وثوم خفيفة"], imageUrl: "https://images.unsplash.com/photo-1677681483419-e18aa1376db7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8SGVhbHRoeSUyMHNocmltcCUyMHBhc3RhJTIwd2hpdGUlMjBzYXVjZXxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "صينية خضار بالفرن مع صدر دجاج", calories: 388, portion: "400غ", fats: 12, proteins: 35, carbs: 35, ingredients: ["150غ دجاج", "كوسا، باذنجان، جزر", "ملعقة زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1581347939856-cbeb758b4c86?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fEJha2VkJTIwY2hpY2tlbiUyMGJyZWFzdCUyMHdpdGglMjByb2FzdGVkJTIwdmVnZXRhYmxlc3xlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "فاهيتا دجاج بخبز التورتيلا الأسمر", calories: 426, portion: "250غ", fats: 14, proteins: 30, carbs: 45, ingredients: ["100غ دجاج", "فليفلة ملونة وبصل", "خبز تورتيلا أسمر", "ملعقة زبادي"], imageUrl: "https://images.unsplash.com/photo-1666493243529-b3b81e7e0a1b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8SGVhbHRoeSUyMGNoaWNrZW4lMjBmYWppdGElMjB3cmFwfGVufDB8fDB8fHww", incompatibleDiseases: [] },
        { name: "كاري الحمص مع أرز بسمتي", calories: 452, portion: "350غ", fats: 16, proteins: 15, carbs: 62, ingredients: ["كوب حمص مطبوخ بالبهارات", "نصف كوب حليب جوز هند لايت", "كوب أرز مسلوق"], imageUrl: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Q2hpY2twZWElMjBjdXJyeSUyMHdpdGglMjBiYXNtYXRpJTIwcmljZXxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 402, portion: "300غ", fats: 18, proteins: 35, carbs: 25, ingredients: ["شريحة سلمون", "كوب بروكلي وجزر", "ملعقة زيتون"], imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=80", incompatibleDiseases: [] },
        { name: "تونة مع سلطة خضراء", calories: 262, portion: "250غ", fats: 10, proteins: 28, carbs: 15, ingredients: ["علبة تونة مصفاة من الزيت", "خس وجرجير", "عصير ليمون"], imageUrl: "https://img.youm7.com/ArticleImgs/2017/6/23/84512-%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%B9%D9%85%D9%84-%D8%B3%D9%84%D8%B7%D8%A9%D8%A7-%D9%84%D8%AA%D9%88%D9%86%D8%A91.jpeg", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "صدر دجاج بالليمون والثوم", calories: 252, portion: "200غ", fats: 8, proteins: 35, carbs: 10, ingredients: ["150غ صدر دجاج", "عصير حبة ليمون", "حبتين ثوم مهروس"], imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435", incompatibleDiseases: [] },
        { name: "جبنة قريش مع فواكه", calories: 225, portion: "200غ", fats: 5, proteins: 20, carbs: 25, ingredients: ["كوب جبنة قريش", "نصف تفاحة أو بطيخ", "رشة جوز"], imageUrl: "https://files.catbox.moe/v73qv9.png", incompatibleDiseases: ["أمراض الكلى المزمنة"] },
        { name: "شوربة خضار دافئة", calories: 185, portion: "300غ", fats: 5, proteins: 5, carbs: 30, ingredients: ["كوب مرق", "جزر بطاطس كوسا", "ملح وفلفل"], imageUrl: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=1200&auto=format&fit=crop", incompatibleDiseases: [] },
        { name: "سلطة يونانية بجبنة الفيتا", calories: 286, portion: "300غ", fats: 22, proteins: 10, carbs: 12, ingredients: ["طماطم وخيار وزيتون", "50غ جبن فيتا", "ملعقة زيت زيتون"], imageUrl: "https://plus.unsplash.com/premium_photo-1690561082636-06237f98bfab?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8R3JlZWslMjBzYWxhZCUyMHdpdGglMjBmZXRhfGVufDB8fDB8fHww", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "دجاج مشوي مع كوسا وجزر", calories: 310, portion: "250غ", fats: 10, proteins: 35, carbs: 20, ingredients: ["150غ دجاج مشوي", "كوسا وجزر مسلوق", "رشة فلفل أسود"], imageUrl: "https://images.unsplash.com/photo-1581859884752-33b181880074?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Um9hc3RlZCUyMGNoaWNrZW4lMjB3aXRoJTIwdmVnZXRhYmxlc3xlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "راب فلافل مخبوزة بالفرن", calories: 348, portion: "200غ", fats: 12, proteins: 15, carbs: 45, ingredients: ["3 حبات فلافل مشوية", "خبز صاج أسمر", "طحينة وسلطة"], imageUrl: "https://plus.unsplash.com/premium_photo-1663853051745-d55f8871cf90?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", incompatibleDiseases: [] },
        { name: "شوربة دجاج بالخضار", calories: 222, portion: "350مل", fats: 6, proteins: 20, carbs: 22, ingredients: ["مرق دجاج", "قطع دجاج صغيرة", "ذرة وجزر", "بقدونس"], imageUrl: "https://plus.unsplash.com/premium_photo-1664472752075-d5b2b3de0a88?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8JUQ4JUI0JUQ5JTg4JUQ4JUIxJUQ4JUE4JUQ4JUE5JTIwJUQ4JUFGJUQ4JUFDJUQ4JUE3JUQ4JUFDJTIwJUQ4JUE4JUQ4JUE3JUQ5JTg0JUQ4JUFFJUQ4JUI2JUQ4JUE3JUQ4JUIxfGVufDB8fDB8fHww", incompatibleDiseases: [] },
        { name: "بطاطا مشوية محشوة بالجبن والخضار", calories: 358, portion: "250غ", fats: 14, proteins: 12, carbs: 46, ingredients: ["حبة بطاطا مشوية", "ملعقتان جبن موزاريلا", "بروكلي مقطع"], imageUrl: "https://images.unsplash.com/photo-1619096802052-fa98408d6dc7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fExvYWRlZCUyMGJha2VkJTIwcG90YXRvfGVufDB8fDB8fHww", incompatibleDiseases: ["السكري"] },
        { name: "سلطة كينوا بالرمان والبقدونس", calories: 298, portion: "250غ", fats: 10, proteins: 8, carbs: 44, ingredients: ["نصف كوب كينوا", "ربع كوب رمان", "بقدونس وليمون", "ملعقة زيت زيتون"], imageUrl: "https://plus.unsplash.com/premium_photo-1704989937441-68b6536e6cf4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8UXVpbm9hJTIwc2FsYWQlMjB3aXRoJTIwcG9tZWdyYW5hdGV8ZW58MHx8MHx8fDA%3D", incompatibleDiseases: [] },
        { name: "لحم مفروم مع باذنجان مشوي", calories: 388, portion: "300غ", fats: 20, proteins: 30, carbs: 22, ingredients: ["100غ لحم بقري مفروم", "باذنجان مشوي بالفرن", "صلصة طماطم طبيعية"], imageUrl: "https://images.unsplash.com/photo-1621852003739-b54d49ff3431?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8RWdncGxhbnQlMjB3aXRoJTIwbWluY2VkJTIwbWVhdHxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "بيضتان مسلوقتان مع سلطة جرجير", calories: 210, portion: "200غ", fats: 14, proteins: 15, carbs: 6, ingredients: ["بيضتان مسلوقتان", "جرجير وطماطم كرزية", "عصير ليمون"], imageUrl: "https://images.unsplash.com/photo-1738257220087-e4e5e4f6b95a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fEJvaWxlZCUyMGVnZ3MlMjB3aXRoJTIwYXJ1Z3VsYSUyMHNhbGFkfGVufDB8fDB8fHww", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "شاورما دجاج صحية", calories: 360, portion: "200غ", fats: 12, proteins: 28, carbs: 35, ingredients: ["100غ دجاج متبل ببهارات شاورما", "خبز أسمر رقيق", "سلطة ومخلل"], imageUrl: "https://images.unsplash.com/photo-1676300187013-7540d4e9440d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8SGVhbHRoeSUyMGNoaWNrZW4lMjBzaGF3YXJtYXxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "برجر لحم صحي بخبز القمح الكامل", calories: 430, portion: "250غ", fats: 18, proteins: 32, carbs: 35, ingredients: ["قطعة برجر لحم مشوي", "خبز برجر أسمر", "شريحة جبن لايت", "خس وطماطم"], imageUrl: "https://images.unsplash.com/photo-1508736793122-f516e3ba5569?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8SGVhbHRoeSUyMGJlZWYlMjBidXJnZXIlMjB3aG9sZSUyMHdoZWF0JTIwYnVufGVufDB8fDB8fHww", incompatibleDiseases: ["أمراض القلب"] }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 193, portion: "150غ", fats: 9, proteins: 6, carbs: 22, ingredients: ["تفاحة متوسطة مقطعة", "20 غ لوز ني", "5غ عسل (اختياري)", "رشة قرفة"], imageUrl: "https://res.cloudinary.com/duhmfxmvq/image/upload/f_auto,q_auto/Gemini_Generated_Image_jmxes3jmxes3jmxe_mlj8rb", incompatibleDiseases: [] },
        { name: "مكسرات مشكلة", calories: 222, portion: "30غ", fats: 18, proteins: 7, carbs: 8, ingredients: ["30غ مكسرات غير مملحة (كاجو، جوز، لوز)"], imageUrl: "https://i0.wp.com/images-prod.healthline.com/hlcmsresource/images/mixed-nuts-in-bowl.jpg?w=1155&h=1528", incompatibleDiseases: [] },
        { name: "زبادي سادة", calories: 108, portion: "150غ", fats: 4, proteins: 8, carbs: 10, ingredients: ["علبة زبادي 150غ"], imageUrl: "https://ikneadtoeat.com/wp-content/uploads/2022/11/cropped-salty-lassi-5-1.jpg", incompatibleDiseases: [] },
        { name: "تمر وجوز", calories: 242, portion: "50غ", fats: 10, proteins: 3, carbs: 35, ingredients: ["3 حبات تمر", "نصف كوب جوز"], imageUrl: "https://www.israelcart.com/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2023/08/Davidpliner_beautifully_arranged_platter_of_Nut-Stuffed_Dates_w_70fede07-60be-499d-87d5-98b44de24b1f-1.png.webp", incompatibleDiseases: ["السكري"] },
        { name: "شرائح جزر وخيار مع حمص", calories: 154, portion: "150غ", fats: 6, proteins: 5, carbs: 20, ingredients: ["خيار وجزر مقطع", "ملعقتان حمص"], imageUrl: "https://images.unsplash.com/photo-1644946763226-22c60fcb6635?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8SHVtbXVzJTIwZGlwJTIwd2l0aCUyMGNhcnJvdHMlMjBhbmQlMjBjdWN1bWJlcnxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "قطعة شوكولاتة داكنة", calories: 120, portion: "20غ", fats: 8, proteins: 2, carbs: 10, ingredients: ["مكعبان شوكولاتة داكنة 70% كاكاو"], imageUrl: "https://images.unsplash.com/photo-1589552950457-90dd56ef4413?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RGFyayUyMGNob2NvbGF0ZSUyMHBpZWNlc3xlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "كعك الأرز مع زبدة لوز", calories: 185, portion: "50غ", fats: 9, proteins: 6, carbs: 20, ingredients: ["حبتان كعك أرز", "ملعقة زبدة لوز"], imageUrl: "https://images.unsplash.com/photo-1629273897606-3b0aad3139d2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fFJpY2UlMjBjYWtlcyUyMHdpdGglMjBhbG1vbmQlMjBidXR0ZXJ8ZW58MHx8MHx8fDA%3D", incompatibleDiseases: ["حساسية المكسرات"] },
        { name: "عصير برتقال طبيعي", calories: 112, portion: "250مل", fats: 0, proteins: 2, carbs: 26, ingredients: ["عصير برتقال معصور طازج بدون سكر"], imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80", incompatibleDiseases: ["السكري"] },
        { name: "زبدية شوفان صغيرة", calories: 155, portion: "100غ", fats: 3, proteins: 5, carbs: 27, ingredients: ["ربع كوب شوفان", "نصف كوب ماء أو حليب دافئ"], imageUrl: "https://images.unsplash.com/photo-1728078466146-793501657a71?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fEhlYWx0aHklMjBvYXRzJTIwYm93bHxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "شرائح بطيخ مع نعناع", calories: 92, portion: "250غ", fats: 0, proteins: 2, carbs: 21, ingredients: ["كوبان بطيخ مقطع", "أوراق نعناع طازجة"], imageUrl: "https://images.unsplash.com/photo-1726802696808-566c2d1c5912?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8V2F0ZXJtZWxvbiUyMGFuZCUyMG1pbnR8ZW58MHx8MHx8fDA%3D", incompatibleDiseases: ["السكري"] },
        { name: "كوب فوشار محضر بالهواء", calories: 93, portion: "30غ", fats: 1, proteins: 3, carbs: 18, ingredients: ["فوشار خالي من الزيت", "رشة ملح خفيفة"], imageUrl: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80", incompatibleDiseases: [] },
        { name: "نصف حبة جريب فروت", calories: 56, portion: "150غ", fats: 0, proteins: 1, carbs: 13, ingredients: ["نصف حبة جريب فروت طازجة"], imageUrl: "https://images.unsplash.com/photo-1550442137-f77eed6380d5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fEdyYXBlZnJ1aXQlMjBmcnVpdHxlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "تمر محشي بزبدة الفول السوداني", calories: 200, portion: "50غ", fats: 8, proteins: 4, carbs: 28, ingredients: ["حبتان تمر", "ملعقة صغيرة زبدة فول سوداني"], imageUrl: "https://images.unsplash.com/photo-1766068581429-8499f1afdd50?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8UGVhbnV0JTIwYnV0dGVyJTIwc3R1ZmZlZCUyMGRhdGVzfGVufDB8fDB8fHww", incompatibleDiseases: ["السكري", "حساسية المكسرات"] },
        { name: "كرات الطاقة بالشوفان والتمر", calories: 211, portion: "50غ", fats: 7, proteins: 5, carbs: 32, ingredients: ["حبتان كرات طاقة محضرة منزلياً"], imageUrl: "https://images.unsplash.com/photo-1680902005886-0f5e39372479?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fERhdGUlMjBlbmVyZ3klMjBiYWxsc3xlbnwwfHwwfHx8MA%3D%3D", incompatibleDiseases: [] },
        { name: "عنب وقطع جبن شيدر", calories: 182, portion: "100غ", fats: 10, proteins: 8, carbs: 15, ingredients: ["نصف كوب عنب", "قطعتان صغيرتان جبن شيدر"], imageUrl: "https://images.unsplash.com/photo-1572306771389-90f47478113f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fEdyYXBlcyUyMGFuZCUyMGNoZWRkYXIlMjBjaGVlc2V8ZW58MHx8MHx8fDA%3D", incompatibleDiseases: [] }

    ]
};

async function main() {
    // لا نستخدم deleteMany: حذف الوجبات يزيل PlanMeal (Cascade) ويكسر خطط المستخدمين.
    // التحديث يتم بمطابقة الاسم: create أو update فقط.
    console.log("Seeding meals (upsert by name)...");

    // 1- Fetch all diseases to get their IDs
    const allDiseases = await prisma.chronicDiseases.findMany();
    const diseaseMap = {};
    allDiseases.forEach(d => {
        diseaseMap[d.name] = d.id;
    });

    for (const [time, meals] of Object.entries(mealCategories)) {
        for (const mealReq of meals) {
            const calories = kcalFromMacros(mealReq.proteins, mealReq.carbs, mealReq.fats);
            if (mealReq.calories !== calories) {
                console.warn(
                    `[seedMeals] "${mealReq.name}": calories في الملف=${mealReq.calories} ≠ من الماكروز=${calories} — يُحفظ ${calories}`
                );
            }
            const existing = await prisma.meal.findFirst({
                where: { name: mealReq.name }
            });

            if (!existing) {
                // Map the names to IDs from the DB
                const connections = mealReq.incompatibleDiseases
                    .filter(diseaseName => diseaseMap[diseaseName]) // Ensure disease exists
                    .map(diseaseName => ({
                        chronicDiseases: {
                            connect: { id: diseaseMap[diseaseName] }
                        }
                    }));

                await prisma.meal.create({
                    data: {
                        name: mealReq.name,
                        calories,
                        portion: mealReq.portion,
                        proteins: mealReq.proteins,
                        fats: mealReq.fats,
                        carbs: mealReq.carbs,
                        ingredients: mealReq.ingredients,
                        imageUrl: mealReq.imageUrl,
                        time: time, // Enum matching: "BREAKFAST", "LUNCH"...
                        chromicDiseases: {
                            create: connections
                        }
                    }
                });
                console.log(`- Created: ${mealReq.name} (${time}) kcal=${calories}, ${connections.length} restrictions`);
            } else {
                const connections = mealReq.incompatibleDiseases
                    .filter(diseaseName => diseaseMap[diseaseName])
                    .map(diseaseName => ({
                        chronicDiseases: {
                            connect: { id: diseaseMap[diseaseName] }
                        }
                    }));

                await prisma.meal.update({
                    where: { id: existing.id },
                    data: {
                        name: mealReq.name,
                        calories,
                        portion: mealReq.portion,
                        proteins: mealReq.proteins,
                        fats: mealReq.fats,
                        carbs: mealReq.carbs,
                        ingredients: mealReq.ingredients,
                        imageUrl: mealReq.imageUrl,
                        time: time,
                        chromicDiseases: {
                            deleteMany: {},
                            create: connections
                        }
                    }
                });
                console.log(`- Updated meal: ${mealReq.name} kcal=${calories}`);
            }
        }
    }

    console.log("Seeding meals finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
