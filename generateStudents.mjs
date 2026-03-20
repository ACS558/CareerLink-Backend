import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

// ─── DB CONNECTION ───────────────────────────────────────────────────────────

// Replace with your actual MongoDB connection string
const MONGO_URI = process.env.MONGODB_URI;

// ─── HELPER DATA ─────────────────────────────────────────────────────────────
const firstNames = [
  "Arun",
  "Ravi",
  "Suresh",
  "Priya",
  "Divya",
  "Kavya",
  "Rahul",
  "Amit",
  "Neha",
  "Pooja",
  "Kiran",
  "Sai",
  "Harsha",
  "Lakshmi",
  "Venkat",
  "Deepak",
  "Swathi",
  "Naveen",
  "Sneha",
  "Vijay",
  "Rohit",
  "Ananya",
  "Meghana",
  "Srinivas",
  "Bharath",
  "Lavanya",
  "Teja",
  "Ramesh",
  "Sunita",
  "Prasad",
  "Chaitanya",
  "Bhavana",
  "Manoj",
  "Rekha",
  "Gopal",
  "Sirisha",
  "Naresh",
  "Padma",
  "Lokesh",
  "Mounika",
];

const lastNames = [
  "Kumar",
  "Reddy",
  "Sharma",
  "Rao",
  "Naidu",
  "Chowdary",
  "Varma",
  "Babu",
  "Nair",
  "Pillai",
  "Gupta",
  "Singh",
  "Patel",
  "Verma",
  "Mishra",
  "Iyer",
  "Menon",
  "Das",
  "Bose",
  "Joshi",
  "Prasad",
  "Murthy",
  "Raju",
  "Goud",
  "Yadav",
  "Patel",
  "Shah",
  "Mehta",
  "Chopra",
  "Malhotra",
];

const branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHE"];
const departments = {
  CSE: "Computer Science and Engineering",
  ECE: "Electronics and Communication Engineering",
  EEE: "Electrical and Electronics Engineering",
  MECH: "Mechanical Engineering",
  CIVIL: "Civil Engineering",
  IT: "Information Technology",
  CHE: "Chemical Engineering",
};

// Branch code mapping for registration number format Y22ACS401
// Y = year prefix, 22 = batch year, A = section, CS/EC/EE/ME/CE/IT/CH = branch code
const branchCodes = {
  CSE: "ACS",
  ECE: "AEC",
  EEE: "AEE",
  MECH: "AME",
  CIVIL: "ACE",
  IT: "AIT",
  CHE: "ACH",
};

const skillSets = {
  CSE: [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "MongoDB",
    "SQL",
    "C++",
    "Git",
    "Docker",
  ],
  ECE: [
    "VLSI",
    "Embedded C",
    "Arduino",
    "MATLAB",
    "Signal Processing",
    "PCB Design",
    "Python",
    "IoT",
  ],
  EEE: [
    "MATLAB",
    "PLC",
    "AutoCAD",
    "Power Systems",
    "Control Systems",
    "Python",
    "Circuit Design",
  ],
  MECH: [
    "AutoCAD",
    "SolidWorks",
    "MATLAB",
    "Manufacturing",
    "Thermodynamics",
    "CAD/CAM",
  ],
  CIVIL: [
    "AutoCAD",
    "STAAD Pro",
    "Revit",
    "Surveying",
    "Structural Analysis",
    "MS Project",
  ],
  IT: [
    "JavaScript",
    "React",
    "Python",
    "PHP",
    "MySQL",
    "Linux",
    "Cybersecurity",
    "Cloud Computing",
  ],
  CHE: [
    "MATLAB",
    "Process Design",
    "HYSYS",
    "Python",
    "Laboratory Skills",
    "Chemical Analysis",
  ],
};

const companies = [
  "TCS",
  "Infosys",
  "Wipro",
  "HCL",
  "Tech Mahindra",
  "Cognizant",
  "Accenture",
  "Capgemini",
  "IBM",
  "Oracle",
  "Microsoft",
  "Amazon",
];

const jobTitles = [
  "Software Engineer",
  "System Engineer",
  "Associate Engineer",
  "Junior Developer",
  "Technical Analyst",
  "Graduate Trainee",
];

