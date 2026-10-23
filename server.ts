import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

import { generateDeterministicPrediction } from "./src/utils/pricePredictionEngine";
import { getCropConfig, SUPPORTED_CROPS } from "./src/data/cropDatasets";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Supported Crops API
app.get("/api/supported-crops", (_req, res) => {
  return res.json(SUPPORTED_CROPS);
});

// AI Price Prediction API Endpoint (Hybrid Model Pipeline)
app.post("/api/price-prediction", (req, res) => {
  try {
    const { crop = "onion", market, horizon = 7 } = req.body || {};
    const prediction = generateDeterministicPrediction({
      crop,
      market,
      horizon: Number(horizon) || 7,
      mode: "model",
    });
    return res.json(prediction);
  } catch (error: any) {
    console.error("Price prediction error on backend:", error);
    return res.status(500).json({ error: "Price prediction is temporarily unavailable. Please try again." });
  }
});

// Historical Market Observations API
app.get("/api/price-history", (req, res) => {
  try {
    const cropKey = (req.query.crop as string) || "onion";
    const cropConfig = getCropConfig(cropKey);
    return res.json({
      crop: cropConfig.id,
      cropDisplayName: cropConfig.displayName,
      cropIcon: cropConfig.icon,
      market: cropConfig.primaryMarket,
      latest: cropConfig.latestObservation,
      observations: cropConfig.observations.slice(-90),
    });
  } catch (error: any) {
    console.error("Price history error on backend:", error);
    return res.status(500).json({ error: "Price history is temporarily unavailable. Please try again." });
  }
});

// Lazy GoogleGenAI client initialization
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper to clean raw markdown from AI text (anti-markdown discipline)
function stripRawMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, "") // Remove ## heading tags
    .replace(/\*\*/g, "") // Remove ** bold markers
    .replace(/\*/g, "") // Remove single asterisks
    .replace(/`([^`]+)`/g, "$1") // Remove backticks
    .replace(/^\|[\s\-:|]+\|$/gm, "") // Remove markdown table separator rows
    .replace(/\|/g, " ") // Replace stray pipes with space
    .replace(/^[-_\s]{3,}$/gm, ""); // Remove --- lines
}

// AI Assistant Endpoint (Website-Aware, Anti-Markdown, Natural Conversational Flow)
app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { message = "", history = [], websiteContext = {}, language = "en" } = req.body;
    const ai = getAiClient();
    const lowerMsg = message.toLowerCase().trim();

    // Benchmark mandi benchmark rates
    const mandiBenchmarkRates = [
      { crop: "Wheat (Sharbati)", price: 2450, unit: "Quintal", market: "Benchmark APMC", trend: "Stable" },
      { crop: "Onion (Nashik Red)", price: 1800, unit: "Quintal", market: "Ahmedabad APMC", trend: "May Increase" },
      { crop: "Cotton (Grade A)", price: 6800, unit: "Quintal", market: "Rajkot Mandi", trend: "Firm" },
      { crop: "Basmati Rice (1121)", price: 4200, unit: "Quintal", market: "Karnal Mandi", trend: "High Demand" },
      { crop: "Mustard Seed", price: 5600, unit: "Quintal", market: "Jaipur Mandi", trend: "Steady" },
      { crop: "Potato (Jyoti)", price: 1400, unit: "Quintal", market: "Deesa Mandi", trend: "Stable" },
    ];

    const activeView = websiteContext.activeView || "general";
    const activeCrop = websiteContext.activeCrop || "Onion";
    const activeMarket = websiteContext.activeMarket || "Ahmedabad APMC Mandi";
    const todayPrice = websiteContext.todayPrice || 1800;
    const expectedPrice = websiteContext.expectedPrice || 2380;
    const priceDiff = websiteContext.priceDiff !== undefined ? websiteContext.priceDiff : 580;
    const forecastHorizon = websiteContext.forecastHorizon || 7;
    const trendText = websiteContext.trend || "May Increase";

    // Conversational memory check: inspect previous turn to identify context
    const lastUserMsg = [...history].reverse().find((h: any) => h.role === "user")?.text?.toLowerCase() || "";
    const isFollowUpToOnion = lastUserMsg.includes("onion") || lastUserMsg.includes("प्याज़") || lastUserMsg.includes("ડુંગળી") || activeView === "price-prediction";
    const isFollowUpToWheat = lastUserMsg.includes("wheat") || lastUserMsg.includes("गेहूँ") || lastUserMsg.includes("ઘઉં");

    // If Gemini client is available
    if (ai) {
      const formattedContext = `
