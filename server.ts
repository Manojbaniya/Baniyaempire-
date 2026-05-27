import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini API with correct parameters
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY not found. Server starting without AI capabilities.");
}

app.use(express.json());

// Mock database for pre-loaded local jobs in Beni & Myagdi
const MOCK_JOBS = [
  {
    id: "job-1",
    title: "BeniDash Delivery Rider",
    npTitle: "बेनीडेश डेलिभरी राइडर",
    category: "delivery",
    type: "Part-time / Full-time",
    location: "Beni, Myagdi",
    npLocation: "बेनी, म्याग्दी",
    salary: "NPR 15,000 - 25,000 / month + Fuel allowances",
    description: "Deliver hot meals, groceries, and medical supplies from local merchants directly to customers in Beni Bazaar with flexible hours.",
    npDescription: "बेनी बजार भित्र स्थानीय पसलहरूबाट खाना, किराना र औषधि डेलिभरी गर्नका लागि।"
  },
  {
    id: "job-2",
    title: "Organic Farm Supervisor",
    npTitle: "अर्गानिक कृषि निरीक्षक",
    category: "agriculture",
    type: "Full-time",
    location: "Baniya Farms, Dandakhet",
    npLocation: "बानियाँ फार्म्स, डाँडाखेत",
    salary: "NPR 22,000 - 30,000 / month",
    description: "Manage planting, nurturing, and harvesting of organic produce at Dandakhet agricultural lot. Experience in organic composting preferred.",
    npDescription: "डाँडाखेतमा प्रांगारिक कृषिको रेखदेख, रोपाईं र फसल व्यवस्थापन हेर्नका लागि।"
  },
  {
    id: "job-3",
    title: "Python & IT Instructor",
    npTitle: "आईटी र प्रोग्रामिङ प्रशिक्षक",
    category: "education",
    type: "Contract",
    location: "BeniDash Gurukul, Beni",
    npLocation: "बेनीडेश गुरुकुल, बेनी",
    salary: "NPR 25,000 - 35,000 / month",
    description: "Teach basic computing, digital literacy, and introductory Python programming to young minds from across Myagdi under the Gurukul program.",
    npDescription: "म्याग्दीका विद्यार्थीहरूलाई डिजिटल साक्षरता र आधारभूत प्रोग्रामिङ सिकाउनका लागि।"
  },
  {
    id: "job-4",
    title: "Beni–Pokhara Shuttle Driver",
    npTitle: "भ्यान चालक (बेनी–पोखरा)",
    category: "transport",
    type: "Full-time",
    location: "BeniMove, Beni",
    npLocation: "बेनीमूभ, बेनी",
    salary: "NPR 20,000 - 28,000 / month",
    description: "Drive clean tourist vans and local shuttles on the Beni to Pokhara route. Must hold a valid driver's license with zero accidents history.",
    npDescription: "बेनी देखि पोखरा चल्ने चल्तीको अत्याधुनिक आरामदायी पर्यटकीय भ्यान हाँक्नका लागि।"
  }
];

// Delivery routes and pricing estimator
const DESTINATIONS: Record<string, { distanceKm: number; baseNpr: number }> = {
  "Beni Bazaar": { distanceKm: 1, baseNpr: 50 },
  "Pula, Dandakhet": { distanceKm: 6, baseNpr: 120 },
  "Galeshwor Dham": { distanceKm: 3.5, baseNpr: 80 },
  "Tatopani Hot Spring": { distanceKm: 9, baseNpr: 180 },
  "Babiyachaur": { distanceKm: 16, baseNpr: 320 },
  "Singa Tatopani": { distanceKm: 8, baseNpr: 160 },
  "Darwang": { distanceKm: 24, baseNpr: 450 }
};

// API routes
app.get("/api/jobs", (req, res) => {
  res.json(MOCK_JOBS);
});

app.post("/api/jobs/create", (req, res) => {
  const { title, npTitle, category, type, location, npLocation, salary, description, npDescription } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newJob = {
    id: `job-${Date.now()}`,
    title,
    npTitle: npTitle || title,
    category: category || "general",
    type: type || "Full-time",
    location: location || "Myagdi, Nepal",
    npLocation: npLocation || "म्याग्दी, नेपाल",
    salary: salary || "Negotiable",
    description,
    npDescription: npDescription || description
  };
  MOCK_JOBS.unshift(newJob);
  res.status(201).json(newJob);
});

