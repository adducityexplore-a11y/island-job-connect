export type Department =
  | "All"
  | "F&B"
  | "Front Office"
  | "Kitchen"
  | "Housekeeping"
  | "Spa"
  | "Recreation"
  | "Engineering"
  | "Sales & Marketing"
  | "HR"
  | "Finance"
  | "Transport"
  | "Diving & Watersports"
  | "Guest Services"
  | "IT"
  | "Management"
  | "Kids Club";

export const DEPARTMENTS: Department[] = [
  "All",
  "F&B",
  "Front Office",
  "Kitchen",
  "Housekeeping",
  "Spa",
  "Recreation",
  "Engineering",
  "Sales & Marketing",
  "HR",
  "Finance",
  "Transport",
  "Diving & Watersports",
  "Guest Services",
  "IT",
  "Management",
  "Kids Club",
];

export const DEPT_OPTIONS: Exclude<Department, "All">[] = [
  "F&B",
  "Front Office",
  "Kitchen",
  "Housekeeping",
  "Spa",
  "Recreation",
  "Engineering",
  "Sales & Marketing",
  "HR",
  "Finance",
  "Transport",
  "Diving & Watersports",
  "Guest Services",
  "IT",
  "Management",
  "Kids Club",
];

export interface Job {
  id: string;
  numericId?: number;
  title: string;
  company: string;
  location: string;
  department: Exclude<Department, "All">;
  salary?: string;
  deadline: string;
  description: string;
  requirements: string[];
  tags: ("Featured" | "Urgent")[];
  perks?: string[];
  applyWhatsApp?: string;
  applyEmail?: string;
  postedAt: string;
  logoUrl?: string;
  imageUrl?: string;
  viewCount?: number;
  applyCount?: number;
}

// ── Resort image helpers (shared across app) ─────────────────────────────────
const RESORT_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd",
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8",
  "https://images.unsplash.com/photo-1548574505-5e239809ee19",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  "https://images.unsplash.com/photo-1578922746465-3a80a228f223",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9",
  "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1",
  "https://images.unsplash.com/photo-1570737209810-87a8e7245f88",
  "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd",
  "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf",
];

const COMPANY_IMAGE_IDX: Record<string, number> = {
  "One&Only Reethi Rah": 0,
  "Soneva Jani": 1,
  "Velaa Private Island": 2,
  "Six Senses Laamu": 3,
  "COMO Maalifushi": 4,
  "Gili Lankanfushi": 5,
  "Four Seasons Kuda Huraa": 6,
  "Anantara Kihavah": 7,
  "Waldorf Astoria Maldives": 8,
  "Amilla Maldives": 9,
  "Coco Bodu Hithi": 10,
  "Niyama Private Islands": 11,
  "Patina Maldives, Fari Islands": 0,
  "Joali Maldives": 1,
  "The Ritz-Carlton Maldives, Fari Islands": 2,
  "Raffles Maldives Meradhoo": 3,
  "LUX* South Ari Atoll": 4,
  "Jumeirah Vittaveli": 5,
  "W Maldives": 6,
  "Banyan Tree Vabbinfaru": 7,
  "Park Hyatt Maldives Hadahaa": 8,
  "Kandima Maldives": 9,
  "Hard Rock Hotel Maldives": 10,
  "Emerald Maldives Resort & Spa": 11,
  "Intercontinental Maldives Maamunagau": 0,
  "Kagi Maldives Spa Island": 1,
  "Constance Moofushi": 2,
  "Nova Maldives": 3,
};

export function getResortImage(company: string, w = 800): string {
  const idx = COMPANY_IMAGE_IDX[company] ?? 0;
  const base = RESORT_IMAGE_POOL[idx % RESORT_IMAGE_POOL.length];
  return `${base}?w=${w}&q=80`;
}

export const VERIFIED_RESORTS = new Set([
  "One&Only Reethi Rah",
  "Soneva Jani",
  "Velaa Private Island",
  "Six Senses Laamu",
  "COMO Maalifushi",
  "Gili Lankanfushi",
  "Four Seasons Kuda Huraa",
  "Anantara Kihavah",
  "Waldorf Astoria Maldives",
  "The Ritz-Carlton Maldives, Fari Islands",
  "Raffles Maldives Meradhoo",
  "LUX* South Ari Atoll",
  "Jumeirah Vittaveli",
  "W Maldives",
  "Park Hyatt Maldives Hadahaa",
  "Patina Maldives, Fari Islands",
  "Joali Maldives",
  "Amilla Maldives",
]);

