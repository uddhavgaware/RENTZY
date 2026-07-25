// RENTXY Gemini AI Service
// Uses Google AI Studio / Gemini API for intelligent property matchmaking, description generation, and real estate assistant

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-pro'
];

/**
 * Call Gemini REST API with fallback models
 */
const callGeminiAPI = async (prompt, systemInstruction = '', apiKey = DEFAULT_API_KEY) => {
  if (!apiKey || apiKey === 'placeholder') {
    throw new Error('Valid Gemini API Key is required');
  }

  const contents = [];
  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: `[SYSTEM INSTRUCTION]: ${systemInstruction}\n\n[USER REQUEST]: ${prompt}` }]
    });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  }

  let lastError = null;

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Model ${model} failed:`, errData.error?.message || response.statusText);
        lastError = new Error(errData.error?.message || `HTTP ${response.status}`);
        continue; // try next model in fallback list
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        return generatedText.trim();
      }
    } catch (err) {
      console.warn(`Error calling model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate a response.');
};

export const geminiService = {
  /**
   * Virtual Assistant Chat for RentXY AI
   */
  askRentXYAI: async (userMessage, history = [], contextData = {}) => {
    const systemPrompt = `You are "RentXY AI", a friendly, expert virtual real estate assistant and roommate matchmaker for the RentXY portal in India.
Your tone is professional, warm, helpful, and concise. You use emojis appropriately.
RentXY features:
1. 100% Brokerage-Free direct rental listings (Flats, PGs, Hostels, Commercial Spaces).
2. Smart Roommate & Flatmate Matchmaker (using a 10-factor compatibility algorithm including diet, smoking, sleep habits, budget, and location).
3. RentXY Movers & Packers (verified relocation with satellite GPS route tracking).
4. Smart Commute & Proximity Algorithm (calculates exact Haversine distance from college/workplace).
5. Split Expenses & Bill Management for flatmates.
6. Razorpay UPI/Card checkout for instant rent & deposit payments.

When answering:
- Provide practical, actionable real estate or rental advice tailored to Indian cities (Pune, Mumbai, Bangalore, Delhi, Hyderabad, etc.).
- If they ask about legal agreements, security deposit refunds, notice periods, or tenant rights, explain clearly in simple terms.
- Keep answers structured with bullet points where helpful. Do not exceed 3-4 short paragraphs.
- If relevant data is provided in context (${JSON.stringify(contextData)}), reference it!`;

    try {
      const reply = await callGeminiAPI(userMessage, systemPrompt);
      return reply;
    } catch (error) {
      console.error('RentXY AI Chat Error:', error);
      throw error;
    }
  },

  /**
   * Auto-generate persuasive property description for landlords / owners
   */
  generatePropertyDescription: async (details = {}) => {
    const {
      title = 'Spacious Property',
      type = 'Flat',
      bhk = '2 BHK',
      price = '15,000',
      location = 'Pune',
      furnishing = 'Semi-Furnished',
      amenities = [],
      sqft = '1000',
      availableFrom = 'Immediate',
      targetTenants = 'Family or Bachelors'
    } = details;

    const prompt = `Write a compelling, professional, and attractive real estate listing description for RentXY based on these details:
- Title: ${title}
- Type: ${bhk} ${type}
- Location/City: ${location}
- Expected Rent: ₹${price}/month
- Area: ${sqft} sq.ft.
- Furnishing Status: ${furnishing}
- Preferred Tenants: ${targetTenants}
- Available From: ${availableFrom}
- Key Amenities: ${Array.isArray(amenities) ? amenities.join(', ') : amenities || 'Standard modern amenities'}

Guidelines:
1. Start with an exciting hook line with emojis.
2. Highlight key features (space, ventilation, location advantages, connectivity to tech parks/colleges/metro).
3. Mention the amenities and suitability for ${targetTenants}.
4. Conclude with a welcoming call-to-action ("Schedule a direct visit without any brokerage!").
5. Format into 2 to 3 neat paragraphs with bullet points for amenities. Do NOT include placeholder text.`;

    try {
      const desc = await callGeminiAPI(prompt, 'You are an expert real estate copywriter in India.');
      return desc;
    } catch (error) {
      console.error('Gemini Description Generation Error:', error);
      throw error;
    }
  },

  /**
   * Auto-generate roommate profile bio & compatibility introduction
   */
  generateRoommateBio: async (preferences = {}) => {
    const {
      name = 'Friend',
      occupation = 'Software Engineer / Student',
      location = 'Pune',
      budget = '10,000 - 15,000',
      dietaryPref = 'Vegetarian',
      smokingPref = 'Non-smoker',
      cleanPref = 'Clean & Organized',
      sleepPref = 'Night Owl / Early Bird',
      hobbies = 'Reading, Traveling, Cooking, Gaming'
    } = preferences;

    const prompt = `Write a friendly, engaging, and trustworthy roommate / flatmate profile bio for RentXY based on these preferences:
- Name: ${name}
- Occupation: ${occupation}
- Target Location: ${location}
- Budget Range: ₹${budget}/month
- Diet: ${dietaryPref}
- Smoking/Drinking: ${smokingPref}
- Cleanliness & Lifestyle: ${cleanPref}, ${sleepPref}
- Interests & Hobbies: ${hobbies}

Guidelines:
1. Make it sound authentic, approachable, and respectful of shared living boundaries.
2. Mention lifestyle compatibility (sleep schedule, cleanliness habits, dietary preference).
3. Mention what they are looking for in a flatmate or apartment.
4. Keep it under 150 words (2 short paragraphs). Use 2-3 friendly emojis.`;

    try {
      const bio = await callGeminiAPI(prompt, 'You are a helpful lifestyle and roommate matchmaking assistant.');
      return bio;
    } catch (error) {
      console.error('Gemini Roommate Bio Error:', error);
      throw error;
    }
  }
};

export default geminiService;