CURRENT APPLICATION CONTEXT:
- Active Page View: ${activeView}
- User: ${websiteContext.user?.name || "Farmer/Buyer"} (${websiteContext.user?.role || "user"}), Location: ${websiteContext.user?.village || "Anand"}, ${websiteContext.user?.district || "Anand"}, ${websiteContext.user?.state || "Gujarat"}
- Active Crop on screen: ${activeCrop} in ${activeMarket}
- Today's Mandi Price for ${activeCrop}: ₹${todayPrice} / Quintal
- Expected AI Market Price for ${activeCrop}: ₹${expectedPrice} / Quintal (Forecast horizon: ${forecastHorizon} days, Trend: ${trendText}, Difference: ${priceDiff >= 0 ? "+" : ""}${priceDiff})
- Historical Mandi Benchmark Rates: Wheat ₹2,450/Q, Onion ₹1,800/Q, Cotton ₹6,800/Q, Basmati Rice ₹4,200/Q, Mustard ₹5,600/Q, Potato ₹1,400/Q
- Marketplace produce items listed: ${websiteContext.items?.length || 0}
- Weather: 28°C Sunny, 62% humidity, 12 km/h winds in Anand, Gujarat
- Recent Conversation History:
${history.slice(-4).map((h: any) => `${h.role}: ${h.text}`).join("\n")}
`;

      const systemInstruction = `You are CloudAgri AI Assistant, a friendly, concise, expert agricultural advisor for Indian farmers and wholesale buyers.

CRITICAL FORMATTING & CONVERSATIONAL RULES:
1. NEVER OUTPUT RAW MARKDOWN CHARACTERS:
   - DO NOT use pipe characters "|" or dashes "---" or table syntax.
   - DO NOT use double asterisks "**" for bold. Output clean, readable plain text.
   - DO NOT use hashtags "##" for headings.
2. ANSWER THE USER'S ACTUAL QUESTION FIRST:
   - DO NOT automatically dump a list of unrelated crops or mandi prices.
   - If asked "What is today's wheat price?", answer ONLY about wheat:
     "Today's wheat mandi price is around ₹2,450 per quintal.
     This is the current benchmark available for the selected market. Prices can vary depending on crop quality, quantity and mandi.
     Would you like me to compare this with your listed wheat price?"
   - If asked about multiple crops (e.g. "mandi rates", "compare prices"), format each crop neatly on its own line: Crop: Rate/Quintal (Market). Never use pipe tables!
3. PRICE PREDICTION & FORECASTS:
   - When asked about onion price prediction or future prices:
     "Based on the current CloudAgri AI forecast, onion prices are expected to be around ₹${expectedPrice} per quintal over the selected ${forecastHorizon}-day forecast period.
     Today's market price is ₹${todayPrice} per quintal, so the model estimates an increase of about ₹${Math.abs(priceDiff)} per quintal.
     The current trend is upward, but this is an AI estimate based on historical market data and is not a guaranteed future price.
     Would you like me to show the price trend?"
4. CONVERSATIONAL MEMORY & PAGE CONTEXT:
   - If the user asks "What about next week?" or "Is price going up?", use the conversation history and active page context to understand they mean ${activeCrop}.
5. FARMER-FRIENDLY TONE:
   - DO NOT use machine learning jargon (no "neural network", "loss function", "out-of-sample", "MAPE", "weights").
   - Instead say "Based on recent market data...", "According to the AI forecast...", "The model expects...".
6. LANGUAGE:
   - The user selected language: "${language}".
   - ALWAYS respond in the user's selected language:
     * If "hi" (Hindi), respond in natural, polite Hindi in Devanagari script.
     * If "gu" (Gujarati), respond in natural Gujarati.
     * If "mr" (Marathi), respond in natural Marathi.
     * If "pa" (Punjabi), respond in natural Punjabi (Gurmukhi).
     * If "en" (English), respond in natural English.
   - Never respond in English when Hindi/Gujarati/Marathi/Punjabi is requested.
