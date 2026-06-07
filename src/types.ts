export interface SubjectScores {
  toan: number;          // Toán
  van: number;           // Ngữ văn
  ngoaiNgu: number;      // Ngoại ngữ (Tiếng Anh/Tiếng Pháp/Tiếng Trung...)
  monThuTu?: number;     // Môn thi thứ 4 (nếu có, ví dụ Lịch sử)
  monChuyen?: number;    // Điểm môn chuyên (nếu đăng ký thi Chuyên)
}

export interface StudentProfile {
  sbd: string;            // Số báo danh (6 kí tự số)
  fullName: string;      // Tên thí sinh
  provinceCode: string;  // Mã tỉnh
  provinceName: string;  // Tên tỉnh thành
  scores: SubjectScores;
  priorityPoints: number;// Điểm ưu tiên tuyển sinh lớp 10 (0, 0.5, 1.0, 1.5)
  
  // Nguyện vọng xét tuyển công lập thường
  nv1School: string;     // Tên trường THPT NV1
  nv1Benchmark: number;  // Điểm chuẩn NV1
  nv2School: string;     // Tên trường THPT NV2
  nv2Benchmark: number;  // Điểm chuẩn NV2 (thường cao hơn NV1 từ 0.5 - 1.0 - 1.5 điểm)
  nv3School: string;     // Tên trường THPT NV3
  nv3Benchmark: number;  // Điểm chuẩn NV3
  
  // Nguyện vọng thi chuyên (nếu có)
  hasSpecialty: boolean;
  specialtySchool?: string;   // Tên trường Chuyên (ví dụ: THPT Chuyên Hà Nội - Amsterdam)
  specialtySubject?: string;  // Môn chuyên đăng ký (ví dụ: Toán, Tin, Tiếng Anh)
  specialtyBenchmark?: number; // Điểm chuẩn chuyên
}

export interface StatisticsData {
  subject: string;
  label: string;
  average: number;
  median: number;
  distribution: { score: string; percentage: number }[];
}

export interface AIAdviceRequest {
  sbd: string;
  preferences?: string; // Sở thích của bản thân (Ví dụ: khối A hướng tự nhiên, mê ngoại ngữ, làm kinh doanh...)
  schoolPreference?: 'CongLap' | 'DanLap' | 'Chuyen' | 'ThoiGianRanh';
}

export interface AIAdviceResponse {
  analysis: string; // Phân tích năng lực tổng quát qua điểm thi 10
  suggestedPathways: Array<{
    title: string;       // NV trúng tuyển đề xuất hoặc Lộ trình dự phòng
    schoolName: string;   // Tên trường gợi ý
    reason: string;       // Vì sao trường này/lộ trình này tối ưu
    suitability: string;  // Mức độ ăn khớp ('Tuyệt vời' | 'Phù hợp' | 'Thử thách')
  }>;
  actionPlan: string;    // Kế hoạch học tập rèn luyện 3 năm cấp 3 tiếp theo
  encouragement: string; // Lời khâm phục, động viên truyền cảm hứng
}
