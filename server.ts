import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", offlineReady: true });
});

// Socratic AI Coach Streaming endpoint (Ultra-low latency)
app.post("/api/gemini/hint/stream", async (req, res) => {
  try {
    const { problemTitle, problemContext, studentInput, studentLevel } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Utilizing offline rule-based coach fallback.",
        isFallback: true,
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    const systemInstruction = `You are the Socratic Math Coach for "Number Sense, Fractions & Proportions Studio" by Sir Eugene Technologies.
Your target audience is Ghanaian high school students (Form 1, Form 2, Form 3).
Guidelines:
1. Provide concise, friendly, rapid Socratic guiding hints (1 to 2 short sentences max).
2. NEVER give away the numerical answer or compute the final arithmetic.
3. Prompt them to think about relationships: equivalent fractions, common denominators, unit fractions, visual strips, percentages, or ratios.
4. Keep the tone encouraging, culturally relatable, and mathematically precise.`;

    const prompt = `Problem: ${problemTitle || "Fraction / Ratio Challenge"}
Context & Details: ${problemContext || "Student is working on finding equivalence or partitioning."}
Student Level: ${studentLevel || "Form 1"}
Student Question: ${studentInput || "I need a hint."}

Provide a quick 1-2 sentence Socratic hint:`;

    const stream = await ai.models.generateContentStream({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Gemini Socratic hint stream error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message || "Failed to generate AI hint stream",
        isFallback: true,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
      res.end();
    }
  }
});

// Socratic AI Coach standard fast endpoint
app.post("/api/gemini/hint", async (req, res) => {
  try {
    const { problemTitle, problemContext, studentInput, studentLevel } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Utilizing offline rule-based coach fallback.",
        isFallback: true,
      });
    }

    const systemInstruction = `You are the Socratic Math Coach for "Number Sense, Fractions & Proportions Studio" by Sir Eugene Technologies.
Your target audience is Ghanaian high school / junior high students (Form 1, Form 2, Form 3).
Guidelines:
1. Provide concise, friendly, rapid Socratic guiding hints (1 to 2 short sentences).
2. NEVER give away the final numerical answer or do the final arithmetic.
3. Prompt them to think about relationships: equivalent fractions, common denominators, unit fractions, visual bars, percentages, or ratios.
4. Keep the tone encouraging, culturally relatable, and mathematically precise.`;

    const prompt = `Problem: ${problemTitle || "Fraction / Ratio Challenge"}
Context & Details: ${problemContext || "Student is working on finding equivalence or partitioning."}
Student Level: ${studentLevel || "Form 1"}
Student's Current Step / Query: ${studentInput || "I'm stuck, can you give me a guiding hint?"}

Please provide a short Socratic guiding hint without revealing the numeric solution:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const hintText = response.text || "Think about breaking both parts into smaller, equal-sized units. What number do both denominators divide into evenly?";
    return res.json({ hint: hintText, isFallback: false });
  } catch (error: any) {
    console.error("Gemini Socratic hint error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI hint",
      isFallback: true,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
