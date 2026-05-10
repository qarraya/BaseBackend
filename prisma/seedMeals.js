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
        { name: "بان كيك الشوفان الصحي", calories: 300, portion: "200غ", fats: 8, proteins: 12, carbs: 45, ingredients: ["نصف كوب شوفان مطحون", "بيضة واحدة", "نصف موزة مهروسة", "رشة قرفة"], imageUrl: "https://kitchen.sayidaty.net/uploads/small/81/8118a0ca8612cf8c561c4da7ad8bad87_w750_h750.jpg", incompatibleDiseases: [] },
        { name: "شكشوكة بالخضار", calories: 308, portion: "250غ", fats: 20, proteins: 14, carbs: 18, ingredients: ["بيضتان", "طماطم وبصل", "فليفلة خضراء", "ملعقة زيت زيتون", "شريحة خبز أسمر"], imageUrl: "https://feelgoodfoodie.net/wp-content/uploads/2018/10/Shakshuka-09.jpg", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "سموذي أخضر", calories: 198, portion: "300مل", fats: 2, proteins: 5, carbs: 40, ingredients: ["كوب سبانخ", "نصف تفاحة خضراء", "ربع حبة أفوكادو", "كوب ماء أو حليب لوز"], imageUrl: "https://kitchen.sayidaty.net/uploads/small/2a/2a4f60ef9c1b72b47c63fc52c1d68abb_w750_h500.jpg", incompatibleDiseases: [] },
        { name: "بودنج بذور الشيا", calories: 262, portion: "200غ", fats: 14, proteins: 8, carbs: 26, ingredients: ["ملعقتان بذور شيا", "نصف كوب حليب", "قطع فراولة", "قطرة فانيليا"], imageUrl: "https://kitchen.sayidaty.net/uploads/small/97/97d1091c6fbf33d8eada5de10a3ec3d8_w750_h750.jpg", incompatibleDiseases: [] },
        { name: "فول مدمس بملعقة زيت زيتون", calories: 359, portion: "250غ", fats: 15, proteins: 16, carbs: 40, ingredients: ["كوب فول مدمس", "ملعقة زيت زيتون", "طماطم وبصل", "ربع رغيف خبز أسمر"], imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe", incompatibleDiseases: ["القولون العصبي"] },
        { name: "جبنة حلوم مشوية مع خضار", calories: 346, portion: "200غ", fats: 26, proteins: 18, carbs: 10, ingredients: ["3 شرائح جبن حلوم", "طماطم كرزية", "خيار", "نعناع"], imageUrl: "https://kitchen.sayidaty.net/uploads/small/cc/cce003113569b5dcbffa4b2d2a023943_w750_h500.jpg", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "ساندويتش ديك رومي", calories: 279, portion: "200غ", fats: 7, proteins: 22, carbs: 32, ingredients: ["شريحتان خبز توست أسمر", "شريحتا حبش مدخن", "خس وطماطم", "مسحة خردل"], imageUrl: "https://v-genius.fatafeat.com/storage/recipes/151206020441676.jpg", incompatibleDiseases: [] },
        { name: "زبدة الفول السوداني مع موز وتوست أسمر", calories: 352, portion: "150غ", fats: 16, proteins: 10, carbs: 42, ingredients: ["شريحة توست أسمر", "ملعقة زبدة فول سوداني", "نصف موزة مقطعة"], imageUrl: "https://ahlmasrnews.com/img/large/2021/03/%D8%B2%D8%A8%D8%AF%D8%A9-%D8%A7%D9%84%D9%81%D9%88%D9%84-%D8%A7%D9%84%D8%B3%D9%88%D8%AF%D8%A7%D9%86%D9%8A-1616434234-0.jpg", incompatibleDiseases: ["حساسية المكسرات"] },
        { name: "رقائق نخالة مع حليب", calories: 223, portion: "200غ", fats: 3, proteins: 9, carbs: 40, ingredients: ["كوب رقائق نخالة", "كوب حليب خالي الدسم"], imageUrl: "https://www.kelloggs.com/content/dam/Asia/kelloggs_me_ar/images/health-and-nutrition/cereal-and-milk/cereal-milk.jpg", incompatibleDiseases: ["حساسية اللاكتوز"] },
        { name: "بيض مخفوق مع فطر وسبانخ", calories: 246, portion: "200غ", fats: 18, proteins: 15, carbs: 6, ingredients: ["بيضتان", "نصف كوب فطر", "كوب سبانخ", "ملعقة زيت صغيرة"], imageUrl: "https://logifoodcoach.com/recipes/images/spinach-and-mushroom-egg-scramble-3a6959.jpg", incompatibleDiseases: ["ارتفاع الكوليسترول"] }
    ],
    LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 344, portion: "300غ", fats: 20, proteins: 32, carbs: 9, ingredients: ["150غ صدر دجاج مشوي", "كوبين خس", "طماطم وخيار", "ملعقتين صلصة خل وزيت"], imageUrl: "https://www.greatgrubdelicioustreats.com/wp-content/uploads/2022/05/Grilled_Chicken_Salad_13.jpg", incompatibleDiseases: [] },
        { name: "سلمون مشوي مع أرز بني", calories: 540, portion: "350غ", fats: 20, proteins: 40, carbs: 50, ingredients: ["150غ فيليه سلمون", "كوب أرز بني مسلوق", "نصف كوب خضار سوتيه"], imageUrl: "https://shamlola.s3.amazonaws.com/Shamlola_Images/5/src/c6b35a1040af8d023392c6f9a328b2d43e2b8f80.jpg", incompatibleDiseases: [] },
        { name: "معكرونة قمح كامل بصلصة الطماطم", calories: 305, portion: "300غ", fats: 4.5, proteins: 12, carbs: 54, ingredients: ["كوب مكرونة مسلوقة", "نصف كوب صلصة طماطم طبيعية", "ملعقة جبن مبشور"], imageUrl: "https://fortheloveofcooking.net/wp-content/uploads/2012/04/DSC_6314-2-scaled.jpg", incompatibleDiseases: ["السكري"] },
        { name: "كفتة مشوية مع سلطة", calories: 334, portion: "250غ", fats: 21.5, proteins: 26.5, carbs: 8.5, ingredients: ["150غ لحم مفروم مشوي", "بصل وبقدونس", "سلطة تبولة صغيرة"], imageUrl: "https://images.themodernproper.com/production/posts/2020/Beef-Kofta-12.jpg?w=1200&h=1200&q=60&fm=jpg&fit=crop&dm=1683266321&s=51d6a810051f11ed9a22ea54dd0bba1f", incompatibleDiseases: ["أمراض القلب", "ارتفاع ضغط الدم"] },
        { name: "مجدرة", calories: 397, portion: "350غ", fats: 5, proteins: 18, carbs: 70, ingredients: ["كوب عدس مطبوخ", "نصف كوب أرز مسلوق", "بصل مقلي", "بهارات"], imageUrl: "https://static01.nyt.com/images/2025/05/15/multimedia/ND-Mujadara-kzgm/ND-Mujadara-kzgm-mediumSquareAt3X.jpg", incompatibleDiseases: [] },
        { name: "كبسة دجاج صحية", calories: 486, portion: "350غ", fats: 14, proteins: 35, carbs: 55, ingredients: ["150غ صدر دجاج", "كوب أرز بسمتي مطبوخ", "جزر وبازلاء", "بهارات كبسة"], imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", incompatibleDiseases: [] },
        { name: "شريحة لحم بقر مشوية مع بطاطا حلوة", calories: 526, portion: "350غ", fats: 22, proteins: 40, carbs: 42, ingredients: ["150غ ستيك بقري", "حبة بطاطا حلوة مشوية", "بروكلي مسلوق"], imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba", incompatibleDiseases: ["أمراض القلب"] },
        { name: "سمك فيليه مشوي مع كينوا", calories: 448, portion: "300غ", fats: 16, proteins: 38, carbs: 38, ingredients: ["150غ سمك فيليه أبيض", "نصف كوب كينوا مطبوخة", "سلطة خضراء بليمون وزيت"], imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288", incompatibleDiseases: [] },
        { name: "سلطة تونة بالذرة والفاصوليا", calories: 330, portion: "300غ", fats: 10, proteins: 28, carbs: 32, ingredients: ["علبة تونة بالماء", "ربع كوب ذرة", "ربع كوب فاصوليا حمراء", "خس وليمون"], imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", incompatibleDiseases: [] },
        { name: "شيش طاووق مع حمص وسلطة", calories: 414, portion: "350غ", fats: 18, proteins: 38, carbs: 25, ingredients: ["أسياخ دجاج مشوي", "ملعقتان حمص", "سلطة خضراء", "ربع رغيف خبز عربي"], imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", incompatibleDiseases: [] },
        { name: "شوربة عدس مع خبز محمص", calories: 344, portion: "350مل", fats: 8, proteins: 18, carbs: 50, ingredients: ["كوب شوربة عدس", "قطعة خبز أسمر محمص", "بصل وليمون"], imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554", incompatibleDiseases: [] },
        { name: "مكرونة بالجمبري وصلصة بيضاء خفيفة", calories: 463, portion: "300غ", fats: 15, proteins: 30, carbs: 52, ingredients: ["كوب مكرونة مسلوقة", "100غ جمبري", "صلصة حليب وثوم خفيفة"], imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601", incompatibleDiseases: [] },
        { name: "صينية خضار بالفرن مع صدر دجاج", calories: 388, portion: "400غ", fats: 12, proteins: 35, carbs: 35, ingredients: ["150غ دجاج", "كوسا، باذنجان، جزر", "ملعقة زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d", incompatibleDiseases: [] },
        { name: "فاهيتا دجاج بخبز التورتيلا الأسمر", calories: 426, portion: "250غ", fats: 14, proteins: 30, carbs: 45, ingredients: ["100غ دجاج", "فليفلة ملونة وبصل", "خبز تورتيلا أسمر", "ملعقة زبادي"], imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", incompatibleDiseases: [] },
        { name: "كاري الحمص مع أرز بسمتي", calories: 452, portion: "350غ", fats: 16, proteins: 15, carbs: 62, ingredients: ["كوب حمص مطبوخ بالبهارات", "نصف كوب حليب جوز هند لايت", "كوب أرز مسلوق"], imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950", incompatibleDiseases: [] }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 402, portion: "300غ", fats: 18, proteins: 35, carbs: 25, ingredients: ["شريحة سلمون", "كوب بروكلي وجزر", "ملعقة زيتون"], imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=80", incompatibleDiseases: [] },
        { name: "تونة مع سلطة خضراء", calories: 262, portion: "250غ", fats: 10, proteins: 28, carbs: 15, ingredients: ["علبة تونة مصفاة من الزيت", "خس وجرجير", "عصير ليمون"], imageUrl: "https://img.youm7.com/ArticleImgs/2017/6/23/84512-%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%B9%D9%85%D9%84-%D8%B3%D9%84%D8%B7%D8%A9%D8%A7-%D9%84%D8%AA%D9%88%D9%86%D8%A91.jpeg", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "صدر دجاج بالليمون والثوم", calories: 252, portion: "200غ", fats: 8, proteins: 35, carbs: 10, ingredients: ["150غ صدر دجاج", "عصير حبة ليمون", "حبتين ثوم مهروس"], imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435", incompatibleDiseases: [] },
        { name: "جبنة قريش مع فواكه", calories: 225, portion: "200غ", fats: 5, proteins: 20, carbs: 25, ingredients: ["كوب جبنة قريش", "نصف تفاحة أو بطيخ", "رشة جوز"], imageUrl: "https://files.catbox.moe/v73qv9.png", incompatibleDiseases: ["أمراض الكلى المزمنة"] },
        { name: "شوربة خضار دافئة", calories: 185, portion: "300غ", fats: 5, proteins: 5, carbs: 30, ingredients: ["كوب مرق", "جزر بطاطس كوسا", "ملح وفلفل"], imageUrl: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=1200&auto=format&fit=crop", incompatibleDiseases: [] },
        { name: "سلطة يونانية بجبنة الفيتا", calories: 286, portion: "300غ", fats: 22, proteins: 10, carbs: 12, ingredients: ["طماطم وخيار وزيتون", "50غ جبن فيتا", "ملعقة زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "دجاج مشوي مع كوسا وجزر", calories: 310, portion: "250غ", fats: 10, proteins: 35, carbs: 20, ingredients: ["150غ دجاج مشوي", "كوسا وجزر مسلوق", "رشة فلفل أسود"], imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d", incompatibleDiseases: [] },
        { name: "راب فلافل مخبوزة بالفرن", calories: 348, portion: "200غ", fats: 12, proteins: 15, carbs: 45, ingredients: ["3 حبات فلافل مشوية", "خبز صاج أسمر", "طحينة وسلطة"], imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af", incompatibleDiseases: [] },
        { name: "شوربة دجاج بالخضار", calories: 222, portion: "350مل", fats: 6, proteins: 20, carbs: 22, ingredients: ["مرق دجاج", "قطع دجاج صغيرة", "ذرة وجزر", "بقدونس"], imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554", incompatibleDiseases: [] },
        { name: "بطاطا مشوية محشوة بالجبن والخضار", calories: 358, portion: "250غ", fats: 14, proteins: 12, carbs: 46, ingredients: ["حبة بطاطا مشوية", "ملعقتان جبن موزاريلا", "بروكلي مقطع"], imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", incompatibleDiseases: ["السكري"] },
        { name: "سلطة كينوا بالرمان والبقدونس", calories: 298, portion: "250غ", fats: 10, proteins: 8, carbs: 44, ingredients: ["نصف كوب كينوا", "ربع كوب رمان", "بقدونس وليمون", "ملعقة زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", incompatibleDiseases: [] },
        { name: "لحم مفروم مع باذنجان مشوي", calories: 388, portion: "300غ", fats: 20, proteins: 30, carbs: 22, ingredients: ["100غ لحم بقري مفروم", "باذنجان مشوي بالفرن", "صلصة طماطم طبيعية"], imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", incompatibleDiseases: [] },
        { name: "بيضتان مسلوقتان مع سلطة جرجير", calories: 210, portion: "200غ", fats: 14, proteins: 15, carbs: 6, ingredients: ["بيضتان مسلوقتان", "جرجير وطماطم كرزية", "عصير ليمون"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "شاورما دجاج صحية بالمنزل", calories: 360, portion: "200غ", fats: 12, proteins: 28, carbs: 35, ingredients: ["100غ دجاج متبل ببهارات شاورما", "خبز أسمر رقيق", "سلطة ومخلل"], imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", incompatibleDiseases: [] },
        { name: "برجر لحم صحي بخبز القمح الكامل", calories: 430, portion: "250غ", fats: 18, proteins: 32, carbs: 35, ingredients: ["قطعة برجر لحم مشوي", "خبز برجر أسمر", "شريحة جبن لايت", "خس وطماطم"], imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", incompatibleDiseases: ["أمراض القلب"] }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 193, portion: "150غ", fats: 9, proteins: 6, carbs: 22, ingredients: ["تفاحة متوسطة مقطعة", "20 غ لوز ني", "5غ عسل (اختياري)", "رشة قرفة"], imageUrl: "https://res.cloudinary.com/duhmfxmvq/image/upload/f_auto,q_auto/Gemini_Generated_Image_jmxes3jmxes3jmxe_mlj8rb", incompatibleDiseases: [] },
        { name: "مكسرات مشكلة", calories: 222, portion: "30غ", fats: 18, proteins: 7, carbs: 8, ingredients: ["30غ مكسرات غير مملحة (كاجو، جوز، لوز)"], imageUrl: "https://i0.wp.com/images-prod.healthline.com/hlcmsresource/images/mixed-nuts-in-bowl.jpg?w=1155&h=1528", incompatibleDiseases: [] },
        { name: "زبادي سادة", calories: 108, portion: "150غ", fats: 4, proteins: 8, carbs: 10, ingredients: ["علبة زبادي 150غ"], imageUrl: "https://png.pngtree.com/png-clipart/20231011/original/pngtree-labneh-png-with-ai-generated-png-image_13294690.png", incompatibleDiseases: [] },
        { name: "تمر وجوز", calories: 242, portion: "50غ", fats: 10, proteins: 3, carbs: 35, ingredients: ["3 حبات تمر", "نصف كوب جوز"], imageUrl: "https://www.israelcart.com/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2023/08/Davidpliner_beautifully_arranged_platter_of_Nut-Stuffed_Dates_w_70fede07-60be-499d-87d5-98b44de24b1f-1.png.webp", incompatibleDiseases: ["السكري"] },
        { name: "شرائح جزر وخيار مع حمص", calories: 154, portion: "150غ", fats: 6, proteins: 5, carbs: 20, ingredients: ["خيار وجزر مقطع", "ملعقتان حمص"], imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352", incompatibleDiseases: [] },
        { name: "قطعة شوكولاتة داكنة", calories: 120, portion: "20غ", fats: 8, proteins: 2, carbs: 10, ingredients: ["مكعبان شوكولاتة داكنة 70% كاكاو"], imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b", incompatibleDiseases: [] },
        { name: "كعك الأرز مع زبدة لوز", calories: 185, portion: "50غ", fats: 9, proteins: 6, carbs: 20, ingredients: ["حبتان كعك أرز", "ملعقة زبدة لوز"], imageUrl: "https://images.unsplash.com/photo-1590080874088-eec64895b423", incompatibleDiseases: ["حساسية المكسرات"] },
        { name: "عصير برتقال طبيعي", calories: 112, portion: "250مل", fats: 0, proteins: 2, carbs: 26, ingredients: ["عصير برتقال معصور طازج بدون سكر"], imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf", incompatibleDiseases: ["السكري"] },
        { name: "زبدية شوفان صغيرة", calories: 155, portion: "100غ", fats: 3, proteins: 5, carbs: 27, ingredients: ["ربع كوب شوفان", "نصف كوب ماء أو حليب دافئ"], imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", incompatibleDiseases: [] },
        { name: "شرائح بطيخ مع نعناع", calories: 92, portion: "250غ", fats: 0, proteins: 2, carbs: 21, ingredients: ["كوبان بطيخ مقطع", "أوراق نعناع طازجة"], imageUrl: "https://images.unsplash.com/photo-1587049352847-81a56d773c1c", incompatibleDiseases: ["السكري"] },
        { name: "كوب فوشار محضر بالهواء", calories: 93, portion: "30غ", fats: 1, proteins: 3, carbs: 18, ingredients: ["فوشار خالي من الزيت", "رشة ملح خفيفة"], imageUrl: "https://images.unsplash.com/photo-1585653040665-2a2b72449279", incompatibleDiseases: [] },
        { name: "نصف حبة جريب فروت", calories: 56, portion: "150غ", fats: 0, proteins: 1, carbs: 13, ingredients: ["نصف حبة جريب فروت طازجة"], imageUrl: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba", incompatibleDiseases: [] },
        { name: "تمر محشي بزبدة الفول السوداني", calories: 200, portion: "50غ", fats: 8, proteins: 4, carbs: 28, ingredients: ["حبتان تمر", "ملعقة صغيرة زبدة فول سوداني"], imageUrl: "https://images.unsplash.com/photo-1596484552834-6a58f850d0d7", incompatibleDiseases: ["السكري", "حساسية المكسرات"] },
        { name: "كرات الطاقة بالشوفان والتمر", calories: 211, portion: "50غ", fats: 7, proteins: 5, carbs: 32, ingredients: ["حبتان كرات طاقة محضرة منزلياً"], imageUrl: "https://images.unsplash.com/photo-1605051939527-30e7fc97cb73", incompatibleDiseases: [] },
        { name: "عنب وقطع جبن شيدر", calories: 182, portion: "100غ", fats: 10, proteins: 8, carbs: 15, ingredients: ["نصف كوب عنب", "قطعتان صغيرتان جبن شيدر"], imageUrl: "https://images.unsplash.com/photo-1596484552834-6a58f850d0d7", incompatibleDiseases: [] }
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
