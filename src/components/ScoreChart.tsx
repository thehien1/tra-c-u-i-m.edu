import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Users, Award, Percent } from 'lucide-react';

interface ChartPoint {
  score: string;
  percentage: number;
}

interface DistributionStats {
  subject: string;
  label: string;
  mean: number;
  median: number;
  distribution: ChartPoint[];
}

const STAT_SUBJECT_OPTIONS = [
  { value: "toan", label: "Môn Toán học" },
  { value: "van", label: "Môn Ngữ văn" },
  { value: "ngoaiNgu", label: "Môn Ngoại ngữ (Tiếng Anh)" },
  { value: "monChuyen", label: "Môn thi Chuyên lớp 10" },
];

export default function ScoreChart() {
  const [selectedSubject, setSelectedSubject] = useState<string>("toan");
  const [stats, setStats] = useState<DistributionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/statistics/${selectedSubject}`);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedSubject]);

  // Calculate students above 8.0 percentage and below 5.0
  let aboveEightPercent = 0;
  let belowFivePercent = 0;
  
  if (stats) {
    stats.distribution.forEach(p => {
      const scoreNum = parseFloat(p.score);
      if (scoreNum >= 8.0) aboveEightPercent += p.percentage;
      if (scoreNum < 5.0) belowFivePercent += p.percentage;
    });
  }

  return (
    <div id="stats-dashboard" className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5.5 h-5.5 text-blue-700" />
            Phổ điểm thi Tuyển sinh 10 Toàn tỉnh/thành
          </h2>
          <p className="text-xs text-gray-550 mt-1">
            Dữ liệu phổ điểm tổng hợp chính sách khảo thí và điều phối chỉ tiêu lớp 10 của các Sở Giáo dục & Đào tạo.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-gray-50 border border-gray-305 rounded-lg py-2 px-4 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
          >
            {STAT_SUBJECT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setChartType('area')}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${chartType === 'area' ? 'bg-white text-blue-800 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Phổ diện tích
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${chartType === 'bar' ? 'bg-white text-blue-800 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Cột đứng đứng
            </button>
          </div>
        </div>
      </div>

      {loading || !stats ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-750 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-550 font-medium">Đang biểu diễn chi tiết phổ điểm thi lớp 10...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
          {/* Main Chart Container */}
          <div className="lg:col-span-3 bg-gray-50 rounded-xl p-4 border border-gray-200/60 shadow-sm relative">
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-blue-105 text-blue-900 font-bold text-xs px-2.5 py-1 rounded-full border border-blue-200">
                Thống kê: {stats.label}
              </span>
            </div>
            
            <div className="h-88 sm:h-96 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart
                    data={stats.distribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0252a7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0252a7" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="score" 
                      stroke="#4b5563" 
                      tick={{ fontSize: 10, fontWeight: 'medium' }} 
                      interval={3}
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      tickFormatter={(v) => `${v}%`} 
                      tick={{ fontSize: 10, fontWeight: 'medium' }}
                    />
                    <Tooltip 
                      formatter={(v: number) => [`${v.toFixed(2)}%`, 'Tỉ lệ học sinh đạt']}
                      labelFormatter={(label) => `Điểm số: ${label}`}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#0252a7" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorPercentage)" 
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={stats.distribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="score" 
                      stroke="#4b5563" 
                      tick={{ fontSize: 10, fontWeight: 'medium' }} 
                      interval={3}
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      tickFormatter={(v) => `${v}%`} 
                      tick={{ fontSize: 10, fontWeight: 'medium' }}
                    />
                    <Tooltip 
                      formatter={(v: number) => [`${v.toFixed(2)}%`, 'Tỉ lệ học sinh đạt']}
                      labelFormatter={(label) => `Điểm số: ${label}`}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                    />
                    <Bar 
                      dataKey="percentage" 
                      fill="#0252a7" 
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            
            <p className="text-center text-[10px] sm:text-xs text-gray-500 font-medium italic mt-2">
              Trục ngang: Điểm thi 10 (0 - 10đ) | Trục đứng: Tỉ lệ phần trăm (%) học sinh trên toàn tỉnh thành
            </p>
          </div>

          {/* Quick Metrics Panels */}
          <div className="flex flex-col gap-4">
            
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex items-center gap-3 shadow-xs">
              <div className="bg-blue-105 p-2 text-blue-900 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-900/80 font-bold uppercase tracking-wider">Điểm Trung bình</p>
                <p className="text-2xl font-black text-blue-800">{stats.mean.toFixed(2)}đ</p>
                <span className="text-[10px] text-gray-500 font-medium">Trung bình kỳ vọng đại chúng</span>
              </div>
            </div>

            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-center gap-3 shadow-xs">
              <div className="bg-indigo-100 p-2 text-indigo-900 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-950/80 font-bold uppercase tracking-wider">Điểm Trung vị</p>
                <p className="text-2xl font-black text-indigo-850">{stats.median.toFixed(2)}đ</p>
                <span className="text-[10px] text-gray-500 font-medium">Cột mốc phân tách 50% học sinh</span>
              </div>
            </div>

            <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100 flex items-center gap-3 shadow-xs">
              <div className="bg-emerald-100 p-2 text-emerald-900 rounded-lg">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-900/80 font-bold uppercase tracking-wider">Khá Giỏi (≥ 8.0)</p>
                <p className="text-2xl font-black text-emerald-850">{aboveEightPercent.toFixed(1)}%</p>
                <span className="text-[10px] text-gray-500 font-medium">Cơ hội vào THPT Công lập Top đầu</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-gray-200 flex items-center gap-3 shadow-xs">
              <div className="bg-slate-200 p-2 text-slate-900 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-800 font-bold uppercase tracking-wider">Dưới trung bình (&lt; 5.0)</p>
                <p className="text-2xl font-black text-slate-700">{belowFivePercent.toFixed(1)}%</p>
                <span className="text-[10px] text-gray-500 font-medium">Cần bồi dưỡng học bạ phụ trợ</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
