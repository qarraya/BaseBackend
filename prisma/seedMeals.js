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
        { name: "فول مدمس بملعقة زيت زيتون", calories: 359, portion: "250غ", fats: 15, proteins: 16, carbs: 40, ingredients: ["كوب فول مدمس", "ملعقة زيت زيتون", "طماطم وبصل", "ربع رغيف خبز أسمر"], imageUrl: "https://i.pinimg.com/736x/a2/a1/cf/a2a1cf0dd3a63a0ffe666246290b019a.jpg", incompatibleDiseases: ["القولون العصبي"] },
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
        { name: "كبسة دجاج صحية", calories: 486, portion: "350غ", fats: 14, proteins: 35, carbs: 55, ingredients: ["150غ صدر دجاج", "كوب أرز بسمتي مطبوخ", "جزر وبازلاء", "بهارات كبسة"], imageUrl: "https://i.pinimg.com/736x/1c/0b/f8/1c0bf848f2b0969642340a1111679cff.jpg", incompatibleDiseases: [] },
        { name: "شريحة لحم بقر مشوية مع بطاطا حلوة", calories: 526, portion: "350غ", fats: 22, proteins: 40, carbs: 42, ingredients: ["150غ ستيك بقري", "حبة بطاطا حلوة مشوية", "بروكلي مسلوق"], imageUrl: "https://i.pinimg.com/1200x/e3/e3/9e/e3e39e682a46a675f090ad8dcec87cf0.jpg", incompatibleDiseases: ["أمراض القلب"] },
        { name: "سمك فيليه مشوي مع كينوا", calories: 448, portion: "300غ", fats: 16, proteins: 38, carbs: 38, ingredients: ["150غ سمك فيليه أبيض", "نصف كوب كينوا مطبوخة", "سلطة خضراء بليمون وزيت"], imageUrl: "https://i.pinimg.com/1200x/7f/76/f6/7f76f6a70088a7584aef1244fdf07623.jpg", incompatibleDiseases: [] },
        { name: "سلطة تونة بالذرة والفاصوليا", calories: 330, portion: "300غ", fats: 10, proteins: 28, carbs: 32, ingredients: ["علبة تونة بالماء", "ربع كوب ذرة", "ربع كوب فاصوليا حمراء", "خس وليمون"], imageUrl: "https://i.pinimg.com/1200x/56/51/66/5651664c9a6c6df41071ca756203713d.jpg", incompatibleDiseases: [] },
        { name: "شيش طاووق مع حمص وسلطة", calories: 414, portion: "350غ", fats: 18, proteins: 38, carbs: 25, ingredients: ["أسياخ دجاج مشوي", "ملعقتان حمص", "سلطة خضراء", "ربع رغيف خبز عربي"], imageUrl: "https://i.pinimg.com/736x/21/5e/2a/215e2ac2dd7c222d98cd295ff5cf54e1.jpg", incompatibleDiseases: [] },
        { name: "شوربة عدس مع خبز محمص", calories: 344, portion: "350مل", fats: 8, proteins: 18, carbs: 50, ingredients: ["كوب شوربة عدس", "قطعة خبز أسمر محمص", "بصل وليمون"], imageUrl: "https://i.pinimg.com/736x/68/c4/3f/68c43f36d9be156165ba86ff3d70f0df.jpg", incompatibleDiseases: [] },
        { name: "مكرونة بالجمبري وصلصة بيضاء خفيفة", calories: 463, portion: "300غ", fats: 15, proteins: 30, carbs: 52, ingredients: ["كوب مكرونة مسلوقة", "100غ جمبري", "صلصة حليب وثوم خفيفة"], imageUrl: "https://i.pinimg.com/1200x/a3/50/71/a35071ed9d3ab9d1ee4ea12724ba3f2d.jpg", incompatibleDiseases: [] },
        { name: "صينية خضار بالفرن مع صدر دجاج", calories: 388, portion: "400غ", fats: 12, proteins: 35, carbs: 35, ingredients: ["150غ دجاج", "كوسا، باذنجان، جزر", "ملعقة زيت زيتون"], imageUrl: "https://i.pinimg.com/1200x/fc/6a/af/fc6aaf7ed8382e7e73273fcfa9d277bc.jpg", incompatibleDiseases: [] },
        { name: "فاهيتا دجاج بخبز التورتيلا الأسمر", calories: 426, portion: "250غ", fats: 14, proteins: 30, carbs: 45, ingredients: ["100غ دجاج", "فليفلة ملونة وبصل", "خبز تورتيلا أسمر", "ملعقة زبادي"], imageUrl: "https://i.pinimg.com/736x/ad/4f/df/ad4fdf1bb639ba759920816ac8896fe9.jpg", incompatibleDiseases: [] },
        { name: "كاري الحمص مع أرز بسمتي", calories: 452, portion: "350غ", fats: 16, proteins: 15, carbs: 62, ingredients: ["كوب حمص مطبوخ بالبهارات", "نصف كوب حليب جوز هند لايت", "كوب أرز مسلوق"], imageUrl: "https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/chickpea_curry_with_rice.jpg", incompatibleDiseases: [] }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 402, portion: "300غ", fats: 18, proteins: 35, carbs: 25, ingredients: ["شريحة سلمون", "كوب بروكلي وجزر", "ملعقة زيتون"], imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=80", incompatibleDiseases: [] },
        { name: "تونة مع سلطة خضراء", calories: 262, portion: "250غ", fats: 10, proteins: 28, carbs: 15, ingredients: ["علبة تونة مصفاة من الزيت", "خس وجرجير", "عصير ليمون"], imageUrl: "https://img.youm7.com/ArticleImgs/2017/6/23/84512-%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%B9%D9%85%D9%84-%D8%B3%D9%84%D8%B7%D8%A9%D8%A7-%D9%84%D8%AA%D9%88%D9%86%D8%A91.jpeg", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "صدر دجاج بالليمون والثوم", calories: 252, portion: "200غ", fats: 8, proteins: 35, carbs: 10, ingredients: ["150غ صدر دجاج", "عصير حبة ليمون", "حبتين ثوم مهروس"], imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435", incompatibleDiseases: [] },
        { name: "جبنة قريش مع فواكه", calories: 225, portion: "200غ", fats: 5, proteins: 20, carbs: 25, ingredients: ["كوب جبنة قريش", "نصف تفاحة أو بطيخ", "رشة جوز"], imageUrl: "https://files.catbox.moe/v73qv9.png", incompatibleDiseases: ["أمراض الكلى المزمنة"] },
        { name: "شوربة خضار دافئة", calories: 185, portion: "300غ", fats: 5, proteins: 5, carbs: 30, ingredients: ["كوب مرق", "جزر بطاطس كوسا", "ملح وفلفل"], imageUrl: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=1200&auto=format&fit=crop", incompatibleDiseases: [] },
        { name: "سلطة يونانية بجبنة الفيتا", calories: 286, portion: "300غ", fats: 22, proteins: 10, carbs: 12, ingredients: ["طماطم وخيار وزيتون", "50غ جبن فيتا", "ملعقة زيت زيتون"], imageUrl: "https://i.pinimg.com/1200x/b2/1e/3e/b21e3ec3c501c1b9909ad6c96cbf5e03.jpg", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "دجاج مشوي مع كوسا وجزر", calories: 310, portion: "250غ", fats: 10, proteins: 35, carbs: 20, ingredients: ["150غ دجاج مشوي", "كوسا وجزر مسلوق", "رشة فلفل أسود"], imageUrl: "https://i.pinimg.com/1200x/c1/ff/76/c1ff7604cc5c1154561569899871eeca.jpg", incompatibleDiseases: [] },
        { name: "راب فلافل مخبوزة بالفرن", calories: 348, portion: "200غ", fats: 12, proteins: 15, carbs: 45, ingredients: ["3 حبات فلافل مشوية", "خبز صاج أسمر", "طحينة وسلطة"], imageUrl: "https://i.pinimg.com/1200x/41/a2/d4/41a2d4163fdddf1b0fe4005388d5252a.jpg", incompatibleDiseases: [] },
        { name: "شوربة دجاج بالخضار", calories: 222, portion: "350مل", fats: 6, proteins: 20, carbs: 22, ingredients: ["مرق دجاج", "قطع دجاج صغيرة", "ذرة وجزر", "بقدونس"], imageUrl: "https://i.pinimg.com/736x/a1/c9/bf/a1c9bfe7670b64d950d02e24144fe4c7.jpg", incompatibleDiseases: [] },
        { name: "بطاطا مشوية محشوة بالجبن والخضار", calories: 358, portion: "250غ", fats: 14, proteins: 12, carbs: 46, ingredients: ["حبة بطاطا مشوية", "ملعقتان جبن موزاريلا", "بروكلي مقطع"], imageUrl: "https://i.pinimg.com/1200x/25/ae/5e/25ae5e37717a53b51d473272c4fbacfd.jpg", incompatibleDiseases: ["السكري"] },
        { name: "سلطة كينوا بالرمان والبقدونس", calories: 298, portion: "250غ", fats: 10, proteins: 8, carbs: 44, ingredients: ["نصف كوب كينوا", "ربع كوب رمان", "بقدونس وليمون", "ملعقة زيت زيتون"], imageUrl: "https://cdn.alweb.com/thumbs/wasfatsehiyah/article/fit727x484/%D8%B3%D9%84%D8%B7%D8%A9-%D8%A7%D9%84%D9%83%D9%8A%D9%86%D9%88%D8%A7-%D8%A8%D8%A7%D9%84%D8%B1%D9%85%D8%A7%D9%86-%D8%A5%D9%84%D9%8A%D9%83-%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%A7%D9%84%D8%AA%D8%AD%D8%B6%D9%8A%D8%B1.jpg", incompatibleDiseases: [] },
        { name: "لحم مفروم مع باذنجان مشوي", calories: 388, portion: "300غ", fats: 20, proteins: 30, carbs: 22, ingredients: ["100غ لحم بقري مفروم", "باذنجان مشوي بالفرن", "صلصة طماطم طبيعية"], imageUrl: "https://i.pinimg.com/736x/3d/ed/c5/3dedc5984d380d9464abf780b8242042.jpg", incompatibleDiseases: [] },
        { name: "بيضتان مسلوقتان مع سلطة جرجير", calories: 210, portion: "200غ", fats: 14, proteins: 15, carbs: 6, ingredients: ["بيضتان مسلوقتان", "جرجير وطماطم كرزية", "عصير ليمون"], imageUrl: "https://i.pinimg.com/736x/12/aa/cc/12aacc2d97440c9648aac3aad2e48590.jpg", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "شاورما دجاج صحية", calories: 360, portion: "200غ", fats: 12, proteins: 28, carbs: 35, ingredients: ["100غ دجاج متبل ببهارات شاورما", "خبز أسمر رقيق", "سلطة ومخلل"], imageUrl: "https://i.pinimg.com/736x/89/62/d2/8962d2b4fdeb7bb6467a492f1f1583bd.jpg", incompatibleDiseases: [] },
        { name: "برجر لحم صحي بخبز القمح الكامل", calories: 430, portion: "250غ", fats: 18, proteins: 32, carbs: 35, ingredients: ["قطعة برجر لحم مشوي", "خبز برجر أسمر", "شريحة جبن لايت", "خس وطماطم"], imageUrl: "https://i.pinimg.com/1200x/61/14/d9/6114d944cd54f680b442da7175d5c6fb.jpg", incompatibleDiseases: ["أمراض القلب"] }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 193, portion: "150غ", fats: 9, proteins: 6, carbs: 22, ingredients: ["تفاحة متوسطة مقطعة", "20 غ لوز ني", "5غ عسل (اختياري)", "رشة قرفة"], imageUrl: "https://res.cloudinary.com/duhmfxmvq/image/upload/f_auto,q_auto/Gemini_Generated_Image_jmxes3jmxes3jmxe_mlj8rb", incompatibleDiseases: [] },
        { name: "مكسرات مشكلة", calories: 222, portion: "30غ", fats: 18, proteins: 7, carbs: 8, ingredients: ["30غ مكسرات غير مملحة (كاجو، جوز، لوز)"], imageUrl: "https://i0.wp.com/images-prod.healthline.com/hlcmsresource/images/mixed-nuts-in-bowl.jpg?w=1155&h=1528", incompatibleDiseases: [] },
        { name: "زبادي سادة", calories: 108, portion: "150غ", fats: 4, proteins: 8, carbs: 10, ingredients: ["علبة زبادي 150غ"], imageUrl: "https://ikneadtoeat.com/wp-content/uploads/2022/11/cropped-salty-lassi-5-1.jpg", incompatibleDiseases: [] },
        { name: "تمر وجوز", calories: 242, portion: "50غ", fats: 10, proteins: 3, carbs: 35, ingredients: ["3 حبات تمر", "نصف كوب جوز"], imageUrl: "https://www.israelcart.com/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2023/08/Davidpliner_beautifully_arranged_platter_of_Nut-Stuffed_Dates_w_70fede07-60be-499d-87d5-98b44de24b1f-1.png.webp", incompatibleDiseases: ["السكري"] },
        { name: "شرائح جزر وخيار مع حمص", calories: 154, portion: "150غ", fats: 6, proteins: 5, carbs: 20, ingredients: ["خيار وجزر مقطع", "ملعقتان حمص"], imageUrl: "https://i.pinimg.com/736x/b8/b3/3f/b8b33fdf8330b63861e703ec40c59ff0.jpg", incompatibleDiseases: [] },
        { name: "قطعة شوكولاتة داكنة", calories: 120, portion: "20غ", fats: 8, proteins: 2, carbs: 10, ingredients: ["مكعبان شوكولاتة داكنة 70% كاكاو"], imageUrl: "https://i.pinimg.com/736x/7f/3c/48/7f3c485d281ad6bb1506f477fd9d38d8.jpg", incompatibleDiseases: [] },
        { name: "كعك الأرز مع زبدة لوز", calories: 185, portion: "50غ", fats: 9, proteins: 6, carbs: 20, ingredients: ["حبتان كعك أرز", "ملعقة زبدة لوز"], imageUrl: "https://kitchen.sayidaty.net/uploads/small/c6/c684687cc37c019431d0fd8495ed6070_w750_h500.jpg", incompatibleDiseases: ["حساسية المكسرات"] },
        { name: "عصير برتقال طبيعي", calories: 112, portion: "250مل", fats: 0, proteins: 2, carbs: 26, ingredients: ["عصير برتقال معصور طازج بدون سكر"], imageUrl: "https://i.pinimg.com/736x/3a/61/bc/3a61bc4bf11ec1f1d9df3cb75b604d38.jpg", incompatibleDiseases: ["السكري"] },
        { name: "زبدية شوفان صغيرة", calories: 155, portion: "100غ", fats: 3, proteins: 5, carbs: 27, ingredients: ["ربع كوب شوفان", "نصف كوب ماء أو حليب دافئ"], imageUrl: "https://i.pinimg.com/1200x/86/49/53/86495329252df3c57f7dcbeecfd702f9.jpg", incompatibleDiseases: [] },
        { name: "شرائح بطيخ مع نعناع", calories: 92, portion: "250غ", fats: 0, proteins: 2, carbs: 21, ingredients: ["كوبان بطيخ مقطع", "أوراق نعناع طازجة"], imageUrl: "https://i.pinimg.com/736x/c0/d6/7f/c0d67fe978b2aefb7c93a0fbf4b9c65e.jpg", incompatibleDiseases: ["السكري"] },
        { name: "كوب فوشار محضر بالهواء", calories: 93, portion: "30غ", fats: 1, proteins: 3, carbs: 18, ingredients: ["فوشار خالي من الزيت", "رشة ملح خفيفة"], imageUrl: "https://i.pinimg.com/1200x/c2/27/62/c22762ef16191cc2f80a5e27a08f5326.jpg", incompatibleDiseases: [] },
        { name: "نصف حبة جريب فروت", calories: 56, portion: "150غ", fats: 0, proteins: 1, carbs: 13, ingredients: ["نصف حبة جريب فروت طازجة"], imageUrl: "https://i.pinimg.com/1200x/e9/77/f0/e977f048c048e92ad72bfacd6dc2d20b.jpg", incompatibleDiseases: [] },
        { name: "تمر محشي بزبدة الفول السوداني", calories: 200, portion: "50غ", fats: 8, proteins: 4, carbs: 28, ingredients: ["حبتان تمر", "ملعقة صغيرة زبدة فول سوداني"], imageUrl: "https://i.pinimg.com/1200x/f1/fb/43/f1fb4337c3ec93a70ffa5cc311c6fbda.jpg", incompatibleDiseases: ["السكري", "حساسية المكسرات"] },
        { name: "كرات الطاقة بالشوفان والتمر", calories: 211, portion: "50غ", fats: 7, proteins: 5, carbs: 32, ingredients: ["حبتان كرات طاقة محضرة منزلياً"], imageUrl: "https://i.pinimg.com/1200x/91/ef/f4/91eff4430401354b89fc746f02b37a8d.jpg", incompatibleDiseases: [] },
        { name: "عنب وقطع جبن شيدر", calories: 182, portion: "100غ", fats: 10, proteins: 8, carbs: 15, ingredients: ["نصف كوب عنب", "قطعتان صغيرتان جبن شيدر"], imageUrl: "https://i.pinimg.com/736x/87/e7/2a/87e72aed7b718f382862927eb709cf03.jpg", incompatibleDiseases: [] }
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
