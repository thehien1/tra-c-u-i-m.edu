import React, { useState } from 'react';
import { Award, Medal, Search, Star, Trophy } from 'lucide-react';

interface Scorer {
  rank: number;
  sbd: string;
  name: string;
  province: string;
  totalScore: number;
  details: string;
  targetSchool: string;
}

const SCORERS_BY_BLOCK: Record<string, Scorer[]> = {
  "Đại Trà": [
    { rank: 1, sbd: "123477", name: "ĐẶNG HOÀNG BÁCH", province: "Sở GD&ĐT Hà Nội", totalScore: 29.50, details: "Toán: 10.0 | Ngữ văn: 9.50 | Tiếng Anh: 10.0", targetSchool: "THPT Chu Văn An" },
    { rank: 2, sbd: "654388", name: "NGUYỄN MINH ANH", province: "Sở GD&ĐT TP. Hồ Chí Minh", totalScore: 29.25, details: "Toán: 9.75 | Ngữ văn: 9.50 | Tiếng Anh: 10.0", targetSchool: "THPT Nguyễn Thượng Hiền" },
    { rank: 3, sbd: "111300", name: "TRẦN MAI KHÁNH", province: "Sở GD&ĐT Hải Phòng", totalScore: 28.75, details: "Toán: 9.50 | Ngữ văn: 9.25 | Tiếng Anh: 10.0", targetSchool: "THPT Ngô Quyền" },
    { rank: 4, sbd: "333555", name: "VŨ THẾ LONG", province: "Sở GD&ĐT Đà Nẵng", totalScore: 28.50, details: "Toán: 9.75 | Ngữ văn: 9.00 | Tiếng Anh: 9.75", targetSchool: "THPT Phan Châu Trinh" },
  ],
  "Chuyên Toán": [
    { rank: 1, sbd: "123456", name: "PHẠM MINH HOÀNG", province: "Sở GD&ĐT Hà Nội", totalScore: 47.00, details: "Toán: 9.75 | Văn: 8.5 | Anh: 9.8 | Toán Chuyên: 9.25 (*2)", targetSchool: "Chuyên HN - Amsterdam" },
    { rank: 2, sbd: "555122", name: "ĐÀO TRUNG KIÊN", province: "Sở GD&ĐT TP. Hồ Chí Minh", totalScore: 46.25, details: "Toán: 10.0 | Văn: 8.0 | Anh: 9.25 | Toán Chuyên: 9.50 (*2)", targetSchool: "Chuyên Lê Hồng Phong" },
    { rank: 3, sbd: "102938", name: "LÊ HOÀNG YÊN", province: "Sở GD&ĐT Đồng Nai", totalScore: 45.50, details: "Toán: 9.50 | Văn: 8.25 | Anh: 9.50 | Toán Chuyên: 9.12 (*2)", targetSchool: "Chuyên Lương Thế Vinh" },
  ],
  "Chuyên Anh": [
    { rank: 1, sbd: "209412", name: "LÊ QUỲNH CHI", province: "Sở GD&ĐT Hà Nội", totalScore: 48.10, details: "Toán: 9.50 | Văn: 9.00 | Anh: 10.0 | Anh Chuyên: 9.80 (*2)", targetSchool: "Chuyên HN - Amsterdam" },
    { rank: 2, sbd: "304918", name: "PHẠM MINH KHUÊ", province: "Sở GD&ĐT TP. Hồ Chí Minh", totalScore: 47.30, details: "Toán: 9.25 | Văn: 8.75 | Anh: 10.0 | Anh Chuyên: 9.65 (*2)", targetSchool: "Chuyên Trần Đại Nghĩa" },
  ],
  "Chuyên Văn": [
    { rank: 1, sbd: "654321", name: "NGUYỄN THỊ MAI LAM", province: "Sở GD&ĐT TP. Hồ Chí Minh", totalScore: 46.85, details: "Toán: 8.50 | Văn: 9.25 | Anh: 9.60 | Văn Chuyên: 9.75 (*2)", targetSchool: "Chuyên Lê Hồng Phong" },
    { rank: 2, sbd: "405191", name: "HÀ THU PHƯƠNG", province: "Sở GD&ĐT Đà Nẵng", totalScore: 44.90, details: "Toán: 8.00 | Văn: 9.50 | Anh: 9.40 | Văn Chuyên: 9.00 (*2)", targetSchool: "Chuyên Lê Quý Đôn" },
  ]
};

