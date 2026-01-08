import { gemini } from "../lib/gemini";

export async function parseJobPostingToJSON(jobText: string) {
  const prompt = `
You are an assistant that extracts job postings into a structured JSON.
Take the following job posting text and organize it into JSON format exactly as follows.
If a section is missing, leave it blank or empty array.
For extra sections or extra requirements add a field "extra" and put all the extra information there as a string.

{
  "jobTitle": "",
  "experienceRequired": "",
  "jobType": "",
  "workingDays": "",
  "skillsMustHave": [],
  "skillsNiceToHave": [],
  "responsibilities": [],
  "salary": "",
  "softSkills": [],
  "education": "",
  "applicationMethod": "",
  "extra": ""
}

JOB POSTING:
"""${jobText}"""
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: [{ text: prompt }]
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      console.error('Gemini returned empty response');
      return null;
    }

    // Clean common LLM JSON issues
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Request failed:', err);
    return null;
  }
}
