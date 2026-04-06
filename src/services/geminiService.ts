import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getApiKey = () => {
  // Try import.meta.env first (Vite standard)
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (key) return key;
  
  // Fallback to define-replaced process.env
  try {
    return process.env.GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

export async function analyzeMedicalReport(
  fileData: string,
  mimeType: string
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your environment.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a highly skilled medical report explainer. Your goal is to help non-medical users understand their health reports in VERY simple, clear English and Simple Tamil.
    
    CRITICAL GUIDELINES:
    1. DUAL LANGUAGE: For every section, provide the explanation in Simple English first, followed by Simple Tamil (தமிழ்).
    2. SUPER SIMPLE LANGUAGE: Imagine you are explaining this to a 10-year-old. Avoid ALL medical jargon. If you must use a medical term (like 'Leukocytosis'), explain it immediately (e.g., 'high white blood cell count').
    3. HIGHLIGHT ABNORMALITIES: Use bold text or a specific section to clearly identify any values that are outside the normal range. Explain what these abnormalities might mean in simple terms.
    4. PROVIDE PRECAUTIONS: Suggest immediate lifestyle precautions or measures based on the findings (e.g., 'drink more water', 'avoid heavy work').
    5. NEXT STEPS: Suggest what the user should discuss with their doctor. Provide 3-4 specific questions they can ask.
    6. DISCLAIMER: Always start by stating that this is an AI-generated explanation and NOT a professional medical diagnosis. The user MUST consult a doctor.
    7. FORMAT: Use clean Markdown with clear headings. Use emojis to make it more readable and less intimidating.
    
    Structure your response as follows (in both English and Tamil):
    - ⚠️ **Medical Disclaimer / மருத்துவ எச்சரிக்கை**
    - 📝 **Overall Summary / ஒட்டுமொத்த சுருக்கம்**
    - 🚩 **Abnormalities & Key Findings / அசாதாரணங்கள் மற்றும் முக்கிய கண்டுபிடிப்புகள்**
    - 📖 **Medical Terms Simplified / எளிமைப்படுத்தப்பட்ட மருத்துவச் சொற்கள்**
    - 🛡️ **Precautions & Measures / முன்னெச்சரிக்கைகள் மற்றும் நடவடிக்கைகள்**
    - 🩺 **Questions for your Doctor / உங்கள் மருத்துவரிடம் கேட்க வேண்டிய கேள்விகள்**
  `;

  const prompt = "Please analyze this medical report and explain it in simple English according to the system instructions.";

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: fileData.split(",")[1], // Remove the data:image/png;base64, part
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.2, // Keep it factual
    },
  });

  return response.text || "Failed to analyze the report.";
}