export default function TopScorers() {
  const [selectedBlock, setSelectedBlock] = useState<string>("Đại Trà");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const currentScorers = SCORERS_BY_BLOCK[selectedBlock] || [];
  
  const filteredScorers = currentScorers.filter(scorer => 
    scorer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scorer.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scorer.sbd.includes(searchTerm)
  );

  return (
    <div id="honor-roll" className="bg-white rounded-xl shadow-md border border-gray-100 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5.5 h-5.5 text-amber-500 fill-amber-100 animate-bounce" />
            Bảng Vàng Vinh Danh Thủ Khoa Lớp 10 THPT
          </h2>
          <p className="text-xs text-gray-550 mt-1">
            Tôn vinh các sĩ tử xuất chúng có thành tích cao phục vụ tuyển dụng hướng nghiệp lớp 10 nâng cao vùng miền.
          </p>
        </div>

        {/* Block Toggles */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
          {Object.keys(SCORERS_BY_BLOCK).map(block => (
            <button
              key={block}
              onClick={() => {
                setSelectedBlock(block);
                setSearchTerm("");
              }}
              className={`text-xs font-bold px-3 py-2 rounded-md transition-all cursor-pointer ${selectedBlock === block ? 'bg-blue-805 text-white shadow-xs' : 'text-gray-600 hover:text-gray-950'}`}
            >
              Hệ {block}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Banner Column with Blue style matching the header */}
        <div className="xl:w-1/3 bg-linear-to-b from-blue-900 to-indigo-950 text-white rounded-xl p-5 border-2 border-amber-300 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Trophy className="w-48 h-48 text-amber-400" />
          </div>
          
          <div className="z-10">
            <div className="flex items-center gap-1.5 mb-3 bg-blue-800/60 p-2 rounded-lg border border-sky-600 w-fit">
              <Award className="w-4.5 h-4.5 text-amber-300" />
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-100">Bảng Vàng Danh Dự</span>
            </div>
            
            <h3 className="text-lg font-bold uppercase tracking-tight text-amber-200">
              Vinh danh thủ khoa tuổi 15
            </h3>
            <p className="text-xs text-slate-200 mt-2 leading-relaxed">
              Vượt qua hàng chục nghìn thí sinh tranh suất vào các trường THPT Chuyên & Công lập tiếng tăm, tinh hoa trí tuệ của thế hệ học sinh mới đã ghi dấu cực kỳ ấn tượng.
            </p>
          </div>

          <div className="mt-8 pt-5 border-t border-sky-700/60 z-10">
            <p className="text-[11px] font-sans font-semibold text-slate-350">Mốc tổng điểm cao nhất ({selectedBlock}):</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-300 font-mono">
                {(currentScorers[0]?.totalScore || 29.0).toFixed(2)}
              </span>
              <span className="text-xs text-sky-200 font-semibold">Điểm bứt phá kỷ lục</span>
            </div>
          </div>
        </div>

        {/* Table Column */}
        <div className="xl:w-2/3 flex flex-col gap-4">
          {/* Quick Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm thủ khoa lớp 10 bằng Tên, Trường THPT hoặc Sở GD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {/* List display */}
          {filteredScorers.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 text-sm">
              Không tìm thấy sĩ tử vinh danh phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-150 rounded-xl">
              <table className="min-w-full divide-y divide-gray-100 text-left">
                <thead className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-center w-20">Thứ hạng</th>
                    <th scope="col" className="px-4 py-3">SBD & Họ Tên</th>
                    <th scope="col" className="px-4 py-3">Sở GD quản lý</th>
                    <th scope="col" className="px-4 py-3 text-right">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredScorers.map((scorer) => (
                    <tr key={scorer.sbd} className="hover:bg-gray-55/40 transition-colors">
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          {scorer.rank === 1 ? (
                            <Medal className="w-6.5 h-6.5 text-amber-500 fill-amber-100" />
                          ) : scorer.rank === 2 ? (
                            <Medal className="w-6 h-6 text-slate-400 fill-slate-50" />
                          ) : scorer.rank === 3 ? (
                            <Medal className="w-5.5 h-5.5 text-amber-600 fill-amber-50" />
                          ) : (
                            <span className="font-semibold text-gray-500 font-mono w-6 text-center">{scorer.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-900 tracking-tight text-xs sm:text-sm">
                            {scorer.name}
                          </span>
                          {scorer.rank === 1 && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="font-mono text-[10px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>SBD: {scorer.sbd}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-800 font-semibold">{scorer.details}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-blue-800 font-bold bg-blue-50 px-1 rounded">Mục tiêu: {scorer.targetSchool}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs sm:text-sm">
                        {scorer.province}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-black text-blue-800 text-sm sm:text-base">
                        {scorer.totalScore.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