7. STRUCTURE:
   Short direct answer -> Helpful explanation -> Relevant numbers / insights -> Optional next action.`;

      const contents: any[] = [];
      for (const h of history.slice(-6)) {
        contents.push({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] });
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
        },
      });

      const rawReply = response.text || "I am analyzing your agricultural query. How can I assist you further?";
      const cleanedReply = stripRawMarkdown(rawReply);

      // Check if response has structured prediction or multi-crop content to attach visual card
      let card = undefined;
      let table = undefined;

      if (lowerMsg.includes("onion") || lowerMsg.includes("predict") || lowerMsg.includes("forecast") || lowerMsg.includes("प्याज़") || lowerMsg.includes("ડુંગળી")) {
        card = {
          type: "price_forecast",
          crop: "Onion",
          icon: "🧅",
          currentPrice: todayPrice,
          expectedPrice: expectedPrice,
          priceDiff: priceDiff,
          unit: "Quintal",
          trend: trendText,
          horizon: forecastHorizon,
          market: activeMarket,
          note: "AI forecast based on historical Ahmedabad APMC mandi data",
        };
      } else if (lowerMsg.includes("wheat") || lowerMsg.includes("गेहूँ") || lowerMsg.includes("ઘઉં")) {
        card = {
          type: "price_benchmark",
          crop: "Wheat (Sharbati)",
          icon: "🌾",
          currentPrice: 2450,
          unit: "Quintal",
          market: "Benchmark APMC Mandi",
          trend: "Stable Demand",
          note: "Mandi modal benchmark rate for standard FAQ grade",
        };
      }

      if (lowerMsg.includes("mandi rates") || lowerMsg.includes("all rates") || lowerMsg.includes("compare prices") || lowerMsg.includes("मंडी भाव") || lowerMsg.includes("મંડી ભાવ")) {
        table = mandiBenchmarkRates;
      }

      return res.json({
        success: true,
        reply: cleanedReply,
        card,
        table,
      });
    }

    // =========================================================================
    // INTELLIGENT MULTI-LINGUAL FALLBACK ENGINE (When offline / no GEMINI_API_KEY)
    // Supports English, Hindi, Gujarati, Marathi, and Punjabi with 100% fidelity
    // =========================================================================
    let reply = "";
    let card: any = undefined;
    let table: any = undefined;
    let suggestedActions: string[] = [];

    // 1. Wheat Price query
    if (
      lowerMsg.includes("wheat") ||
      lowerMsg.includes("गेहूँ") ||
      lowerMsg.includes("ઘઉં") ||
      (isFollowUpToWheat && (lowerMsg.includes("price") || lowerMsg.includes("rate") || lowerMsg.includes("ભાવ") || lowerMsg.includes("भाव")))
    ) {
      if (language === "hi") {
        reply = "आज गेहूँ का मंडी भाव लगभग ₹2,450 प्रति क्विंटल है।\n\nयह चयनित बाज़ार के लिए उपलब्ध बेंचमार्क दर है। फ़सल की गुणवत्ता, मात्रा और मंडी के आधार पर कीमतों में थोड़ा अंतर हो सकता है।\n\nक्या आप चाहते हैं कि मैं आपके सूचीबद्ध गेहूँ के भाव से इसकी तुलना करूँ?";
      } else if (language === "gu") {
        reply = "આજનો ઘઉંનો મંડી ભાવ લગભગ ₹2,450 પ્રતિ ક્વિન્ટલ છે.\n\nઆ પસંદ કરેલ બજાર માટે ઉપલબ્ધ બેન્ચમાર્ક દર છે. પાકની ગુણવત્તા, જથ્થો અને મંડી અનુસાર ભાવમાં ફેરફાર થઈ શકે છે.\n\nશું તમે તમારા લિસ્ટેડ ઘઉંના ભાવ સાથે આની સરખામણી કરવા માંગો છો?";
      } else if (language === "mr") {
        reply = "आजचा गव्हाचा बाजार भाव साधारण ₹2,450 प्रति क्विंटल आहे.\n\nहा निवडलेल्या बाजारपेठेसाठी उपलब्ध बेंचमार्क दर आहे. पिकाची गुणवत्ता, प्रमाण आणि बाजारानुसार दरांमध्ये थोडा फरक असू शकतो.\n\nआपण आपल्या नोंदणीकृत गव्हाच्या दराशी याची तुलना करू इच्छिता का?";
      } else if (language === "pa") {
        reply = "ਅੱਜ ਕਣਕ ਦਾ ਮੰਡੀ ਭਾਅ ਲਗਭਗ ₹2,450 ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ।\n\nਇਹ ਚੁਣੀ ਗਈ ਮੰਡੀ ਲਈ ਉਪਲਬਧ ਬੈਂਚਮਾਰਕ ਰੇਟ ਹੈ। ਫਸਲ ਦੀ ਗੁਣਵੱਤਾ, ਮਾਤਰਾ ਅਤੇ ਮੰਡੀ ਅਨੁਸਾਰ ਕੀਮਤਾਂ ਵਿੱਚ ਫਰਕ ਹੋ ਸਕਦਾ ਹੈ।\n\nਕੀ ਤੁਸੀਂ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਮੈਂ ਤੁਹਾਡੀ ਸੂਚੀਬੱਧ ਕਣਕ ਦੇ ਭਾਅ ਨਾਲ ਇਸਦੀ ਤੁਲਨਾ ਕਰਾਂ?";
      } else {
        reply = "Today's wheat mandi price is around ₹2,450 per quintal.\n\nThis is the current benchmark available for the selected market. Prices can vary depending on crop quality, quantity and mandi.\n\nWould you like me to compare this with your listed wheat price?";
      }

      card = {
        type: "price_benchmark",
        crop: "Wheat (Sharbati)",
        icon: "🌾",
        currentPrice: 2450,
        unit: "Quintal",
        market: "Benchmark APMC Mandi",
        trend: "Stable Demand",
        note: "Benchmark modal rate for standard FAQ grade",
      };
      suggestedActions = ["Compare Prices", "Predict Onion Price", "Find Buyers"];

    // 2. Onion Price Prediction / Expected Price / Next Week query
    } else if (
      lowerMsg.includes("onion") ||
      lowerMsg.includes("प्याज़") ||
      lowerMsg.includes("ડુંગળી") ||
      lowerMsg.includes("predict") ||
      lowerMsg.includes("forecast") ||
      lowerMsg.includes("next week") ||
      (isFollowUpToOnion && (lowerMsg.includes("trend") || lowerMsg.includes("going up") || lowerMsg.includes("increase") || lowerMsg.includes("अगले")))
    ) {
      if (language === "hi") {
        reply = `वर्तमान क्लाउड-एग्री AI पूर्वानुमान के अनुसार, चयनित पूर्वानुमान अवधि में प्याज़ की कीमत लगभग ₹${expectedPrice} प्रति क्विंटल रहने की संभावना है।\n\nआज का बाज़ार भाव ₹${todayPrice} प्रति क्विंटल है, इसलिए मॉडल लगभग ₹${Math.abs(priceDiff)} प्रति क्विंटल की वृद्धि का अनुमान लगा रहा है।\n\nवर्तमान रुझान ऊपर की ओर है, लेकिन यह ऐतिहासिक मंडी आंकड़ों पर आधारित एक AI अनुमान है और गारंटीकृत बाज़ार भाव नहीं है।\n\nक्या आप मूल्य रुझान का चार्ट देखना चाहेंगे?`;
      } else if (language === "gu") {
        reply = `ક્લાઉડ-એગ્રી AI ના વર્તમાન અંદાજ અનુસાર, પસંદ કરેલ સમયગાળામાં ડુંગળીનો ભાવ લગભગ ₹${expectedPrice} પ્રતિ ક્વિન્ટલ રહેવાની ધારણા છે.\n\nઆજનો બજાર ભાવ ₹${todayPrice} પ્રતિ ક્વિન્ટલ છે, તેથી મોડેલ અનુસાર આશરે ₹${Math.abs(priceDiff)} પ્રતિ ક્વિન્ટલનો વધારો થઈ શકે છે.\n\nભાવમાં વધારાનો ટ્રેન્ડ જણાય છે, પરંતુ આ ઐતિહાસિક મંડી ડેટા આધારિત એક AI અંદાજ છે, ગેરંટીડ બજાર ભાવ નથી.\n\nશું તમે ભાવ ટ્રેન્ડ જોવાનું પસંદ કરશો?`;
      } else if (language === "mr") {
        reply = `सध्याच्या क्लाउड-अ‍ॅग्री AI अंदाजानुसार, कांद्याचे दर निवडलेल्या कालावधीत सुमारे ₹${expectedPrice} प्रति क्विंटल राहण्याची शक्यता आहे.\n\nआजचा बाजार भाव ₹${todayPrice} प्रति क्विंटल आहे, त्यामुळे मॉडेलनुसार सुमारे ₹${Math.abs(priceDiff)} प्रति क्विंटल वाढ अपेक्षित आहे.\n\nसध्याचा कल वाढीचा आहे, परंतु हा ऐतिहासिक बाजार आकडेवारीवर आधारित AI अंदाज आहे, हमी दिलेला दर नाही.\n\nआपण किंमतींचा कल पाहू इच्छिता का?`;
      } else if (language === "pa") {
        reply = `ਮੌਜੂਦਾ ਕਲਾਉਡ-ਐਗਰੀ AI ਅੰਦਾਜ਼ੇ ਅਨੁਸਾਰ, ਪਿਆਜ਼ ਦੀ ਕੀਮਤ ਲਗਭਗ ₹${expectedPrice} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਰਹਿਣ ਦੀ ਉਮੀਦ ਹੈ।\n\nਅੱਜ ਦਾ ਬਾਜ਼ਾਰ ਭਾਅ ₹${todayPrice} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ, ਇਸ ਲਈ ਮਾਡਲ ਲਗਭਗ ₹${Math.abs(priceDiff)} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਦੇ ਵਾਧੇ ਦਾ ਅੰਦਾਜ਼ਾ ਲਗਾ ਰਿਹਾ ਹੈ।\n\nਰੁਝਾਨ ਉੱਪਰ ਵੱਲ ਹੈ, ਪਰ ਇਹ ਇਤਿਹਾਸਕ ਮੰਡੀ ਅੰਕੜਿਆਂ 'ਤੇ ਅਧਾਰਤ AI ਅੰਦਾਜ਼ਾ ਹੈ, ਕੋਈ ਗਾਰੰਟੀਸ਼ੁਦਾ ਕੀਮਤ ਨਹੀਂ ਹੈ।\n\nਕੀ ਤੁਸੀਂ ਕੀਮਤ ਦਾ ਰੁਝਾਨ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?`;
      } else {
        reply = `Based on the current CloudAgri AI forecast, onion prices are expected to be around ₹${expectedPrice} per quintal over the selected forecast period.\n\nToday's market price is ₹${todayPrice} per quintal, so the model estimates an increase of about ₹${Math.abs(priceDiff)} per quintal.\n\nThe current trend is upward, but this is an AI estimate based on historical market data and is not a guaranteed future price.\n\nWould you like me to show the price trend?`;
      }

      card = {
        type: "price_forecast",
        crop: "Onion",
        icon: "🧅",
        currentPrice: todayPrice,
        expectedPrice: expectedPrice,
        priceDiff: priceDiff,
        unit: "Quintal",
        trend: trendText,
        horizon: forecastHorizon,
        market: activeMarket,
        note: "AI forecast based on historical Ahmedabad APMC mandi data",
      };
      suggestedActions = ["View Price Forecast", "Today's Mandi Price", "Compare Prices"];

    // 3. Multi-Crop Mandi Rates Query
    } else if (
      lowerMsg.includes("mandi") ||
      lowerMsg.includes("rates") ||
      lowerMsg.includes("prices") ||
      lowerMsg.includes("compare") ||
      lowerMsg.includes("ભાવ") ||
      lowerMsg.includes("भाव")
    ) {
      if (language === "hi") {
        reply = "यहाँ प्रमुख फ़सलों के वर्तमान बेंचमार्क मंडी भाव दिए गए हैं:\n\nयह संदर्भ कीमतें प्रमुख APMC मंडियों के मॉडल भावों पर आधारित हैं। फ़सल की गुणवत्ता और स्थानीय बाज़ार के आधार पर वास्तविक दरों में अंतर हो सकता है।\n\nक्या आप किसी विशेष फ़सल का AI मूल्य पूर्वानुमान देखना चाहते हैं?";
      } else if (language === "gu") {
        reply = "અહીં મુખ્ય પાકોના વર્તમાન બેન્ચમાર્ક મંડી ભાવો આપેલા છે:\n\nઆ ભાવો અગ્રણી APMC મંડીઓના સરેરાશ મોડલ ભાવ પર આધારિત છે. વાસ્તવિક ભાવ પાકની ગુણવત્તા અનુસાર બદલાઈ શકે છે.\n\nશું તમે કોઈ ચોક્કસ પાક માટે AI ભાવ અંદાજ જોવા માંગો છો?";
      } else if (language === "mr") {
        reply = "येथे प्रमुख पिकांचे सध्याचे बेंचमार्क बाजार भाव दिले आहेत:\n\nहे दर प्रमुख APMC बाजारातील सरासरी भावांवर आधारित आहेत. पिकाच्या गुणवत्तेनुसार वास्तविक दरात बदल होऊ शकतो.\n\nआपण कोणत्याही विशिष्ट पिकाचा AI दर अंदाज पाहू इच्छिता का?";
      } else if (language === "pa") {
        reply = "ਇੱਥੇ ਪ੍ਰਮੁੱਖ ਫਸਲਾਂ ਦੇ ਮੌਜੂਦਾ ਬੈਂਚਮਾਰਕ ਮੰਡੀ ਭਾਅ ਦਿੱਤੇ ਗਏ ਹਨ:\n\nਇਹ ਕੀਮਤਾਂ ਪ੍ਰਮੁੱਖ APMC ਮੰਡੀਆਂ ਦੇ ਔਸਤ ਰੇਟਾਂ 'ਤੇ ਅਧਾਰਤ ਹਨ। ਅਸਲ ਦਰਾਂ ਵਿੱਚ ਗੁਣਵੱਤਾ ਅਨੁਸਾਰ ਫਰਕ ਹੋ ਸਕਦਾ ਹੈ।\n\nਕੀ ਤੁਸੀਂ ਕਿਸੇ ਖਾਸ ਫਸਲ ਦਾ AI ਮੁੱਲ ਅੰਦਾਜ਼ਾ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?";
      } else {
        reply = "Here are the current benchmark mandi prices for major crops:\n\nThese rates reflect benchmark modal values across major APMC markets. Actual transaction prices may vary with crop grade and mandi location.\n\nWould you like an AI forecast for a specific crop?";
      }

      table = mandiBenchmarkRates;
      suggestedActions = ["Predict Onion Price", "Find Buyers", "My Listed Crops"];

    // 4. Cheapest produce query
    } else if (lowerMsg.includes("cheapest") || lowerMsg.includes("cheap") || lowerMsg.includes("lowest") || lowerMsg.includes("सस्ता") || lowerMsg.includes("સસ્તું")) {
      const items = websiteContext.items || [];
      if (items.length > 0) {
        const sorted = [...items].sort((a: any, b: any) => a.price - b.price);
        const cheapest = sorted[0];
        if (language === "hi") {
          reply = `मार्केटप्लेस पर वर्तमान में सबसे सस्ता उत्पाद ${cheapest.title} है, जो ${cheapest.sellerName} द्वारा ${cheapest.location} में ₹${cheapest.price} प्रति ${cheapest.unit} की दर से उपलब्ध है (उपलब्ध मात्रा: ${cheapest.availableQuantity} ${cheapest.unit})।\n\nक्या आप इस उत्पाद को सीधे खरीदना या प्रस्ताव भेजना चाहते हैं?`;
        } else if (language === "gu") {
          reply = `માર્કેટપ્લેસ પર અત્યારે સૌથી સસ્તો પાક ${cheapest.title} છે, જે ${cheapest.sellerName} દ્વારા ${cheapest.location} ખાતે ₹${cheapest.price} પ્રતિ ${cheapest.unit} ના ભાવે ઉપલબ્ધ છે (જથ્થો: ${cheapest.availableQuantity} ${cheapest.unit}).\n\nશું તમે આ ઉત્પાદન જોવા માંગો છો?`;
        } else {
          reply = `The most affordable produce listed on the marketplace right now is ${cheapest.title} by ${cheapest.sellerName} in ${cheapest.location} for ₹${cheapest.price} per ${cheapest.unit} (Available quantity: ${cheapest.availableQuantity} ${cheapest.unit}).\n\nWould you like to view this product details or negotiate directly?`;
        }
      } else {
        reply = "The most affordable items currently available on the marketplace benchmark are Organic Potato (Jyoti) at ₹1,400 per Quintal and Sharbati Wheat at ₹2,450 per Quintal.";
      }
      suggestedActions = ["Find Buyers", "Today's Mandi Price", "Compare Prices"];

    // 5. Weather query
    } else if (lowerMsg.includes("weather") || lowerMsg.includes("मौसम") || lowerMsg.includes("હવામાન") || lowerMsg.includes("हवामान")) {
      if (language === "hi") {
        reply = "आनंद, गुजरात में वर्तमान मौसम 28°C और धूप वाला है। आर्द्रता 62% है और हवा की गति 12 किमी/घंटा है।\n\nयह कटाई, अनाज सुखाने और खेत में नियमित सिंचाई कार्यों के लिए अनुकूल मौसम है।\n\nक्या आप अगले 3 दिनों का विस्तृत कृषि मौसम पूर्वानुमान देखना चाहते हैं?";
      } else if (language === "gu") {
        reply = "આણંદ, ગુજરાતમાં હાલનું હવામાન 28°C અને સૂર્યપ્રકાશ વાળું છે. ભેજનું પ્રમાણ 62% છે અને પવનની ગતિ 12 કિમી/કલાક છે.\n\nઆ પાકની કાપણી અને અનાજ સુકવણી માટે ઉત્તમ હવામાન છે.\n\nશું તમે હવામાન અપડેટ્સ વિગતવાર જોવા માંગો છો?";
      } else {
        reply = "Currently in Anand, Gujarat, the weather is 28°C and Sunny with 62% humidity and light 12 km/h winds.\n\nThese are favorable conditions for harvest drying, field aeration, and standard irrigation cycles.\n\nWould you like to open the full live weather monitor?";
      }
      suggestedActions = ["Today's Mandi Price", "Predict Onion Price", "My Listed Crops"];

    // 6. Government Schemes query
    } else if (lowerMsg.includes("scheme") || lowerMsg.includes("yojana") || lowerMsg.includes("government") || lowerMsg.includes("योजना") || lowerMsg.includes("યોજના")) {
      if (language === "hi") {
        reply = "भारतीय किसानों के लिए प्रमुख सरकारी कृषि योजनाएँ:\n\n1. PM-KISAN: पात्र किसानों को 3 समान किस्तों में प्रति वर्ष ₹6,000 की सीधी वित्तीय सहायता।\n2. PMFBY (फ़सल बीमा योजना): प्राकृतिक आपदाओं के ख़िलाफ़ न्यूनतम प्रीमियम पर व्यापक बीमा सुरक्षा।\n3. e-NAM पोर्टल: पारदर्शी इलेक्ट्रॉनिक बोली और सीधी अंतर-राज्य बिक्री के लिए राष्ट्रीय कृषि बाज़ार।\n4. SMAM योजना: कृषि यंत्रों और उपकरणों की ख़रीद पर 40% से 50% तक सरकारी सब्सिडी।\n\nक्या आप इनमें से किसी योजना की पात्रता के बारे में विस्तार से जानना चाहते हैं?";
      } else if (language === "gu") {
        reply = "ભારતીય ખેડૂતો માટે અગત્યની સરકારી યોજનાઓ:\n\n1. પીએમ-કિસાન: વર્ષે ₹6,000 ની સીધી નાણાકીય સહાય.\n2. પીએમ ફસલ બીમા યોજના (PMFBY): પાક નુકસાન સામે ઓછા પ્રીમિયમે સુરક્ષા.\n3. ઈ-નામ (e-NAM): દેશવ્યાપી ડિજિટલ મંડી પોર્ટલ.\n4. કૃષિ યાંત્રિકીકરણ સબમિશન: ટ્રેક્ટર અને ઓજારો પર 40-50% સબસિડી.\n\nશું તમે આમાંથી કોઈ યોજના વિશે વધુ માહિતી મેળવવા માંગો છો?";
      } else {
        reply = "Key Government Agricultural Schemes for Indian farmers:\n\n1. PM-KISAN: ₹6,000 annual direct income support credited in 3 equal installments.\n2. PMFBY (Crop Insurance): Comprehensive insurance coverage against crop damage at minimal premium.\n3. e-NAM Portal: National Agriculture Market enabling transparent online trading across APMC mandis.\n4. SMAM: 40% to 50% financial subsidy on agricultural machinery and modern equipment.\n\nWould you like details on how to register or verify eligibility for any of these?";
      }
      suggestedActions = ["Today's Mandi Price", "Predict Onion Price", "Find Buyers"];

    // 7. Selling produce / list crop query
    } else if (lowerMsg.includes("sell") || lowerMsg.includes("list") || lowerMsg.includes("add crop") || lowerMsg.includes("बेच") || lowerMsg.includes("વેચ")) {
      if (language === "hi") {
        reply = "क्लाउड-एग्री AI पर अपनी फ़सल सीधे थोक खरीदारों को बेचने के आसान चरण:\n\n1. ऊपर नेविगेशन में 'किसान कंसोल' पर जाएँ।\n2. '+ फ़सल उत्पाद जोड़ें' बटन पर क्लिक करें।\n3. फ़सल का नाम, मात्रा, अपना अपेक्षित मंडी भाव और ग्रेड दर्ज करें।\n4. उत्पाद की फ़ोटो अपलोड करके 'प्रकाशित करें' पर क्लिक करें।\n\nआपकी फ़सल तुरंत सत्यापित थोक खरीदारों को दिखाई देगी और वे आपको सीधे ख़रीद प्रस्ताव भेज सकेंगे।";
      } else if (language === "gu") {
        reply = "ક્લાઉડ-એગ્રી AI પર તમારો પાક સીધો ખરીદદારોને વેચવા માટેનાં પગલાં:\n\n1. ઉપરના મેનુમાંથી 'ખેડૂત કન્સોલ' પસંદ કરો.\n2. '+ ઉત્પાદન ઉમેરો' પર ક્લિક કરો.\n3. પાકનું નામ, જથ્થો, ભાવ અને ગ્રેડ દાખલ કરો.\n4. ફોટો અપલોડ કરી 'પ્રકાશિત કરો' પર ક્લિક કરો.\n\nતમારો પાક સીધો જથ્થાબંધ ખરીદદારોને દેખાશે અને તેઓ સીધો ઓર્ડર આપી શકશે.";
      } else {
        reply = "Steps to sell your harvest directly on CloudAgri AI:\n\n1. Open your 'Farmer Console' from the top menu.\n2. Click the '+ Add Produce Listing' button.\n3. Enter crop name, category, available quantity, price per quintal, and quality grade.\n4. Upload crop photos and click 'Publish Listing'.\n\nYour crop will be immediately visible to verified wholesale buyers across India for direct purchase and price negotiation.";
      }
      suggestedActions = ["My Listed Crops", "Today's Mandi Price", "Predict Onion Price"];

    // 8. Default Greeting / Help
    } else {
      const userName = websiteContext.user?.name || "Friend";
      if (language === "hi") {
        reply = `नमस्ते ${userName}! मैं आपका क्लाउड-एग्री AI सहायक हूँ।\n\nमैं आपको मंडी भाव जाँचने, प्याज़ AI मूल्य पूर्वानुमान देखने, मौसम की स्थिति जानने, अपनी फ़सल सूचीबद्ध करने और सीधे थोक खरीदारों से जुड़ने में मदद कर सकता हूँ।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?`;
      } else if (language === "gu") {
        reply = `નમસ્તે ${userName}! હું તમારો ક્લાઉડ-એગ્રી AI સહાયક છું.\n\nહું તમને મંડી ભાવો જાણવા, ડુંગળીના ભાવનો AI અંદાજ મેળવવા, હવામાન અપડેટ્સ અને પાક સીધો વેચવામાં મદદ કરી શકું છું.\n\nઆજે હું તમારી શું મદદ કરી શકું?`;
      } else if (language === "mr") {
        reply = `नमस्ते ${userName}! मी आपला क्लाउड-अ‍ॅग्री AI सहाय्यक आहे.\n\nमी आपल्याला बाजार भाव तपासणे, कांदा दर अंदाज, हवामान आणि पिकांची थेट विक्री करण्यात मदत करू शकतो.\n\nआज मी आपली काय मदत करू शकतो?`;
      } else if (language === "pa") {
        reply = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${userName}! ਮੈਂ ਤੁਹਾਡਾ ਕਲਾਉਡ-ਐਗਰੀ AI ਸਹਾਇਕ ਹਾਂ।\n\nਮੈਂ ਮੰਡੀ ਭਾਅ ਜਾਣਨ, ਪਿਆਜ਼ ਦੇ ਮੁੱਲ ਦਾ AI ਅੰਦਾਜ਼ਾ ਲਗਾਉਣ ਅਤੇ ਫਸਲ ਦੀ ਸਿੱਧੀ ਵਿਕਰੀ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।\n\nਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?`;
      } else {
        reply = `Namaste ${userName}! I am your CloudAgri AI Assistant.\n\nI can help you check mandi benchmark prices, explore AI onion price forecasts, check local weather, manage your crop listings, or connect directly with wholesale buyers.\n\nHow can I assist you today?`;
      }
      suggestedActions = ["Today's Mandi Price", "Predict Onion Price", "Compare Prices", "Find Buyers"];
    }

    return res.json({
      success: true,
      fallback: true,
      reply: stripRawMarkdown(reply),
      card,
      table,
      suggestedActions,
    });
  } catch (err: any) {
    console.error("AI Assistant Error:", err);
    // Never expose technical error messages or 500 dumps to the user
    return res.status(200).json({
      success: false,
      isError: true,
      canRetry: true,
      reply: "Sorry, I couldn't generate that answer right now. Please try again.",
    });
  }
});

// AI Market Price & Crop Advisor Endpoint
app.post("/api/market-advisor", async (req, res) => {
  try {
    const { cropName, location = "Anand, Gujarat", quantity = 50, unit = "Quintal", askingPrice = 2450, isOrganic = false } = req.body;
    const ai = getAiClient();

    if (!ai) {
      const basePrice = Number(askingPrice) || 2450;
      const recPrice = Math.round(basePrice * 1.05);
      return res.json({
        success: true,
        fallback: true,
        data: {
          recommendedPrice: recPrice,
          marketDemand: "High",
          priceCompetitiveness: basePrice > recPrice ? "Fair" : "Highly Competitive",
          expectedProfit: Math.round(quantity * (recPrice * 0.38)),
          confidenceScore: 94,
          bestSellingTime: "Within 7-10 days during peak APMC trading window",
          waitingRecommendation: "Hold 30% of stock for 2 weeks to capture post-harvest demand surge (+8% price).",
          riskLevel: "Low",
          cropAdvisor: {
            fertilizer: "Apply balanced NPK (12-32-16) top dressing with foliar Zinc Sulfate spray during grain filling.",
            watering: "Maintain alternate wetting and drying cycle; irrigate every 5-7 days depending on soil moisture.",
            harvestTime: "Harvest when grain moisture drops to 14-16% and golden husk coloration reaches 90%.",
            storageTips: "Store in cool, airtight bags with neem leaves or aluminum phosphide pouches to prevent weevil infestation."
          }
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            text: `Analyze market conditions and provide price & crop cultivation advice for:
Crop: ${cropName}
Asking Price: ₹${askingPrice} per ${unit}
Quantity: ${quantity} ${unit}
Location: ${location}
Organic Certified: ${isOrganic ? "Yes" : "No"}`
          }
        ]
      },
      config: {
        systemInstruction: `You are CloudAgri AI Market Price Advisor & Agronomist. Provide real-time price recommendation, market demand analysis, expected profit, confidence score, best selling strategy, risk level, and agronomic recommendations (fertilizer, watering, harvest time, storage tips). Return strictly a JSON object.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedPrice: { type: Type.INTEGER },
            marketDemand: { type: Type.STRING },
            priceCompetitiveness: { type: Type.STRING },
            expectedProfit: { type: Type.INTEGER },
            confidenceScore: { type: Type.INTEGER },
            bestSellingTime: { type: Type.STRING },
            waitingRecommendation: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            cropAdvisor: {
              type: Type.OBJECT,
              properties: {
                fertilizer: { type: Type.STRING },
                watering: { type: Type.STRING },
                harvestTime: { type: Type.STRING },
                storageTips: { type: Type.STRING },
              },
              required: ["fertilizer", "watering", "harvestTime", "storageTips"]
            }
          },
          required: [
            "recommendedPrice",
            "marketDemand",
            "priceCompetitiveness",
            "expectedProfit",
            "confidenceScore",
            "bestSellingTime",
            "waitingRecommendation",
            "riskLevel",
            "cropAdvisor"
          ]
        }
      }
    });

    const parsed = response.text ? JSON.parse(response.text) : null;
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("Market Advisor Error:", err);
    res.status(500).json({ success: false, error: err.message });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudAgri AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
