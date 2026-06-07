import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Landmark, ShieldCheck } from 'lucide-react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Formatted VN time or local time format
      const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'full',
        timeStyle: 'medium',
      });
      setCurrentTime(formatter.format(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="app-header" className="w-full bg-linear-to-r from-sky-800 via-blue-900 to-indigo-950 border-b-4 border-amber-400 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="bg-sky-50 p-2.5 rounded-full border-2 border-amber-300 text-blue-900 shadow-md">
              <Landmark className="w-10 h-10" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                Cổng dịch vụ công quốc gia - Sở GD&ĐT
              </p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-amber-100 drop-shadow-sm font-sans">
                Hệ thống Tuyển sinh vào lớp 10 THPT
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 font-medium tracking-wide">
                Tra cứu điểm thi • Cập nhật điểm thử nghiệm • Dự báo đỗ trượt Nguyện vọng & Chuyên thông minh AI
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1.5 bg-blue-950/45 px-4 py-2.5 rounded-lg border border-sky-700/60 shadow-inner">
            <div className="flex items-center gap-2 text-sm text-amber-300 font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4 animate-pulse text-amber-300" />
              <span>Thời gian hệ thống (HN)</span>
            </div>
            <p className="text-xs font-mono text-gray-100 font-medium">
              {currentTime || "Đang kết nối..."}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cơ sở Dữ liệu Bản đồ Tuyển sinh số hóa</span>
            </div>
          </div>

        </div>
      </div>
      
      {/* Visual decorative ribbon representing VN national flag colors */}
      <div className="h-1 w-full bg-linear-to-r from-amber-400 via-sky-500 to-amber-400"></div>
    </header>
  );
}
