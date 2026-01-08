import { gemini } from '../lib/gemini';

export async function websiteReport(htmlContent: string) {
  const prompt = `
You are a **career intelligence assistant**.

I will provide you with the **raw HTML of a company's landing page**.
Your job is to analyze ONLY what can be inferred from that page and produce a **clear, concise, and visually polished Markdown report**.

---

## 🎯 Your Output MUST include ONLY the following 3 sections

### 1️⃣ What the Company Is
- Company name (if identifiable)
- What type of company it is (e.g., SaaS startup, agency, enterprise, marketplace, etc.)
- A **1–2 sentence plain-English explanation** of the company

---

### 2️⃣ What the Company Does
- Core product(s), service(s), or solution(s)
- What problem they solve or value they provide
- Who their product/service is for (users, businesses, industry, etc.)

Use **bullet points**, not paragraphs.

---

### 3️⃣ What YOU (a Job Applicant) Need to Be Skilled At
- Concrete **technical skills**, **tools**, or **technologies** mentioned or implied
- Relevant **domains** or **problem areas** the company works in
- Types of experience or projects that would align well with this company

Focus on **actionable, skill-based takeaways**, not generic advice.

---

## 🧾 Output Rules (Very Important)

- Output **MUST be valid, clean, and beautiful Markdown**
- Use:
  - Clear headings
  - Bullet points
  - Bold keywords
  - Emojis ONLY in section headers (minimal & professional)
- Do **NOT** include:
  - Company culture analysis
  - Mission/vision fluff
  - CV or cover letter tips
  - Assumptions not grounded in the HTML
- If something is unclear, make a **reasonable inference** and phrase it carefully (e.g., "Likely focuses on…").

---

## 📥 Input HTML
"""
${htmlContent}
"""

---

## 📤 Output
Return **only** the Markdown report. No explanations. No JSON.
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: [{ text: prompt }],
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      console.error('Gemini returned empty response');
      return null;
    }

    const cleaned = rawText
      .replace(/```(?:markdown|md)?/gi, '')
      .replace(/```/g, '')
      .trim();

    return cleaned;
  } catch (err) {
    console.error('Request failed:', err);
    return null;
  }
}
