import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  console.log("🧪 Testing Gemini API...");
  console.log(
    "API Key:",
    process.env.GEMINI_API_KEY ? "✅ Found" : "❌ Missing",
  );

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const result = await model.generateContent("Say hello in one word");
    const response = await result.response;
    console.log("✅ Gemini API working!");
    console.log("Response:", response.text());

    // Test JSON generation
    console.log("\n🧪 Testing JSON generation...");
    const jsonTest = await model.generateContent(
      'Return ONLY this JSON: {"score": 85, "message": "test"}',
    );
    const jsonResponse = await jsonTest.response;
    console.log("JSON Response:", jsonResponse.text());
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

testGemini();
