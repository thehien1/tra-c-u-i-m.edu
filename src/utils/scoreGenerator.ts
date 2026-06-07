import { StudentProfile, SubjectScores } from '../types';
import { getProvinceName } from './provinceData';

const SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const MIDDLE_NAMES = ["Văn", "Thị", "Hữu", "Minh", "Đức", "Thế", "Khánh", "Hải", "Tuấn", "Hoài", "Phương", "Gia", "Thanh", "Ngọc", "Thu", "Xuân"];
const FIRST_NAMES_MALE = ["Anh", "Bình", "Chương", "Duy", "Đạt", "Hùng", "Hải", "Huy", "Khoa", "Lâm", "Long", "Minh", "Nam", "Phong", "Quang", "Sơn", "Tùng", "Vinh", "Khánh", "Phúc"];
const FIRST_NAMES_FEMALE = ["Vy", "Trang", "Linh", "Thảo", "Hà", "Phương", "Yến", "Lan", "Mai", "Hương", "Hồng", "Tú", "An", "Như", "Cúc", "Quỳnh", "Trúc", "Tuyết", "Nhung", "Nga"];

// Deterministic random generator based on string seed
export function seedRandom(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function() {
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return Math.abs(hash) / 4294967296;
  };
}

export function randomNormal(rand: () => number, mean: number, std: number, min = 0, max = 10): number {
  let u1 = rand();
  let u2 = rand();
  while (u1 === 0) u1 = rand();
  while (u2 === 0) u2 = rand();
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  let val = z0 * std + mean;
  
  if (val < min) val = min;
  if (val > max) val = max;
  return val;
}

// Schools list corresponding to regions
const HIGHSCHOOLS_BY_REGION: Record<string, Array<{ schoolName: string; benchmarkHs1: number; benchmarkHs2: number }>> = {
  // Northern Region / Ha Noi style (Benchmark for 40-50 pts with HS2, and 24-30 pts with HS1)
  "B": [
    { schoolName: "THPT Chu Văn An", benchmarkHs1: 26.50, benchmarkHs2: 43.25 },
    { schoolName: "THPT Kim Liên", benchmarkHs1: 25.25, benchmarkHs2: 41.50 },
    { schoolName: "THPT Yên Hòa", benchmarkHs1: 24.75, benchmarkHs2: 40.25 },
    { schoolName: "THPT Phan Đình Phùng", benchmarkHs1: 24.50, benchmarkHs2: 39.75 },
    { schoolName: "THPT Cầu Giấy", benchmarkHs1: 23.75, benchmarkHs2: 38.50 },
    { schoolName: "THPT Việt Đức", benchmarkHs1: 23.25, benchmarkHs2: 38.25 },
    { schoolName: "THPT Nhân Chính", benchmarkHs1: 22.50, benchmarkHs2: 37.00 },
    { schoolName: "THPT Phan Huy Chú", benchmarkHs1: 21.00, benchmarkHs2: 35.00 },
    { schoolName: "THPT Trần Hưng Đạo", benchmarkHs1: 19.50, benchmarkHs2: 32.50 },
    { schoolName: "THPT Đại Mỗ", benchmarkHs1: 16.50, benchmarkHs2: 27.50 }
  ],
  // Southern Region / HCM style (Benchmark out of 30 pts)
  "N": [
    { schoolName: "THPT Nguyễn Thị Minh Khai", benchmarkHs1: 24.25, benchmarkHs2: 40.50 },
    { schoolName: "THPT Gia Định", benchmarkHs1: 23.50, benchmarkHs2: 39.00 },
    { schoolName: "THPT Bùi Thị Xuân", benchmarkHs1: 23.00, benchmarkHs2: 38.25 },
    { schoolName: "THPT Trưng Vương", benchmarkHs1: 21.75, benchmarkHs2: 36.00 },
    { schoolName: "THPT Lương Thế Vinh", benchmarkHs1: 21.00, benchmarkHs2: 34.50 },
    { schoolName: "THPT Nguyễn Hữu Huân", benchmarkHs1: 20.50, benchmarkHs2: 33.75 },
    { schoolName: "THPT Nguyễn Thượng Hiền", benchmarkHs1: 25.25, benchmarkHs2: 42.00 },
    { schoolName: "THPT Phú Nhuận", benchmarkHs1: 22.00, benchmarkHs2: 36.50 },
    { schoolName: "THPT Marie Curie", benchmarkHs1: 18.50, benchmarkHs2: 30.00 },
    { schoolName: "THPT Gò Vấp", benchmarkHs1: 16.00, benchmarkHs2: 26.50 }
  ],
  // Central Region / Da Nang or other style
  "T": [
    { schoolName: "THPT Phan Châu Trinh", benchmarkHs1: 24.00, benchmarkHs2: 39.50 },
    { schoolName: "THPT Hoàng Hoa Thám", benchmarkHs1: 22.50, benchmarkHs2: 37.00 },
    { schoolName: "THPT Trần Phú", benchmarkHs1: 21.00, benchmarkHs2: 34.50 },
    { schoolName: "THPT Thái Phiên", benchmarkHs1: 19.75, benchmarkHs2: 32.00 },
    { schoolName: "THPT Nguyễn Hiền", benchmarkHs1: 17.50, benchmarkHs2: 29.00 },
    { schoolName: "THPT Ngô Quyền", benchmarkHs1: 16.00, benchmarkHs2: 26.00 }
  ]
};

