// ชุดคำถามและสมการคำนวณคะแนนระบบแนะแนวค้นหาสายเรียนและสาขาที่ใช่ (NPC_Admission)

import {
  DepartmentKey,
  DEPARTMENTS,
  CurrentEducationInput,
  TrackResultType,
  StudyModeType,
  SpecialInterestType,
} from "./guidance-config";

export interface QuestionChoice {
  id: string;
  label: string;
  text: string;
  scores?: {
    gen?: number;
    voc?: number;
    dept?: Partial<Record<DepartmentKey, number>>;
  };
  studyMode?: StudyModeType;
  specialInterest?: SpecialInterestType;
  deptKey?: DepartmentKey; // สำหรับข้อ 5 และ ข้อ 9 ที่ใช้เป็น tie-breaker
}

export interface QuestionItem {
  id: number;
  part: 1 | 2 | 3;
  partTitle: string;
  question: string;
  subtitle?: string;
  choices: QuestionChoice[];
}

export const GUIDANCE_QUESTIONS: QuestionItem[] = [
  // ===================== ส่วนที่ 1: GEN vs VOC (ข้อ 1 - 4) =====================
  {
    id: 1,
    part: 1,
    partTitle: "ส่วนที่ 1: สไตล์การเรียนรู้และเป้าหมาย (สายสามัญ vs สายอาชีพ)",
    question: "เวลาต้องเรียนรู้เรื่องใหม่ๆ สไตล์ไหนที่ทำให้น้องเข้าใจได้เร็วและมีความสุขที่สุด?",
    choices: [
      {
        id: "1_a",
        label: "ก",
        text: "อ่านสรุปเนื้อหา ท่องจำหลักการ และฝึกทำโจทย์ข้อสอบบนกระดาษ",
        scores: { gen: 3, voc: 0 },
      },
      {
        id: "1_b",
        label: "ข",
        text: "ดูตัวอย่างประกอบทฤษฎีบ้าง แล้วลองทำตามทีละขั้นตอน",
        scores: { gen: 1, voc: 2 },
      },
      {
        id: "1_c",
        label: "ค",
        text: "ลงมือจับของจริง ลองผิดลองถูก สร้างชิ้นงานให้เห็นผลลัพธ์ตรงหน้าทันที",
        scores: { gen: 0, voc: 3 },
      },
    ],
  },
  {
    id: 2,
    part: 1,
    partTitle: "ส่วนที่ 1: สไตล์การเรียนรู้และเป้าหมาย (สายสามัญ vs สายอาชีพ)",
    question: "น้องมองภาพตัวเองในอีก 3 - 5 ปีข้างหน้าไว้อย่างไร?",
    choices: [
      {
        id: "2_a",
        label: "ก",
        text: "เตรียมสอบแข่งขันเข้าคณะสายวิชาการในมหาวิทยาลัย เช่น แพทย์ พยาบาล ครู นิติศาสตร์",
        scores: { gen: 3, voc: 0 },
      },
      {
        id: "2_b",
        label: "ข",
        text: "อยากเรียนต่อปริญญาตรีในสายที่มีทักษะปฏิบัติติดตัว และทำงานหาประสบการณ์ไปด้วยได้",
        scores: { gen: 1, voc: 2 },
      },
      {
        id: "2_c",
        label: "ค",
        text: "อยากเก่งวิชาชีพเฉพาะทาง มีรายได้เร็ว เปิดกิจการของตัวเอง หรือเข้าทำงานได้ทันที",
        scores: { gen: 0, voc: 3 },
      },
    ],
  },
  {
    id: 3,
    part: 1,
    partTitle: "ส่วนที่ 1: สไตล์การเรียนรู้และเป้าหมาย (สายสามัญ vs สายอาชีพ)",
    question: "รูปแบบการวัดผลแบบไหนที่น้องรู้สึกว่าได้แสดงความสามารถของตัวเองออกมามากที่สุด?",
    choices: [
      {
        id: "3_a",
        label: "ก",
        text: "การสอบวัดความรู้ปลายภาคด้วยข้อสอบวิเคราะห์เนื้อหาเข้มข้น",
        scores: { gen: 3, voc: 0 },
      },
      {
        id: "3_b",
        label: "ข",
        text: "ผสมกันครึ่งต่อครึ่งระหว่างการสอบทฤษฎีและการส่งรายงานปฏิบัติ",
        scores: { gen: 1, voc: 2 },
      },
      {
        id: "3_c",
        label: "ค",
        text: "การส่งโปรเจกต์ชิ้นงาน การสอบปฏิบัติหน้างาน และการออกไปฝึกประสบการณ์ทำงานจริง",
        scores: { gen: 0, voc: 3 },
      },
    ],
  },
  {
    id: 4,
    part: 1,
    partTitle: "ส่วนที่ 1: สไตล์การเรียนรู้และเป้าหมาย (สายสามัญ vs สายอาชีพ)",
    question: "หากมีเวลาว่างช่วงวันหยุด กิจกรรมแบบไหนที่ดึงดูดใจน้องมากกว่ากัน?",
    choices: [
      {
        id: "4_a",
        label: "ก",
        text: "อ่านหนังสือ ติวเนื้อหาวิชาหลัก หรือค้นคว้าความรู้เชิงวิชาการ",
        scores: { gen: 3, voc: 0 },
      },
      {
        id: "4_b",
        label: "ข",
        text: "หาคอร์สออนไลน์สั้นๆ ดูคลิปสอนทักษะใหม่ๆ ที่น่าสนใจ",
        scores: { gen: 1, voc: 2 },
      },
      {
        id: "4_c",
        label: "ค",
        text: "ซ่อมแซมประดิษฐ์ของ แต่งรถ ทำคอม กราฟิก หรือลองขายของหารายได้เสริม",
        scores: { gen: 0, voc: 3 },
      },
    ],
  },

  // ===================== ส่วนที่ 2: ค้นหาสาขาวิชาใน 6 แผนก (ข้อ 5 - 10) =====================
  {
    id: 5,
    part: 2,
    partTitle: "ส่วนที่ 2: ค้นหาสาขาวิชาที่ตรงใจ (6 แผนกวิชาหลัก)",
    subtitle: "ข้อนี้เป็นตัวตัดสินลำดับที่ 2 ในกรณีคะแนนรวมเท่ากัน",
    question: "สิ่งรอบตัวเรื่องไหนที่น้องเปิดดูคลิปหรือคลุกคลีได้นานๆ โดยไม่รู้สึกเบื่อ?",
    choices: [
      {
        id: "5_a",
        label: "ก",
        text: "รถยนต์ มอเตอร์ไซค์ ยานยนต์ไฟฟ้า (EV) เครื่องยนต์ และการปรับแต่งสมรรถนะ",
        deptKey: "AUTO",
        scores: { dept: { AUTO: 3 } },
      },
      {
        id: "5_b",
        label: "ข",
        text: "ระบบไฟฟ้าในบ้าน โซลาร์เซลล์ พลังงานสะอาด และเครื่องจักรในโรงงาน",
        deptKey: "ELEC",
        scores: { dept: { ELEC: 3 } },
      },
      {
        id: "5_c",
        label: "ค",
        text: "แก็ดเจ็ตอัจฉริยะ แผงวงจร หุ่นยนต์ อุปกรณ์สมาร์ทโฮม และเครื่องเสียง",
        deptKey: "TRON",
        scores: { dept: { TRON: 3 } },
      },
      {
        id: "5_d",
        label: "ง",
        text: "คอมพิวเตอร์ เขียนโค้ด สร้างเว็บ แต่งภาพ ตัดต่อวิดีโอ และเครื่องมือ AI",
        deptKey: "IT",
        scores: { dept: { IT: 3 } },
      },
      {
        id: "5_e",
        label: "จ",
        text: "การวางแผนออมเงิน คำนวณต้นทุน-กำไร จัดระเบียบข้อมูลตัวเลขให้เป๊ะ",
        deptKey: "ACC",
        scores: { dept: { ACC: 3 } },
      },
      {
        id: "5_f",
        label: "ฉ",
        text: "เทรนด์โซเชียลมีเดีย การรีวิวสินค้า การไลฟ์ขายของ และไอเดียโปรโมตร้านค้า",
        deptKey: "MKT",
        scores: { dept: { MKT: 3 } },
      },
    ],
  },
  {
    id: 6,
    part: 2,
    partTitle: "ส่วนที่ 2: ค้นหาสาขาวิชาที่ตรงใจ (6 แผนกวิชาหลัก)",
    question: "ถ้าต้องรวมทีมกับเพื่อนสร้างโปรเจกต์ใหญ่ของโรงเรียน น้องอยากรับผิดชอบหน้าที่ไหนที่สุด?",
    choices: [
      {
        id: "6_a",
        label: "ก",
        text: "ฝ่ายประกอบโครงสร้างหลัก ทดสอบความแข็งแรงและกลไกให้เครื่องทำงานได้จริง",
        scores: { dept: { AUTO: 3 } },
      },
      {
        id: "6_b",
        label: "ข",
        text: "ฝ่ายเดินระบบพลังงาน ควบคุมไฟ แสงสว่าง และดูแลความปลอดภัยของสถานที่",
        scores: { dept: { ELEC: 3 } },
      },
      {
        id: "6_c",
        label: "ค",
        text: "ฝ่ายติดตั้งเซ็นเซอร์ ระบบสั่งการอัตโนมัติ และเชื่อมวงจรควบคุมขนาดเล็ก",
        scores: { dept: { TRON: 3 } },
      },
      {
        id: "6_d",
        label: "ง",
        text: "ฝ่ายทำระบบลงทะเบียนออนไลน์ ออกแบบโปสเตอร์ สื่อดิจิทัล และดูแลอุปกรณ์ไอที",
        scores: { dept: { IT: 3 } },
      },
      {
        id: "6_e",
        label: "จ",
        text: "ฝ่ายเหรัญญิก คุมงบประมาณ ทำบัญชีรายรับ-รายจ่าย และตรวจเช็กใบเสร็จทุกบาท",
        scores: { dept: { ACC: 3 } },
      },
      {
        id: "6_f",
        label: "ฉ",
        text: "ฝ่ายประชาสัมพันธ์ คิดแคมเปญดึงคนมาร่วมงาน หาสปอนเซอร์ และพรีเซนต์หน้าเวที",
        scores: { dept: { MKT: 3 } },
      },
    ],
  },
  {
    id: 7,
    part: 2,
    partTitle: "ส่วนที่ 2: ค้นหาสาขาวิชาที่ตรงใจ (6 แผนกวิชาหลัก)",
    question: "บรรยากาศการทำงานแบบไหนที่เข้ากับบุคลิกของน้องมากที่สุด?",
    choices: [
      {
        id: "7_a",
        label: "ก",
        text: "ลุยงานภาคสนามได้ คล่องแคล่ว ชอบจับเครื่องมือช่างและงานระบบโครงสร้างจริง",
        scores: { dept: { AUTO: 2, ELEC: 2 } },
      },
      {
        id: "7_b",
        label: "ข",
        text: "มีสมาธิกับงานละเอียด ชอบนั่งวิเคราะห์แก้ไขวงจรหรือทำงานสร้างสรรค์หน้าจอเทคโนโลยี",
        scores: { dept: { TRON: 2, IT: 2 } },
      },
      {
        id: "7_c",
        label: "ค",
        text: "ชอบงานบริหารจัดการในออฟฟิศ จัดการข้อมูลธุรกิจ หรือติดต่อสื่อสารกับผู้คนหลากหลาย",
        scores: { dept: { ACC: 2, MKT: 2 } },
      },
    ],
  },
  {
    id: 8,
    part: 2,
    partTitle: "ส่วนที่ 2: ค้นหาสาขาวิชาที่ตรงใจ (6 แผนกวิชาหลัก)",
    question: "เวลาเจอปัญหาหรืออุปกรณ์สักชิ้นทำงานผิดปกติ วิธีคิดแรกของน้องคืออะไร?",
    choices: [
      {
        id: "8_a",
        label: "ก",
        text: "ขอรื้อดูชิ้นส่วน กลไกข้างใน หรือตรวจเช็กจุดเชื่อมต่อและแผงวงจรด้วยตัวเอง",
        scores: { dept: { AUTO: 2, TRON: 2 } },
      },
      {
        id: "8_b",
        label: "ข",
        text: "เปิดคู่มือไล่เช็กตามลำดับขั้นตอน มาตรฐานความปลอดภัย หรือตรวจสอบตัวเลขให้ถูกต้อง",
        scores: { dept: { ELEC: 2, ACC: 2 } },
      },
      {
        id: "8_c",
        label: "ค",
        text: "ค้นหาซอฟต์แวร์หรือเครื่องมือดิจิทัลมาช่วยแก้ปัญหา หรือปรับรูปแบบการนำเสนอใหม่",
        scores: { dept: { IT: 2, MKT: 2 } },
      },
    ],
  },
  {
    id: 9,
    part: 2,
    partTitle: "ส่วนที่ 2: ค้นหาสาขาวิชาที่ตรงใจ (6 แผนกวิชาหลัก)",
    subtitle: "ข้อนี้เป็นตัวตัดสินลำดับที่ 1 ในกรณีคะแนนรวมเท่ากัน",
    question: "ทักษะมืออาชีพด้านใดที่น้องอยากฝึกให้เก่งเพื่อใช้สร้างรายได้ในอนาคต?",
    choices: [
      {
        id: "9_a",
        label: "ก",
        text: "ผู้เชี่ยวชาญด้านเทคนิคยานยนต์สมัยใหม่ ซ่อมบำรุงและดูแลรักษารถยนต์ครบวงจร",
        deptKey: "AUTO",
        scores: { dept: { AUTO: 3 } },
      },
      {
        id: "9_b",
        label: "ข",
        text: "ช่างเทคนิคและผู้รับเหมาวางระบบไฟฟ้าอาคาร โรงงาน และพลังงานแสงอาทิตย์",
        deptKey: "ELEC",
        scores: { dept: { ELEC: 3 } },
      },
      {
        id: "9_c",
        label: "ค",
        text: "นักเทคนิคระบบอิเล็กทรอนิกส์อัจฉริยะ ระบบ IoT และซ่อมบำรุงอุปกรณ์ไฮเทค",
        deptKey: "TRON",
        scores: { dept: { TRON: 3 } },
      },
      {
        id: "9_d",
        label: "ง",
        text: "นักพัฒนาเว็บไซต์/แอปพลิเคชัน ผู้ดูแลระบบเครือข่าย และนักสร้างสรรค์สื่อดิจิทัล",
        deptKey: "IT",
        scores: { dept: { IT: 3 } },
      },
      {
        id: "9_e",
        label: "จ",
        text: "นักบัญชีมืออาชีพ ผู้เชี่ยวชาญด้านการเงินและภาษีที่เป็นหัวใจของทุกองค์กร",
        deptKey: "ACC",
        scores: { dept: { ACC: 3 } },
      },
      {
        id: "9_f",
        label: "ฉ",
        text: "นักการตลาดดิจิทัล นักบริหารงานขาย และเจ้าของธุรกิจออนไลน์ยุคใหม่",
        deptKey: "MKT",
        scores: { dept: { MKT: 3 } },
      },
    ],
  },
  {
    id: 10,
    part: 2,
    partTitle: "ส่วนที่ 2: ค้นหาสาขาวิชาที่ตรงใจ (6 แผนกวิชาหลัก)",
    question: "วิชาหรือทักษะพื้นฐานในโรงเรียนข้อใดที่น้องทำได้ดีหรือรู้สึกถนัดเป็นพิเศษ?",
    choices: [
      {
        id: "10_a",
        label: "ก",
        text: "วิทยาศาสตร์กายภาพ พลังงานไฟฟ้า และการทดลองต่อวงจร",
        scores: { dept: { ELEC: 2, TRON: 2 } },
      },
      {
        id: "10_b",
        label: "ข",
        text: "คณิตศาสตร์ ตรรกะ การจัดหมวดหมู่ข้อมูล และวิชาคอมพิวเตอร์",
        scores: { dept: { ACC: 2, IT: 2 } },
      },
      {
        id: "10_c",
        label: "ค",
        text: "การพูดคุยโน้มน้าวใจ กิจกรรมออกบูธขายของ หรืองานช่างประดิษฐ์ปรับแต่งสิ่งของ",
        scores: { dept: { MKT: 2, AUTO: 2 } },
      },
    ],
  },

  // ===================== ส่วนที่ 3: ความสนใจพิเศษและรูปแบบการเรียน (ข้อ 11 - 12) =====================
  {
    id: 11,
    part: 3,
    partTitle: "ส่วนที่ 3: ความสนใจพิเศษและรูปแบบการเรียน",
    subtitle: "ช่วยแนะแนวระบบการเรียนที่เหมาะสม (ไม่นำคะแนนไปปนกับ 6 สาขา)",
    question: "รูปแบบการใช้ชีวิตช่วงเรียนต่อแบบไหนที่ตอบโจทย์น้องและครอบครัวมากที่สุด?",
    choices: [
      {
        id: "11_a",
        label: "ก",
        text: "เน้นเรียนในรั้ววิทยาลัยเต็มเวลา ทำกิจกรรมชมรมและปูพื้นฐานปฏิบัติการให้แน่น",
        studyMode: "NORMAL",
      },
      {
        id: "11_b",
        label: "ข",
        text: "อยากเรียนควบคู่ฝึกงานจริงในสถานประกอบการ มีเบี้ยเลี้ยงและโอกาสได้งานทำทันที",
        studyMode: "DUAL",
      },
      {
        id: "11_c",
        label: "ค",
        text: "ยืดหยุ่นได้ทั้งสองแบบ ขอพิจารณาตามคำแนะนำของครูแนะแนว",
        studyMode: "FLEX",
      },
    ],
  },
  {
    id: 12,
    part: 3,
    partTitle: "ส่วนที่ 3: ความสนใจพิเศษและรูปแบบการเรียน",
    subtitle: "เพื่อแนะนำหลักสูตรระยะสั้นและชมรมสร้างรายได้เสริม",
    question: "นอกจากสายเรียนหลักแล้ว น้องมีความสนใจพิเศษด้านใดที่อยากฝึกเสริมอีกบ้าง?",
    choices: [
      {
        id: "12_a",
        label: "ก",
        text: "อาหาร เบเกอรี่ และเครื่องดื่มคาเฟ่",
        specialInterest: "CAFE",
      },
      {
        id: "12_b",
        label: "ข",
        text: "ความงาม แฟชั่น และงานฝีมือเอกลักษณ์ท้องถิ่นน่าน",
        specialInterest: "CRAFT",
      },
      {
        id: "12_c",
        label: "ค",
        text: "อีสปอร์ต สตรีมเมอร์ และการถ่ายภาพโดรน/วิดีโอ",
        specialInterest: "MEDIA",
      },
      {
        id: "12_d",
        label: "ง",
        text: "กิจกรรมจิตอาสาและออกค่ายบริการซ่อมสร้างเพื่อชุมชน",
        specialInterest: "FIXIT",
      },
      {
        id: "12_e",
        label: "จ",
        text: "ยังไม่มีความสนใจเสริมเป็นพิเศษ โฟกัสสาขาหลักเต็มที่",
        specialInterest: "NONE",
      },
    ],
  },
];