// Delivery fee estimator endpoint
app.post("/api/estimator", (req, res) => {
  const { from, to, serviceType } = req.body; // serviceType: "ride", "food", "parcel", "medicine"
  
  const fromData = DESTINATIONS[from];
  const toData = DESTINATIONS[to];
  
  if (!fromData || !toData) {
    return res.status(400).json({ error: "Invalid locations selected" });
  }

  // Calculate delivery math
  const distance = Math.abs(fromData.distanceKm - toData.distanceKm) || 1.2;
  let ratePerKm = 20; // NPR per km
  let baseFee = 60;   // Base fee in NPR
  
  if (serviceType === "ride") {
    ratePerKm = 25;
    baseFee = 50;
  } else if (serviceType === "food" || serviceType === "grocery") {
    ratePerKm = 15;
    baseFee = 40;
  } else if (serviceType === "medicine") {
    ratePerKm = 10;
    baseFee = 30; // Subsidized for community support
  }

  const calculatedFee = Math.round(baseFee + (distance * ratePerKm));
  const estMinutes = Math.max(15, Math.round(distance * 3 + 10));

  res.json({
    from,
    to,
    distanceKm: parseFloat(distance.toFixed(1)),
    estimatedFeeNpr: calculatedFee,
    estimatedMinutes: estMinutes,
    formula: `Base ${baseNpr => baseFee} NPR + ${distance.toFixed(1)} km × ${ratePerKm} NPR/km`
  });
});

// AI BeniDash chat helper
app.post("/api/ai-benidash/chat", async (req, res) => {
  const { message, history } = req.body; // history is optional array of { role: 'user'|'model', text: string }
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!ai) {
    return res.json({
      text: "Namaste! AI BeniDash is currently running in local offline demo mode because the API key is not active. I'm the digital companion for the Baniya Empire in Beni, Myagdi. How can I help you find opportunities in our beautiful hills today?"
    });
  }

  try {
    const sysInstruction = `You are "AI BeniDash", the premier local AI Assistant for the Myagdi District and the Baniya Empire digital ecosystem, proudly developed by the Baniya Empire technology team (located in Pula, Dandakhet, Myagdi, Nepal, designed to empower our native land through digital technology).

Your character:
- You are exceptionally warm, humble, polite, and helpful, mirroring the loving hospitality of Nepalese mountains.
- You speak naturally in English, formal Nepali, or a friendly blended Romanized Nepali (Nepglish) depending on how the user prompts you.
- You have deep pride in Beni, Dandakhet, Pula, Tatopani, Galeshwor Dham, and the entirety of Myagdi.
- Respond enthusiastically about Baniya Empire's initiatives:
  * BeniDash: Deliveries & rides simplifying bazaar life.
  * BeniJobs: Getting youth local jobs so they don't have to fly abroad.
  * AI BeniDash (You!): A guide to answers, farming advice, or homework.
  * Gurukul: Online free study modules so every child shines.
  * Visit Myagdi: Treks like Dhaulagiri Round or rafting on the Kali Gandaki.
  * HK Baniya Foundation: Formed in memory of grandmother Hom Kumari Baniya, offering educational stipends.
  
Keep answers encouraging, visually pleasing (use Markdown, bullet points, emojis where appropriate), and medium size. Support the vision of 'I do, you do, we do... TOGETHER 🤝'.`;

    // Process chat history if configured, otherwise make standard content generation
    let contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: { role: string; text: string }) => {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.8,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Failed to connect to AI server",
      text: "Namaste! I had a connection ripple down here in the mountains of Myagdi. Please let me try again in a bit!"
    });
  }
});


// Dev vs Production Setup for Express serving Vite Client
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProduction) {
    // Lazily load vite in development to avoid compilation overhead on simple start
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port 3000 host 0.0.0.0 as required by container
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Baniya Empire server running on port ${PORT}`);
    if (apiKey) {
      console.log("Gemini API Key active on server!");
    }
  });
}

startServer();
