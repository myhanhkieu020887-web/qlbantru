'use client';

import React, { useState } from 'react';
import { FoodSafetyAuditRecord } from '@/types/nutrition';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  Lock,
  Unlock,
  QrCode,
  FileCheck,
} from 'lucide-react';

interface Props {
  date: string;
  isDistributionUnlocked: boolean;
  onUnlockDistribution: (record: FoodSafetyAuditRecord) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const FoodSafetyView: React.FC<Props> = ({
  date,
  isDistributionUnlocked,
  onUnlockDistribution,
  onShowToast,
}) => {
  // Bước 1: Tiếp phẩm
  const [step1Sensory, setStep1Sensory] = useState<boolean>(true);
  const [step1Packaging, setStep1Packaging] = useState<boolean>(true);
  const [step1Origin, setStep1Origin] = useState<boolean>(true);
  const [deliveryTemp, setDeliveryTemp] = useState<number>(4.5);

  // Bước 2: Chế biến chín (Nhiệt độ tâm)
  const [coreTempRice, setCoreTempRice] = useState<number>(85.0);
  const [coreTempFish, setCoreTempFish] = useState<number>(82.5);
  const [coreTempSoup, setCoreTempSoup] = useState<number>(88.0);
  const [coreTempBeefNoodle, setCoreTempBeefNoodle] = useState<number>(80.0);

  // Bước 3: Lưu mẫu 24h
  const [sealCode, setSealCode] = useState<string>(`TEM-${date.replace(/-/g, '')}-HT01`);
  const [fridgeTemp, setFridgeTemp] = useState<number>(4.0);
  const [sampleWeight, setSampleWeight] = useState<number>(120);

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
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 p-4 md:p-6 text-xs text-slate-800">
      {/* Top Banner */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            HỆ THỐNG KIỂM THỰC 3 BƯỚC & LƯU MẪU 24 GIỜ (QĐ 1246/QĐ-BYT & CV 423)
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Ngày: <strong className="text-slate-800">{date}</strong> | Kiểm soát nghiêm ngặt quy trình vệ sinh an toàn thực phẩm bếp ăn một chiều.
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfirmUnlock}
          disabled={!canUnlock}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-xs transition-all active:scale-95 ${
            isDistributionUnlocked
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : canUnlock
              ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isDistributionUnlocked ? (
            <>
              <Unlock className="w-4 h-4" />
              <span>✓ ĐÃ MỞ KHÓA CHIA ĂN SỐ (9 LỚP HỌC)</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>KÝ DUYỆT & MỞ KHÓA CHIA ĂN</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Steps Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* STEP 1 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">1</span>
                BƯỚC 1: TIẾP PHẨM (06:00)
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ĐẠT CHUẨN
              </span>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={step1Sensory}
                  onChange={(e) => setStep1Sensory(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Cảm quan màu sắc, mùi vị tươi mới</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={step1Packaging}
                  onChange={(e) => setStep1Packaging(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Bao bì nguyên vẹn, niêm phong tốt</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={step1Origin}
                  onChange={(e) => setStep1Origin(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Hóa đơn, xuất xứ VietGAP đầy đủ</span>
              </label>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Nhiệt độ xe lạnh giao:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={deliveryTemp}
                    onChange={(e) => setDeliveryTemp(parseFloat(e.target.value) || 0)}
                    className="w-16 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1 py-0.5"
                  />
                  <span className="text-slate-400 font-mono">°C (0-5°C)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Người kiểm tra: <strong>Nguyễn Thị Thu (Bếp trưởng)</strong>
          </div>
        </div>

        {/* STEP 2 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">2</span>
                BƯỚC 2: CHẾ BIẾN CHÍN (09:30)
              </span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${isStep2Pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {isStep2Pass ? 'ĐẠT (≥75°C)' : 'CHƯA ĐẠT'}
              </span>
            </div>

            <p className="text-slate-500 text-[11px] mb-2.5">
              Đo nhiệt độ tâm thực phẩm nấu chín theo đúng Công văn 423/BGDĐT-GDMN:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <span className="font-medium text-slate-700">1. Cơm trắng:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={coreTempRice}
                    onChange={(e) => setCoreTempRice(parseFloat(e.target.value) || 0)}
                    className="w-16 text-center font-mono font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-emerald-700"
                  />
                  <span className="text-slate-400 font-mono">°C</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <span className="font-medium text-slate-700">2. Cá nục rim mặn ngọt:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={coreTempFish}
                    onChange={(e) => setCoreTempFish(parseFloat(e.target.value) || 0)}
                    className="w-16 text-center font-mono font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-emerald-700"
                  />
                  <span className="text-slate-400 font-mono">°C</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <span className="font-medium text-slate-700">3. Canh bầu nấm rơm:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={coreTempSoup}
                    onChange={(e) => setCoreTempSoup(parseFloat(e.target.value) || 0)}
                    className="w-16 text-center font-mono font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-emerald-700"
                  />
                  <span className="text-slate-400 font-mono">°C</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <span className="font-medium text-slate-700">4. Bún bò xào cải (Xế):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={coreTempBeefNoodle}
                    onChange={(e) => setCoreTempBeefNoodle(parseFloat(e.target.value) || 0)}
                    className="w-16 text-center font-mono font-bold bg-white border border-slate-200 rounded px-1 py-0.5 text-emerald-700"
                  />
                  <span className="text-slate-400 font-mono">°C</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Người nấu chính: <strong>Trần Văn Hùng (Bếp phụ)</strong>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">3</span>
                BƯỚC 3: LƯU MẪU 24H (10:15)
              </span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${isStep3Pass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isStep3Pass ? 'ĐÃ NIÊM PHONG' : 'CHƯA LƯU'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Mã tem niêm phong hũ mẫu:</label>
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={sealCode}
                    onChange={(e) => setSealCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Khối lượng mẫu lưu (g/hũ):</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={sampleWeight}
                    onChange={(e) => setSampleWeight(parseInt(e.target.value) || 0)}
                    className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-800"
                  />
                  <span className="text-slate-400 text-[10px]">Chuẩn: ≥ 100g</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nhiệt độ tủ mát lưu mẫu (°C):</label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-4 h-4 text-blue-600" />
                    <input
                      type="number"
                      step="0.5"
                      value={fridgeTemp}
                      onChange={(e) => setFridgeTemp(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <span className="text-slate-400 text-[10px]">Chuẩn: 2 - 8°C</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Người lưu mẫu: <strong>Phạm Thị Lan (Y tế học đường)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
