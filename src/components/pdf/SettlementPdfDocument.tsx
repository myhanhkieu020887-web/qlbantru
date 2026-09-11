import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { MonthSettlementSummary } from '../../lib/services/SettlementService';

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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#94a3b8',
    marginBottom: 16,
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
  colClass: { width: '18%', textAlign: 'left', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colStudents: { width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colMealDays: { width: '9%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colAbsentDays: { width: '9%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colCollected: { width: '17%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colExpense: { width: '17%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#cbd5e1', padding: 2 },
  colRefund: { width: '17%', textAlign: 'right', padding: 2 },

  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  signBlock: {
    width: '30%',
    textAlign: 'center',
  },
  signSpacing: {
    height: 48,
  },
});

export const SettlementPdfDocument: React.FC<{ data: MonthSettlementSummary }> = ({ data }) => {
  return (
    <Document title={`Quyet_toan_tien_an_thang_${data.month}_${data.year}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.schoolHeader}>
            <Text style={{ fontSize: 7.5 }}>UBND PHƯỜNG HÀM THẮNG</Text>
            <Text style={[styles.boldText, { fontSize: 8.5 }]}>{data.schoolName.toUpperCase()}</Text>
            <Text style={{ fontSize: 7.5, color: '#64748b' }}>BỘ PHẬN TÀI CHÍNH - KẾ TOÁN</Text>
          </View>
          <View style={styles.stateHeader}>
            <Text style={[styles.boldText, { fontSize: 8 }]}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
            <Text style={{ fontSize: 7.5 }}>Độc lập - Tự do - Hạnh phúc</Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>
              Hàm Thắng, ngày 30 tháng {data.month} năm {data.year}
            </Text>
          </View>
        </View>

        {/* Tiêu đề */}
        <Text style={styles.title}>BẢNG CÔNG KHAI QUYẾT TOÁN TIỀN ĂN BÁN TRÚ THÁNG {data.month}/{data.year}</Text>
        <Text style={styles.subtitle}>
          (Ban hành công khai theo Thông tư 36/2017/TT-BGDĐT và quy chế chi tiêu bán trú)
        </Text>

        {/* Tóm tắt chỉ số */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCol}>
            <Text style={{ color: '#64748b', fontSize: 7.5 }}>TỔNG THU TIỀN ĂN</Text>
            <Text style={[styles.boldText, { fontSize: 10, color: '#1e3a8a', marginTop: 2 }]}>
              {data.totalRevenue.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={{ color: '#64748b', fontSize: 7.5 }}>TỔNG THỰC CHI</Text>
            <Text style={[styles.boldText, { fontSize: 10, color: '#15803d', marginTop: 2 }]}>
              {data.totalExpense.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={{ color: '#64748b', fontSize: 7.5 }}>TIỀN HOÀN TRẢ PHÉP</Text>
            <Text style={[styles.boldText, { fontSize: 10, color: '#b91c1c', marginTop: 2 }]}>
              {data.totalRefund.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={{ color: '#64748b', fontSize: 7.5 }}>SỐ DƯ QUỸ</Text>
            <Text style={[styles.boldText, { fontSize: 10, color: '#4338ca', marginTop: 2 }]}>
              {data.surplusDeficit.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* Bảng chi tiết từng lớp */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colNo}>STT</Text>
            <Text style={styles.colClass}>Tên lớp học</Text>
            <Text style={styles.colStudents}>Sĩ số</Text>
            <Text style={styles.colMealDays}>Ngày ăn</Text>
            <Text style={styles.colAbsentDays}>Nghỉ phép</Text>
            <Text style={styles.colCollected}>Tổng thu (đ)</Text>
            <Text style={styles.colExpense}>Thực chi (đ)</Text>
            <Text style={styles.colRefund}>Hoàn trả (đ)</Text>
          </View>

          {data.classes.map((c, index) => (
            <View key={c.classId} style={styles.tableRow}>
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colClass}>{c.className}</Text>
              <Text style={styles.colStudents}>{c.studentCount}</Text>
              <Text style={styles.colMealDays}>{c.totalMealDays}</Text>
              <Text style={styles.colAbsentDays}>{c.totalAbsentExcusedDays}</Text>
              <Text style={styles.colCollected}>{c.totalCollected.toLocaleString('vi-VN')}</Text>
              <Text style={styles.colExpense}>{c.actualExpense.toLocaleString('vi-VN')}</Text>
              <Text style={styles.colRefund}>{c.totalRefund.toLocaleString('vi-VN')}</Text>
            </View>
          ))}

          {/* Dòng tổng cộng */}
          <View style={[styles.tableRow, { backgroundColor: '#f1f5f9', fontWeight: 'bold' }]}>
            <Text style={[styles.colNo, styles.boldText]}>-</Text>
            <Text style={[styles.colClass, styles.boldText]}>TỔNG TOÀN TRƯỜNG</Text>
            <Text style={[styles.colStudents, styles.boldText]}>{data.totalStudents}</Text>
            <Text style={[styles.colMealDays, styles.boldText]}>-</Text>
            <Text style={[styles.colAbsentDays, styles.boldText]}>-</Text>
            <Text style={[styles.colCollected, styles.boldText]}>{data.totalRevenue.toLocaleString('vi-VN')}</Text>
            <Text style={[styles.colExpense, styles.boldText]}>{data.totalExpense.toLocaleString('vi-VN')}</Text>
            <Text style={[styles.colRefund, styles.boldText]}>{data.totalRefund.toLocaleString('vi-VN')}</Text>
          </View>
        </View>

        {/* Khối ký xác nhận 3 bên */}
        <View style={styles.signatureSection}>
          <View style={styles.signBlock}>
            <Text style={styles.boldText}>KẾ TOÁN BÁN TRÚ</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>(Ký, ghi rõ họ tên)</Text>
            <View style={styles.signSpacing} />
            <Text style={styles.boldText}>Nguyễn Thị Hạnh</Text>
          </View>
          <View style={styles.signBlock}>
            <Text style={styles.boldText}>ĐẠI DIỆN BAN PHỤ HUYNH</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>(Ký, ghi rõ họ tên)</Text>
            <View style={styles.signSpacing} />
            <Text style={styles.boldText}>Trần Văn Hùng</Text>
          </View>
          <View style={styles.signBlock}>
            <Text style={styles.boldText}>HIỆU TRƯỞNG</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>(Ký, đóng dấu)</Text>
            <View style={styles.signSpacing} />
            <Text style={styles.boldText}>Trần Thị Kim Loan</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