const projectTitles = [
  "E-Commerce Website",
  "Chat Application",
  "Portfolio Website",
  "Student Management System",
  "Library Management System",
  "Weather App",
  "Task Manager",
  "Blog Platform",
  "Online Quiz App",
];

const certifications = [
  { name: "AWS Cloud Practitioner", issuedBy: "Amazon Web Services" },
  { name: "Google Cloud Associate", issuedBy: "Google" },
  { name: "Python for Data Science", issuedBy: "Coursera" },
  { name: "Full Stack Web Development", issuedBy: "Udemy" },
  { name: "Java Programming", issuedBy: "Oracle" },
  { name: "React Developer", issuedBy: "Meta" },
  { name: "Microsoft Azure Fundamentals", issuedBy: "Microsoft" },
];

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// ─── INLINE SCHEMAS (avoids import issues) ───────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "recruiter", "admin", "alumni"],
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    personalInfo: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      email: { type: String, default: "", lowercase: true, trim: true },
      phoneNumber: { type: String, default: "" },
      dateOfBirth: { type: Date, default: null },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other", ""],
        default: "",
      },
      profilePicture: { type: String, default: "" },
    },
    academicInfo: {
      department: { type: String, default: "" },
      branch: { type: String, uppercase: true, default: "" },
      semester: { type: Number, default: null },
      cgpa: { type: Number, default: null },
      percentage: { type: Number, default: null },
      backlogs: { type: Number, default: 0 },
      graduationYear: { type: Number, default: null },
    },
    skills: [{ type: String }],
    resume: { type: String, default: "" },
    resumeText: { type: String, default: "" },
    projects: [
      {
        title: String,
        description: String,
        technologies: [String],
        liveLink: String,
        githubLink: String,
      },
    ],
    internships: [
      {
        companyName: String,
        role: String,
        duration: String,
        description: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    certifications: [
      {
        name: String,
        issuedBy: String,
        issueDate: Date,
        credentialUrl: String,
      },
    ],
    externalLinks: [{ name: String, url: String }],
    socialLinks: { linkedin: String, github: String, portfolio: String },
    placementStatus: {
      type: String,
      enum: ["unplaced", "placed", "pursuing_higher_studies"],
      default: "unplaced",
    },
    placedCompany: { type: String, default: "" },
    package: { type: Number, default: null },
    placedAt: { type: Date, default: null },
    profileCompleted: { type: Boolean, default: true },
    accountStatus: {
      type: String,
      enum: ["active", "career_guidance_mode", "expired", "deleted"],
      default: "active",
    },
    registrationDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    careerGuidanceStartDate: { type: Date },
    deletionScheduledAt: { type: Date },
    extensionRequests: [],
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    placements: [
      {
        company: { type: String, required: true },
        jobTitle: { type: String, default: "" },
        package: { type: Number, required: true },
        offerDate: { type: Date, default: Date.now },
        joiningDate: { type: Date },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
        isPrimary: { type: Boolean, default: false },
        metadata: {
          jobId: mongoose.Schema.Types.ObjectId,
          applicationId: mongoose.Schema.Types.ObjectId,
        },
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

// ─── GENERATE ONE STUDENT ────────────────────────────────────────────────────
const generateStudent = async (index) => {
  const firstName = randomFrom(firstNames);
  const lastName = randomFrom(lastNames);
  const branch = randomFrom(branches);
  const graduationYear = 2025;
  const cgpa = randomFloat(6.0, 9.8);
  const backlogs = Math.random() < 0.2 ? randomInt(1, 3) : 0;
  const isPlaced = Math.random() < 0.65; // 65% placement rate
  const gender = Math.random() < 0.5 ? "Male" : "Female";
  const branchCode = branchCodes[branch];
  const regNo = `Y22${branchCode}${String(index + 401).padStart(3, "0")}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@bec.edu.in`;

  // Generate 2-3 random skills
  const allSkills = skillSets[branch];
  const numSkills = randomInt(3, 6);
  const studentSkills = [...allSkills]
    .sort(() => 0.5 - Math.random())
    .slice(0, numSkills);

  // Generate 1-2 projects
  const numProjects = randomInt(1, 2);
  const projects = Array.from({ length: numProjects }, () => ({
    title: randomFrom(projectTitles),
    description:
      "A web-based application developed as part of academic coursework.",
    technologies: studentSkills.slice(0, randomInt(2, 3)),
    liveLink: "",
    githubLink: `https://github.com/${firstName.toLowerCase()}${index}/project`,
  }));

  // Generate 0-1 certifications
  const hasCert = Math.random() < 0.6;
  const studentCerts = hasCert
    ? [
        {
          ...randomFrom(certifications),
          issueDate: randomDate(new Date(2022, 0, 1), new Date(2024, 11, 31)),
          credentialUrl: "",
        },
      ]
    : [];

  // Placement info
  const placements = [];
  let placementStatus = "unplaced";
  let placedCompany = "";
  let pkg = null;
  let placedAt = null;

  if (isPlaced) {
    const company = randomFrom(companies);
    const packageAmount = randomFloat(3.5, 12.0);
    const offerDate = randomDate(new Date(2024, 8, 1), new Date(2025, 2, 31));
    placements.push({
      company,
      jobTitle: randomFrom(jobTitles),
      package: packageAmount,
      offerDate,
      joiningDate: new Date(offerDate.getTime() + 90 * 24 * 60 * 60 * 1000),
      status: "accepted",
      isPrimary: true,
    });
    placementStatus = "placed";
    placedCompany = company;
    pkg = packageAmount;
    placedAt = offerDate;
  }

  // Registration date
  const regDate = randomDate(new Date(2021, 7, 1), new Date(2021, 10, 30));
  const guidanceStart = new Date(regDate);
  guidanceStart.setDate(guidanceStart.getDate() + 365);
  const expiryDate = new Date(regDate);
  expiryDate.setDate(expiryDate.getDate() + 375);
  const deletionScheduledAt = new Date(expiryDate);
  deletionScheduledAt.setDate(deletionScheduledAt.getDate() + 90);

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("Student@123", salt);

  return {
    user: {
      email,
      password: hashedPassword,
      role: "student",
      isVerified: true,
      isActive: true,
    },
    student: {
      registrationNumber: regNo,
      personalInfo: {
        firstName,
        lastName,
        email,
        phoneNumber: `9${randomInt(100000000, 999999999)}`,
        dateOfBirth: randomDate(new Date(2000, 0, 1), new Date(2003, 11, 31)),
        gender,
        profilePicture: "",
      },
      academicInfo: {
        department: departments[branch],
        branch,
        semester: 8,
        cgpa,
        percentage: parseFloat((cgpa * 10).toFixed(2)),
        backlogs,
        graduationYear,
      },
      skills: studentSkills,
      projects,
      certifications: studentCerts,
      externalLinks: [
        {
          name: "GitHub",
          url: `https://github.com/${firstName.toLowerCase()}${index}`,
        },
      ],
      socialLinks: {
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        github: `https://github.com/${firstName.toLowerCase()}${index}`,
        portfolio: "",
      },
      placementStatus,
      placedCompany,
      package: pkg,
      placedAt,
      placements,
      profileCompleted: true,
      accountStatus: "active",
      registrationDate: regDate,
      careerGuidanceStartDate: guidanceStart,
      expiryDate,
      deletionScheduledAt,
      isDeleted: false,
    },
  };
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
const main = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.\n");

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < 300; i++) {
      const { user, student } = await generateStudent(i);

      // Check if user already exists
      const existingUser = await User.findOne({ email: user.email });
      if (existingUser) {
        skipped++;
        continue;
      }

      // Create user
      const newUser = await User.create(user);

      // Create student linked to user
      await Student.create({ ...student, userId: newUser._id });

      created++;
      if (created % 50 === 0) console.log(`Created ${created} students...`);
    }

    console.log(`\n✅ Done!`);
    console.log(`   Created : ${created} students`);
    console.log(`   Skipped : ${skipped} (already existed)`);
    console.log(`\nAll students have password: Student@123`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
};

main();
