'use client';

import React, { useState } from 'react';
import { FoodSafetyAuditRecord } from '@/types/nutrition';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Lock,
  Unlock,
  QrCode,
  Calendar,
  Clock,
  FileCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  isDistributionUnlocked: boolean;
  onUnlockDistribution: (record: FoodSafetyAuditRecord) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const FoodSafetyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  date,
  isDistributionUnlocked,
  onUnlockDistribution,
  onShowToast,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(isDistributionUnlocked ? 3 : 2);

  // Bước 1: Tiếp phẩm
  const [step1Sensory, setStep1Sensory] = useState<boolean>(true);
  const [step1Packaging, setStep1Packaging] = useState<boolean>(true);
  const [step1Origin, setStep1Origin] = useState<boolean>(true);
  const [deliveryTemp, setDeliveryTemp] = useState<number>(4.5);

  // Bước 2: Chế biến chín (Đo nhiệt độ tâm)
  const [coreTempRice, setCoreTempRice] = useState<number>(85.0);
  const [coreTempFish, setCoreTempFish] = useState<number>(82.5);
  const [coreTempSoup, setCoreTempSoup] = useState<number>(88.0);
  const [coreTempBeefNoodle, setCoreTempBeefNoodle] = useState<number>(80.0);

  // Bước 3: Lưu mẫu 24h
  const [sealCode, setSealCode] = useState<string>(`TEM-${date.replace(/-/g, '')}-HT01`);
  const [fridgeTemp, setFridgeTemp] = useState<number>(4.0);
  const [sampleWeight, setSampleWeight] = useState<number>(120);

  if (!isOpen) return null;

  // Kiểm tra điều kiện CV 423: Tất cả nhiệt độ tâm >= 75°C
  const isStep2Pass =
    coreTempRice >= 75 &&
    coreTempFish >= 75 &&
    coreTempSoup >= 75 &&
    coreTempBeefNoodle >= 75;

  const isStep3Pass = sealCode.trim().length > 3 && fridgeTemp >= 2 && fridgeTemp <= 8 && sampleWeight >= 100;

  const canUnlock = isStep2Pass && isStep3Pass;

  const handleConfirmUnlock = () => {
    if (!isStep2Pass) {
      onShowToast('Cảnh báo CV 423: Nhiệt độ tâm thức ăn phải đạt tối thiểu 75°C!', 'error');
      return;
    }
    if (!isStep3Pass) {
      onShowToast('Cảnh báo QĐ 1246: Chưa niêm phong mã tem mẫu hoặc nhiệt độ tủ mẫu sai quy định (2-8°C)!', 'error');
      return;
    }

    const auditRecord: FoodSafetyAuditRecord = {
      id: `audit_${date}`,
      date,
      step1: {
        checkedAt: '06:15',
        inspector: 'Bếp trưởng Nguyễn Thị Thu',
        passedSensory: step1Sensory,
        passedPackaging: step1Packaging,
        passedOrigin: step1Origin,
        tempDeliveryC: deliveryTemp,
      },
      step2: {
        checkedAt: '09:30',
        chefName: 'Đầu bếp Trần Văn Hùng',
        dishes: [
          { dishName: 'Cơm trắng', mealSession: 'Trưa', cookedTime: '09:15', coreTemperatureC: coreTempRice, sensoryPassed: true },
          { dishName: 'Cá nục rim mặn ngọt', mealSession: 'Trưa', cookedTime: '09:20', coreTemperatureC: coreTempFish, sensoryPassed: true },
          { dishName: 'Canh bầu nấm rơm', mealSession: 'Trưa', cookedTime: '09:25', coreTemperatureC: coreTempSoup, sensoryPassed: true },
          { dishName: 'Bún bò xào cải thìa (Bữa xế)', mealSession: 'Xế', cookedTime: '09:30', coreTemperatureC: coreTempBeefNoodle, sensoryPassed: true },
        ],
        allCoreTempsPassed: isStep2Pass,
      },
      step3: {
        checkedAt: '10:15',
        sampleKeeper: 'Y tế học đường Phạm Thị Lan',
        sealCode,
        sampleWeightG: sampleWeight,
        fridgeTempC: fridgeTemp,
        storageDurationHours: 24,
        discardPlanAt: '10:15 ngày mai',
        isLocked: true,
      },
      isDistributionUnlocked: true,
    };

    onUnlockDistribution(auditRecord);
    onShowToast('✓ ĐÃ NIÊM PHONG LƯU MẪU VÀ MỞ KHÓA CHIA ĂN SỐ CHO 9 LỚP HỌC!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                QUY TRÌNH KIỂM THỰC 3 BƯỚC & LƯU MẪU 24 GIỜ
              </h3>
              <p className="text-xs text-blue-100">
                Căn cứ: Quyết định 1246/QĐ-BYT & Công văn 423/BGDĐT-GDMN | Ngày: <strong>{date}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trạng thái Mở khóa chia ăn Banner */}
        <div className={`px-5 py-2 text-xs font-bold flex items-center justify-between border-b ${
          isDistributionUnlocked
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {isDistributionUnlocked ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>TRẠNG THÁI: ĐÃ MỞ KHÓA CHIA ĂN SỐ (9 Lớp học đã được phép nhận thức ăn)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-600" />
                <span>TRẠNG THÁI: ĐANG KHÓA CHIA ĂN (Chỉ mở khi hoàn tất kiểm tra Bước 2 & Bước 3)</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono font-normal">
            Mã lưu mẫu: <strong>{sealCode}</strong>
          </span>
        </div>

        {/* 3 Steps Tabs */}
        <div className="grid grid-cols-3 bg-gray-100 border-b border-gray-300 text-xs font-bold text-center">
          <button
            onClick={() => setActiveStep(1)}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 1
                ? 'border-blue-700 bg-white text-blue-900 shadow-xs'
                : 'border-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] flex items-center justify-center">1</span>
            <span>Bước 1: Nhập thực phẩm (06:00)</span>
          </button>
          <button
            onClick={() => setActiveStep(2)}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 2
                ? 'border-blue-700 bg-white text-blue-900 shadow-xs'
                : 'border-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] flex items-center justify-center">2</span>
            <span>Bước 2: Chế biến chín (09:30)</span>
          </button>
          <button
            onClick={() => setActiveStep(3)}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 3
                ? 'border-blue-700 bg-white text-blue-900 shadow-xs'
                : 'border-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] flex items-center justify-center">3</span>
            <span>Bước 3: Lưu mẫu 24h (10:15)</span>
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto p-5 text-xs text-gray-800">
          {/* BƯỚC 1 */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-md border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-1">Kiểm tra cảm quan nguyên liệu khi tiếp nhận (06:00 sáng):</h4>
                <p className="text-gray-600">Đối chiếu chủng loại, quy cách, tem nhãn VietGAP và nhiệt độ xe lạnh bảo quản.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={step1Sensory}
                      onChange={(e) => setStep1Sensory(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>1. Cảm quan màu sắc, mùi vị đặc trưng tươi sống đạt chuẩn</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={step1Packaging}
                      onChange={(e) => setStep1Packaging(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>2. Bao bì, thùng chứa sạch sẽ, có niêm phong nguyên vẹn</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={step1Origin}
                      onChange={(e) => setStep1Origin(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>3. Hóa đơn chứng từ, nguồn gốc xuất xứ VietGAP đầy đủ</span>
                  </label>
                </div>

                <div className="p-3 border rounded-md bg-gray-50 flex flex-col justify-between">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Nhiệt độ thùng/xe lạnh giao hàng (°C):
                    </label>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-blue-600" />
                      <input
                        type="number"
                        step="0.5"
                        value={deliveryTemp}
                        onChange={(e) => setDeliveryTemp(parseFloat(e.target.value) || 0)}
                        className="w-24 bg-white border border-gray-300 rounded px-2 py-1 font-mono font-bold text-center"
                      />
                      <span className="text-gray-500 font-medium">(Chuẩn xe lạnh: 0 - 5°C)</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                    ✓ Kiểm tra cảm quan tiếp nhận: ĐÃ ĐẠT
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BƯỚC 2 */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/60 rounded-md border border-amber-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-950">
                    Quy chuẩn CV 423/BGDĐT-GDMN: Nhiệt độ tâm thức ăn chín phải đạt ≥ 75°C
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                    Cấm Suất Ăn Chế Biến Sẵn Ngoài
                  </span>
                </div>
                <p className="text-gray-600 mt-0.5">
                  Đo bằng nhiệt kế xiên thực phẩm tại tâm món ăn trước khi múc chia ra các khay cơm lớp.
                </p>
              </div>

              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100 font-bold text-gray-700">
                  <tr>
                    <th className="py-2 px-3 text-left border-b border-r border-gray-300">Tên món ăn nấu chín</th>
                    <th className="py-2 px-2 text-center border-b border-r border-gray-300 w-20">Bữa ăn</th>
                    <th className="py-2 px-2 text-center border-b border-r border-gray-300 w-24">Giờ nấu chín</th>
                    <th className="py-2 px-3 text-center border-b border-r border-gray-300 w-44 bg-blue-50 text-blue-950 font-black">
                      Nhiệt độ tâm (°C)
                    </th>
                    <th className="py-2 px-3 text-center border-b border-gray-300 w-28">Đánh giá CV 423</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2 px-3 border-r font-medium">1. Cơm trắng (Gạo tẻ thơm)</td>
                    <td className="py-2 px-2 text-center border-r">Trưa</td>
                    <td className="py-2 px-2 text-center border-r font-mono">09:15</td>
                    <td className="py-1 px-3 text-center border-r bg-blue-50/30">
                      <input
                        type="number"
                        step="0.5"
                        value={coreTempRice}
                        onChange={(e) => setCoreTempRice(parseFloat(e.target.value) || 0)}
                        className={`w-20 text-center font-mono font-bold px-2 py-1 rounded border ${
                          coreTempRice >= 75 ? 'border-gray-300 bg-white text-emerald-800' : 'border-rose-500 bg-rose-50 text-rose-700'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      {coreTempRice >= 75 ? (
                        <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Chưa đạt
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 border-r font-medium">2. Cá nục rim mặn ngọt thịt heo</td>
                    <td className="py-2 px-2 text-center border-r">Trưa</td>
                    <td className="py-2 px-2 text-center border-r font-mono">09:20</td>
                    <td className="py-1 px-3 text-center border-r bg-blue-50/30">
                      <input
                        type="number"
                        step="0.5"
                        value={coreTempFish}
                        onChange={(e) => setCoreTempFish(parseFloat(e.target.value) || 0)}
                        className={`w-20 text-center font-mono font-bold px-2 py-1 rounded border ${
                          coreTempFish >= 75 ? 'border-gray-300 bg-white text-emerald-800' : 'border-rose-500 bg-rose-50 text-rose-700'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      {coreTempFish >= 75 ? (
                        <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Chưa đạt
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 border-r font-medium">3. Canh bầu non nấu nấm rơm</td>
                    <td className="py-2 px-2 text-center border-r">Trưa</td>
                    <td className="py-2 px-2 text-center border-r font-mono">09:25</td>
                    <td className="py-1 px-3 text-center border-r bg-blue-50/30">
                      <input
                        type="number"
                        step="0.5"
                        value={coreTempSoup}
                        onChange={(e) => setCoreTempSoup(parseFloat(e.target.value) || 0)}
                        className={`w-20 text-center font-mono font-bold px-2 py-1 rounded border ${
                          coreTempSoup >= 75 ? 'border-gray-300 bg-white text-emerald-800' : 'border-rose-500 bg-rose-50 text-rose-700'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      {coreTempSoup >= 75 ? (
                        <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Chưa đạt
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 border-r font-medium">4. Bún bò xào cải thìa (Bữa xế)</td>
                    <td className="py-2 px-2 text-center border-r">Xế</td>
                    <td className="py-2 px-2 text-center border-r font-mono">09:30</td>
                    <td className="py-1 px-3 text-center border-r bg-blue-50/30">
                      <input
                        type="number"
                        step="0.5"
                        value={coreTempBeefNoodle}
                        onChange={(e) => setCoreTempBeefNoodle(parseFloat(e.target.value) || 0)}
                        className={`w-20 text-center font-mono font-bold px-2 py-1 rounded border ${
                          coreTempBeefNoodle >= 75 ? 'border-gray-300 bg-white text-emerald-800' : 'border-rose-500 bg-rose-50 text-rose-700'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      {coreTempBeefNoodle >= 75 ? (
                        <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Chưa đạt
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {!isStep2Pass && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-900 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>
                    <strong>CẢNH BÁO:</strong> Một hoặc nhiều món có nhiệt độ tâm &lt; 75°C. Hệ thống khóa chia ăn để đảm bảo an toàn tuyệt đối cho trẻ!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* BƯỚC 3 */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/70 rounded-md border border-emerald-300">
                <h4 className="font-bold text-emerald-950 mb-1">
                  Quy trình Lưu mẫu thức ăn 24 giờ (QĐ 1246/QĐ-BYT):
                </h4>
                <p className="text-gray-600">
                  Mỗi món ăn lưu tối thiểu ≥ 100g (hoặc 150ml lỏng) trong dụng cụ thủy tinh/inox vô trùng, dán tem niêm phong có chữ ký và lưu trữ ở nhiệt độ 2 - 8°C trong 24 giờ.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Mã tem niêm phong hũ mẫu:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={sealCode}
                        onChange={(e) => setSealCode(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 font-mono font-bold text-blue-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Khối lượng mẫu lưu (g/hũ):
                    </label>
                    <input
                      type="number"
                      value={sampleWeight}
                      onChange={(e) => setSampleWeight(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 font-mono font-bold"
                    />
                    <span className="text-[10px] text-gray-500">Chuẩn quy định: ≥ 100g</span>
                  </div>
                </div>

                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Nhiệt độ tủ lạnh lưu mẫu (°C):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-emerald-600" />
                      <input
                        type="number"
                        step="0.5"
                        value={fridgeTemp}
                        onChange={(e) => setFridgeTemp(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 font-mono font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">Chuẩn quy định: 2 - 8°C</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Thời hạn lưu mẫu:
                    </label>
                    <div className="bg-gray-200 px-2.5 py-1 rounded font-mono font-semibold text-gray-700">
                      24 giờ (Đến 10:15 ngày mai)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-300 px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600">Tiến độ kiểm thực:</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
              B1: Đạt
            </span>
            <span className={`px-2 py-0.5 rounded font-bold ${isStep2Pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              B2: {isStep2Pass ? 'Đạt (≥75°C)' : 'Cảnh báo'}
            </span>
            <span className={`px-2 py-0.5 rounded font-bold ${isStep3Pass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              B3: {isStep3Pass ? 'Đã niêm phong' : 'Chưa lưu'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleConfirmUnlock}
              disabled={!canUnlock}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded font-bold shadow-xs transition-all ${
                canUnlock
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <span>KÝ DUYỆT & MỞ KHÓA CHIA ĂN SỐ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
