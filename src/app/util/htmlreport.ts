import { gemini } from "../lib/gemini";

export async function websiteReport(htmlContent: string) {
  const prompt = `
You are a career insights analyst. I will provide you the **raw HTML of a company's landing page**.
Your task is to analyze the company and produce a **Company Website Analysis Report**.

Focus on identifying:

1. **Company Overview**
   - Name
   - Website URL (if available)
   - Short description of what the company does

2. **Specializations / Core Focus**
   - Main services, products, or solutions
   - Technologies, tools, or platforms mentioned
   - Target clients or market segments

3. **Culture & Work Style**
   - Remote-friendly or hybrid?
   - Team structure (flat, hierarchical, cross-functional, project-based, etc.)
   - Traits or values emphasized (innovation, results-driven, collaborative, client-first, etc.)

4. **Signals / Additional Context**
   - Tech focus or innovation emphasis
   - Data or metrics-driven approaches
   - Client-first or customer-oriented messaging

5. **Actionable Recommendations**
   - Skills, experience, or projects a candidate should emphasize based on the company’s specialization
   - How to adapt a CV or portfolio to align with their focus
   - Tips for cover letter or messaging to match company culture

**Rules:**
- Focus **heavily on the company's specializations**; the rest (culture, signals) is context.
- Avoid vague statements; extract concrete keywords, services, and technologies.
- Keep it structured, readable, and human-friendly (like a report, not JSON).
- If information is missing or unclear, make a **reasonable inference based on the content**.
- Keep each section clearly labeled.

**Input HTML:**
"""${htmlContent}"""

**Output:**
Produce a **Company Website Analysis Report** following the structure above.
  `

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

    return rawText;
  } catch (err) {
    console.error('Request failed:', err);
    return null;
  }
}