// Helper for specialty config
const SPECIALTY_SCHOOLS = [
  { schoolName: "THPT Chuyên Hà Nội - Amsterdam", benchmark: 42.5 },
  { schoolName: "THPT Chuyên Nguyễn Huệ", benchmark: 39.0 },
  { schoolName: "THPT Chuyên Lê Hồng Phong TPHCM", benchmark: 41.5 },
  { schoolName: "THPT Chuyên Trần Đại Nghĩa TPHCM", benchmark: 40.0 },
  { schoolName: "THPT Chuyên Lê Quý Đôn Đà Nẵng", benchmark: 38.5 }
];

const SPECIALTY_SUBJECTS = ["Toán chuyên", "Tin học chuyên", "Ngữ văn chuyên", "Tiếng Anh chuyên", "Vật lí chuyên", "Hóa học chuyên"];

export function generateStudentProfile(sbd: string): StudentProfile {
  const cleanSbd = sbd.trim().replace(/\D/g, '');
  if (cleanSbd.length < 5 || cleanSbd.length > 8) {
    throw new Error('Số báo danh phải có độ dài từ 5 đến 8 kí tự chữ số.');
  }

  // Exemplars (Tập hợp các Preset SBD thí sinh mẫu để test nhanh)
  if (cleanSbd === '123456') {
    return {
      sbd: '123456',
      fullName: 'PHẠM MINH HOÀNG',
      provinceCode: '01',
      provinceName: 'Sở GD&ĐT Hà Nội',
      scores: {
        toan: 9.75,
        van: 8.5,
        ngoaiNgu: 9.8,
        monThuTu: 9.0,
        monChuyen: 9.25
      },
      priorityPoints: 0,
      nv1School: 'THPT Chu Văn An',
      nv1Benchmark: 26.50,
      nv2School: 'THPT Kim Liên',
      nv2Benchmark: 25.25,
      nv3School: 'THPT Yên Hòa',
      nv3Benchmark: 24.75,
      hasSpecialty: true,
      specialtySchool: 'THPT Chuyên Hà Nội - Amsterdam',
      specialtySubject: 'Toán chuyên',
      specialtyBenchmark: 42.5
    };
  }

  if (cleanSbd === '654321') {
    return {
      sbd: '654321',
      fullName: 'NGUYỄN THỊ MAI LAM',
      provinceCode: '02',
      provinceName: 'Sở GD&ĐT TP. Hồ Chí Minh',
      scores: {
        toan: 8.5,
        van: 9.25,
        ngoaiNgu: 9.6
      },
      priorityPoints: 0.5,
      nv1School: 'THPT Nguyễn Thị Minh Khai',
      nv1Benchmark: 24.25,
      nv2School: 'THPT Bùi Thị Xuân',
      nv2Benchmark: 23.00,
      nv3School: 'THPT Trưng Vương',
      nv3Benchmark: 21.75,
      hasSpecialty: false
    };
  }

  if (cleanSbd === '111222') {
    return {
      sbd: '111222',
      fullName: 'VŨ THỨC TRẦN ANH',
      provinceCode: '03',
      provinceName: 'Sở GD&ĐT Hải Phong',
      scores: {
        toan: 1.0, // Điểm liệt
        van: 7.25,
        ngoaiNgu: 6.5
      },
      priorityPoints: 0,
      nv1School: 'THPT Trần Hưng Đạo',
      nv1Benchmark: 19.50,
      nv2School: 'THPT Đại Mỗ',
      nv2Benchmark: 16.50,
      nv3School: 'THPT Phan Huy Chú',
      nv3Benchmark: 21.00,
      hasSpecialty: false
    };
  }

  if (cleanSbd === '333444') {
    return {
      sbd: '333444',
      fullName: 'LÊ THANH PHONG',
      provinceCode: '04',
      provinceName: 'Sở GD&ĐT Đà Nẵng',
      scores: {
        toan: 6.5,
        van: 700, // sẽ được định dạng lại
        ngoaiNgu: 6.8
      },
      priorityPoints: 1.0,
      nv1School: 'THPT Phan Châu Trinh',
      nv1Benchmark: 24.00,
      nv2School: 'THPT Trần Phú',
      nv2Benchmark: 21.00,
      nv3School: 'THPT Thái Phiên',
      nv3Benchmark: 19.75,
      hasSpecialty: false
    };
  }

  // Generation dynamically based on seeded random
  const rand = seedRandom(cleanSbd);
  
  // Decide Region based on SBD digit
  const firstDigit = Number(cleanSbd.charAt(0)) || 1;
  const regionKey = firstDigit < 4 ? "B" : (firstDigit < 7 ? "N" : "T");
  const schools = HIGHSCHOOLS_BY_REGION[regionKey];

  // Pick different schools deterministically
  const idx1 = Math.floor(rand() * 4); // top 4
  const idx2 = Math.min(idx1 + 1 + Math.floor(rand() * 2), schools.length - 2);
  const idx3 = Math.min(idx2 + 1 + Math.floor(rand() * 2), schools.length - 1);

  const sch1 = schools[idx1];
  const sch2 = schools[idx2];
  const sch3 = schools[idx3];

  const provinceName = getProvinceName(cleanSbd.substring(0, 2)) || "Sở GD&ĐT Hà Nội";

  // Generate Vietnamese Name
  const surname = SURNAMES[Math.floor(rand() * SURNAMES.length)];
  const isFemale = rand() > 0.5;
  const middleName = MIDDLE_NAMES[Math.floor(rand() * MIDDLE_NAMES.length)];
  const firstName = isFemale 
    ? FIRST_NAMES_FEMALE[Math.floor(rand() * FIRST_NAMES_FEMALE.length)]
    : FIRST_NAMES_MALE[Math.floor(rand() * FIRST_NAMES_MALE.length)];
  const fullName = `${surname} ${middleName} ${firstName}`.toUpperCase();

  // Create normally distributed scores
  const roundScore = (score: number) => Math.round(score * 4) / 4; // increment 0.25

  const toan = roundScore(randomNormal(rand, 6.75, 1.8, 1.0, 10.0));
  const van = roundScore(randomNormal(rand, 7.0, 1.2, 2.0, 10.0));
  const ngoaiNgu = roundScore(randomNormal(rand, 6.25, 2.0, 1.5, 10.0));

  const hasSpecialty = rand() > 0.75;
  let specialtySchool = undefined;
  let specialtySubject = undefined;
  let specialtyBenchmark = undefined;
  let monChuyen = undefined;

  if (hasSpecialty) {
    const specSchObj = SPECIALTY_SCHOOLS[Math.floor(rand() * SPECIALTY_SCHOOLS.length)];
    specialtySchool = specSchObj.schoolName;
    specialtySubject = SPECIALTY_SUBJECTS[Math.floor(rand() * SPECIALTY_SUBJECTS.length)];
    specialtyBenchmark = specSchObj.benchmark;
    monChuyen = roundScore(randomNormal(rand, 6.0, 2.0, 1.0, 10.0));
  }

  // Optionally there is a fourth common subject in some years
  const hasMonTu = rand() > 0.8;
  const monThuTu = hasMonTu ? roundScore(randomNormal(rand, 7.5, 1.1, 3.0, 10.0)) : undefined;

  const pRand = rand();
  const priorityPoints = pRand > 0.85 ? (pRand > 0.95 ? 1.5 : 0.5) : 0;

  return {
    sbd: cleanSbd,
    fullName,
    provinceCode: cleanSbd.substring(0, 2) || '01',
    provinceName,
    scores: {
      toan,
      van,
      ngoaiNgu,
      monThuTu,
      monChuyen
    },
    priorityPoints,
    nv1School: sch1.schoolName,
    nv1Benchmark: sch1.benchmarkHs1,
    nv2School: sch2.schoolName,
    nv2Benchmark: sch2.benchmarkHs1,
    nv3School: sch3.schoolName,
    nv3Benchmark: sch3.benchmarkHs1,
    hasSpecialty,
    specialtySchool,
    specialtySubject,
    specialtyBenchmark
  };
}

