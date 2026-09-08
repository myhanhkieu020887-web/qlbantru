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
  formulaText?: string;
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
      formulaText: 'E = (P × 4) + (L × 9) + (G × 4)',
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
      formulaText: '%P = (P × 4 / E) × 100%',
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
      formulaText: '%L = (L × 9 / E) × 100%',
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
      formulaText: '%G = (G × 4 / E) × 100%',
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
      formulaText: '%P(đv) = (P_động_vật / P_tổng) × 100%',
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
      formulaText: '%L(tv) = (L_thực_vật / L_tổng) × 100%',
      advice: totals.plantFatRatio < 45 ? 'Cần dùng dầu thực vật thay bớt một phần mỡ lợn.' : undefined,
    },
    // 7. Tỷ lệ Canxi / Photpho (Ca:P)
    {
      id: 'ca_p_ratio',
      name: 'Tỷ lệ Canxi / Photpho (Ca:P)',
      category: 'micro',
      standardText: '1.0 : 1 - 1.5 : 1 (QĐ 2195)',
      actualValue: Math.round(totals.calciumPhosphorusRatio * 100) / 100,
      actualUnit: ': 1',
      passed: totals.isCaPRatioPass,
      status: totals.isCaPRatioPass ? 'DAT' : 'CANH_BAO',
      formulaText: 'Tỷ lệ Ca:P = Canxi(mg) / Photpho(mg)',
      advice: totals.calciumPhosphorusRatio < 0.7 
        ? 'Tỷ lệ Ca:P thấp (<0.7), photpho cao cản trở hấp thụ canxi. Cần bổ sung tôm đồng, cua hoặc sữa mầm non.' 
        : totals.calciumPhosphorusRatio > 1.8 
        ? 'Tỷ lệ Ca:P quá cao, cần cân bằng lại nguồn ngũ cốc và thịt.' 
        : undefined,
    },
    // 8. Hàm lượng Sắt hữu dụng (Iron)
    {
      id: 'iron',
      name: 'Hàm lượng Sắt (Iron)',
      category: 'micro',
      standardText: isMG ? '>= 3.5 mg/ngày' : '>= 2.8 mg/ngày',
      actualValue: Math.round(totals.ironMg * 10) / 10,
      actualUnit: 'mg',
      passed: totals.isIronPass,
      status: totals.isIronPass ? 'DAT' : 'CANH_BAO',
      formulaText: 'Tổng Sắt = ∑(Sắt_thực_phẩm)',
      advice: !totals.isIronPass ? 'Chưa đạt khuyến nghị Sắt tối thiểu. Cần bổ sung thịt bò, lòng đỏ trứng hoặc mộc nhĩ.' : undefined,
    },
    // 9. Natri khống chế (Muối)
    {
      id: 'sodium',
      name: 'Kiểm soát Natri (QĐ 2195/QĐ-BGDĐT)',
      category: 'micro',
      standardText: isMG ? '<= 1200 mg (~3g muối)' : '<= 1000 mg',
      actualValue: Math.round(totals.totalSodiumMg * 10) / 10,
      actualUnit: 'mg',
      passed: totals.isSodiumPass,
      status: totals.isSodiumPass ? 'DAT' : 'KHONG_DAT',
      formulaText: '∑ Natri(mg) ≤ 1200mg',
      advice: !totals.isSodiumPass ? 'Lượng muối/nước mắm vượt chuẩn QĐ 2195! Cần giảm gia vị mặn.' : undefined,
    },
    // 10. Đường tự do (Free Sugars)
    {
      id: 'free_sugar',
      name: 'Kiểm soát Đường tự do (QĐ 2195)',
      category: 'micro',
      standardText: '<= 10.0% tổng năng lượng',
      actualValue: Math.round(totals.freeSugarCaloPct * 10) / 10,
      actualUnit: '%',
      passed: totals.isSugarPass,
      status: totals.isSugarPass ? 'DAT' : 'KHONG_DAT',
      formulaText: '%E(đường) = (Carbs_đường × 4 / E) × 100%',
      advice: !totals.isSugarPass ? 'Lượng đường bổ sung vượt 10% calo! Cắt giảm đường cát và sữa ngọt.' : undefined,
    },
    // 11. Cân đối Ngân sách tiền ăn
    {
      id: 'budget',
      name: 'Cân đối Tiền ăn thực tế',
      category: 'budget',
      standardText: `Bám sát ${totals.budgetPerChild.toLocaleString('vi-VN')} đ/trẻ (±100đ)`,
      actualValue: Math.round(totals.costPerChild),
      actualUnit: 'đ',
      passed: Math.abs(totals.costPerChild - totals.budgetPerChild) <= 100,
      status: totals.costPerChild - totals.budgetPerChild > 100 
        ? 'KHONG_DAT' 
        : Math.abs(totals.costPerChild - totals.budgetPerChild) <= 100
        ? 'DAT'
        : 'CANH_BAO',
      formulaText: 'Δ = Tiền_thu - Tiền_chi (Mục tiêu |Δ| ≤ 100đ)',
      advice: totals.costPerChild - totals.budgetPerChild > 100 
        ? `Bội chi ${(Math.round(totals.costPerChild - totals.budgetPerChild)).toLocaleString('vi-VN')} đ/cháu. Cần cân đối lại định lượng.`
        : totals.budgetPerChild - totals.costPerChild > 500
        ? `Tồn dư nhiều (${Math.round(totals.budgetPerChild - totals.costPerChild).toLocaleString('vi-VN')} đ/cháu). Cần tăng định lượng thịt hoặc trái cây.`
        : undefined,
    },
  ];

  return checks;
}
