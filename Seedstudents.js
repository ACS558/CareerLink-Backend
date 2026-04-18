import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Student from "./src/models/Student.js";

dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════════════════

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/careerlink";

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE DATA ARRAYS
// ═══════════════════════════════════════════════════════════════════════════

const firstNames = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Reyansh",
  "Ayaan",
  "Krishna",
  "Ishaan",
  "Shaurya",
  "Atharv",
  "Advait",
  "Pranav",
  "Devansh",
  "Ananya",
  "Diya",
  "Aadhya",
  "Saanvi",
  "Pari",
  "Anvi",
  "Kavya",
  "Aarohi",
  "Sara",
  "Myra",
  "Kiara",
  "Riya",
  "Navya",
  "Anika",
  "Aditi",
  "Priya",
  "Rohan",
  "Aryan",
  "Karan",
  "Rahul",
  "Amit",
  "Rajesh",
  "Suresh",
  "Dinesh",
  "Neha",
  "Pooja",
  "Divya",
  "Priyanka",
  "Sneha",
  "Nikita",
  "Anjali",
  "Swati",
  "Harsha",
  "Lakshmi",
  "Venkat",
  "Deepak",
  "Naveen",
  "Vijay",
  "Rohit",
  "Manoj",
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
  "Patel",
  "Gupta",
  "Singh",
  "Verma",
  "Mishra",
  "Iyer",
  "Menon",
  "Das",
  "Joshi",
  "Prasad",
  "Murthy",
  "Raju",
  "Goud",
  "Yadav",
  "Shah",
  "Mehta",
  "Chopra",
  "Malhotra",
  "Pillai",
  "Nair",
  "Bose",
  "Agarwal",
  "Saxena",
  "Jain",
];

const branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];

const departments = {
  CSE: "Computer Science and Engineering",
  ECE: "Electronics and Communication Engineering",
  EEE: "Electrical and Electronics Engineering",
  MECH: "Mechanical Engineering",
  CIVIL: "Civil Engineering",
  IT: "Information Technology",
};

const branchCodes = {
  CSE: "ACS",
  ECE: "AEC",
  EEE: "AEE",
  MECH: "AME",
  CIVIL: "ACE",
  IT: "AIT",
};

const skillSets = {
  CSE: [
    "JavaScript",
    "React.js",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "MongoDB",
    "MySQL",
    "Express.js",
    "Git",
    "Docker",
    "AWS",
    "TypeScript",
    "Redux",
    "Next.js",
    "TailwindCSS",
    "REST API",
  ],
  ECE: [
    "VLSI Design",
    "Embedded C",
    "Arduino",
    "MATLAB",
    "Signal Processing",
    "PCB Design",
    "Python",
    "IoT",
    "Microcontrollers",
    "C Programming",
    "Digital Electronics",
    "Communication Systems",
  ],
  EEE: [
    "MATLAB",
    "PLC Programming",
    "AutoCAD",
    "Power Systems",
    "Control Systems",
    "Circuit Design",
    "Python",
    "Electrical Machines",
    "Power Electronics",
    "Energy Systems",
    "SCADA",
  ],
  MECH: [
    "AutoCAD",
    "SolidWorks",
    "CATIA",
    "ANSYS",
    "MATLAB",
    "Manufacturing",
    "Thermodynamics",
    "CAD/CAM",
    "3D Modeling",
    "Fluid Mechanics",
    "Machine Design",
    "CNC Programming",
  ],
  CIVIL: [
    "AutoCAD",
    "STAAD Pro",
    "Revit",
    "Surveying",
    "Structural Analysis",
    "MS Project",
    "Quantity Surveying",
    "Building Design",
    "GIS",
    "Construction Management",
    "Concrete Technology",
  ],
  IT: [
    "JavaScript",
    "React.js",
    "Python",
    "Java",
    "PHP",
    "MySQL",
    "Linux",
    "Cybersecurity",
    "Cloud Computing",
    "Data Structures",
    "Algorithms",
    "Web Development",
    "Mobile App Development",
  ],
};

const companies = [
  "TCS",
  "Infosys",
  "Wipro",
  "HCL Technologies",
  "Tech Mahindra",
  "Cognizant",
  "Accenture",
  "Capgemini",
  "IBM",
  "Oracle",
  "Amazon",
  "Microsoft",
  "Google",
  "Zoho",
  "Freshworks",
];

const jobTitles = [
  "Software Engineer",
  "System Engineer",
  "Associate Engineer",
  "Junior Developer",
  "Technical Analyst",
  "Graduate Engineer Trainee",
];

