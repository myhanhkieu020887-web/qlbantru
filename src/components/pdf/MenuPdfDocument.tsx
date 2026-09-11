import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { DailyMenuPlan, NutritionTotals } from '../../types/nutrition';

// Đăng ký font tiếng Việt tiêu chuẩn (Roboto / Noto) từ Google CDN
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontFamily: 'Roboto',
    fontSize: 8.5,
    color: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  schoolHeader: {
    width: '45%',
    textAlign: 'center',
  },
  stateHeader: {
    width: '50%',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 8.5,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 10,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#94a3b8',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    alignItems: 'center',
    minHeight: 18,
  },
  tableHeader: {
    backgroundColor: '#e2e8f0',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
  },
  colNo: { width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colName: { width: '28%', textAlign: 'left', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colSession: { width: '15%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colUnit: { width: '7%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colGamPerChild: { width: '12%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colBuyQty: { width: '13%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colPrice: { width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colTotal: { width: '10%', textAlign: 'right', padding: 2 },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    padding: 6,
    borderWidth: 0.5,
    borderColor: '#bfdbfe',
    borderRadius: 4,
    marginBottom: 16,
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  signBlock: {
    width: '30%',
    textAlign: 'center',
  },
  signSpacing: {
    height: 48,
  },
});

interface MenuPdfDocumentProps {
  plan: DailyMenuPlan;
  totals: NutritionTotals;
}

export const MenuPdfDocument: React.FC<MenuPdfDocumentProps> = ({ plan, totals }) => {
  const sessionLabels: Record<string, string> = {
    sang: 'Ăn sáng',
    chinh_trua: 'Chính trưa',
    phu_trua: 'Phụ trưa',
    xe: 'Xế chiều',
    phu_xe: 'Phụ xế',
  };

  return (
    <Document title={`Thuc_don_${plan.date}_${plan.ageGroup}`}>
      <Page size="A4" style={styles.page}>
        {/* Header Quốc hiệu & Trường */}
        <View style={styles.headerRow}>
          <View style={styles.schoolHeader}>
            <Text style={{ fontSize: 7.5 }}>{plan.divisionName || 'UBND PHƯỜNG HÀM THẮNG'}</Text>
            <Text style={[styles.boldText, { fontSize: 8.5 }]}>{plan.schoolName || 'TRƯỜNG MẪU GIÁO HÀM THẮNG'}</Text>
            <Text style={{ fontSize: 7.5, color: '#64748b' }}>Mã thực đơn: {plan.menuCode || 'TD-HT-01'}</Text>
          </View>
          <View style={styles.stateHeader}>
            <Text style={[styles.boldText, { fontSize: 8 }]}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
            <Text style={{ fontSize: 7.5 }}>Độc lập - Tự do - Hạnh phúc</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>
              Hàm Thắng, ngày {plan.date.split('-').slice(1).reverse().join(' tháng ')} năm {plan.date.split('-')[0]}
            </Text>
          </View>
        </View>

        {/* Tiêu đề Báo cáo */}
        <Text style={styles.title}>BẢNG CÂN ĐỐI THỰC ĐƠN VÀ ĐỊNH LƯỢNG KHẨU PHẦN BÁN TRÚ</Text>
        <Text style={styles.subtitle}>
          (Ban hành kèm theo Quyết định số 2195/QĐ-BGDĐT và Thông tư 51/2020/TT-BGDĐT)
        </Text>

        {/* Thông tin chung */}
        <View style={styles.infoBox}>
          <Text>
            <Text style={styles.boldText}>Phân hệ:</Text>{' '}
            {plan.ageGroup === 'maugiao' ? 'Mẫu giáo (3 - 5 tuổi)' : plan.ageGroup === 'nhatre' ? 'Nhà trẻ (24 - 36 tháng)' : 'Ăn sáng'}
          </Text>
          <Text>
            <Text style={styles.boldText}>Sĩ số ăn:</Text> {plan.studentCount.toLocaleString('vi-VN')} cháu
          </Text>
          <Text>
            <Text style={styles.boldText}>Mức thu:</Text> {plan.mealPricePerChild.toLocaleString('vi-VN')} đ/cháu/ngày
          </Text>
          <Text>
            <Text style={styles.boldText}>Tổng quỹ ăn:</Text> {(plan.studentCount * plan.mealPricePerChild).toLocaleString('vi-VN')} đ
          </Text>
        </View>

        {/* Bảng kê thực phẩm chi tiết */}
        <View style={styles.table}>
          {/* Header bảng */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNo}>STT</Text>
            <Text style={styles.colName}>Tên thực phẩm / Món</Text>
            <Text style={styles.colSession}>Bữa ăn</Text>
            <Text style={styles.colUnit}>ĐVT</Text>
            <Text style={styles.colGamPerChild}>g/cháu</Text>
            <Text style={styles.colBuyQty}>Tổng mua</Text>
            <Text style={styles.colPrice}>Đơn giá</Text>
            <Text style={styles.colTotal}>Thành tiền</Text>
          </View>

          {/* Dòng dữ liệu thực phẩm */}
          {plan.items.map((item, index) => {
            const gamExchange = item.food?.gamExchange || 1000;
            const totalKg = ((item.gamPerChild * plan.studentCount) / gamExchange);
            const price = item.food?.price || 0;
            const lineTotal = totalKg * price;

            return (
              <View key={item.id || index} style={styles.tableRow}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colName}>
                  {item.food?.name || 'Thực phẩm'} {item.dishName ? `(${item.dishName})` : ''}
                </Text>
                <Text style={styles.colSession}>{sessionLabels[item.mealSession] || item.mealSession}</Text>
                <Text style={styles.colUnit}>{item.food?.unit || 'Kg'}</Text>
                <Text style={styles.colGamPerChild}>{item.gamPerChild.toFixed(1)}</Text>
                <Text style={styles.colBuyQty}>{totalKg.toFixed(2)} {item.food?.unit || 'Kg'}</Text>
                <Text style={styles.colPrice}>{price.toLocaleString('vi-VN')}</Text>
                <Text style={styles.colTotal}>{Math.round(lineTotal).toLocaleString('vi-VN')}</Text>
              </View>
            );
          })}
        </View>

        {/* Tóm tắt cân đối dinh dưỡng & Tài chính */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.boldText}>Tổng Calo (Kcal)</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>{Math.round(totals.totalCalo)}</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>Định mức: 615 - 727 Kcal</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.boldText}>Tỷ lệ P - L - C (%)</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>
              {totals.proteinPct.toFixed(1)}% - {totals.fatPct.toFixed(1)}% - {totals.carbsPct.toFixed(1)}%
            </Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>Chuẩn: 13-20 / 25-35 / 52-60</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.boldText}>Đạm ĐV / Béo TV</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>
              {(totals.animalProteinRatio ?? 0).toFixed(1)}% / {(totals.plantFatRatio ?? 0).toFixed(1)}%
            </Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>Chuẩn ĐV ≥ 50% | TV 30-50%</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.boldText}>Tổng chi thực tế</Text>
            <Text style={{ fontSize: 10, marginTop: 2, fontWeight: 'bold', color: '#15803d' }}>
              {Math.round(totals.totalCost).toLocaleString('vi-VN')} đ
            </Text>
            <Text style={{ fontSize: 7, color: totals.budgetDifference < 0 ? '#b91c1c' : '#15803d' }}>
              Chênh lệch: {totals.budgetDifference > 0 ? '+' : ''}{Math.round(totals.budgetDifference).toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* Khối ký xác nhận 3 bên */}
        <View style={styles.signatureSection}>
          <View style={styles.signBlock}>
            <Text style={styles.boldText}>NGƯỜI LẬP BIỂU</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>(Kế toán bán trú)</Text>
            <View style={styles.signSpacing} />
            <Text style={styles.boldText}>Nguyễn Thị Hạnh</Text>
          </View>
          <View style={styles.signBlock}>
            <Text style={styles.boldText}>BẾP TRƯỞNG</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>(Tiếp phẩm - Chế biến)</Text>
            <View style={styles.signSpacing} />
            <Text style={styles.boldText}>Lê Thị Mai</Text>
          </View>
          <View style={styles.signBlock}>
            <Text style={styles.boldText}>HIỆU TRƯỞNG DUYỆT</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>(Ký, đóng dấu)</Text>
            <View style={styles.signSpacing} />
            <Text style={styles.boldText}>Trần Thị Kim Loan</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
