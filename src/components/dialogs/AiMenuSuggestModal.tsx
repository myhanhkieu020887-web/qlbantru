'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, Loader2, RefreshCw, Utensils, Award, Info } from 'lucide-react';
import { AiMenuSuggestionResult } from '../../lib/services/AiMenuService';
import { AgeGroup, MealSession } from '../../types/nutrition';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ageGroup: AgeGroup;
  date: string;
  studentCount: number;
  budgetPerStudent: number;
  recentDishes?: string[];
  onApplySuggestion: (suggestion: AiMenuSuggestionResult) => void;
}

export const AiMenuSuggestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  ageGroup,
  date,
  studentCount,
  budgetPerStudent,
  recentDishes = [],
  onApplySuggestion,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<AiMenuSuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/menu-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageGroup,
          date,
          studentCount,
          budgetPerStudent,
          recentDishes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gợi ý thực đơn');
      setSuggestion(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !suggestion && !loading) {
      fetchSuggestion();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sessionTitles: Record<string, string> = {
    chinh_trua: 'Chính trưa',
    phu_trua: 'Phụ trưa',
    xe: 'Xế chiều',
    phu_xe: 'Phụ xế',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-purple-200 flex flex-col max-h-[90vh]">
        {/* Header gradient AI */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base">Trợ lý AI Gợi Ý Thực Đơn Bán Trú</h3>
              <p className="text-xs text-purple-200">
                Gemini 2.0 Flash • Cân đối theo chuẩn QĐ 2195/QĐ-BGDĐT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Đang phân tích định mức dinh dưỡng & lịch sử 7 ngày qua...
              </p>
              <p className="text-xs text-slate-400">
                AI đang tối ưu hóa đa dạng nguồn đạm, chất xơ và kiểm soát muối theo khuyến nghị.
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-xs">
              <p className="font-bold mb-1">Không thể lấy gợi ý AI:</p>
              <p>{error}</p>
              <button
                onClick={fetchSuggestion}
                className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          ) : suggestion ? (
            <>
              {/* Tên thực đơn & Rationale */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="w-4 h-4 text-purple-700" />
                  <h4 className="font-bold text-slate-900 text-sm">{suggestion.title}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{suggestion.rationale}</p>

                {/* Macro & Highlights */}
                <div className="mt-3 pt-3 border-t border-purple-200/60 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                    🔥 Ước tính: {suggestion.estimatedCalo} Kcal
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                    ⚖️ Tỷ lệ P-L-C: {suggestion.macroRatioEstimated}%
                  </span>
                </div>
              </div>

              {/* Danh sách món đề xuất */}
              <div>
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-blue-600" />
                  <span>Danh sách món ăn đề xuất</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {suggestion.suggestedDishes.map((d, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg p-3 hover:border-blue-400 transition bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {sessionTitles[d.mealSession] || d.mealSession}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{d.dishName}</div>
                      <p className="text-[11px] text-slate-500 mt-1 italic">{d.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Điểm nhấn dinh dưỡng */}
              {suggestion.nutritionHighlights && suggestion.nutritionHighlights.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <div className="font-bold text-emerald-800 text-xs mb-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Ưu điểm nổi bật của thực đơn</span>
                  </div>
                  <ul className="text-[11px] text-emerald-700 space-y-1 list-disc list-inside">
                    {suggestion.nutritionHighlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={fetchSuggestion}
            disabled={loading}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800 text-xs font-semibold px-3 py-1.5 rounded hover:bg-slate-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Gợi ý phương án khác</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Đóng
            </button>
            <button
              disabled={!suggestion || loading}
              onClick={() => {
                if (suggestion) {
                  onApplySuggestion(suggestion);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Áp dụng vào thực đơn hôm nay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