const projectTitles = {
  CSE: [
    "E-Commerce Platform",
    "Social Media Dashboard",
    "Task Management System",
    "Chat Application",
    "Blog Platform",
    "Weather Forecast App",
    "Student Management Portal",
    "Quiz Application",
    "Food Delivery System",
  ],
  ECE: [
    "IoT Based Home Automation",
    "Smart Meter System",
    "Wireless Sensor Network",
    "RFID Based Attendance",
    "Digital Signal Processor",
    "Solar Tracking System",
  ],
  EEE: [
    "Smart Grid Monitoring",
    "Solar Power Plant Design",
    "Motor Speed Controller",
    "Power Factor Correction",
    "Automatic Street Light",
    "Battery Management System",
  ],
  MECH: [
    "CNC Machine Design",
    "Hydraulic Press System",
    "Solar Water Heater",
    "Robotic Arm Design",
    "Wind Turbine Model",
    "Thermal Energy Storage",
  ],
  CIVIL: [
    "Building Structure Design",
    "Bridge Analysis",
    "Water Supply Network",
    "Highway Design Project",
    "Green Building Design",
    "Seismic Analysis",
  ],
  IT: [
    "College Management System",
    "Library Automation",
    "Online Voting System",
    "Healthcare Portal",
    "Inventory Management",
    "Payment Gateway Integration",
  ],
};

