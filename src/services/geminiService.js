import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parse resume using Gemini
export const parseResume = async (filePath) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Read file
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString("base64");

    const prompt = `
You are a resume parser. Extract the following information from this resume and return ONLY a valid JSON object with no additional text:

{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number"
  },
  "skills": ["skill1", "skill2", "skill3"],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "Graduation Year",
      "cgpa": "CGPA or Percentage"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Duration",
      "description": "Brief description"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Project Description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization"
    }
  ]
}

Extract as much information as possible. If a field is not found, use empty string or empty array.
Return ONLY the JSON object, no markdown formatting, no explanations.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsedData = JSON.parse(text);
    return parsedData;
  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw new Error("Failed to parse resume");
  }
};

// Calculate ATS score using RESUME FILE content
export const calculateATSScoreFromResume = async (
  resumeText,
  jobDescription,
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an ATS (Applicant Tracking System) expert. Analyze how well this candidate's resume matches the job requirements.

RESUME CONTENT:
${resumeText}

JOB DESCRIPTION:
Title: ${jobDescription.title}
Required Skills: ${jobDescription.skillsRequired?.join(", ") || "None"}
Description: ${jobDescription.description}
Minimum CGPA: ${jobDescription.eligibilityCriteria?.minCGPA || "Not specified"}
Preferred Branches: ${jobDescription.eligibilityCriteria?.branches?.join(", ") || "Any"}
Location: ${jobDescription.location}
Salary: ${jobDescription.salaryRange?.min || 0}-${jobDescription.salaryRange?.max || 0} ${jobDescription.salaryType || "LPA"}

Analyze the match and return ONLY this JSON format (no markdown, no code blocks):
{
  "score": 85,
  "strengths": ["Strong match in React and Node.js", "Relevant project experience in web development", "Good academic background with 8.5 CGPA"],
  "weaknesses": ["Limited professional work experience", "Missing Docker expertise mentioned in JD"],
  "recommendation": "Highly recommended"
}

Scoring criteria (0-100):
- Technical skills match with JD: 40%
- Project/internship relevance: 25%
- Education & CGPA fit: 20%
- Overall profile strength: 15%

Be specific in strengths and weaknesses. Mention actual skills, projects, or companies from the resume.
Recommendation must be one of: "Highly recommended", "Recommended", "Maybe", "Not recommended"
`;

    console.log("🎯 Calculating ATS score from resume content...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("📥 Raw Gemini ATS response:");
    console.log(text);

    // Clean response
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const atsResult = JSON.parse(text);
    console.log("✅ Resume-based ATS score:", atsResult.score);

    return atsResult;
  } catch (error) {
    console.error("ATS from resume error:", error.message);
    return null;
  }
};