// Generate realistic chart distributions for grade 10 subjects
export function generateSubjectDistribution(subject: string) {
  const scoreTicks = Array.from({ length: 41 }, (_, i) => i * 0.25); // 0, 0.25, ..., 10
  
  let mean = 6.5;
  let std = 1.6;
  let label = "Toán";
  
  switch (subject) {
    case "toan":
      mean = 6.2; std = 1.85; label = "Toán học";
      break;
    case "van":
      mean = 6.95; std = 1.15; label = "Ngữ văn";
      break;
    case "ngoaiNgu":
      mean = 5.85; std = 2.1; label = "Ngoại ngữ (Tiếng Anh)";
      break;
    case "monChuyen":
      mean = 5.25; std = 1.8; label = "Môn thi Chuyên";
      break;
  }
  
  const distribution = scoreTicks.map(score => {
    const exponent = -Math.pow(score - mean, 2) / (2 * Math.pow(std, 2));
    let countRate = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    
    if (subject === "ngoaiNgu" && score < 3.0) {
      countRate += 0.04 * Math.exp(-Math.pow(score - 2.5, 2) / 0.6);
    }
    
    return {
      score: score.toFixed(2),
      percentage: Math.round(countRate * 1000) / 10
    };
  });
  
  const sum = distribution.reduce((acc, curr) => acc + curr.percentage, 0);
  const scaleFactor = 100 / sum;
  const normalizedDistribution = distribution.map(d => ({
    score: d.score,
    percentage: Math.round((d.percentage * scaleFactor) * 100) / 100
  }));
  
  return {
    subject,
    label,
    mean: Math.round(mean * 100) / 100,
    median: Math.round((mean + 0.1) * 100) / 100,
    distribution: normalizedDistribution
  };
}