const certifications = [
  { name: "AWS Cloud Practitioner", issuedBy: "Amazon Web Services" },
  { name: "Azure Fundamentals", issuedBy: "Microsoft" },
  { name: "Google Cloud Associate", issuedBy: "Google Cloud" },
  { name: "Python for Data Science", issuedBy: "Coursera" },
  { name: "Full Stack Development", issuedBy: "Udemy" },
  { name: "Java Programming", issuedBy: "Oracle" },
  { name: "React Developer", issuedBy: "Meta" },
  { name: "Machine Learning", issuedBy: "Stanford Online" },
  { name: "Cybersecurity Essentials", issuedBy: "Cisco" },
  { name: "Data Structures", issuedBy: "NPTEL" },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const shuffleArray = (arr) => [...arr].sort(() => 0.5 - Math.random());

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE SINGLE STUDENT
// ═══════════════════════════════════════════════════════════════════════════

const generateStudent = async (index) => {
  const firstName = random(firstNames);
  const lastName = random(lastNames);
  const fullName = `${firstName} ${lastName}`;
  const branch = random(branches);
  const branchCode = branchCodes[branch];
  const department = departments[branch];

  // Registration number format: Y22CS401, Y22CS402... Y22EC401...
  const regNo = `Y22${branchCode}${String(index + 401).padStart(3, "0")}`;

  // Email format: firstname.lastname.regNo@bec.edu.in
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${regNo.toLowerCase()}@bec.edu.in`;

  // Academic details
  const cgpa = randomFloat(6.0, 9.5);
  const percentage = parseFloat((cgpa * 9.5).toFixed(2));
  const backlogs = Math.random() < 0.15 ? randomInt(1, 2) : 0;
  const gender = Math.random() < 0.6 ? "Male" : "Female";

  // Skills (3-6 random skills from branch skill set)
  const allSkills = skillSets[branch];
  const numSkills = randomInt(4, 7);
  const studentSkills = shuffleArray(allSkills).slice(0, numSkills);

  // Projects (1-3 projects)
  const numProjects = randomInt(1, 3);
  const branchProjects = projectTitles[branch];
  const projects = shuffleArray(branchProjects)
    .slice(0, numProjects)
    .map((title, idx) => ({
      title,
      description: `Developed ${title.toLowerCase()} using modern technologies as part of academic coursework.`,
      technologies: shuffleArray(studentSkills).slice(0, randomInt(2, 4)),
      githubLink: `https://github.com/${firstName.toLowerCase()}${index}/project${idx + 1}`,
      liveLink:
        Math.random() < 0.3
          ? `https://${firstName.toLowerCase()}-project${idx + 1}.vercel.app`
          : "",
    }));

  // Certifications (0-2 certifications)
  const numCerts = Math.random() < 0.5 ? 0 : randomInt(1, 2);
  const studentCerts = shuffleArray(certifications)
    .slice(0, numCerts)
    .map((cert) => ({
      ...cert,
      issueDate: randomDate(new Date(2022, 0, 1), new Date(2024, 11, 31)),
      credentialUrl: `https://certificates.com/${firstName.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

  // Placement status (60% placed)
  const isPlaced = Math.random() < 0.6;
  let placementData = {
    placementStatus: "unplaced",
    placedCompany: "",
    placedPackage: null,
    placedRole: "",
    placedDate: null,
  };

  if (isPlaced) {
    const company = random(companies);
    const packageAmount = randomFloat(3.5, 15.0);
    const placedDate = randomDate(new Date(2024, 8, 1), new Date(2025, 1, 28));

    placementData = {
      placementStatus: "placed",
      placedCompany: company,
      placedPackage: packageAmount,
      placedRole: random(jobTitles),
      placedDate,
    };
  }

  // Date of birth (age 21-23)
  const dob = randomDate(new Date(2001, 0, 1), new Date(2003, 11, 31));

  // Phone number
  const phoneNumber = `9${randomInt(100000000, 999999999)}`;

  // Social links
  const linkedinUrl = `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.random().toString(36).substr(2, 6)}`;
  const githubUrl = `https://github.com/${firstName.toLowerCase()}${index}`;
  const portfolioUrl =
    Math.random() < 0.2
      ? `https://${firstName.toLowerCase()}-portfolio.vercel.app`
      : "";

  return {
    user: {
      email,
      password: "Student@123",
      role: "student",
      isApproved: true,
    },
    student: {
      registrationNumber: regNo,

      personalInfo: {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth: dob,
        gender,
      },

      academicInfo: {
        department,
        branch,
        semester: 8,
        cgpa,
        percentage,
        backlogs,
        graduationYear: 2026,
      },

      skills: studentSkills,

      projects,

      certifications: studentCerts,

      socialLinks: {
        linkedin: linkedinUrl,
        github: githubUrl,
        portfolio: portfolioUrl,
      },

      profileCompleted: true,

      placements: isPlaced
        ? [
            {
              company: placementData.placedCompany,
              jobTitle: placementData.placedRole,
              package: placementData.placedPackage,
              offerDate: placementData.placedDate,
              status: "accepted",
              isPrimary: true,
            },
          ]
        : [],
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

const main = async () => {
  try {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║        CareerLink Student Data Seeder (300 Students)    ║");
    console.log(
      "╚══════════════════════════════════════════════════════════╝\n",
    );

    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected successfully!\n");

    console.log("🔍 Checking existing data...");
    const existingCount = await User.countDocuments({ role: "student" });
    console.log(`   Found ${existingCount} existing students\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    console.log("🚀 Starting student generation...\n");

    for (let i = 0; i < 300; i++) {
      try {
        const { user, student } = await generateStudent(i);

        // Check if email already exists
        const existingUser = await User.findOne({ email: user.email });
        if (existingUser) {
          skipped++;
          process.stdout.write(`⏭  Skipped ${i + 1}/300 (already exists)\r`);
          continue;
        }

        // Create user first
        const newUser = await User.create(user);

        // Create student linked to user
        await Student.create({
          ...student,
          userId: newUser._id,
        });

        created++;

        // Progress indicator
        if (created % 25 === 0) {
          console.log(`✅ Created ${created}/300 students...`);
        } else {
          process.stdout.write(`⏳ Creating... ${created}/300\r`);
        }
      } catch (error) {
        errors++;
        console.error(`\n❌ Error creating student ${i + 1}:`, error.message);
      }
    }

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║                    SUMMARY REPORT                        ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log(`\n✅ Successfully created: ${created} students`);
    console.log(`⏭  Skipped (duplicates):  ${skipped} students`);
    console.log(`❌ Errors encountered:    ${errors} students`);
    console.log(
      `📊 Total in database:     ${await User.countDocuments({ role: "student" })} students`,
    );

    console.log(
      "\n╔══════════════════════════════════════════════════════════╗",
    );
    console.log("║                  LOGIN CREDENTIALS                       ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("\n📧 Email Format:");
    console.log("   firstname.lastname.regNo@bec.edu.in");
    console.log("\n🔑 Password for ALL students:");
    console.log("   Student@123");
    console.log("\n📝 Sample Login Credentials:");

    // Show 5 sample credentials
    const sampleStudents = await Student.find().limit(5).populate("userId");
    sampleStudents.forEach((s, idx) => {
      console.log(`Email: ${s.personalInfo.email}`);
      console.log(`Branch: ${s.academicInfo.branch}`);
      console.log(`      Password: Student@123`);
      console.log(`      Reg No: ${s.registrationNumber}`);
    });

    console.log("\n");
  } catch (error) {
    console.error("\n❌ Fatal Error:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n📡 Disconnected from MongoDB.");
    console.log("\n✨ Seeding complete!\n");
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

main();
