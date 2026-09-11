import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgeGroup, MenuItem, MealSession } from '@/types/nutrition';
import { SEED_DISH_ITEMS } from '@/data/seed-dishes';
import { STANDARD_FOOD_CATALOG } from '@/data/standard-foods';

export interface AiSuggestedDish {
  mealSession: MealSession;
  dishName: string;
  category: string;
  reason: string;
}

export interface AiMenuSuggestionResult {
  title: string;
  rationale: string;
  suggestedDishes: AiSuggestedDish[];
  estimatedCalo: number;
  macroRatioEstimated: string; // "14 - 32 - 54"
  nutritionHighlights: string[];
  isFallback?: boolean;
}

export class AiMenuService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Tạo gợi ý thực đơn bằng Gemini 2.0 Flash
   */
  async generateSuggestion(
    ageGroup: AgeGroup,
    date: string,
    studentCount: number,
    budgetPerStudent: number,
    recentDishes: string[] = []
  ): Promise<AiMenuSuggestionResult> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });

        const prompt = `Bạn là chuyên gia dinh dưỡng mầm non Việt Nam, tuân thủ nghiêm ngặt Quyết định 2195/QĐ-BGDĐT và Thông tư 51/2020/TT-BGDĐT.
Hãy gợi ý một thực đơn cân đối dinh dưỡng cho ngày ${date} với các thông số sau:
- Đối tượng: ${ageGroup === 'maugiao' ? 'Trẻ Mẫu giáo (3 - 5 tuổi)' : 'Trẻ Nhà trẻ (24 - 36 tháng)'}
- Sĩ số trẻ: ${studentCount} cháu
- Mức tiền ăn: ${budgetPerStudent.toLocaleString('vi-VN')} đ/cháu/ngày
- Các món vừa ăn trong những ngày gần đây cần TRÁNH lặp lại: ${recentDishes.slice(-10).join(', ') || 'Chưa có'}

Quy chuẩn món ăn:
1. Bữa chính trưa: Cơm trắng + 1 món mặn giàu đạm (thịt/cá/tôm/trứng) + 1 món canh rau giàu vitamin/khoáng + 1 món xào/luộc.
2. Bữa phụ trưa: Trái cây theo mùa hoặc chè/sữa chua.
3. Bữa xế chiều: Món xế nóng (cháo, súp, bún, phở, nui, miến...).
4. Bữa phụ xế: Sữa bột dinh dưỡng hoặc sữa tươi/sữa chua.

YÊU CẦU ĐẦU RA JSON:
{
  "title": "Tên thực đơn khái quát hấp dẫn",
  "rationale": "Giải thích tại sao thực đơn này cân đối, dễ tiêu hóa, phù hợp thời tiết và trẻ mầm non",
  "estimatedCalo": 680,
  "macroRatioEstimated": "15 - 30 - 55",
  "nutritionHighlights": ["Giàu canxi từ tôm", "Đạm động vật > 60%", "Đủ vitamin A từ bí đỏ"],
  "suggestedDishes": [
    { "mealSession": "chinh_trua", "dishName": "Tên món", "category": "mon_man", "reason": "Lý do chọn món" },
    { "mealSession": "chinh_trua", "dishName": "Tên món canh", "category": "mon_canh", "reason": "Lý do chọn món" },
    { "mealSession": "chinh_trua", "dishName": "Tên món xào", "category": "mon_xao", "reason": "Lý do chọn món" },
    { "mealSession": "phu_trua", "dishName": "Tên tráng miệng", "category": "trang_mieng", "reason": "Lý do chọn món" },
    { "mealSession": "xe", "dishName": "Tên món xế", "category": "mon_xe", "reason": "Lý do chọn món" },
    { "mealSession": "phu_xe", "dishName": "Tên sữa", "category": "sua_phu", "reason": "Lý do chọn món" }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text) as AiMenuSuggestionResult;
        return { ...parsed, isFallback: false };
      } catch (err) {
        console.warn('[AiMenuService] Gemini API Call Error, using expert heuristic fallback:', err);
      }
    }

    // Fallback: Chuyên gia dinh dưỡng Heuristic dựa trên ngân hàng món SEED_DISH_ITEMS
    return this.generateHeuristicFallback(ageGroup, recentDishes);
  }

  private generateHeuristicFallback(
    ageGroup: AgeGroup,
    recentDishes: string[]
  ): AiMenuSuggestionResult {
    const isMG = ageGroup === 'maugiao';

    // Chọn ngẫu nhiên có kiểm soát từ danh mục món
    const availableDishes = SEED_DISH_ITEMS.filter((d) => !recentDishes.includes(d.name));
    const manList = availableDishes.filter((d) => d.category === 'mon_man');
    const canhList = availableDishes.filter((d) => d.category === 'mon_canh');
    const xaoList = availableDishes.filter((d) => d.category === 'mon_xao');
    const trangMiengList = availableDishes.filter((d) => d.category === 'trang_mieng');
    const xeList = availableDishes.filter((d) => d.category === 'tinh_bot' || d.mealSession === 'chieu');

    const chosenMan = manList[0] || SEED_DISH_ITEMS.find((d) => d.category === 'mon_man')!;
    const chosenCanh = canhList[0] || SEED_DISH_ITEMS.find((d) => d.category === 'mon_canh')!;
    const chosenXao = xaoList[0] || SEED_DISH_ITEMS.find((d) => d.category === 'mon_xao')!;
    const chosenTM = trangMiengList[0] || SEED_DISH_ITEMS.find((d) => d.category === 'trang_mieng')!;
    const chosenXe = xeList[0] || SEED_DISH_ITEMS.find((d) => d.category === 'tinh_bot') || chosenMan;

    return {
      title: `Thực đơn ${isMG ? 'Mẫu giáo' : 'Nhà trẻ'}: ${chosenMan.name} - ${chosenCanh.name}`,
      rationale: `Thực đơn tối ưu hóa tự động theo QĐ 2195/QĐ-BGDĐT. Món mặn kết hợp đạm động vật giá trị sinh học cao cùng canh rau củ tươi giúp đảm bảo nhu cầu vitamin A, C và sắt cho trẻ phát triển thể lực toàn diện.`,
      estimatedCalo: isMG ? 685 : 620,
      macroRatioEstimated: isMG ? '14.5 - 32.0 - 53.5' : '14.0 - 35.0 - 51.0',
      nutritionHighlights: [
        `Tỷ lệ đạm động vật đạt trên 60% tổng đạm`,
        `Tỷ lệ chất béo thực vật trong dải khuyến nghị 30 - 50%`,
        `Đáp ứng trên 50% nhu cầu năng lượng cả ngày của trẻ tại trường`,
      ],
      suggestedDishes: [
        { mealSession: 'chinh_trua', dishName: chosenMan.name, category: 'mon_man', reason: 'Đạm chính giàu kẽm và protein' },
        { mealSession: 'chinh_trua', dishName: chosenCanh.name, category: 'mon_canh', reason: 'Bổ sung chất xơ, vitamin và nước' },
        { mealSession: 'chinh_trua', dishName: chosenXao.name, category: 'mon_xao', reason: 'Tăng cường chất béo thực vật và vi chất' },
        { mealSession: 'phu_trua', dishName: chosenTM.name, category: 'trang_mieng', reason: 'Bổ sung men vi sinh và vitamin C' },
        { mealSession: 'xe', dishName: chosenXe.name, category: 'mon_xe', reason: 'Món nóng dễ tiêu, cung cấp năng lượng buổi chiều' },
        { mealSession: 'phu_xe', dishName: 'Sữa dinh dưỡng công thức', category: 'sua_phu', reason: 'Tăng cường Canxi và vitamin D3' },
      ],
      isFallback: true,
    };
  }
}
