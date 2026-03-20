// Helper functions for profile management

// Calculate student profile completion percentage
export const calculateStudentProfileCompletion = (student) => {
  let completion = 0;
  const weights = {
    personalInfo: 20,
    academicInfo: 25,
    skills: 15,
    projects: 15,
    internships: 10,
    certifications: 10,
    socialLinks: 5,
  };

  // Personal Info (20%)
  const personalFields = [
    "firstName",
    "lastName",
    "phoneNumber",
    "dateOfBirth",
    "gender",
  ];
  const filledPersonalFields = personalFields.filter(
    (field) =>
      student.personalInfo[field] && student.personalInfo[field] !== "",
  );
  completion +=
    (filledPersonalFields.length / personalFields.length) *
    weights.personalInfo;

  // Academic Info (25%)
  const academicFields = [
    "branch",
    "semester",
    "cgpa",
    "percentage",
    "graduationYear",
  ];
  const filledAcademicFields = academicFields.filter(
    (field) =>
      student.academicInfo[field] !== null &&
      student.academicInfo[field] !== "",
  );
  completion +=
    (filledAcademicFields.length / academicFields.length) *
    weights.academicInfo;

  // Skills (15%)
  if (student.skills && student.skills.length > 0) {
    completion += weights.skills;
  }

  // Projects (15%)
  if (student.projects && student.projects.length > 0) {
    completion += weights.projects;
  }

  // Internships (10%)
  if (student.internships && student.internships.length > 0) {
    completion += weights.internships;
  }

  // Certifications (10%)
  if (student.certifications && student.certifications.length > 0) {
    completion += weights.certifications;
  }

  // Social Links (5%)
  if (
    student.socialLinks &&
    (student.socialLinks.linkedin || student.socialLinks.github)
  ) {
    completion += weights.socialLinks;
  }

  return Math.round(completion);
};

// Calculate recruiter profile completion percentage
export const calculateRecruiterProfileCompletion = (recruiter) => {
  let completion = 0;
  const weights = {
    companyInfo: 60,
    contactPerson: 40,
  };

  // Company Info (60%)
  const companyFields = [
    "companyName",
    "industry",
    "website",
    "companySize",
    "location",
    "description",
  ];
  const filledCompanyFields = companyFields.filter(
    (field) =>
      recruiter.companyInfo[field] && recruiter.companyInfo[field] !== "",
  );
  completion +=
    (filledCompanyFields.length / companyFields.length) * weights.companyInfo;

  // Contact Person (40%)
  const contactFields = ["name", "designation", "phoneNumber", "email"];
  const filledContactFields = contactFields.filter(
    (field) =>
      recruiter.contactPerson[field] && recruiter.contactPerson[field] !== "",
  );
  completion +=
    (filledContactFields.length / contactFields.length) * weights.contactPerson;

  return Math.round(completion);
};

// Calculate alumni profile completion percentage
export const calculateAlumniProfileCompletion = (alumni) => {
  let completion = 0;
  const weights = {
    personalInfo: 30,
    currentRole: 40,
    externalLinks: 30,
  };

  // Personal Info (30%)
  const personalFields = ["firstName", "lastName", "phoneNumber"];
  const filledPersonalFields = personalFields.filter(
    (field) => alumni.personalInfo[field] && alumni.personalInfo[field] !== "",
  );
  completion +=
    (filledPersonalFields.length / personalFields.length) *
    weights.personalInfo;

  // Current Role (40%)
  const roleFields = ["company", "designation", "experience"];
  const filledRoleFields = roleFields.filter(
    (field) =>
      alumni.currentRole[field] &&
      alumni.currentRole[field] !== "" &&
      alumni.currentRole[field] !== 0,
  );
  completion +=
    (filledRoleFields.length / roleFields.length) * weights.currentRole;

  // External Links (30%)
  const hasLinks =
    (alumni.externalLinks && alumni.externalLinks.length > 0) ||
    (alumni.socialLinks &&
      (alumni.socialLinks.linkedin || alumni.socialLinks.twitter));
  if (hasLinks) {
    completion += weights.externalLinks;
  }

  return Math.round(completion);
};

// Validate CGPA
export const validateCGPA = (cgpa) => {
  if (cgpa === null || cgpa === undefined || cgpa === "") return true; // Optional field
  const cgpaNum = parseFloat(cgpa);
  return cgpaNum >= 0 && cgpaNum <= 10;
};

// Validate Percentage
export const validatePercentage = (percentage) => {
  if (percentage === null || percentage === undefined || percentage === "")
    return true; // Optional field
  const percentNum = parseFloat(percentage);
  return percentNum >= 0 && percentNum <= 100;
};

// Validate Email
export const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

// Validate Phone Number (Indian format)
export const validatePhone = (phone) => {
  if (!phone || phone === "") return true; // Optional field
  const phoneRegex =
    /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

// Validate URL
export const validateURL = (url) => {
  if (!url || url === "") return true; // Optional field
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Validate Graduation Year
export const validateGraduationYear = (year) => {
  if (!year) return true; // Optional field
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 10 && year <= currentYear + 10;
};