export const RESORT_ABOUT: Record<string, string> = {
  "One&Only Reethi Rah":
    "One&Only Reethi Rah is an ultra-luxury private island resort in North Malé Atoll, celebrated for lush tropical vegetation, overwater bungalows, and world-class dining. The 44-hectare natural island has earned multiple global awards as one of the world's finest luxury escapes.",
  "Soneva Jani":
    "Soneva Jani is an award-winning eco-luxury resort in Noonu Atoll featuring stunning overwater villas with private pools and retractable roofs for stargazing. Its pioneering sustainability programme and barefoot-luxury philosophy make it one of the most unique resorts in the Indian Ocean.",
  "Velaa Private Island":
    "Velaa Private Island is one of the Maldives' most exclusive ultra-luxury retreats in Noonu Atoll. It features a private golf course, Noku Spa, a championship tennis academy, and an award-winning wine collection — all on a single breathtaking private island.",
  "Six Senses Laamu":
    "Six Senses Laamu is the only resort in Laamu Atoll, offering direct access to pristine reefs and some of the best diving in the Maldives. Its award-winning sustainability programme and holistic wellness approach attract discerning guests from around the world.",
  "COMO Maalifushi":
    "COMO Maalifushi is a natural barefoot-luxury island in Thaa Atoll, famous for exceptional diving, the COMO Shambhala wellness retreat, and organic cuisine. The resort is renowned for its understated elegance and pristine, untouched natural surroundings.",
  "Gili Lankanfushi":
    "Gili Lankanfushi is an eco-luxury resort just 20 minutes from Malé, operating a No News No Shoes philosophy. It offers the world's largest overwater villa and an exceptional level of personalised service through its signature 'Mr/Ms Friday' private butler concept.",
  "Four Seasons Kuda Huraa":
    "Four Seasons Kuda Huraa has been welcoming guests since 1996 and remains one of the Maldives' most beloved luxury resorts. Located 25 minutes from Malé by speedboat, it features beautifully crafted Maldivian bungalows, an award-winning spa, and a dedicated PADI dive centre.",
  "Anantara Kihavah":
    "Anantara Kihavah is located in the pristine Baa Atoll UNESCO Biosphere Reserve, celebrated for manta ray and whale shark sightings. The resort features SEA — an underwater restaurant — the world's only overwater observatory, and private pool villas above the turquoise lagoon.",
  "Waldorf Astoria Maldives":
    "Waldorf Astoria Ithaafushi is one of the largest private island resorts in the Maldives, featuring 119 villas, 11 restaurants and bars, and a Guerlain Spa. Its dramatic overwater and beach villa architecture has made it one of the most photographed resorts in the Indian Ocean.",
  "The Ritz-Carlton Maldives, Fari Islands":
    "Part of the exclusive Fari Islands development in North Malé Atoll, The Ritz-Carlton Maldives opened in 2021 and immediately set a new benchmark for luxury. The resort shares the Fari Marina Village with Patina Maldives, creating a unique island community experience.",
  "Raffles Maldives Meradhoo":
    "Raffles Maldives Meradhoo is an intimate luxury retreat in Gaafu Alifu Atoll, southern Maldives, accessible via a short domestic flight. With only 32 villas on a pristine island, it offers unmatched seclusion, exceptional marine life, and the legendary Raffles service heritage.",
  "LUX* South Ari Atoll":
    "LUX* South Ari Atoll is a vibrant, playful luxury resort famous for its beach cinema, overwater breakfast, and exceptional diving in Ari Atoll. The resort's LUX* Me Spa is renowned across the Indian Ocean for its holistic wellness programmes.",
  "Jumeirah Vittaveli":
    "Jumeirah Vittaveli is a striking luxury island resort in South Malé Atoll, known for its iconic underwater suite, the Bohemian restaurant, and the signature Talise Spa. The resort's proximity to Malé makes it one of the most accessible ultra-luxury options in the Maldives.",
  "W Maldives":
    "W Maldives is the original W Hotels property in the Indian Ocean, located on a private island in North Ari Atoll. Known for its bold design, vibrant energy, and legendary AWAY Spa, W Maldives set the standard for edgy luxury in the Maldives.",
  "Park Hyatt Maldives Hadahaa":
    "Park Hyatt Maldives Hadahaa is one of the most remote and exclusive resorts in the Maldives, located in Gaafu Alifu Atoll. Surrounded by some of the world's best untouched dive sites, it offers a serene, unplugged luxury experience for sophisticated travellers.",
  "Patina Maldives, Fari Islands":
    "Patina Maldives is a contemporary luxury resort on Fari Islands, North Malé Atoll, connected to The Ritz-Carlton Maldives via shuttle boat. Patina's design-forward aesthetic, gallery spaces, and curated culinary experiences attract creatively minded luxury travellers.",
  "Joali Maldives":
    "Joali Maldives is an immersive art-inspired luxury resort in Raa Atoll, where art installations by international artists are woven throughout the island. The resort's Joali Being wellness sanctuary is one of the most acclaimed in the Maldives.",
  "Amilla Maldives":
    "Amilla Maldives is a family-friendly barefoot-luxury resort in Baa Atoll UNESCO Biosphere Reserve. Known for its spacious villas, exceptional house reef, and a relaxed no-rules philosophy, Amilla offers one of the most warm and genuine luxury experiences in the Maldives.",
};

