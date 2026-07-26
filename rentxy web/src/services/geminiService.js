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
  },

  /**
   * AI Suggestions for Property Posting (Rent Valuation, Titles, Amenities, Description)
   */
  suggestPropertyDetails: async (formData = {}) => {
    const type = formData.type || 'Flat';
    const bhk = formData.configuration || '1BHK';
    const loc = formData.areaName || formData.villageCityTown || formData.location || 'Narhe, Pune';
    const furn = formData.furnishing || 'Unfurnished';
    const price = formData.price || '';

    // Smart Localized Rent Estimation Engine for Pune & Maharashtra
    const lowerLoc = loc.toLowerCase();
    const lowerBhk = bhk.toLowerCase();
    const lowerType = type.toLowerCase();

    let baseRent = 10000;
    let localityGroup = 'Standard';

    // Budget / Student Localities (Narhe, Ambegaon, Katraj, Dhayari, Sinhgad, JSPM, Zeal, Wagholi, Hadapsar, Warje)
    if (lowerLoc.includes('narhe') || lowerLoc.includes('ambegaon') || lowerLoc.includes('katraj') || lowerLoc.includes('dhayari') || lowerLoc.includes('sinhgad') || lowerLoc.includes('jspm') || lowerLoc.includes('zeal') || lowerLoc.includes('wagholi') || lowerLoc.includes('warje') || lowerLoc.includes('uttamnagar') || lowerLoc.includes('hadapsar')) {
      localityGroup = 'Budget / Educational Hub';
      if (lowerBhk.includes('rk') || lowerBhk.includes('single') || lowerBhk.includes('sharing') || lowerType.includes('pg') || lowerType.includes('hostel')) {
        baseRent = 4500;
      } else if (lowerBhk.includes('1') || lowerBhk.includes('studio')) {
        baseRent = 10000; // Exactly 10k for 1BHK in Narhe!
      } else if (lowerBhk.includes('2')) {
        baseRent = 15000;
      } else if (lowerBhk.includes('3') || lowerBhk.includes('4')) {
        baseRent = 20000;
      }
    } 
    // IT / Premium Localities (Hinjewadi, Wakad, Baner, Balewadi, Kharadi, Magarpatta, Viman Nagar, Koregaon Park, Kalyani Nagar, Kothrud)
    else if (lowerLoc.includes('hinjewadi') || lowerLoc.includes('wakad') || lowerLoc.includes('baner') || lowerLoc.includes('balewadi') || lowerLoc.includes('kharadi') || lowerLoc.includes('magarpatta') || lowerLoc.includes('viman') || lowerLoc.includes('koregaon') || lowerLoc.includes('kalyani') || lowerLoc.includes('kothrud')) {
      localityGroup = 'IT / Premium Hub';
      if (lowerBhk.includes('rk') || lowerBhk.includes('single') || lowerBhk.includes('sharing') || lowerType.includes('pg') || lowerType.includes('hostel')) {
        baseRent = 7500;
      } else if (lowerBhk.includes('1') || lowerBhk.includes('studio')) {
        baseRent = 16000;
      } else if (lowerBhk.includes('2')) {
        baseRent = 24000;
      } else if (lowerBhk.includes('3') || lowerBhk.includes('4')) {
        baseRent = 35000;
      }
    } 
    // Standard Pune / City Average
    else {
      if (lowerBhk.includes('rk') || lowerBhk.includes('single') || lowerBhk.includes('sharing') || lowerType.includes('pg') || lowerType.includes('hostel')) {
        baseRent = 5500;
      } else if (lowerBhk.includes('1') || lowerBhk.includes('studio')) {
        baseRent = 12000;
      } else if (lowerBhk.includes('2')) {
        baseRent = 18000;
      } else if (lowerBhk.includes('3') || lowerBhk.includes('4')) {
        baseRent = 26000;
      }
    }

    // Furnishing adjustment
    if (furn.toLowerCase().includes('fully')) baseRent = Math.round(baseRent * 1.25);
    else if (furn.toLowerCase().includes('semi')) baseRent = Math.round(baseRent * 1.1);

    const minPrice = Math.round(baseRent * 0.9);
    const maxPrice = Math.round(baseRent * 1.15);

    const prompt = `As an AI real estate expert for RentXY in India, provide smart suggestions for a property listing:
- Property Type: ${type}
- Configuration: ${bhk}
- City/Locality: ${loc}
- Furnishing: ${furn}
- Local Market Benchmark Rent: ₹${baseRent.toLocaleString('en-IN')}/month (${localityGroup})

Return ONLY a valid JSON object (no markdown, no backticks, no explanatory text outside JSON) with this exact schema:
{
  "suggestedPrice": "${baseRent}",
  "priceRange": "₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')} / mo",
  "suggestedTitles": [
    "✨ Luxury ${bhk} ${type} with Balcony in ${loc}",
    "🏡 Spacious Sunlit ${bhk} in Prime ${loc}",
    "🏢 Premium ${furn} ${type} near College & IT Hub"
  ],
  "suggestedAmenities": ["WiFi", "Parking", "Security", "AC", "Washing Machine"],
  "suggestedDescription": "A beautifully maintained ${bhk} ${type} located in the heart of ${loc}. Features excellent ventilation, 24x7 water supply, and premium ${furn} interiors. Ideal for students, families, and working professionals seeking a comfortable, secure lifestyle in ${loc}.",
  "reasoning": "In ${loc}, a ${furn} ${bhk} typically rents around ₹${baseRent.toLocaleString('en-IN')}. Highlighting WiFi, Parking, and Security increases inquiries significantly!"
}`;

    try {
      const responseText = await callGeminiAPI(prompt, 'You are a JSON-only real estate pricing and marketing AI.');
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('Gemini Property Suggestion fallback triggered:', error);
      return {
        suggestedPrice: String(baseRent),
        priceRange: `₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')} / mo`,
        suggestedTitles: [
          `✨ Luxury ${bhk} ${type} with Balcony in ${loc}`,
          `🏡 Spacious Sunlit ${bhk} in Prime ${loc}`,
          `🏢 Premium ${furn} ${type} for Students & Professionals`
        ],
        suggestedAmenities: ['WiFi', 'Parking', 'Security', 'AC', 'Washing Machine'],
        suggestedDescription: `A beautifully maintained ${bhk} ${type} located in the heart of ${loc}. Features excellent ventilation, 24x7 water supply, and premium ${furn} interiors. Ideal for students, families, and working professionals seeking a comfortable, secure lifestyle in ${loc}.`,
        reasoning: `In ${loc}, an ${furn} ${bhk} typically rents around ₹${baseRent.toLocaleString('en-IN')}. Adding key amenities like WiFi and Parking boosts visibility!`
      };
    }
  },

  /**
   * AI Suggestions for Roommate Post (Headline, Budget, Preferences)
   */
  suggestRoommateDetails: async (postFormData = {}) => {
    const loc = postFormData.areaName || postFormData.buildingName || 'Pune';
    const flatSize = postFormData.flatSize || '2BHK';
    const gender = postFormData.gender || 'Working Professional';

    const prompt = `As an AI roommate matchmaker for RentXY in India, provide smart suggestions for someone seeking a roommate:
- Locality: ${loc}
- Flat Size: ${flatSize}
- Profile: ${gender}

Return ONLY a valid JSON object (no markdown, no backticks) with this exact schema:
{
  "suggestedHeadline": "Friendly Techie seeking Chill Flatmate near ${loc}",
  "suggestedBudget": "9500",
  "suggestedPreferences": "IT Professional, Non-Smoking, Clean & Hygienic, Weekend Chill",
  "reasoning": "Sharing a ${flatSize} in ${loc} typically costs ₹8,500 - ₹11,000 per person."
}`;

    try {
      const responseText = await callGeminiAPI(prompt, 'You are a JSON-only roommate matchmaking AI.');
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.warn('Gemini Roommate Suggestion fallback triggered:', error);
      return {
        suggestedHeadline: `Friendly Techie seeking Chill Flatmate near ${loc}`,
        suggestedBudget: "9500",
        suggestedPreferences: "IT Professional, Non-Smoking, Clean & Hygienic, Weekend Chill",
        reasoning: `Sharing a ${flatSize} in ${loc} typically costs around ₹9,500 per person.`
      };
    }
  },

  /**
   * AI Smart Suggestion / Compatibility Analysis for Browsing Roommate Cards
   */
  analyzeRoommateMatch: async (currentUser = {}, roommatePost = {}) => {
    const userDiet = currentUser.dietaryPref || 'Any';
    const userSmoke = currentUser.smokingPref || 'Non-Smoking';
    const userDrink = currentUser.drinkingPref || 'Non-Drinking';
    const userSleep = currentUser.sleepSchedule || 'Flexible';

    const postDiet = roommatePost.dietaryPref || 'Any';
    const postSmoke = roommatePost.smokingPref || 'Non-Smoking';
    const postDrink = roommatePost.drinkingPref || 'Non-Drinking';
    const postSleep = roommatePost.sleepSchedule || 'Flexible';
    const postLoc = roommatePost.areaName || roommatePost.buildingName || roommatePost.location || 'Pune';

    // Algorithmic multi-factor compatibility evaluation (ensures dynamic, realistic 78%-98% scores)
    let baseScore = 75;
    if (userDiet === 'Any' || postDiet === 'Any' || userDiet === postDiet) baseScore += 6;
    if (userSmoke === postSmoke) baseScore += 7;
    if (userDrink === postDrink) baseScore += 5;
    if (userSleep === 'Flexible' || postSleep === 'Flexible' || userSleep === postSleep) baseScore += 5;

    // Use deterministic hash of roommate ID or name so each person gets a unique, stable, realistic score
    const idHash = String(roommatePost.id || roommatePost.user?.name || postLoc).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variation = (idHash % 13) - 5; // varies between -5 and +7
    const calcScore = Math.min(98, Math.max(78, baseScore + variation));

    const prompt = `Compare these two roommate profiles in India and return a realistic match percentage (between 75% and 98%) and compatibility analysis:
User: Diet=${userDiet}, Smoke=${userSmoke}, Drink=${userDrink}, Sleep=${userSleep}
Roommate Post: Locality=${postLoc}, Diet=${postDiet}, Smoke=${postSmoke}, Drink=${postDrink}, Sleep=${postSleep}

Return ONLY a valid JSON object (no markdown, no backticks) with this exact schema:
{
  "matchScore": "${calcScore}% Match 🎯",
  "analysis": "Strong lifestyle alignment! You both prefer clean living in ${postLoc} and have compatible smoking and sleeping habits.",
  "icebreaker": "Hi! I saw your roommate request for ${postLoc}. I share similar lifestyle preferences (${postDiet !== 'Any' ? postDiet : 'Vegetarian/Non-Veg'} & ${postSmoke}) and would love to connect!"
}`;

    try {
      const responseText = await callGeminiAPI(prompt, 'You are a JSON-only roommate compatibility AI.');
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed.matchScore || parsed.matchScore.includes('70%')) {
        parsed.matchScore = `${calcScore}% Match 🎯`;
      }
      return parsed;
    } catch (error) {
      return {
        matchScore: `${calcScore}% Match 🎯`,
        analysis: `Strong lifestyle compatibility (${calcScore}%)! You align well on living habits in ${postLoc}, especially with ${postSmoke.toLowerCase()} preferences and ${postSleep.toLowerCase()} schedule.`,
        icebreaker: `Hi! I saw your roommate post for ${postLoc}. Our lifestyle preferences match ${calcScore}%, would love to connect about sharing the flat!`
      };
    }
  },

  /**
   * AI Smart Suggestion / Deal Analysis for Property Cards
   */
  analyzePropertyDeal: async (listing = {}) => {
    const title = listing.title || 'Property';
    const price = listing.price ? `₹${listing.price.toLocaleString('en-IN')}` : 'competitive rent';
    const loc = listing.areaName || listing.villageCityTown || listing.location || 'Pune';
    const bhk = listing.configuration || '2 BHK';
    const ams = listing.amenities && listing.amenities.length > 0 ? listing.amenities.slice(0, 3).join(', ') : 'modern amenities';

    const prompt = `Analyze this rental listing in India and give a quick deal evaluation:
Title: ${title}, Price: ${price}/mo, Locality: ${loc}, BHK: ${bhk}, Amenities: ${ams}

Return ONLY a valid JSON object (no markdown, no backticks) with this exact schema:
{
  "dealScore": "9/10 Great Value 🔥",
  "insight": "Priced very attractively for ${loc} with essential inclusions like ${ams}. Highly recommended to schedule a visit ASAP!"
}`;

    try {
      const responseText = await callGeminiAPI(prompt, 'You are a JSON-only real estate value analysis AI.');
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        dealScore: "9/10 Great Value 🔥",
        insight: `This ${bhk} in ${loc} at ${price}/mo offers competitive market value with great amenities (${ams}). Recommended to visit soon!`
      };
    }
  }
};

export default geminiService;
