import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { generateStudentProfile, generateSubjectDistribution } from "./src/utils/scoreGenerator";
import { StudentProfile, AIAdviceResponse } from "./src/types";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini API Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: SBD Search for Grade 10
  app.get("/api/search-sbd/:sbd", (req, res) => {
    try {
      const { sbd } = req.params;
      const profile = generateStudentProfile(sbd);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || "Lỗi không xác định." });
    }
  });

  // API 2: Score Distribution for Grade 10
  app.get("/api/statistics/:subject", (req, res) => {
    try {
      const { subject } = req.params;
      const stats = generateSubjectDistribution(subject);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(400).json({ success: false, error: "Không tìm thấy dữ liệu thống kê môn học tuyển sinh lớp 10." });
    }
  });

  // API 3: AI Consultation for Grade 10
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { sbd, preferences, schoolPreference, configScore } = req.body;
      if (!sbd) {
        return res.status(400).json({ success: false, error: "Số báo danh là bắt buộc." });
      }

      // Generate base profile
      const profile = generateStudentProfile(sbd);
      
      if (!ai) {
        return res.json({
          success: true,
          data: generateFallbackAdvice(profile, preferences, schoolPreference, configScore || 'hs1'),
          isFallback: true
        });
      }

      // Build text scores
      const scoresTxt = `Toán học: ${profile.scores.toan}, Ngữ văn: ${profile.scores.van}, Ngoại ngữ: ${profile.scores.ngoaiNgu}` + 
        (profile.scores.monThuTu ? `, Môn thứ tư: ${profile.scores.monThuTu}` : '') + 
        (profile.scores.monChuyen ? `, Môn Chuyên đăng ký: ${profile.scores.monChuyen}` : '');

      const prompt = `Bạn là Trợ lý Tư vấn Tuyển sinh vào Lớp 10 THPT thông minh thuộc Cục Quản lý chất lượng & Sở Giáo dục Việt Nam.
Hãy giúp học sinh có Số báo danh: ${profile.sbd} phân tích điểm thi tuyển sinh lớp 10, định hướng đỗ trượt nguyện vọng thường/chuyên và gợi ý hướng đi lớp 10 tối ưu.

Thông tin học sinh:
- Họ và tên: ${profile.fullName}
- Sở GD&ĐT tỉnh thành: ${profile.provinceName}
- Điểm thi các môn: ${scoresTxt}
- Điểm ưu tiên tuyển sinh: ${profile.priorityPoints}
- Điểm thi Chuyên (nếu đăng ký): ${profile.scores.monChuyen ? `${profile.scores.monChuyen} môn ${profile.specialtySubject} vào trường ${profile.specialtySchool}` : "Không thi chuyên"}

Nguyện vọng Đăng ký và Điểm chuẩn đề xuất (Tính theo hệ số 1):
1. Nguyện vọng 1 Công lập: Trường ${profile.nv1School} (Điểm chuẩn: ${profile.nv1Benchmark})
2. Nguyện vọng 2 Công lập: Trường ${profile.nv2School} (Điểm chuẩn: ${profile.nv2Benchmark})
3. Nguyện vọng 3 Công lập: Trường ${profile.nv3School} (Điểm chuẩn: ${profile.nv3Benchmark})

Sở thích, xu hướng cá nhân học sinh: ${preferences || "Không có (Nhờ tư vấn tự động)"}
Nguyện vọng loại hình trường muốn học: ${schoolPreference === 'DanLap' ? 'Tư thục chất lượng cao/Quốc tế' : (schoolPreference === 'Chuyen' ? 'Trường chuyên học thuật' : 'Trường công lập bình thường')}

Yêu cầu đầu ra:
1. Phân tích chi tiết năng lực qua điểm số (đánh giá khả năng tư duy tự nhiên ở môn Toán, năng lực ngôn ngữ/xã hội ở văn/ngoại ngữ).
2. Đề xuất các lộ trình THPT khả thi nhất ứng với điểm số thực tế này (nhận định đỗ trượt trường nào dựa vào điểm số, tư vấn trường dân lập hoặc trung tâm nghề chất lượng cao trong trường hợp điểm mấp mé hoặc trượt công lập).
3. Đề ra kế hoạch hành động 3 năm cấp THPT (Lớp 10, 11, 12) chuẩn bị cho định hướng thi Đại học hoặc Du học tương lai.
4. Lời chúc và động viên sâu sắc, tình cảm để giảm bớt căng thẳng của kỳ thi chuyển cấp đầy cam go.

Trả về kiểu định dạng JSON thuần gốc khớp chính xác với cấu trúc sau:
{
  "analysis": "Phân tích cụ thể chi tiết về năng lực",
  "suggestedPathways": [
    {
      "title": "Tên nguyện vọng hoặc Lộ trình dự phòng (ví dụ: Trúng tuyển NV1, Thử sức trường Tư thục, v.v.)",
      "schoolName": "Tên trường THPT hướng đi tiếp theo gợi ý",
      "reason": "Giải thích chi tiết vì sao",
      "suitability": "Một trong ba giá trị: 'Tuyệt vời', 'Phù hợp', 'Thử thách'"
    }
  ],
  "actionPlan": "Kế hoạch hành động 3 năm lớp 10, 11, 12 chi tiết",
  "encouragement": "Lời chia sẻ, chúc mừng truyền động lực ấm áp"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              suggestedPathways: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    schoolName: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    suitability: { type: Type.STRING }
                  },
                  required: ["title", "schoolName", "reason", "suitability"]
                }
              },
              actionPlan: { type: Type.STRING },
              encouragement: { type: Type.STRING }
            },
            required: ["analysis", "suggestedPathways", "actionPlan", "encouragement"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json({ success: true, data: parsedData, isFallback: false });
    } catch (error: any) {
      console.error("Gemini Consultation Error:", error);
      res.status(500).json({ success: false, error: "Lỗi kết nối bộ não AI tuyển sinh 10. Đang tải phương thức dự phòng..." });
    }
  });

  // Vite server middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

// Fallback algorithm for offline/mock cases
function generateFallbackAdvice(profile: StudentProfile, preferences?: string, schoolPref?: string, configScore: 'hs1' | 'hs2' = 'hs1'): AIAdviceResponse {
  const { toan, van, ngoaiNgu, monThuTu, monChuyen } = profile.scores;
  
  // Calculate score base
  const hasLie = toan <= 1.0 || van <= 1.0 || ngoaiNgu <= 1.0;
  
  const rawSum = toan + van + ngoaiNgu + (monThuTu || 0);
  const examScore = configScore === 'hs1' 
    ? rawSum
    : (toan * 2 + van * 2 + ngoaiNgu + (monThuTu || 0));
    
  const totalScore = examScore + profile.priorityPoints;
  
  // Translate benchmarks
  const multiplier = configScore === 'hs2' ? 1.65 : 1.0;
  const nv1Benchmark = Math.round(profile.nv1Benchmark * multiplier * 100) / 100;
  const nv2Benchmark = Math.round(profile.nv2Benchmark * multiplier * 100) / 100;
  const nv3Benchmark = Math.round(profile.nv3Benchmark * multiplier * 100) / 100;

  const pathways = [];

  if (hasLie) {
    pathways.push({
      title: "Lộ trình 1: Tuyển sinh kết hợp học bạ vào Tư thục / Quốc tế",
      schoolName: "Các trường THPT ngoài công lập hoặc trường Quốc tế",
      reason: `SBD của em ghi nhận điểm thi có môn đạt điểm liệt (Toán: ${toan}, Văn: ${van}, Anh: ${ngoaiNgu} <= 1) nên không thể tham gia xét tuyển công lập. Các trường dân lập chất lượng cao xét học bạ kết hợp phỏng vấn sẽ là chìa khóa hoàn hảo nhất để tối ưu thời gian.`,
      suitability: "Tuyệt vời"
    });
    pathways.push({
      title: "Lộ trình 2: Tốt nghiệp THPT kết hợp Đào tạo nghề 9+",
      schoolName: "Các trường Cao đẳng Nghề, Trung cấp chuyên nghiệp liên kết",
      reason: `Mô hình 9+ giúp em vừa hoàn thành chương trình văn hóa THPT quốc gia rút gọn vừa lấy bằng Cao đẳng chính quy sau 3-4 năm, thích hợp phát triển sớm kỹ năng công nghệ hoặc thiết kế.`,
      suitability: "Phù hợp"
    });
  } else {
    // Check normal admission
    if (totalScore >= nv1Benchmark) {
      pathways.push({
        title: "Tuyển sinh chính thức: Đỗ Nguyện vọng 1 công lập!",
        schoolName: profile.nv1School,
        reason: `Điểm tuyển sinh của em là ${totalScore.toFixed(2)}đ (Điểm chuẩn NV1 là ${nv1Benchmark}đ). Em đã chính thức trúng tuyển vào lớp 10 trường cấp 3 hàng đầu mong ước!`,
        suitability: "Tuyệt vời"
      });
    } else if (totalScore >= nv2Benchmark) {
      pathways.push({
        title: "Tuyển sinh chính thức: Đỗ Nguyện vọng 2 công lập!",
        schoolName: profile.nv2School,
        reason: `Điểm tuyển sinh đạt ${totalScore.toFixed(2)}đ vượt mức điểm chuẩn NV2 (${nv2Benchmark}đ). Trường NV2 có môi trường sư phạm năng động, sẵn sàng giúp em bứt phá.`,
        suitability: "Phù hợp"
      });
    } else if (totalScore >= nv3Benchmark) {
      pathways.push({
        title: "Tuyển sinh chính thức: Đỗ Nguyện vọng 3 công lập!",
        schoolName: profile.nv3School,
        reason: `Trúng tuyển NV3 công lập kịp thời với điểm số ${totalScore.toFixed(2)}đ kế sát nút điểm chuẩn trường (${nv3Benchmark}đ). Hãy tự hào nắm bắt thời cơ học tập quý giá này.`,
        suitability: "Phù hợp"
      });
    } else {
      pathways.push({
        title: "Giải pháp dự phòng: THPT Tư thục bán trú",
        schoolName: "THPT FPT / THPT Lương Thế Vinh / THPT Marie Curie",
        reason: `Điểm thi đạt ${totalScore.toFixed(2)}đ chưa chạm điểm chuẩn công lập đã chọn. Các trường tư thục chất lượng cao với cơ sở vật chất năng động, tập trung tiếng Anh và CNTT chính là bệ phóng rực rỡ không thua kém trường công lập.`,
        suitability: "Tuyệt vời"
      });
      pathways.push({
        title: "Giải pháp dự phòng: Trung tâm GDNN - GDTX chất lượng cao",
        schoolName: "Trung tâm Giáo dục thường xuyên Quận/Huyện",
        reason: `Cơ cấu giảng dạy tập trung, giảm bớt môn phụ, tập trung ôn thi tổ hợp khối Đại học ngay từ lớp 10 với học phí tối giản.`,
        suitability: "Phù hợp"
      });
    }

    // Add specialty if registered
    if (profile.hasSpecialty && monChuyen) {
      const specBenchmark = profile.specialtyBenchmark || 38.0;
      const specMult = configScore === 'hs2' ? 1.0 : 0.8;
      const cleanSpecBench = Math.round(specBenchmark * specMult * 100) / 100;
      const specTotal = toan + van + ngoaiNgu + (monChuyen * 2); // Chuyên thường nhân đôi môn chuyên
      
      if (specTotal >= cleanSpecBench) {
        pathways.unshift({
          title: "Đặc tài xuất sắc: Trúng tuyển Lớp Chuyên THPT chuyên sâu!",
          schoolName: `${profile.specialtySchool} (Lớp Chuyên ${profile.specialtySubject})`,
          reason: `Tổng điểm xét Chuyên là ${specTotal.toFixed(2)}đ vượt điểm chuẩn lớp chuyên (${cleanSpecBench}đ). Môn Chuyên đạt ${monChuyen}. Đây là một thành tích đáng ngưỡng mộ!`,
          suitability: "Tuyệt vời"
        });
      } else {
        pathways.push({
          title: "Thử thách lớp Chuyên học thuật cận kề",
          schoolName: profile.specialtySchool || "Các trường THPT Chuyên tỉnh thành",
          reason: `Điểm xét Chuyên đạt ${specTotal.toFixed(2)}đ (Điểm chuẩn Chuyên là ${cleanSpecBench}đ). Môn chuyên đạt ${monChuyen} điểm cực kỳ tiềm năng, em có thể nộp đơn vào các hệ song bằng hoặc chất lượng cao của Chuyên.`,
          suitability: "Thử thách"
        });
      }
    }
  }

  // Generate action plan based on scores
  let actionPlan = "Hành trình 3 năm THPT sắp tới cần lên lộ trình chiến lược:\n";
  if (toan < 6) {
    actionPlan += "- Lớp 10: Tập trung xây dựng lại gốc rễ hình học và đại số cơ bản. Đăng ký học phụ đạo để không bị tụt lại.\n";
  } else {
    actionPlan += "- Lớp 10: Rèn luyện khả năng tư duy nâng cao, thử sức các mảng đề đại học sớm để xây dựng phản xạ logic.\n";
  }
  if (van < 6) {
    actionPlan += "- Lớp 10 & 11: Chăm đọc văn học hiện đại Việt Nam, cải thiện tư duy nghị luận xã hội qua việc cập nhật tin tức báo chí hàng tuần.\n";
  } else {
    actionPlan += "- Lớp 10 & 11: Phát triển viết lách có chiều sâu riêng, rèn kịch bản tư duy phân tích nghị luận sắc sảo.\n";
  }
  actionPlan += "- Lớp 11: Xác định rõ nét khối thi tuyển Đại học sau này (ví dụ: khối A00, D01, A01...) để tăng tốc ôn luyện nhóm môn mục tiêu.\n- Lớp 12: Đăng ký thi thử, luyện các chuyên đề bám sát đề thi tốt nghiệp THPT Quốc gia & Đánh giá năng lực ĐHQG.";

  return {
    analysis: `Xin chào ${profile.fullName}! Hệ thống đã tiếp nhận dữ liệu thi lớp 10 của em. Phân tích điểm chi tiết: Môn Toán của em đạt ${toan} điểm, Ngữ văn đạt ${van} điểm, và Ngoại ngữ đạt ${ngoaiNgu} điểm.` + 
      (preferences ? ` Phù hợp với thế mạnh mong muốn: ${preferences}.` : " Đây là phân khúc điểm tương đối đồng đều cho các mục tiêu THPT."),
    suggestedPathways: pathways,
    actionPlan: actionPlan,
    encouragement: `Tuyển sinh 10 là mốc ngoặt rất quan trọng của tuổi 15. Dù kết quả tốt hay nằm ngoài tính toán, phía trước em vẫn luôn rộng mở vô vàn lộ trường tươi sáng. Con đường THPT năng động, tự hào đang gọi tên em. Chúc ${profile.fullName} có 3 năm học cấp 3 thật trọn vẹn và rực rỡ!`
  };
}

startServer();