export const SAMPLE_JOBS: Job[] = [
  {
    id: "1",
    title: "Head Chef",
    company: "One&Only Reethi Rah",
    location: "North Malé Atoll",
    department: "Kitchen",
    salary: "$3,500 – $4,500/mo",
    deadline: "2026-05-30",
    description:
      "Lead our culinary team at One&Only Reethi Rah, one of the Maldives' most iconic ultra-luxury resorts. You will oversee all kitchen operations across multiple outlets, design seasonal menus using fresh local ingredients, and uphold the highest standards of food quality and presentation. The ideal candidate thrives in a fast-paced luxury environment and has a genuine passion for world-class dining.",
    requirements: [
      "Minimum 5 years in a senior culinary leadership role",
      "Culinary degree or equivalent professional qualification",
      "Extensive experience in luxury resort dining",
      "Strong knowledge of international and Maldivian cuisine",
      "Excellent team leadership and mentoring skills",
    ],
    tags: ["Featured"],
    perks: ["Free Accommodation", "Staff Meals", "Annual Flight"],
    applyWhatsApp: "+9607777001",
    applyEmail: "careers@oneandonlyreethi.com",
    postedAt: "2026-05-07T06:00:00Z",
  },
  {
    id: "2",
    title: "F&B Manager",
    company: "Soneva Jani",
    location: "Noonu Atoll",
    department: "F&B",
    salary: "$3,000 – $4,000/mo",
    deadline: "2026-05-20",
    description:
      "Soneva Jani is seeking an F&B Manager to oversee award-winning food and beverage operations across our overwater and beachside venues. You will drive service excellence, manage a large multicultural team, and champion our sustainable luxury dining philosophy.",
    requirements: [
      "Minimum 4 years F&B management in luxury hospitality",
      "Experience in a resort island environment preferred",
      "Strong leadership and financial acumen",
      "Passion for sustainable and conscious dining",
      "Proficiency in major POS and reservation systems",
    ],
    tags: ["Featured", "Urgent"],
    perks: ["Free Accommodation", "Staff Meals", "Medical Insurance"],
    applyWhatsApp: "+9607777002",
    applyEmail: "hr@soneva.com",
    postedAt: "2026-05-07T02:00:00Z",
  },
  {
    id: "3",
    title: "Front Office Supervisor",
    company: "Velaa Private Island",
    location: "Noonu Atoll",
    department: "Front Office",
    salary: "$1,800 – $2,400/mo",
    deadline: "2026-06-01",
    description:
      "Join the Velaa team as Front Office Supervisor. You will lead the front desk, ensure seamless check-in/out experiences, and deliver personalised service to our ultra-high-net-worth guests. You are the first and last impression of the island.",
    requirements: [
      "Minimum 3 years front office experience in luxury hotels",
      "Excellent spoken and written English",
      "Proficient with Opera PMS",
      "Empathetic problem-solver with a calm demeanour",
      "Previous supervisory experience required",
    ],
    tags: [],
    applyWhatsApp: "+9607777003",
    applyEmail: "careers@velaa.com",
    postedAt: "2026-04-29",
  },
  {
    id: "4",
    title: "Spa Therapist",
    company: "Six Senses Laamu",
    location: "Laamu Atoll",
    department: "Spa",
    salary: "$1,500 – $2,000/mo",
    deadline: "2026-05-15",
    description:
      "Six Senses Laamu is recruiting experienced Spa Therapists to join our award-winning wellness team. You will deliver a wide range of treatments — from traditional Maldivian healing rituals to modern holistic therapies — in our stunning overwater spa.",
    requirements: [
      "Recognised diploma in massage therapy or beauty therapy",
      "Minimum 2 years spa experience in a 5-star environment",
      "Proficiency in Swedish, deep tissue, and aromatherapy",
      "Professional, calming, and attentive personality",
      "Good spoken English required",
    ],
    tags: ["Urgent"],
    perks: ["Free Accommodation", "Staff Meals"],
    applyWhatsApp: "+9607777004",
    applyEmail: "hr@sixsenses.com",
    postedAt: "2026-05-06T18:00:00Z",
  },
  {
    id: "5",
    title: "PADI Dive Instructor",
    company: "COMO Maalifushi",
    location: "Thaa Atoll",
    department: "Diving & Watersports",
    salary: "$2,000 – $2,800/mo",
    deadline: "2026-05-28",
    description:
      "Guide guests on unforgettable dive experiences around Thaa Atoll, home to some of the most pristine reefs in the Maldives. You will conduct PADI courses, lead guided dives, maintain dive equipment, and create memorable underwater moments for guests.",
    requirements: [
      "PADI Divemaster or Instructor certification",
      "Minimum 200 logged dives",
      "Strong swimming and water safety skills",
      "Valid First Aid and CPR certification",
      "Warm, guest-focused communication style",
    ],
    tags: [],
    applyWhatsApp: "+9607777005",
    applyEmail: "careers@como.com",
    postedAt: "2026-05-02",
  },
  {
    id: "6",
    title: "Housekeeping Supervisor",
    company: "Gili Lankanfushi",
    location: "North Malé Atoll",
    department: "Housekeeping",
    salary: "$1,400 – $1,800/mo",
    deadline: "2026-06-10",
    description:
      "Maintain the impeccably high standards of cleanliness and presentation that Gili Lankanfushi is known for. You will supervise a dedicated housekeeping team, conduct room inspections, manage stock of eco-friendly supplies, and train new team members.",
    requirements: [
      "Minimum 3 years housekeeping experience in luxury resorts",
      "Previous team supervisory experience",
      "Strong eye for detail and presentation",
      "Knowledge of eco-conscious cleaning standards",
      "Effective communication and leadership",
    ],
    tags: [],
    applyWhatsApp: "+9607777006",
    applyEmail: "hr@gili.com",
    postedAt: "2026-05-01",
  },
  {
    id: "7",
    title: "Chief Engineer",
    company: "Four Seasons Kuda Huraa",
    location: "North Malé Atoll",
    department: "Engineering",
    salary: "$4,000 – $5,500/mo",
    deadline: "2026-05-25",
    description:
      "Oversee all engineering operations at Four Seasons Kuda Huraa. You will manage preventive maintenance programmes, supervise the engineering team, and ensure all mechanical, electrical, plumbing, and HVAC systems operate at peak efficiency.",
    requirements: [
      "Degree or diploma in Engineering",
      "Minimum 5 years in hospitality engineering management",
      "Comprehensive knowledge of resort infrastructure",
      "HVAC, electrical, and plumbing expertise",
      "Strong team leadership and planning skills",
    ],
    tags: ["Featured"],
    perks: ["Free Accommodation", "Staff Meals", "Transport Provided"],
    applyWhatsApp: "+9607777007",
    applyEmail: "careers@fourseasons.com",
    postedAt: "2026-05-06T10:00:00Z",
  },
  {
    id: "8",
    title: "Recreation Coordinator",
    company: "Anantara Kihavah",
    location: "Baa Atoll",
    department: "Recreation",
    salary: "$1,300 – $1,700/mo",
    deadline: "2026-06-05",
    description:
      "Bring the fun and excitement to our guests at Anantara Kihavah. You will plan and facilitate daily activities — from water sports and island excursions to sunset dolphin cruises and cultural experiences — ensuring every guest has an unforgettable stay.",
    requirements: [
      "Experience in guest activity coordination",
      "Strong interpersonal and communication skills",
      "Knowledge of water sports an advantage",
      "Energetic, creative, and enthusiastic personality",
      "First Aid certification preferred",
    ],
    tags: ["Urgent"],
    perks: ["Free Accommodation", "Staff Meals"],
    applyWhatsApp: "+9607777008",
    applyEmail: "hr@anantara.com",
    postedAt: "2026-05-07T09:00:00Z",
  },
  {
    id: "9",
    title: "Sales Manager",
    company: "Waldorf Astoria Maldives",
    location: "Ithaafushi",
    department: "Sales & Marketing",
    salary: "$3,500 – $5,000/mo",
    deadline: "2026-05-22",
    description:
      "Drive revenue growth for Waldorf Astoria Maldives, one of the world's most exclusive island destinations. You will manage key travel trade accounts, develop new business opportunities, attend international travel fairs, and lead the sales effort across key markets.",
    requirements: [
      "Minimum 4 years luxury hotel sales experience",
      "Established network in the global luxury travel trade",
      "Proven track record of exceeding revenue targets",
      "Strong negotiation and presentation skills",
      "Willingness to travel internationally",
    ],
    tags: ["Featured"],
    applyWhatsApp: "+9607777009",
    applyEmail: "careers@waldorfmaldives.com",
    postedAt: "2026-04-30",
  },
  {
    id: "10",
    title: "HR Officer",
    company: "Amilla Maldives",
    location: "Baa Atoll",
    department: "HR",
    salary: "$1,600 – $2,200/mo",
    deadline: "2026-06-15",
    description:
      "Support the people operations at Amilla Maldives, a family-friendly barefoot-luxury resort. You will assist with recruitment, onboarding, staff welfare activities, payroll coordination, and HR administration for our diverse international team.",
    requirements: [
      "Degree in Human Resources or related field",
      "Minimum 2 years HR experience in hospitality",
      "Familiarity with Maldives labour law is a bonus",
      "Proficiency in HRIS and MS Office",
      "High level of confidentiality and professionalism",
    ],
    tags: [],
    applyWhatsApp: "+9607777010",
    applyEmail: "hr@amilla.com",
    postedAt: "2026-05-03",
  },
  {
    id: "11",
    title: "Finance Manager",
    company: "Coco Bodu Hithi",
    location: "North Malé Atoll",
    department: "Finance",
    salary: "$3,000 – $4,000/mo",
    deadline: "2026-05-31",
    description:
      "Lead all financial operations at Coco Bodu Hithi, including budgeting, forecasting, cash flow management, and monthly financial reporting. You will work closely with the General Manager and department heads to deliver financial insights that drive performance.",
    requirements: [
      "Degree in Finance, Accounting, ACCA or CIMA",
      "Minimum 4 years finance experience in hospitality",
      "Strong knowledge of hotel accounting software",
      "Analytical and detail-oriented",
      "Excellent reporting and communication skills",
    ],
    tags: [],
    applyWhatsApp: "+9607777011",
    applyEmail: "finance@cocoboduhithi.com",
    postedAt: "2026-04-29",
  },
  {
    id: "12",
    title: "Speedboat Captain",
    company: "Niyama Private Islands",
    location: "Dhaalu Atoll",
    department: "Transport",
    salary: "$1,500 – $2,000/mo",
    deadline: "2026-05-20",
    description:
      "Safely transport our guests and team between Malé and Niyama Private Islands via speedboat. You will be responsible for vessel safety checks, maintenance coordination, guest welfare on board, and navigation in Maldivian waters.",
    requirements: [
      "Valid MNDF or MRCS speedboat captain licence",
      "Minimum 3 years as a licensed boat captain",
      "Thorough knowledge of Maldivian waters and navigation",
      "Excellent safety-first mindset",
      "Good spoken English for guest communication",
    ],
    tags: ["Urgent"],
    applyWhatsApp: "+9607777012",
    applyEmail: "hr@niyama.com",
    postedAt: "2026-05-01",
  },
  {
    id: "13",
    title: "Bartender / Mixologist",
    company: "Patina Maldives, Fari Islands",
    location: "North Malé Atoll",
    department: "F&B",
    salary: "$1,600 – $2,200/mo",
    deadline: "2026-06-08",
    description:
      "Patina Maldives is looking for a creative Bartender/Mixologist to craft exceptional cocktails and curate beverage experiences at our Fari Islands bars and beachside venues. You will develop seasonal menus, train junior staff, and ensure every pour reflects our ethos of mindful luxury.",
    requirements: [
      "Minimum 3 years bartending experience in luxury hotels",
      "Recognised mixology certification preferred",
      "Knowledge of classic and contemporary cocktail techniques",
      "Strong product knowledge of wines, spirits, and non-alcoholic alternatives",
      "Engaging, outgoing personality with excellent guest interaction skills",
    ],
    tags: ["Featured"],
    applyWhatsApp: "+9607989001",
    applyEmail: "careers@patinamaldives.com",
    postedAt: "2026-05-03",
  },
  {
    id: "14",
    title: "Private Butler",
    company: "Joali Maldives",
    location: "Raa Atoll",
    department: "Guest Services",
    salary: "$2,000 – $2,800/mo",
    deadline: "2026-06-01",
    description:
      "Joali Maldives, an immersive art-inspired luxury resort in Raa Atoll, is seeking a dedicated Private Butler. You will be the personal point of contact for villa guests, anticipating every need, arranging bespoke experiences, and ensuring flawless, tailored service throughout each stay.",
    requirements: [
      "Minimum 3 years butler or personal concierge experience in ultra-luxury hospitality",
      "Excellent spoken and written English; additional languages a strong advantage",
      "Discreet, proactive, and highly attentive to detail",
      "Experience handling VIP and HNWI guests",
      "Professional diploma in hospitality or butler service preferred",
    ],
    tags: ["Featured", "Urgent"],
    applyWhatsApp: "+9607989002",
    applyEmail: "hr@joali.com",
    postedAt: "2026-05-04",
  },
  {
    id: "15",
    title: "Sous Chef — Italian Cuisine",
    company: "The Ritz-Carlton Maldives, Fari Islands",
    location: "North Malé Atoll",
    department: "Kitchen",
    salary: "$2,800 – $3,600/mo",
    deadline: "2026-05-30",
    description:
      "The Ritz-Carlton Maldives is searching for a Sous Chef specialising in authentic Italian cuisine for our signature restaurant. You will support the Executive Chef in menu development, kitchen operations, and maintaining the legendary Ritz-Carlton gold standards in every dish.",
    requirements: [
      "Formal culinary training with an Italian cuisine specialisation",
      "Minimum 4 years in a senior kitchen role, ideally in luxury resorts",
      "Deep knowledge of regional Italian cooking and fresh pasta techniques",
      "Strong leadership and kitchen management skills",
      "Experience with HACCP and food safety management",
    ],
    tags: ["Featured"],
    applyWhatsApp: "+9607989003",
    applyEmail: "careers@ritzcarlton.com",
    postedAt: "2026-05-02",
  },
  {
    id: "16",
    title: "Marine Biologist / Conservation Officer",
    company: "Raffles Maldives Meradhoo",
    location: "Gaafu Alifu Atoll",
    department: "Recreation",
    salary: "$2,200 – $3,000/mo",
    deadline: "2026-06-15",
    description:
      "Raffles Maldives Meradhoo is hiring a Marine Biologist to lead our coral restoration and reef conservation programme. You will conduct reef surveys, run guest marine awareness sessions, collaborate with local NGOs, and manage our in-house coral nursery.",
    requirements: [
      "Degree in Marine Biology, Marine Science, or related field",
      "PADI Divemaster or higher certification",
      "Experience in coral reef monitoring and restoration techniques",
      "Strong public speaking and guest engagement skills",
      "Passion for ocean conservation and sustainability",
    ],
    tags: [],
    applyWhatsApp: "+9607989004",
    applyEmail: "hr@raffles.com",
    postedAt: "2026-05-05",
  },
  {
    id: "17",
    title: "Yoga & Wellness Instructor",
    company: "LUX* South Ari Atoll",
    location: "Alifu Dhaalu Atoll",
    department: "Spa",
    salary: "$1,800 – $2,500/mo",
    deadline: "2026-06-12",
    description:
      "LUX* South Ari Atoll is seeking a certified Yoga & Wellness Instructor to join our LUX* Me Spa team. You will lead daily sunrise and sunset yoga sessions on the beach, conduct meditation workshops, offer personalised wellness consultations, and create transformative retreat programmes for guests.",
    requirements: [
      "200-hour or 500-hour yoga teacher certification (RYT preferred)",
      "Experience in wellness retreats or luxury spa environments",
      "Knowledge of mindfulness, meditation, and breathwork practices",
      "Warm, motivating personality with strong communication skills",
      "First Aid certification required",
    ],
    tags: ["Urgent"],
    applyWhatsApp: "+9607989005",
    applyEmail: "hr@luxresorts.com",
    postedAt: "2026-05-04",
  },
  {
    id: "18",
    title: "Guest Relations Officer",
    company: "Jumeirah Vittaveli",
    location: "South Malé Atoll",
    department: "Front Office",
    salary: "$1,500 – $2,000/mo",
    deadline: "2026-06-07",
    description:
      "Jumeirah Vittaveli is looking for a passionate Guest Relations Officer to be the face of our resort. You will greet VIP arrivals, manage guest feedback, coordinate special occasions and room amenities, and ensure every guest departs with exceptional memories of Maldives.",
    requirements: [
      "Minimum 2 years guest relations or front office experience in 5-star hotels",
      "Excellent English communication; Arabic or Russian language skills are a bonus",
      "Proficient in Opera PMS",
      "Genuine passion for personalised guest service",
      "Professional appearance and composed demeanour",
    ],
    tags: [],
    applyWhatsApp: "+9607989006",
    applyEmail: "careers@jumeirah.com",
    postedAt: "2026-05-03",
  },
  {
    id: "19",
    title: "Pastry Chef",
    company: "W Maldives",
    location: "North Ari Atoll",
    department: "Kitchen",
    salary: "$2,200 – $3,000/mo",
    deadline: "2026-05-28",
    description:
      "W Maldives is seeking a talented Pastry Chef to lead our pastry and bakery operations. You will craft innovative dessert menus, oversee daily pastry production, design showstopping cakes and sweet amenities for special occasions, and inspire the pastry team with cutting-edge techniques.",
    requirements: [
      "Recognised patisserie or culinary arts qualification",
      "Minimum 4 years as Pastry Chef or Chef de Partie in luxury hospitality",
      "Creative flair in plating and dessert design",
      "Strong knowledge of chocolate work, sugar craft, and bread baking",
      "Ability to manage stock, costs, and a small team",
    ],
    tags: ["Featured"],
    applyWhatsApp: "+9607989007",
    applyEmail: "hr@wmaldives.com",
    postedAt: "2026-05-01",
  },
  {
    id: "20",
    title: "Electrician / Electrical Technician",
    company: "Banyan Tree Vabbinfaru",
    location: "North Malé Atoll",
    department: "Engineering",
    salary: "$1,400 – $1,900/mo",
    deadline: "2026-06-20",
    description:
      "Banyan Tree Vabbinfaru needs an experienced Electrician to maintain and repair all electrical systems across our eco-friendly resort. Duties include routine inspections, fault-finding, installation works, and supporting green energy initiatives including our solar panels and energy monitoring systems.",
    requirements: [
      "Technical diploma or trade certificate in Electrical Engineering",
      "Minimum 3 years electrical maintenance experience, preferably in hospitality",
      "Solid knowledge of 3-phase power, lighting systems, and control panels",
      "Familiarity with solar and renewable energy systems is an advantage",
      "Valid electrical trade licence required",
    ],
    tags: [],
    applyWhatsApp: "+9607989008",
    applyEmail: "hr@banyantree.com",
    postedAt: "2026-05-05",
  },
  {
    id: "21",
    title: "Night Auditor",
    company: "Park Hyatt Maldives Hadahaa",
    location: "Gaafu Alifu Atoll",
    department: "Front Office",
    salary: "$1,300 – $1,700/mo",
    deadline: "2026-06-10",
    description:
      "Park Hyatt Maldives Hadahaa is recruiting a detail-oriented Night Auditor to manage overnight front office operations and financial reconciliation. You will balance daily accounts, generate end-of-day reports, assist late-arriving guests, and coordinate with all departments for a seamless overnight experience.",
    requirements: [
      "Minimum 2 years night audit or accounts experience in hotels",
      "Proficient in Opera PMS and hotel accounting software",
      "Strong numerical and analytical skills",
      "Reliable, self-motivated, and calm under pressure",
      "Good spoken English required",
    ],
    tags: [],
    applyWhatsApp: "+9607989009",
    applyEmail: "careers@hyatt.com",
    postedAt: "2026-05-04",
  },
  {
    id: "22",
    title: "Digital Marketing Executive",
    company: "Kandima Maldives",
    location: "Dhaalu Atoll",
    department: "Sales & Marketing",
    salary: "$1,800 – $2,500/mo",
    deadline: "2026-06-18",
    description:
      "Kandima Maldives — the playful lifestyle resort — is looking for a Digital Marketing Executive to grow our online presence and drive direct bookings. You will manage social media channels, create engaging content, run paid campaigns, coordinate with influencers, and analyse performance data across all digital platforms.",
    requirements: [
      "Degree in Marketing, Communications, or Digital Media",
      "Minimum 2 years digital marketing experience, hospitality preferred",
      "Proficiency in Instagram, Facebook, TikTok, and Google Ads",
      "Skilled in Canva, Adobe Creative Suite, or similar tools",
      "Strong copywriting skills in English",
    ],
    tags: ["Featured", "Urgent"],
    applyWhatsApp: "+9607989010",
    applyEmail: "hr@kandima.com",
    postedAt: "2026-05-05",
  },
  {
    id: "23",
    title: "Pool & Beach Attendant",
    company: "Hard Rock Hotel Maldives",
    location: "South Malé Atoll",
    department: "Recreation",
    salary: "$1,000 – $1,400/mo",
    deadline: "2026-06-25",
    description:
      "Join the Hard Rock vibe at our Maldives resort as a Pool & Beach Attendant! You will set up sun loungers and beach cabanas, assist guests with towels and refreshments, enforce safety rules around the pool, and help create a fun, energetic atmosphere that guests will rave about.",
    requirements: [
      "Basic guest service experience preferred",
      "Strong swimming ability and water safety awareness",
      "Friendly, high-energy personality",
      "Basic spoken English required",
      "Lifeguard certification is an advantage",
    ],
    tags: [],
    applyWhatsApp: "+9607989011",
    applyEmail: "hr@hardrockmaldives.com",
    postedAt: "2026-05-05",
  },
  {
    id: "24",
    title: "Watersports Instructor",
    company: "Emerald Maldives Resort & Spa",
    location: "Raa Atoll",
    department: "Diving & Watersports",
    salary: "$1,500 – $2,000/mo",
    deadline: "2026-06-30",
    description:
      "Emerald Maldives Resort & Spa is seeking an energetic Watersports Instructor to run our beach sports centre. You will instruct guests in windsurfing, kitesurfing, kayaking, and stand-up paddleboarding, conduct safety briefings, and maintain all equipment to the highest standards.",
    requirements: [
      "Recognised watersports instructor certification (RYA, IKO, or equivalent)",
      "Minimum 2 years instructing experience in a resort setting",
      "Strong swimming ability and water rescue training",
      "Outgoing personality with enthusiasm for outdoor activities",
      "Good English communication skills",
    ],
    tags: ["Urgent"],
    applyWhatsApp: "+9607989012",
    applyEmail: "hr@emeraldmaldives.com",
    postedAt: "2026-05-04",
  },
  {
    id: "25",
    title: "IT Systems Administrator",
    company: "Intercontinental Maldives Maamunagau",
    location: "Raa Atoll",
    department: "IT",
    salary: "$2,000 – $2,800/mo",
    deadline: "2026-06-20",
    description:
      "IHG's InterContinental Maldives is looking for an IT Systems Administrator to manage resort-wide technology infrastructure. Responsibilities include maintaining servers, networks, CCTV, PABX, PMS systems, and providing technical support to all departments on the island.",
    requirements: [
      "Degree or diploma in Information Technology or Computer Science",
      "Minimum 3 years IT administration experience, hospitality preferred",
      "Proficiency in Windows Server, networking, and firewall configuration",
      "Experience with Opera PMS and CCTV systems a strong advantage",
      "Strong troubleshooting skills and ability to work independently on a remote island",
    ],
    tags: [],
    applyWhatsApp: "+9607989013",
    applyEmail: "careers@ihg.com",
    postedAt: "2026-05-03",
  },
  {
    id: "26",
    title: "Commis Chef — Asian Cuisine",
    company: "Kagi Maldives Spa Island",
    location: "North Malé Atoll",
    department: "Kitchen",
    salary: "$1,000 – $1,400/mo",
    deadline: "2026-07-01",
    description:
      "Kagi Maldives Spa Island — a serene wellness retreat just 20 minutes from Malé by speedboat — is hiring a Commis Chef with Asian cuisine specialisation. You will support senior chefs in preparing healthy, flavour-forward Asian dishes as part of our mindful dining concept.",
    requirements: [
      "Culinary certificate or diploma",
      "Basic kitchen experience in a hotel or restaurant setting",
      "Passion for Asian flavours including Thai, Japanese, or Indian cuisines",
      "Willingness to learn and grow in a wellness-focused kitchen",
      "Good personal hygiene and HACCP awareness",
    ],
    tags: [],
    applyWhatsApp: "+9607989014",
    applyEmail: "hr@kagi.com.mv",
    postedAt: "2026-05-05",
  },
  {
    id: "27",
    title: "General Manager",
    company: "Nova Maldives",
    location: "South Ari Atoll",
    department: "Management",
    salary: "Competitive + benefits",
    deadline: "2026-06-15",
    description:
      "Nova Maldives — a vibrant, value-luxury island resort — is searching for an experienced General Manager to lead our growing team. You will oversee all resort operations, drive financial performance, champion team development, maintain brand standards, and ensure Nova remains the top-rated resort in its category.",
    requirements: [
      "Minimum 8 years hospitality management with at least 3 years as Resort GM",
      "Proven track record of improving RevPAR and guest satisfaction scores",
      "Strong commercial acumen and budget management skills",
      "Exceptional leadership, communication, and stakeholder management",
      "Experience working in the Maldives or other remote island destinations preferred",
    ],
    tags: ["Featured"],
    applyWhatsApp: "+9607989015",
    applyEmail: "gm.search@novamaldives.com",
    postedAt: "2026-05-05",
  },
];