export interface AssessmentResult {
  currentEducation: CurrentEducationInput;
  schoolName?: string;
  vocScore: number;
  genScore: number;
  trackResult: TrackResultType;
  trackTitle: string;
  trackDesc: string;
  scores: Record<DepartmentKey, number>;
  sortedDepartments: {
    key: DepartmentKey;
    score: number;
    percentage: number;
  }[];
  top1: DepartmentKey;
  top2: DepartmentKey;
  studyMode: StudyModeType;
  specialInterest: SpecialInterestType;
}

export function calculateAssessmentResult(
  currentEducation: CurrentEducationInput,
  schoolName: string | undefined,
  answers: Record<number, string> // questionId -> choiceId
): AssessmentResult {
  let vocScore = 0;
  let genScore = 0;

  const deptScores: Record<DepartmentKey, number> = {
    AUTO: 0,
    ELEC: 0,
    TRON: 0,
    IT: 0,
    ACC: 0,
    MKT: 0,
  };

  let tieBreakerQ9: DepartmentKey | null = null;
  let tieBreakerQ5: DepartmentKey | null = null;
  let studyMode: StudyModeType = "NORMAL";
  let specialInterest: SpecialInterestType = "NONE";

  for (const q of GUIDANCE_QUESTIONS) {
    const choiceId = answers[q.id];
    if (!choiceId) continue;
    const choice = q.choices.find((c) => c.id === choiceId);
    if (!choice) continue;

    // คำนวณส่วนที่ 1
    if (choice.scores?.voc) vocScore += choice.scores.voc;
    if (choice.scores?.gen) genScore += choice.scores.gen;

    // คำนวณส่วนที่ 2
    if (choice.scores?.dept) {
      for (const [k, v] of Object.entries(choice.scores.dept)) {
        if (v) {
          deptScores[k as DepartmentKey] += v;
        }
      }
    }

    if (q.id === 9 && choice.deptKey) {
      tieBreakerQ9 = choice.deptKey;
    }
    if (q.id === 5 && choice.deptKey) {
      tieBreakerQ5 = choice.deptKey;
    }

    // ส่วนที่ 3
    if (choice.studyMode) {
      studyMode = choice.studyMode;
    }
    if (choice.specialInterest) {
      specialInterest = choice.specialInterest;
    }
  }

  // แปลผล Track Result
  let trackResult: TrackResultType = "VOCATIONAL";
  let trackTitle = "สายอาชีพโดยตรง (Practical & Vocational Learner)";
  let trackDesc =
    "คุณเป็นคนชอบลงมือปฏิบัติจริง เรียนรู้ผ่านการสัมผัสของจริงและแก้ปัญหาหน้างาน สายอาชีพจะช่วยติดปีกทักษะเฉพาะทางให้คุณพร้อมทำงาน มีรายได้เร็ว และสร้างความมั่นคงในอนาคต";

  if (vocScore >= 7) {
    trackResult = "VOCATIONAL";
    trackTitle = "สายอาชีพโดยตรง (Practical & Vocational Learner)";
    trackDesc =
      "คุณเป็นคนชอบลงมือปฏิบัติจริง เรียนรู้ผ่านการสัมผัสของจริงและแก้ปัญหาหน้างาน สายอาชีพที่วิทยาลัยสารพัดช่างน่านตอบโจทย์คุณ 100% พร้อมฝึกทักษะเฉพาะทาง มีรายได้เร็ว หรือต่อยอด ป.ตรี ได้อย่างมั่นใจ";
  } else if (vocScore >= 5) {
    trackResult = "HYBRID";
    trackTitle = "สายลูกผสม (Applied Theory & Hand-on Hybrid)";
    trackDesc =
      "คุณเรียนรู้ทฤษฎีได้ดีควบคู่ไปกับความชอบในการลงมือทดลองทำ การเรียนสายอาชีพในระดับ ปวช./ปวส. จะช่วยให้คุณมีทั้งหลักการแน่นและทักษะมือที่เหนือกว่า สามารถศึกษาต่อระดับปริญญาตรีหรือทำงานควบคู่กันได้อย่างยอดเยี่ยม";
  } else {
    trackResult = "ACADEMIC";
    trackTitle = "สายสามัญเชิงวิชาการ (Academic & Analytical Learner)";
    trackDesc =
      "คุณโดดเด่นด้านการวิเคราะห์เนื้อหาเชิงทฤษฎี เหมาะกับการเรียนสายสามัญหรือมหาวิทยาลัยวิชาการ ทั้งนี้ คุณสามารถลงเรียน 'หลักสูตรวิชาชีพระยะสั้น' ของวิทยาลัยสารพัดช่างน่านช่วงวันหยุดเพื่อเสริมทักษะอาชีพ และมีสาขาวิชาด้านเทคโนโลยี/บริหารธุรกิจเป็นทางเลือกที่น่าสนใจ";
  }

  // เรียงลำดับ 6 แผนกวิชา
  const deptKeys: DepartmentKey[] = ["AUTO", "ELEC", "TRON", "IT", "ACC", "MKT"];
  deptKeys.sort((a, b) => {
    const scoreA = deptScores[a];
    const scoreB = deptScores[b];
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    // Tie-breaker 1: ข้อ 9
    if (tieBreakerQ9 === a) return -1;
    if (tieBreakerQ9 === b) return 1;

    // Tie-breaker 2: ข้อ 5
    if (tieBreakerQ5 === a) return -1;
    if (tieBreakerQ5 === b) return 1;

    return 0;
  });

  const sortedDepartments = deptKeys.map((key) => {
    const score = deptScores[key];
    const percentage = Math.round((score / 15) * 100);
    return {
      key,
      score,
      percentage,
    };
  });

  const top1 = sortedDepartments[0].key;
  const top2 = sortedDepartments[1].key;

  return {
    currentEducation,
    schoolName,
    vocScore,
    genScore,
    trackResult,
    trackTitle,
    trackDesc,
    scores: deptScores,
    sortedDepartments,
    top1,
    top2,
    studyMode,
    specialInterest,
  };
}
