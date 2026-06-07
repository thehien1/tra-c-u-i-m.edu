import React, { useState } from 'react';
import { StudentProfile, AIAdviceResponse } from '../types';
import { Brain, HelpCircle, Sparkles, MapPin, Compass, Briefcase, GraduationCap, Heart, ArrowRight } from 'lucide-react';

interface AICounselorProps {
  profile: StudentProfile | null;
  configScore: 'hs1' | 'hs2';
}

export default function AICounselor({ profile, configScore }: AICounselorProps) {
  const [preferences, setPreferences] = useState<string>("");
  const [schoolPref, setSchoolPref] = useState<string>("CongLap");
  const [loading, setLoading] = useState<boolean>(false);
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleConsult = async () => {
    if (!profile) return;
    setLoading(true);
    setErrorCode(null);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sbd: profile.sbd,
          preferences,
          schoolPreference: schoolPref,
          configScore
        })
      });
      const result = await res.json();
      if (result.success) {
        setAdvice(result.data);
      } else {
        setErrorCode(result.error || "Không thể khởi động bộ não AI tư vấn. Thử lại sau!");
      }
    } catch (err) {
      setErrorCode("Hệ thống AI quá tải trong đợt tra cứu cao điểm. Vui lòng kết nối lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const getSuitabilityStyles = (suit: string) => {
    switch (suit) {
      case 'Tuyệt vời':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Lộ trình tối ưu (Tuyệt vời)' };
      case 'Phù hợp':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Cơ hội tốt (Phù hợp)' };
      default:
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Thử thách / Cận điểm chuẩn' };
    }
  };

  return (
    <div id="ai-advisor" className="bg-white rounded-xl shadow-md border border-gray-100 p-6 animate-fadeIn">
      {/* Intro section with Blue palette */}
      <div className="border-b border-gray-150 pb-5 mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-5.5 h-5.5 text-blue-700 animate-pulse" />
          Cố vấn Tuyển sinh Lớp 10 & Hướng nghiệp THPT (AI Trợ lý)
        </h2>
        <p className="text-xs text-gray-550 mt-1">
          Hệ thống kết xuất kết quả điểm thi lớp 10, phân tích thế mạnh và định vị lộ trình học tập, đỗ trượt nguyện vọng cấp THPT thông minh bằng Gemini 3.5.
        </p>
      </div>

      {!profile ? (
        <div className="bg-blue-50/20 rounded-xl p-8 text-center border-2 border-dashed border-blue-200">
          <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-blue-950">Đợi nạp dữ liệu tra cứu thí sinh</p>
          <p className="text-xs text-sky-800/80 mt-1 max-w-sm mx-auto leading-relaxed">
            Mời em nhập thông tin Số báo danh ở mục <b>Tra cứu điểm thi</b> bên trên, sau đó khởi tạo Trợ lý AI để nhận kết xuất dự báo đỗ trượt & tư vấn hướng học phù hợp nhất!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Quick options */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner">
            <h3 className="text-xs sm:text-sm font-bold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-1.5 border-b border-blue-900/10 pb-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              Tùy chỉnh định hướng THPT của em
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Sở thích / Thế mạnh đặc biệt (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Em học tốt khối tự nhiên, Đam mê hội họa, Thích học Tiếng Anh, Muốn đi du học..."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Loại hình trường THPT mong muốn:
                </label>
                <div className="flex gap-2">
                  <select
                    value={schoolPref}
                    onChange={(e) => setSchoolPref(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs sm:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                  >
                    <option value="CongLap">Trường THPT Công lập thông thường</option>
                    <option value="Chuyen">Trường THPT Chuyên (Học chuyên sâu môn học)</option>
                    <option value="DanLap">Trường THPT Dân lập / Quốc tế chất lượng cao</option>
                  </select>

                  <button
                    onClick={handleConsult}
                    disabled={loading}
                    className="bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        AI đang tính...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Tư vấn AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI report view */}
          {loading ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Brain className="w-12 h-12 text-blue-700 animate-bounce" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-700/20 border-t-blue-700 rounded-full animate-spin"></div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Mô hình AI đang khảo sát đề án tuyển sinh lớp 10...</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Hệ thống đang tiến hành đối chiếu điểm thi của em với điểm chuẩn các trường THPT tại địa phương, liên kết tổ hợp khối tư vấn kế hoạch rèn luyện 3 năm học tốt nhất cho em.
                </p>
              </div>
            </div>
          ) : advice ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* General Analysis */}
              <div className="bg-linear-to-r from-blue-50/50 to-indigo-50/30 border border-blue-200/50 rounded-xl p-5 shadow-xs">
                <h4 className="text-sm font-bold text-blue-950 uppercase tracking-widest flex items-center gap-1.5 border-b border-blue-105 pb-2 mb-3">
                  <Compass className="w-5 h-5 text-blue-850" />
                  Kết quả Phân tích thế mạnh & Năng lực tư duy
                </h4>
                <p className="text-xs sm:text-sm text-gray-750 font-medium leading-relaxed font-sans text-justify bg-white/40 p-3 rounded-lg border border-gray-100">
                  {advice.analysis}
                </p>
              </div>

              {/* Pathways Recommended */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Phương án tuyển sinh THPT & Dự báo nguyện vọng:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {advice.suggestedPathways && advice.suggestedPathways.map((pathway, idx) => {
                    const style = getSuitabilityStyles(pathway.suitability);
                    return (
                      <div key={idx} className="bg-white border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all rounded-xl p-5 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 mb-2">
                            <span className="font-bold text-gray-900 text-xs sm:text-sm block">
                              {pathway.title}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${style.bg}`}>
                              {style.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2 font-black text-blue-900 text-xs sm:text-sm uppercase tracking-wide">
                            <GraduationCap className="w-4 h-4 text-blue-750" />
                            {pathway.schoolName}
                          </div>

                          <p className="text-[11px] sm:text-xs text-gray-500 mt-2 font-medium leading-relaxed">
                            {pathway.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Plan */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-3">
                  <Briefcase className="w-5 h-5 text-slate-700" />
                  Kế hoạch hành động rèn luyện 3 năm THPT nâng cao
                </h4>
                <div className="text-xs sm:text-sm text-gray-650 font-semibold whitespace-pre-line leading-relaxed font-sans bg-white p-3.5 rounded-lg border border-slate-250">
                  {advice.actionPlan}
                </div>
              </div>

              {/* Encouragement from Counselor */}
              <div className="bg-radial from-amber-50 to-yellow-50/50 border border-amber-200/50 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-amber-100 p-3 text-amber-800 rounded-full border border-yellow-300 shadow-md">
                  <Heart className="w-6 h-6 fill-amber-700 text-amber-700" />
                </div>
                <div>
                  <h5 className="font-extrabold text-amber-950 uppercase tracking-wider text-xs">Cố vấn chia sẻ tâm tình:</h5>
                  <p className="text-xs sm:text-sm font-medium italic text-amber-900 mt-1 leading-relaxed text-justify">
                    &ldquo;{advice.encouragement}&ldquo;
                  </p>
                </div>
              </div>

            </div>
          ) : errorCode ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
              <p className="text-sm font-bold text-red-900">Xảy ra sự cố không mong muốn</p>
              <p className="text-xs text-red-850 mt-1 font-medium">{errorCode}</p>
              <button
                onClick={handleConsult}
                className="mt-3 bg-red-800 hover:bg-red-900 text-white font-bold text-xs px-4 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer border-none outline-none"
              >
                Yêu cầu nạp lại tư vấn
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
              <Compass className="w-10 h-10 text-gray-400" />
              <p className="text-sm font-bold text-gray-700">Trợ lý AI đang đợi lệnh từ thí sinh</p>
              <p className="text-xs text-gray-550 max-w-sm leading-relaxed">
                Sau khi rà soát mức điểm thi tuyển sinh lớp 10 thường/chuyên ở bảng trên, em hãy nhấp chọn <b>Tư vấn AI</b> để phân tích hướng nguyện vọng thấu đáo!
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
