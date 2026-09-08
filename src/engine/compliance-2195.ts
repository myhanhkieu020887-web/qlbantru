import { AgeGroup, NutritionTotals } from '../types/nutrition';

export interface ComplianceCheck {
  id: string;
  name: string;
  category: 'calo' | 'macro' | 'origin' | 'micro' | 'budget';
  standardText: string;
  actualValue: number;
  actualUnit: string;
  passed: boolean;
  status: 'DAT' | 'CANH_BAO' | 'KHONG_DAT';
  advice?: string;
}

export function evaluateCompliance(totals: NutritionTotals, ageGroup: AgeGroup): ComplianceCheck[] {
  const isMG = ageGroup === 'maugiao';

  const checks: ComplianceCheck[] = [
    // 1. Năng lượng Calo
    {
      id: 'calo',
      name: 'Năng lượng tại trường (Kcal)',
      category: 'calo',
      standardText: isMG ? '615 - 738 Kcal (TT 51/2020)' : '600 - 651 Kcal (TT 51/2020)',
      actualValue: Math.round(totals.totalCalo * 10) / 10,
      actualUnit: 'Kcal',
      passed: totals.isCaloPass,
      status: totals.isCaloPass ? 'DAT' : 'KHONG_DAT',
      advice: totals.totalCalo < (isMG ? 615 : 600)
        ? 'Năng lượng chưa đủ ngưỡng tối thiểu. Cần tăng định lượng gạo/thịt/dầu.'
        : totals.totalCalo > (isMG ? 738 : 651)
        ? 'Năng lượng vượt ngưỡng khuyến nghị. Cần giảm bớt lượng tinh bột hoặc dầu mỡ.'
        : undefined,
    },
    // 2. Tỷ lệ Đạm (Protein)
    {
      id: 'protein_pct',
      name: 'Tỷ lệ năng lượng từ Đạm (Protein)',
      category: 'macro',
      standardText: '13.0% - 20.0%',
      actualValue: Math.round(totals.proteinPct * 10) / 10,
      actualUnit: '%',
      passed: totals.proteinPct >= 13 && totals.proteinPct <= 20,
      status: totals.proteinPct >= 13 && totals.proteinPct <= 20 ? 'DAT' : 'KHONG_DAT',
      advice: totals.proteinPct < 13 ? 'Thiếu đạm. Cần bổ sung thêm thịt nạc, cá, tôm hoặc đậu phụ.' : undefined,
    },
    // 3. Tỷ lệ Béo (Lipid)
    {
      id: 'fat_pct',
      name: 'Tỷ lệ năng lượng từ Béo (Lipid)',
      category: 'macro',
      standardText: isMG ? '25.0% - 35.0%' : '30.0% - 40.0%',
      actualValue: Math.round(totals.fatPct * 10) / 10,
      actualUnit: '%',
      passed: totals.fatPct >= (isMG ? 25 : 30) && totals.fatPct <= (isMG ? 35 : 40),
      status: totals.fatPct >= (isMG ? 25 : 30) && totals.fatPct <= (isMG ? 35 : 40) ? 'DAT' : 'KHONG_DAT',
      advice: totals.fatPct > (isMG ? 35 : 40) ? 'Quá nhiều chất béo, cần giảm lượng dầu ăn hoặc mỡ heo.' : undefined,
    },
    // 4. Tỷ lệ Đường bột (Glucid)
    {
      id: 'carbs_pct',
      name: 'Tỷ lệ năng lượng từ Tinh bột (Glucid)',
      category: 'macro',
      standardText: isMG ? '52.0% - 60.0%' : '50.0% - 60.0%',
      actualValue: Math.round(totals.carbsPct * 10) / 10,
      actualUnit: '%',
      passed: totals.carbsPct >= (isMG ? 52 : 50) && totals.carbsPct <= 60,
      status: totals.carbsPct >= (isMG ? 52 : 50) && totals.carbsPct <= 60 ? 'DAT' : 'KHONG_DAT',
    },
    // 5. Đạm động vật / Tổng đạm
    {
      id: 'animal_protein',
      name: 'Tỷ lệ Đạm động vật / Tổng đạm',
      category: 'origin',
      standardText: '>= 50.0% (QĐ 2195)',
      actualValue: Math.round(totals.animalProteinRatio * 10) / 10,
      actualUnit: '%',
      passed: totals.animalProteinRatio >= 50,
      status: totals.animalProteinRatio >= 50 ? 'DAT' : 'KHONG_DAT',
      advice: totals.animalProteinRatio < 50 ? 'Đạm động vật chưa đạt 50%, cần thay thế nguồn đạm thực vật bằng cá/thịt.' : undefined,
    },
    // 6. Béo thực vật / Tổng béo
    {
      id: 'plant_fat',
      name: 'Tỷ lệ Mỡ thực vật / Tổng chất béo',
      category: 'origin',
      standardText: '>= 45.0% (QĐ 2195)',
      actualValue: Math.round(totals.plantFatRatio * 10) / 10,
      actualUnit: '%',
      passed: totals.plantFatRatio >= 45,
      status: totals.plantFatRatio >= 45 ? 'DAT' : 'KHONG_DAT',
      advice: totals.plantFatRatio < 45 ? 'Cần dùng dầu thực vật thay bớt một phần mỡ lợn.' : undefined,
    },
    // 7. Natri khống chế (Muối)
    {
      id: 'sodium',
      name: 'Kiểm soát Natri (QĐ 2195/QĐ-BGDĐT)',
      category: 'micro',
      standardText: isMG ? '<= 1200 mg (~3g muối)' : '<= 1000 mg',
      actualValue: Math.round(totals.totalSodiumMg * 10) / 10,
      actualUnit: 'mg',
      passed: totals.isSodiumPass,
      status: totals.isSodiumPass ? 'DAT' : 'KHONG_DAT',
      advice: !totals.isSodiumPass ? 'Lượng muối/nước mắm vượt chuẩn QĐ 2195! Cần giảm gia vị mặn.' : undefined,
    },
    // 8. Đường tự do (Free Sugars)
    {
      id: 'free_sugar',
      name: 'Kiểm soát Đường tự do (QĐ 2195)',
      category: 'micro',
      standardText: '<= 10.0% tổng năng lượng',
      actualValue: Math.round(totals.freeSugarCaloPct * 10) / 10,
      actualUnit: '%',
      passed: totals.isSugarPass,
      status: totals.isSugarPass ? 'DAT' : 'KHONG_DAT',
      advice: !totals.isSugarPass ? 'Lượng đường bổ sung vượt 10% calo! Cắt giảm đường cát và sữa ngọt.' : undefined,
    },
    // 9. Cân đối Ngân sách tiền ăn
    {
      id: 'budget',
      name: 'Cân đối Tiền ăn thực tế',
      category: 'budget',
      standardText: `Bám sát ${totals.budgetPerChild.toLocaleString('vi-VN')} đ/trẻ (±1%)`,
      actualValue: Math.round(totals.costPerChild),
      actualUnit: 'đ',
      passed: Math.abs(totals.budgetDifference) <= totals.totalBudget * 0.02,
      status: totals.budgetDifference < -totals.totalBudget * 0.02 
        ? 'KHONG_DAT' 
        : totals.budgetDifference < 0 
        ? 'CANH_BAO' 
        : 'DAT',
      advice: totals.budgetDifference < 0 
        ? `Bội chi ${(Math.abs(totals.budgetDifference)).toLocaleString('vi-VN')} đ. Cần cân đối lại định lượng.`
        : undefined,
    },
  ];

  return checks;
}
