import { gemini } from "../lib/gemini";

export async function parseCVtoJSON(cvText: string) {
  const prompt = `
You are an assistant that extracts CVs into a structured JSON.
Take the following CV text and organize it into JSON format exactly as follows.
If a section is missing, leave it blank or empty array.

{
  "name": "",
  "email": "",
  "phone": "",
  "linkedin": "",
  "github": "",
  "website": "",
  "summary": "",
  "futureGoals": "",
  "education": [
    {
      "degree": "",
      "institution": "",
      "startYear": "",
      "endYear": "",
      "details": ""
    }
  ],
  "experience": [
    {
      "title": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "details": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ],
  "skills": [],
  "certifications": [],
  "languages": [],
  "publications": [
    {
      "title": "",
      "publisher": "",
      "year": "",
      "details": ""
    }
  ]
}

CV TEXT:
"""${cvText}"""
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        { text: prompt}
      ]
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
