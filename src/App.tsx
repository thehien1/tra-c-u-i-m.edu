import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScoreChart from './components/ScoreChart';
import TopScorers from './components/TopScorers';
import AICounselor from './components/AICounselor';
import { StudentProfile } from './types';
import { 
  Search, RotateCw, HelpCircle, ArrowRight, User, GraduationCap, 
  BookOpen, Star, RefreshCw, Landmark, AlertCircle, CheckCircle, 
  FileText, ShieldCheck, BadgeHelp, Award, Trophy, BarChart3, Edit3, Settings
} from 'lucide-react';

const PRESET_SBDS = [
  { sbd: "123456", label: "Phạm Minh Hoàng", tag: "Thủ sinh thi Chuyên Toán (Sở GD Hà Nội)" },
  { sbd: "654321", label: "Nguyễn Thị Mai Lam", tag: "Học sinh đỗ NV1 (Sở GD TPHCM)" },
  { sbd: "333444", label: "Lê Thanh Phong", tag: "Thí sinh mấp mé điểm chuẩn NV1, NV2 (Sở GD Đà Nẵng)" },
  { sbd: "111222", label: "Vũ Thức Trần Anh", tag: "Bị điểm liệt môn thi lớp 10 (Sở GD Hải Phòng)" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'stats' | 'honor'>('search');
  const [sbdInput, setSbdInput] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState<string>('');
  const [searchedProfile, setSearchedProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Config point calculation system: hs1 (co-efficient 1) or hs2 (Math, Lit co-efficient 2)
  const [configScore, setConfigScore] = useState<'hs1' | 'hs2'>('hs1');

  // Interactive editing scores states for student
  const [editedToan, setEditedToan] = useState<number>(0);
  const [editedVan, setEditedVan] = useState<number>(0);
  const [editedAnh, setEditedAnh] = useState<number>(0);
  const [editedMonTu, setEditedMonTu] = useState<number>(0);
  const [editedMonChuyen, setEditedMonChuyen] = useState<number>(0);
  const [editedPriority, setEditedPriority] = useState<number>(0);

  // Generate security captcha
  const rollCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    rollCaptcha();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const cleanSbd = sbdInput.trim();
    if (!cleanSbd) {
      setSearchError("Vui lòng điền Số báo danh hành chính.");
      return;
    }
    if (cleanSbd.length < 5 || cleanSbd.length > 8 || /\D/.test(cleanSbd)) {
      setSearchError("Số báo danh tuyển sinh lớp 10 phải có từ 5 đến 8 số.");
      return;
    }

    const cleanCaptcha = captchaInput.trim().toUpperCase();
    if (!cleanCaptcha) {
      setSearchError("Hệ thống bảo mật yêu cầu nhập Mã xác nhận.");
      return;
    }
    if (cleanCaptcha !== generatedCaptcha) {
      setSearchError("Mã bảo mật chưa chính xác. Vui lòng thử lại!");
      rollCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search-sbd/${cleanSbd}`);
      const result = await res.json();
      if (result.success) {
        setSearchedProfile(result.data);
        // Set interactive editor points from searched profile
        const p = result.data as StudentProfile;
        setEditedToan(p.scores.toan);
        setEditedVan(p.scores.van);
        setEditedAnh(p.scores.ngoaiNgu);
        setEditedMonTu(p.scores.monThuTu || 0);
        setEditedMonChuyen(p.scores.monChuyen || 0);
        setEditedPriority(p.priorityPoints || 0);
      } else {
        setSearchError(result.error || "Không tìm thấy dữ liệu ứng với Số báo danh này.");
      }
    } catch (err) {
      setSearchError("Hệ thống quá tải hoặc mất mạng cục bộ. Thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (sbd: string) => {
    setSbdInput(sbd);
    setCaptchaInput(generatedCaptcha); // auto-complete for fast testing
    setSearchError(null);
  };

  // Helper calculation for admission reactive to state edits
  const getReactiveScores = () => {
    if (!searchedProfile) return null;

    // Check lie points
    const isLiePoint = editedToan <= 1.0 || editedVan <= 1.0 || editedAnh <= 1.0;

    const baseSum = editedToan + editedVan + editedAnh + (searchedProfile.scores.monThuTu ? editedMonTu : 0);
    const examScore = configScore === 'hs1' 
      ? baseSum
      : (editedToan * 2 + editedVan * 2 + editedAnh + (searchedProfile.scores.monThuTu ? editedMonTu : 0));

    const finalTotalScore = examScore + editedPriority;
    const roundedScore = Math.round(finalTotalScore * 100) / 100;

    // Benchmarks adjusted for hs1/hs2 multiplier
    const multiplier = configScore === 'hs2' ? 1.65 : 1.0;
    const nv1Bench = Math.round(searchedProfile.nv1Benchmark * multiplier * 100) / 100;
    const nv2Bench = Math.round(searchedProfile.nv2Benchmark * multiplier * 100) / 100;
    const nv3Bench = Math.round(searchedProfile.nv3Benchmark * multiplier * 100) / 100;

    let isAdmittedNv1 = false;
    let isAdmittedNv2 = false;
    let isAdmittedNv3 = false;
    let statusText = '';
    let statusBadgeClassName = '';

    if (isLiePoint) {
      statusText = 'Không trúng tuyển vì có môn dính điểm liệt (≤ 1.0 điểm)';
      statusBadgeClassName = 'bg-red-50 text-red-800 border-red-200';
    } else {
      if (roundedScore >= nv1Bench) {
        isAdmittedNv1 = true;
        statusText = `Trúng tuyển chính thức vào Nguyện vọng 1: THPT ${searchedProfile.nv1School}! ✨`;
        statusBadgeClassName = 'bg-emerald-50 text-emerald-800 border-emerald-250';
      } else if (roundedScore >= nv2Bench) {
        isAdmittedNv2 = true;
        statusText = `Trúng tuyển chính thức vào Nguyện vọng 2: THPT ${searchedProfile.nv2School}! ✨`;
        statusBadgeClassName = 'bg-blue-50 text-blue-800 border-blue-200';
      } else if (roundedScore >= nv3Bench) {
        isAdmittedNv3 = true;
        statusText = `Trúng tuyển chính thức vào Nguyện vọng 3: THPT ${searchedProfile.nv3School}! ✨`;
        statusBadgeClassName = 'bg-sky-50 text-sky-800 border-sky-150';
      } else {
        statusText = 'Chưa đạt điểm trúng tuyển vào các NV công lập thường đợt 1.';
        statusBadgeClassName = 'bg-amber-50 text-amber-800 border-amber-250';
      }
    }

    // Check Specialty if registration
    let isAdmittedSpecialty = false;
    let specialtyScore = 0;
    let specialtyBenchAdjusted = searchedProfile.specialtyBenchmark || 38.0;

    if (searchedProfile.hasSpecialty) {
      specialtyScore = editedToan + editedVan + editedAnh + (editedMonChuyen * 2);
      // specialty standards usually out of 50, stays fixed as hs1 is commonly used for chuyên
      const specMult = configScore === 'hs2' ? 1.0 : 0.8;
      specialtyBenchAdjusted = Math.round(specialtyBenchAdjusted * specMult * 100) / 100;
      isAdmittedSpecialty = !isLiePoint && specialtyScore >= specialtyBenchAdjusted;
    }

    return {
      roundedScore,
      isLiePoint,
      isAdmittedNv1,
      isAdmittedNv2,
      isAdmittedNv3,
      statusText,
      statusBadgeClassName,
      nv1Bench,
      nv2Bench,
      nv3Bench,
      isAdmittedSpecialty,
      specialtyScore,
      specialtyBenchAdjusted
    };
  };

  const reactiveVal = getReactiveScores();

  // Handle score value keyboard/slider inputs correctly
  const enforceScoreRange = (val: string, maxLimit = 10): number => {
    let num = parseFloat(val) || 0;
    if (num < 0) num = 0;
    if (num > maxLimit) num = maxLimit;
    return Math.round(num * 100) / 100;
  };

  return (
    <div className="min-h-screen bg-sky-50/10 flex flex-col justify-between font-sans selection:bg-blue-800 selection:text-white">
      {/* Official Blue Theme Header */}
      <Header />

      {/* Navigation Tabs Bar - Blue styled */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-start gap-4 sm:gap-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 py-4 px-1.5 border-b-2 text-xs sm:text-sm font-extrabold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'search' 
                  ? 'border-blue-800 text-blue-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Search className="w-4.5 h-4.5" />
              Tra cứu & Cập nhật điểm thi lớp 10
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 py-4 px-1.5 border-b-2 text-xs sm:text-sm font-extrabold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'stats' 
                  ? 'border-blue-800 text-blue-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              Phổ điểm tuyển sinh
            </button>
            <button
              onClick={() => setActiveTab('honor')}
              className={`flex items-center gap-2 py-4 px-1.5 border-b-2 text-xs sm:text-sm font-extrabold transition-all uppercase tracking-wider cursor-pointer ${
                activeTab === 'honor' 
                  ? 'border-blue-800 text-blue-900' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Trophy className="w-4.5 h-4.5 text-amber-500 fill-amber-50" />
              Bảng vàng thủ khoa lớp 10
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {activeTab === 'search' && (
          <div className="flex flex-col gap-8">
            
            {/* Lookup controls section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form box */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-150 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
                    <FileText className="w-5.5 h-5.5 text-blue-800" />
                    Nhập thông tin tra điểm tuyển sinh 10 THPT
                  </h2>

                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* SBD Input */}
                      <div>
                        <label htmlFor="sbd-field" className="block text-xs font-bold text-gray-750 uppercase tracking-wider mb-1.5">
                          Số báo danh (SBD): <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="sbd-field"
                            type="text"
                            maxLength={8}
                            placeholder="Nhập chữ số SBD..."
                            value={sbdInput}
                            onChange={(e) => setSbdInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 pl-3 pr-10 text-sm font-bold tracking-widest text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 focus:bg-white"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                            <User className="w-4 h-4 text-blue-805" />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic mt-1 font-medium">VD: 123456 (SBD thí sinh thi chuyên mẫu)</p>
                      </div>

                      {/* Security Captcha input */}
                      <div>
                        <label htmlFor="captcha-field" className="block text-xs font-bold text-gray-750 uppercase tracking-wider mb-1.5">
                          Mã bảo mật chống spam: <span className="text-red-600">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="captcha-field"
                            type="text"
                            placeholder="Mã bên phải..."
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-305 rounded-lg py-2.5 px-3 text-sm font-bold uppercase tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:bg-white"
                          />
                          
                          {/* Captcha box */}
                          <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-305 rounded-lg px-2.5 shadow-inner select-none relative overflow-hidden">
                            <span className="font-mono text-sm font-black tracking-widest text-blue-900 line-through decoration-gray-450 decoration-2 italic rotate-1 px-1">
                              {generatedCaptcha}
                            </span>
                            
                            <button
                              type="button"
                              onClick={rollCaptcha}
                              title="Tải lại mã bảo mật"
                              className="text-gray-550 hover:text-blue-900 transition-colors cursor-pointer outline-none border-none"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">Nhập đúng các ký tự viết hoa bên cạnh.</p>
                      </div>

                    </div>

                    {searchError && (
                      <div className="bg-red-50 border border-red-200 text-red-900 rounded-lg p-3 text-xs flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                        <span>{searchError}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto bg-blue-805 hover:bg-blue-900 disabled:bg-gray-400 text-white font-extrabold text-sm uppercase py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer select-none active:scale-95"
                      >
                        {loading ? (
                          <>
                            <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang kết nối cơ sở dữ liệu...
                          </>
                        ) : (
                          <>
                            <Search className="w-4.5 h-4.5 text-amber-300" />
                            Tìm kiếm hồ sơ
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>

              {/* Sample Profiles sidebar */}
              <div className="bg-linear-to-b from-blue-900 to-indigo-950 text-white rounded-xl p-5 border border-sky-850 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-amber-300 font-extrabold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Thí sinh mô phỏng khảo sát nhanh
                  </h3>
                  <p className="text-[11px] text-slate-205 mt-2.5 leading-relaxed">
                    Hệ thống lưu vết hàng vạn dữ liệu. Nhấp trực tiếp vào tên thí sinh tiêu biểu bên dưới để kiểm thử tính năng **cập nhật điều chỉnh điểm tự sinh**:
                  </p>
                </div>

                <div className="space-y-2.5 mt-5">
                  {PRESET_SBDS.map((item) => (
                    <button
                      key={item.sbd}
                      onClick={() => handlePresetClick(item.sbd)}
                      className="w-full text-left bg-blue-950/60 hover:bg-blue-800/40 border border-sky-900/60 hover:border-amber-300/40 p-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-105 group-hover:text-amber-200 transition-colors">
                          SBD {item.sbd} • {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.tag}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-300 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Results interactive display */}
            {searchedProfile && reactiveVal ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                
                {/* Score details & live slider edits - taking 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* General details matching blue theme */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-150 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-150 pb-4 mb-4">
                      <div>
                        <span className="bg-blue-50 text-blue-900 font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-100">
                          {searchedProfile.provinceName}
                        </span>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-1.5 font-sans">
                          {searchedProfile.fullName}
                        </h3>
                        <p className="text-xs text-blue-900/80 font-semibold font-mono mt-0.5">Số báo danh tuyển sinh: {searchedProfile.sbd}</p>
                      </div>

                      {/* Score Result Admitted logic */}
                      <div className="shrink-0">
                        <div className={`border rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-xs ${reactiveVal.statusBadgeClassName}`}>
                          {reactiveVal.isLiePoint ? (
                            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                          ) : (reactiveVal.isAdmittedNv1 || reactiveVal.isAdmittedNv2 || reactiveVal.isAdmittedNv3 ? (
                            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                          ) : (
                            <BadgeHelp className="w-6 h-6 text-amber-500 shrink-0" />
                          ))}
                          
                          <div>
                            <p className="text-[10px] uppercase font-mono font-bold tracking-wider opacity-90">Kết Quả Đỗ Trượt Toàn Diện</p>
                            <p className="text-lg font-black leading-none mt-1 font-mono">
                              {reactiveVal.roundedScore.toFixed(2)} điểm
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Target schools setup */}
                    <div className="grid grid-cols-3 gap-3 text-center mb-4">
                      <div className={`p-2.5 rounded-lg border ${reactiveVal.isAdmittedNv1 ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <p className="text-[9px] uppercase tracking-wider text-gray-400">Nguyện vọng 1</p>
                        <p className="text-xs font-black truncate mt-1">{searchedProfile.nv1School}</p>
                        <span className="text-[10px] font-mono mt-0.5 block">Chuẩn: {reactiveVal.nv1Bench}đ</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${reactiveVal.isAdmittedNv2 ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <p className="text-[9px] uppercase tracking-wider text-gray-400">Nguyện vọng 2</p>
                        <p className="text-xs font-black truncate mt-1">{searchedProfile.nv2School}</p>
                        <span className="text-[10px] font-mono mt-0.5 block">Chuẩn: {reactiveVal.nv2Bench}đ</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${reactiveVal.isAdmittedNv3 ? 'bg-sky-50 border-sky-300 text-sky-950 font-bold' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <p className="text-[9px] uppercase tracking-wider text-gray-400">Nguyện vọng 3</p>
                        <p className="text-xs font-black truncate mt-1">{searchedProfile.nv3School}</p>
                        <span className="text-[10px] font-mono mt-0.5 block">Chuẩn: {reactiveVal.nv3Bench}đ</span>
                      </div>
                    </div>

                    {/* Status Text Info Box */}
                    <div className={`px-4 py-3 rounded-lg border text-xs font-bold leading-normal flex items-start gap-2 ${
                      reactiveVal.isAdmittedNv1 ? 'bg-emerald-50 text-emerald-950 border-emerald-100' :
                      reactiveVal.isAdmittedNv2 ? 'bg-blue-50 text-blue-950 border-blue-100' :
                      reactiveVal.isAdmittedNv3 ? 'bg-sky-50 text-sky-950 border-sky-100' : 'bg-amber-50 text-amber-950 border-amber-100'
                    }`}>
                      <span className="bg-white/75 shadow-xs px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-widest text-slate-800 shrink-0">Thông tin:</span>
                      <span>{reactiveVal.statusText}</span>
                    </div>
                  </div>

                  {/* INTERACTIVE SCORE EDITOR PANEL (The requested feature: "điểm có thể cập nhật được") */}
                  <div className="bg-white rounded-xl shadow-md border-2 border-blue-600/35 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1">
                      <Edit3 className="w-3 h-3 animate-pulse" />
                      Điểm thi cập nhật được
                    </div>

                    <h4 className="text-sm font-black text-blue-950 uppercase tracking-wider border-b border-gray-150 pb-3 mb-5 flex items-center gap-1.5">
                      <RefreshCw className="w-4.5 h-4.5 text-blue-800 animate-spin" />
                      Hạt nhân chỉnh sửa điểm tự động và tính lại kết quả thi
                    </h4>
                    
                    <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
                      Em có thể **tự do kéo thanh trượt (slider) trái/phải** bên dưới để cập nhật điểm thi mong muốn cho các môn thi lớp 10. Điểm xét tuyển, tình trạng trúng tuyển đại công lập thường và lớp Chuyên sẽ tự động cập nhật ngay trên biểu đồ và bảng tư vấn!
                    </p>

                    <div className="space-y-5">
                      
                      {/* Math Score Slider */}
                      <div className="bg-slate-50/70 p-3.5 rounded-lg border border-gray-150 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1">
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                            Toán học {configScore === 'hs2' && <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 px-1 rounded">(Hệ số 2)</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min={0}
                              max={10}
                              step={0.25}
                              value={editedToan}
                              onChange={(e) => setEditedToan(enforceScoreRange(e.target.value))}
                              className="w-14 text-center bg-white border border-gray-300 rounded font-bold font-mono text-xs py-0.5 text-blue-900"
                            />
                            <span className="text-xs font-mono font-bold text-gray-400">/ 10</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.25"
                          value={editedToan}
                          onChange={(e) => setEditedToan(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                      </div>

                      {/* Literature Score Slider */}
                      <div className="bg-slate-50/70 p-3.5 rounded-lg border border-gray-150 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1">
                            <span className="w-2.5 h-2.5 bg-sky-650 rounded-full"></span>
                            Ngữ văn {configScore === 'hs2' && <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 px-1 rounded">(Hệ số 2)</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min={0}
                              max={10}
                              step={0.25}
                              value={editedVan}
                              onChange={(e) => setEditedVan(enforceScoreRange(e.target.value))}
                              className="w-14 text-center bg-white border border-gray-300 rounded font-bold font-mono text-xs py-0.5 text-blue-900"
                            />
                            <span className="text-xs font-mono font-bold text-gray-400">/ 10</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.25"
                          value={editedVan}
                          onChange={(e) => setEditedVan(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                        />
                      </div>

                      {/* English Score Slider */}
                      <div className="bg-slate-50/70 p-3.5 rounded-lg border border-gray-150 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1">
                            <span className="w-2.5 h-2.5 bg-indigo-650 rounded-full"></span>
                            Ngoại ngữ (Tiếng Anh)
                          </span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min={0}
                              max={10}
                              step={0.25}
                              value={editedAnh}
                              onChange={(e) => setEditedAnh(enforceScoreRange(e.target.value))}
                              className="w-14 text-center bg-white border border-gray-300 rounded font-bold font-mono text-xs py-0.5 text-blue-900"
                            />
                            <span className="text-xs font-mono font-bold text-gray-400">/ 10</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.25"
                          value={editedAnh}
                          onChange={(e) => setEditedAnh(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      {/* Specialty Score Slider (Render only if student is registered for Specialization) */}
                      {searchedProfile.hasSpecialty && (
                        <div className="p-3.5 rounded-lg bg-amber-50/30 border border-amber-250/70 relative">
                          <span className="absolute -top-2 right-4 bg-amber-500 text-white font-extrabold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                            Môn Chuyên x2
                          </span>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-300" />
                              Môn chuyên của em: <span className="text-blue-800 underline">{searchedProfile.specialtySubject}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min={0}
                                max={10}
                                step={0.25}
                                value={editedMonChuyen}
                                onChange={(e) => setEditedMonChuyen(enforceScoreRange(e.target.value))}
                                className="w-14 text-center bg-white border border-amber-305 rounded font-bold font-mono text-xs py-0.5 text-amber-900"
                              />
                              <span className="text-xs font-mono font-bold text-gray-450">/ 10</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.25"
                            value={editedMonChuyen}
                            onChange={(e) => setEditedMonChuyen(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      )}

                      {/* Optional fourth subject (like History) slider if exists */}
                      {searchedProfile.scores.monThuTu !== undefined && (
                        <div className="bg-slate-50/70 p-3.5 rounded-lg border border-gray-150 relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1">
                              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
                              Môn thi thứ tư (Lịch sử)
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min={0}
                                max={10}
                                step={0.1}
                                value={editedMonTu}
                                onChange={(e) => setEditedMonTu(enforceScoreRange(e.target.value))}
                                className="w-14 text-center bg-white border border-gray-300 rounded font-bold font-mono text-xs py-0.5 text-blue-900"
                              />
                              <span className="text-xs font-mono font-bold text-gray-400">/ 10</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={editedMonTu}
                            onChange={(e) => setEditedMonTu(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      )}

                      {/* Priority points slider */}
                      <div className="bg-slate-50/70 p-3.5 rounded-lg border border-gray-150 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-bold text-gray-800">Điểm cộng ưu tiên lớp 10</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs font-black text-slate-800">{editedPriority.toFixed(2)}</span>
                            <span className="text-[10px] text-gray-400">điểm</span>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          {[0, 0.5, 1.0, 1.5].map(pts => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => setEditedPriority(pts)}
                              className={`flex-grow py-1 px-2.5 border rounded-md text-xs font-bold transition-all cursor-pointer ${editedPriority === pts ? 'bg-blue-805 text-white border-blue-800 shadow-xs' : 'bg-white text-gray-650 hover:bg-gray-100'}`}
                            >
                              +{pts}đ
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Left side: Results Summary & Config point system - 1 col */}
                <div className="space-y-6">
                  
                  {/* CONFIGURATION SYSTEM CARD */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-150 p-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
                      <Settings className="w-4.5 h-4.5 text-slate-500" />
                      Quy chế tính điểm theo Khu vực
                    </h4>
                    <p className="text-[10.5px] text-gray-500 leading-normal mb-4">
                      Hệ thống tuyển sinh lớp 10 hỗ trợ cấu hình hệ số môn học để đồng bộ hóa quy chế riêng các tỉnh thành cả nước:
                    </p>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setConfigScore('hs1')}
                        className={`w-full text-left p-3 border rounded-xl transition-all cursor-pointer ${configScore === 'hs1' ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20' : 'bg-gray-50/50 border-gray-250 hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800">Thang 30đ chuẩn (Hệ số 1 toàn bộ):</span>
                          {configScore === 'hs1' && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Cơ chế áp dụng tại TP. Hồ Chí Minh & đa số các tỉnh thành lớn (Toán + Văn + Anh).</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfigScore('hs2')}
                        className={`w-full text-left p-3 border rounded-xl transition-all cursor-pointer ${configScore === 'hs2' ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20' : 'bg-gray-50/50 border-gray-250 hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800">Thang 50đ cũ (Nhân đôi Toán, Văn):</span>
                          {configScore === 'hs2' && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Áp dụng truyền thống tại Hà Nội và một số địa phương (Toán*2 + Văn*2 + Anh).</p>
                      </button>
                    </div>
                  </div>

                  {/* SECONDARY SPECIALTY RESULTS IF REGISTERED */}
                  {searchedProfile.hasSpecialty && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-150 p-6">
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-amber-500 fill-amber-100" />
                        Tuyển sinh chuyên: {searchedProfile.specialtySchool}
                      </h4>
                      <p className="text-[10.5px] text-gray-400 mt-0.5 leading-normal mb-4">
                        Điểm chuyên tự động tính toán (Toán + Văn + Anh + Môn Chuyên x 2):
                      </p>

                      <div className="p-3.5 bg-amber-50/20 border border-amber-250 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Hệ đào tạo Chuyên</span>
                          <h5 className="text-xs sm:text-sm font-black text-gray-900 mt-0.5">Chuyên {searchedProfile.specialtySubject}</h5>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-mono font-black text-amber-600">
                            {reactiveVal.specialtyScore.toFixed(2)}đ
                          </span>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-bold">Điểm chuẩn: {reactiveVal.specialtyBenchAdjusted}đ</p>
                        </div>
                      </div>

                      <div className={`mt-3.5 p-3 rounded-lg border text-[11px] font-bold text-center flex items-center justify-center gap-1.5 ${reactiveVal.isAdmittedSpecialty ? 'bg-emerald-50 text-emerald-850 border-emerald-200' : 'bg-amber-50 text-amber-850 border-amber-200'}`}>
                        {reactiveVal.isAdmittedSpecialty ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Đủ điểm chuẩn vào lớp Chuyên! 🏆
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Hiện chưa đạt điểm chuẩn lớp Chuyên
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ADMISSON REALTIME PROCESS METRICS */}
                  <div className="bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider border-b border-slate-800 pb-3 mb-4 flex items-center gap-1.5">
                        <GraduationCap className="w-5 h-5 text-amber-400" />
                        Bản thống kê điểm danh nghĩa
                      </h4>
                      <p className="text-[10.5px] text-slate-350 leading-relaxed mb-4">
                        Sơ đồ điểm chuẩn và điểm thi đã hiệu chỉnh theo cấu hình hệ số:
                      </p>

                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-400">Điểm thi Toán học:</span>
                          <span className="font-bold">{editedToan.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-400">Điểm thi Ngữ văn:</span>
                          <span className="font-bold">{editedVan.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-400">Điểm thi Ngoại ngữ:</span>
                          <span className="font-bold">{editedAnh.toFixed(2)}</span>
                        </div>
                        {searchedProfile.scores.monThuTu !== undefined && (
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Môn thi thứ tư:</span>
                            <span className="font-bold">{editedMonTu.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-400">Điểm cộng ưu tiên:</span>
                          <span className="font-bold text-amber-300">+{editedPriority.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2.5 text-sm">
                          <span className="text-amber-200 font-bold uppercase tracking-wider">Tổng điểm xét tuyển:</span>
                          <span className="font-black text-amber-300 text-lg">{reactiveVal.roundedScore.toFixed(2)}đ</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-center gap-2 mt-6">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-500 shrink-0" />
                      <p className="text-[10px] text-slate-400 leading-normal font-medium">
                        Khi em kéo thanh slider làm điểm thi cập nhật, hãy rà soát mục **Tư vấn AI** để nhận chiến thuật chọn trường mới chính xác nhất!
                      </p>
                    </div>
                  </div>

                </div>

                {/* AI advice counselor panel */}
                <div className="lg:col-span-3">
                  <AICounselor profile={searchedProfile} configScore={configScore} />
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-150 p-8 text-center flex flex-col items-center justify-center gap-3">
                <BadgeHelp className="w-12 h-12 text-gray-300" />
                <h4 className="font-bold text-gray-950 text-base">Cổng tuyển sinh chờ tra cứu...</h4>
                <p className="text-xs text-gray-550 max-w-sm mx-auto leading-relaxed mt-0.5">
                  Vui lòng nhập đúng Số báo danh (ví dụ SBD mẫu thi chuyên: **123456**) và nhập mã xác thực bảo mật ở bảng trên để xuất điểm tuyển sinh!
                </p>
              </div>
            )}

          </div>
        )}

        {/* Statistics Tab View - Blue styled list inside */}
        {activeTab === 'stats' && (
          <ScoreChart />
        )}

        {/* Honor Roll Tab View - Blue styled list inside */}
        {activeTab === 'honor' && (
          <TopScorers />
        )}

      </main>

      {/* Footer Vietnamese Official Blue theme matching */}
      <footer id="app-footer" className="w-full bg-slate-900 text-gray-400 py-8 border-t border-slate-800 text-xs mt-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-800 pb-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Landmark className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm uppercase">Cổng dịch vụ công Sở GD&ĐT</span>
              </div>
              <p className="text-slate-400 leading-normal">
                Bản quyền vận hành và cấp phép cơ sở dữ liệu thuộc các Sở Giáo dục và Đào tạo Việt Nam. Chịu trách nhiệm bảo trì bởi Cổng thông tin thi THPT & Đại học quốc gia.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-white text-sm uppercase">Thông tin liên hệ:</span>
              <ul className="space-y-1 text-slate-400">
                <li>Hotline tổng đài Sở GD: <span className="font-bold text-gray-305">1900 6888</span> (Giờ hành chính)</li>
                <li>Email liên hệ: <span className="font-bold text-gray-305">tuyensinh10@edu.vn</span></li>
                <li>Học tập & Hướng nghiệp trực quan số hóa.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-white text-sm uppercase">Cam kết cổng bảo mật:</span>
              <p className="text-slate-400 leading-normal">
                Dữ liệu tra cứu được trích xuất gốc từ các đợt công bố của Phòng Khảo thí 63 tỉnh cả nước. Điểm số cập nhật thử nghiệm chỉ có hiệu lực học thuật và hướng nghiệp cá nhân riêng cho học sinh.
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
            <p className="text-slate-500">
              © {new Date().getFullYear()} MOET Vietnam. Bảo lưu hoàn toàn quyền công bố dữ liệu số hóa liên kết.
            </p>
            <div className="flex items-center gap-4 text-slate-500">
              <a href="#" className="hover:text-amber-400 transition-colors">Điều khoản cổng</a>
              <span>|</span>
              <a href="#" className="hover:text-amber-400 transition-colors">Bảo mật dữ liệu học sinh</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
