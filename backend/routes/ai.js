const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { authenticateToken } = require('./auth');

// Initialize Groq client if key is available
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY') {
    try {
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        console.log('Groq SDK initialized successfully with API key.');
    } catch (e) {
        console.error('Failed to initialize Groq client:', e);
    }
} else {
    console.log('No Groq API Key found. Backend running in MOCK mode.');
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function buildDestinationSpots(destination) {
    const seed = hashString(destination.toLowerCase());
    const adjectives = ['Historic', 'Central', 'Riverside', 'Old Town', 'Grand', 'Sunset', 'Golden', 'Emerald', 'Royal', 'Maritime'];
    const places = [
        'Cathedral Square', 'Central Market', 'National Museum', 'Harbor District',
        'Art Quarter', 'Botanical Gardens', 'Observation Deck', 'Heritage Museum',
        'Waterfront Promenade', 'Cultural Center', 'Main Bazaar', 'City Park',
        'Historic Bridge', 'Main Plaza', 'Food Street', 'University District',
        'Scenic Lookout', 'Old Quarter', 'Craft Village', 'Riverside Walk'
    ];

    const spots = [];
    for (let i = 0; i < places.length; i++) {
        const adj = adjectives[(seed + i * 3) % adjectives.length];
        const place = places[(seed + i * 7) % places.length];
        spots.push(`${adj} ${place} of ${destination}`);
    }
    return spots;
}

function buildDayTemplates(travelStyle, destination, spots) {
    const s = (idx) => spots[idx % spots.length];

    const templatesByStyle = {
        Adventure: [
            { theme: 'Arrival & Orientation', morning: (d, sp) => `Arrive in ${d} and take a guided city orientation walk through ${sp(0)} to get your bearings.`, afternoon: (d, sp) => `Rent bikes and cycle the ${sp(1)} trail, stopping at scenic viewpoints.`, evening: (d, sp) => `Casual dinner at a local grill near ${sp(2)} and an early rest to prepare for active days ahead.`, transport: 'Airport/train transfer, then metro or taxi to hotel.', notes: 'Pick up a local transit card and confirm tomorrow\'s tour bookings.' },
            { theme: 'Outdoor Thrills', morning: (d, sp) => `Sunrise hike to ${sp(3)} with a local adventure guide — moderate difficulty, stunning views.`, afternoon: (d, sp) => `Try kayaking or zip-lining near ${sp(4)}, depending on local offerings.`, evening: (d, sp) => `Recover at an outdoor-themed bar in ${sp(5)} and swap stories with fellow travelers.`, transport: 'Organized tour pickup; return via shuttle.', notes: 'Wear sturdy shoes and bring a refillable water bottle.' },
            { theme: 'Nature & Exploration', morning: (d, sp) => `Day trip to the natural reserves outside ${d}, starting from ${sp(6)}.`, afternoon: (d, sp) => `Rock climbing or canyon trekking session near ${sp(7)} with certified instructors.`, evening: (d, sp) => `Camp-style BBQ dinner back in the city at ${sp(8)}.`, transport: 'Full-day tour bus; some walking on uneven terrain.', notes: 'Pack sunscreen, snacks, and a light rain jacket.' },
            { theme: 'Local Adventure Culture', morning: (d, sp) => `Explore ${sp(9)} on foot — hidden alleys, street art, and local artisan workshops.`, afternoon: (d, sp) => `Join a surf/paddleboard or mountain-biking group near ${sp(10)}.`, evening: (d, sp) => `Night market food crawl around ${sp(11)} — try regional specialties.`, transport: 'Walking plus short rideshare hops between districts.', notes: 'Ask guides for off-the-beaten-path trail recommendations.' },
            { theme: 'Scenic Day Trip', morning: (d, sp) => `Early departure to ${sp(12)} for a half-day trekking expedition.`, afternoon: (d, sp) => `Visit a nearby waterfall or coastal cliff viewpoint accessible from ${sp(13)}.`, evening: (d, sp) => `Return to ${d} for a relaxed meal overlooking ${sp(14)}.`, transport: 'Rental car or organized day-trip coach.', notes: 'Start early to beat crowds at popular trailheads.' },
            { theme: 'Urban Adventure', morning: (d, sp) => `Rooftop parkour or urban cycling tour starting at ${sp(15)}.`, afternoon: (d, sp) => `Explore ${sp(16)} by scooter or e-bike — cover more ground than on foot.`, evening: (d, sp) => `Sunset drinks at ${sp(17)} followed by live music nearby.`, transport: 'Bike/scooter rental; return before dark.', notes: 'Helmets and ID required for most rental services.' },
            { theme: 'Departure Day', morning: (d, sp) => `Light morning jog or walk through ${sp(18)} — pick up last-minute souvenirs.`, afternoon: (d, sp) => `Brunch near ${sp(19)}, then check out and head to the airport/station.`, evening: (d, sp) => `Travel home — reflect on your ${d} adventure!`, transport: 'Taxi or airport express from hotel.', notes: 'Allow extra time for security and baggage check-in.' }
        ],
        Culture: [
            { theme: 'Arrival & Old City', morning: (d, sp) => `Settle in and stroll ${sp(0)} — admire architecture and note key landmarks on your map.`, afternoon: (d, sp) => `Guided walking tour of ${sp(1)} covering founding history and local legends.`, evening: (d, sp) => `Welcome dinner at a heritage restaurant near ${sp(2)}.`, transport: 'Transfer to hotel, then walking tour on foot.', notes: 'Many sites close one day a week — confirm hours in advance.' },
            { theme: 'Museums & Monuments', morning: (d, sp) => `Visit ${sp(3)} — allow 2–3 hours for the permanent collections.`, afternoon: (d, sp) => `Tour ${sp(4)} and the surrounding monument district with an audio guide.`, evening: (d, sp) => `Classical or folk performance at a venue near ${sp(5)}.`, transport: 'Metro to museum district; walk between nearby sites.', notes: 'Book timed-entry tickets online to skip queues.' },
            { theme: 'Art & Craft Heritage', morning: (d, sp) => `Explore ${sp(6)} galleries and meet local artists in their studios.`, afternoon: (d, sp) => `Hands-on pottery/weaving workshop in the ${sp(7)} craft quarter.`, evening: (d, sp) => `Dine at a chef-owned bistro in ${sp(8)} featuring regional recipes.`, transport: 'Short bus ride to the arts district.', notes: 'Workshop spaces fill up — reserve a spot the day before.' },
            { theme: 'Religious & Spiritual Sites', morning: (d, sp) => `Visit the main cathedral/temple at ${sp(9)} — dress modestly and observe local customs.`, afternoon: (d, sp) => `Explore ${sp(10)} and its adjacent monastery or shrine complex.`, evening: (d, sp) => `Quiet evening walk along ${sp(11)} as locals gather for evening prayer or socializing.`, transport: 'Walking; remove shoes where required.', notes: 'Photography may be restricted inside sacred buildings.' },
            { theme: 'Neighborhood Immersion', morning: (d, sp) => `Morning coffee in ${sp(12)} — chat with shopkeepers about daily life in ${d}.`, afternoon: (d, sp) => `Free time in ${sp(13)} — browse bookshops, antique stores, and local cafés.`, evening: (d, sp) => `Home-style cooking class near ${sp(14)} — learn three traditional dishes.`, transport: 'Tram or walking through residential districts.', notes: 'Cash is handy at small family-run shops.' },
            { theme: 'Day Trip to Heritage Town', morning: (d, sp) => `Day excursion from ${d} to a nearby UNESCO-listed town, departing from ${sp(15)}.`, afternoon: (d, sp) => `Guided tour of ${sp(16)} ruins or palace grounds with a historian.`, evening: (d, sp) => `Return to ${d} and enjoy a slow dinner at ${sp(17)}.`, transport: 'Train or coach day pass.', notes: 'Pack a light lunch if dining options at the site are limited.' },
            { theme: 'Departure Day', morning: (d, sp) => `Final visit to ${sp(18)} for any missed exhibits or photo spots.`, afternoon: (d, sp) => `Last lunch at a café in ${sp(19)}, then collect luggage and depart.`, evening: (d, sp) => `Head home with a deeper appreciation of ${d}\'s culture.`, transport: 'Airport/station express or pre-booked taxi.', notes: 'Museum gift shops are great for authentic local crafts.' }
        ],
        Relaxation: [
            { theme: 'Arrival & Unwind', morning: (d, sp) => `Arrive in ${d} and check in — take a gentle walk through ${sp(0)}.`, afternoon: (d, sp) => `Afternoon spa session or pool time at your hotel near ${sp(1)}.`, evening: (d, sp) => `Light dinner and early night — acclimate to ${d}\'s relaxed pace.`, transport: 'Private transfer or taxi to hotel.', notes: 'Hydrate after travel; avoid over-scheduling day one.' },
            { theme: 'Wellness & Spa', morning: (d, sp) => `Slow breakfast, then a full-morning wellness treatment at a spa in ${sp(2)}.`, afternoon: (d, sp) => `Yoga or meditation session overlooking ${sp(3)}.`, evening: (d, sp) => `Organic farm-to-table dinner at ${sp(4)}.`, transport: 'Spa shuttle or short taxi ride.', notes: 'Book spa slots 48 hours ahead during peak season.' },
            { theme: 'Scenic Leisure', morning: (d, sp) => `Leisurely stroll through ${sp(5)} — benches, gardens, and people-watching.`, afternoon: (d, sp) => `Harbor or river cruise departing from ${sp(6)} — no rush, just views.`, evening: (d, sp) => `Sunset cocktails on a terrace near ${sp(7)}.`, transport: 'Walking plus one short cruise boarding.', notes: 'Bring a light shawl — evenings can get breezy by the water.' },
            { theme: 'Beach or Park Day', morning: (d, sp) => `Morning at ${sp(8)} — read, swim, or simply relax under shade.`, afternoon: (d, sp) => `Picnic lunch in ${sp(9)} with locally sourced snacks from a nearby deli.`, evening: (d, sp) => `Beachside or park-side seafood grill near ${sp(10)}.`, transport: 'Bus or rideshare to the waterfront/green belt.', notes: 'Reapply sunscreen every two hours.' },
            { theme: 'Slow Exploration', morning: (d, sp) => `Visit ${sp(11)} at opening hour — quiet galleries before the crowds.`, afternoon: (d, sp) => `Afternoon tea or coffee ritual at a historic café in ${sp(12)}.`, evening: (d, sp) => `Fine dining with tasting menu at ${sp(13)} — no fixed schedule after.`, transport: 'Minimal — stay within one walkable district.', notes: 'This is your recharge day; skip anything that feels rushed.' },
            { theme: 'Nature Retreat', morning: (d, sp) => `Gentle nature walk through ${sp(14)} — flat paths, birdwatching optional.`, afternoon: (d, sp) => `Hot springs or thermal baths near ${sp(15)}, if available in the ${d} region.`, evening: (d, sp) => `Quiet meal at a garden restaurant in ${sp(16)}.`, transport: 'Day-trip van to nature site; return by evening.', notes: 'Bring flip-flops and a quick-dry towel for bath facilities.' },
            { theme: 'Departure Day', morning: (d, sp) => `Final relaxed breakfast at ${sp(17)} — no alarm needed.`, afternoon: (d, sp) => `Pick up treats at ${sp(18)} for the journey home, then depart ${d}.`, evening: (d, sp) => `Travel refreshed and recharged.`, transport: 'Pre-arranged airport/station transfer.', notes: 'Leave buffer time — rushing undoes the relaxation!' }
        ],
        Foodie: [
            { theme: 'Arrival & First Tastes', morning: (d, sp) => `Arrive and head straight to ${sp(0)} for a welcome pastry and local coffee.`, afternoon: (d, sp) => `Self-guided tasting walk through ${sp(1)} — sample street snacks and chat with vendors.`, evening: (d, sp) => `Introductory dinner at a well-reviewed bistro near ${sp(2)}.`, transport: 'Taxi to hotel, then walking food tour.', notes: 'Come hungry but pace yourself — ${d} has many courses ahead!' },
            { theme: 'Market Day', morning: (d, sp) => `Early visit to ${sp(3)} — meet farmers, taste seasonal fruit, and buy spices.`, afternoon: (d, sp) => `Cooking class in ${sp(4)} using ingredients you picked this morning.`, evening: (d, sp) => `Eat your own creations plus wine pairings at the class venue.`, transport: 'Metro to market; class location is usually nearby.', notes: 'Notify the chef of any dietary restrictions when booking.' },
            { theme: 'Signature Dishes', morning: (d, sp) => `Breakfast tour of ${sp(5)} — try three regional morning specialties.`, afternoon: (d, sp) => `Lunch at a legendary local institution in ${sp(6)} (expect a queue — worth it).`, evening: (d, sp) => `Reservation-only tasting menu at a chef\'s table near ${sp(7)}.`, transport: 'Walking between food stops in the same district.', notes: 'Share plates to maximize variety without overfilling.' },
            { theme: 'Hidden Gems & Alley Eats', morning: (d, sp) => `Explore backstreets around ${sp(8)} — food bloggers\' favorite dumpling/noodle spots.`, afternoon: (d, sp) => `Food hall crawl at ${sp(9)} — one small plate per stall.`, evening: (d, sp) => `Night market feast at ${sp(10)} — go bold with unfamiliar dishes.`, transport: 'Walking; bring hand sanitizer and small bills.', notes: 'Peak flavor hours are often 7–9 PM at night markets.' },
            { theme: 'Drinks & Desserts', morning: (d, sp) => `Specialty coffee and pastry crawl starting at ${sp(11)}.`, afternoon: (d, sp) => `Artisan chocolate, ice cream, or dessert tour through ${sp(12)}.`, evening: (d, sp) => `Craft cocktail or local wine bar hopping near ${sp(13)}.`, transport: 'Walking; use rideshare if moving between distant districts.', notes: 'Designate a non-drinking member if traveling with friends.' },
            { theme: 'Day Trip for Regional Cuisine', morning: (d, sp) => `Day trip from ${d} to a nearby village known for a signature dish — depart from ${sp(14)}.`, afternoon: (d, sp) => `Farm lunch and vineyard visit near ${sp(15)}.`, evening: (d, sp) => `Return to ${d} for a light supper at ${sp(16)}.`, transport: 'Organized food tour coach or rental car.', notes: 'Village restaurants often close between 3–6 PM — plan accordingly.' },
            { theme: 'Departure Day', morning: (d, sp) => `Final breakfast at ${sp(17)} — order the house specialty one last time.`, afternoon: (d, sp) => `Grab packaged local treats at ${sp(18)} for the trip home, then depart.`, evening: (d, sp) => `Already planning your return for the food alone!`, transport: 'Airport/station with time for duty-free snack shopping.', notes: 'Check customs rules before bringing food products home.' }
        ]
    };

    const defaultTemplates = [
        { theme: 'Arrival & Orientation', morning: (d, sp) => `Arrive in ${d} and explore ${sp(0)} on a self-guided walk.`, afternoon: (d, sp) => `Visit ${sp(1)} and get oriented with a city map app.`, evening: (d, sp) => `Dinner at a popular spot near ${sp(2)}.`, transport: 'Airport/station transfer, then local metro or taxi.', notes: 'Download offline maps for ${d} before heading out.' },
        { theme: 'Landmarks & Sights', morning: (d, sp) => `Tour ${sp(3)} and the surrounding historic district.`, afternoon: (d, sp) => `Visit ${sp(4)} — book tickets online to save time.`, evening: (d, sp) => `Evening stroll and photos at ${sp(5)}.`, transport: 'Metro day pass; walk between nearby attractions.', notes: 'Wear comfortable shoes — expect 8,000+ steps today.' },
        { theme: 'Local Life & Markets', morning: (d, sp) => `Browse ${sp(6)} — sample local breakfast specialties.`, afternoon: (d, sp) => `Explore ${sp(7)} and nearby boutique shops.`, evening: (d, sp) => `Street food dinner around ${sp(8)}.`, transport: 'Walking and occasional bus rides.', notes: 'Markets are liveliest before noon.' },
        { theme: 'Culture & Museums', morning: (d, sp) => `Spend the morning at ${sp(9)}.`, afternoon: (d, sp) => `Visit ${sp(10)} and the adjacent cultural quarter.`, evening: (d, sp) => `Live music or theater near ${sp(11)}.`, transport: 'Public transit to the arts district.', notes: 'Many museums offer free entry on certain weekdays.' },
        { theme: 'Nature & Views', morning: (d, sp) => `Hike or ride up to ${sp(12)} for panoramic views of ${d}.`, afternoon: (d, sp) => `Relax at ${sp(13)} — gardens, benches, and photo spots.`, evening: (d, sp) => `Sunset dinner overlooking ${sp(14)}.`, transport: 'Cable car or bus to viewpoint; taxi back if tired.', notes: 'Check weather — fog can obscure views.' },
        { theme: 'Day Trip', morning: (d, sp) => `Day trip from ${d} to a nearby town, starting at ${sp(15)} station.`, afternoon: (d, sp) => `Explore ${sp(16)} and its local specialties.`, evening: (d, sp) => `Return to ${d} for a quiet meal near ${sp(17)}.`, transport: 'Train or coach day ticket.', notes: 'Buy return tickets in advance on busy routes.' },
        { theme: 'Departure Day', morning: (d, sp) => `Last-minute shopping at ${sp(18)} and a final coffee.`, afternoon: (d, sp) => `Check out and transfer to the airport/station from ${sp(19)}.`, evening: (d, sp) => `Safe travels — ${d} awaits your return!`, transport: 'Pre-booked airport express or taxi.', notes: 'Confirm departure terminal and gate before leaving the hotel.' }
    ];

    return templatesByStyle[travelStyle] || defaultTemplates;
}

function buildStylePacking(travelStyle) {
    const packingByStyle = {
        Adventure: ['Hiking Boots', 'Waterproof Jacket', 'Hydration Pack', 'Insect Repellent'],
        Culture: ['Comfortable Walking Shoes', 'Camera', 'Local Currency Cash', 'Respectful Temple/Church Wear'],
        Relaxation: ['Sunscreen', 'Swimwear', 'Sunglasses', 'Light Linen Clothing'],
        Foodie: ['Hand Sanitizer', 'Comfortable Eating Waistband', 'Digestive Enzyme Pills', 'Food Map Guide']
    };
    return packingByStyle[travelStyle] || ['Casual Shoes', 'Portable Power Bank', 'Light Jacket', 'Travel Wallet'];
}

// Helper to generate dynamic mock travel plans with unique activities per day
function generateMockTripData(destination, durationDays, travelStyle, budget, companion) {
    const duration = parseInt(durationDays) || 3;
    const spots = buildDestinationSpots(destination);
    const dayTemplates = buildDayTemplates(travelStyle, destination, spots);
    const stylePacking = buildStylePacking(travelStyle);

    const itinerary = [];
    for (let i = 1; i <= duration; i++) {
        const isLastDay = i === duration && duration > 1;
        const templateIndex = isLastDay
            ? dayTemplates.length - 1
            : (i - 1) % (dayTemplates.length - 1);
        const day = dayTemplates[templateIndex];

        itinerary.push({
            day_number: i,
            morning_act: day.morning(destination, (idx) => spots[(templateIndex * 3 + idx) % spots.length]),
            afternoon_act: day.afternoon(destination, (idx) => spots[(templateIndex * 3 + idx + 1) % spots.length]),
            evening_act: day.evening(destination, (idx) => spots[(templateIndex * 3 + idx + 2) % spots.length]),
            transport_info: day.transport,
            notes: day.notes.replace(/\$\{d\}/g, destination)
        });
    }

    const hotels = [
        {
            name: `${destination} Grand Central Hotel`,
            rating: 4.8,
            price_level: 'Luxury',
            description: `A stunning premium hotel located in the heart of ${destination}, close to top tourist spots and dining. Ideal for a ${companion} trip.`
        },
        {
            name: `${destination} Heritage Inn`,
            rating: 4.3,
            price_level: 'Mid-range',
            description: `Cozy, warm ambience combining local heritage design with modern amenities. Perfect for standard travelers looking for quality comfort.`
        },
        {
            name: `${destination} Backpackers Base`,
            rating: 4.1,
            price_level: 'Budget',
            description: `Highly rated budget hostel with clean beds, vibrant common rooms, and fast Wi-Fi. Excellent for meeting fellow travelers.`
        }
    ];

    const packing = [
        { item_name: 'Passport & Visa Documents', category: 'Documents' },
        { item_name: 'Credit Cards & Local Currency Cash', category: 'Documents' },
        { item_name: 'Smartphone & Charger Cables', category: 'Electronics' },
        { item_name: 'Universal Power Adapter', category: 'Electronics' },
        { item_name: 'Toothbrush & Travel Toiletries', category: 'Toiletries' },
        { item_name: 'First Aid Kit & Personal Medicines', category: 'Toiletries' }
    ];

    stylePacking.forEach(item => {
        packing.push({ item_name: item, category: 'Other' });
    });

    return { itinerary, hotels, packing };
}

function dayActivitySignature(day) {
    return `${day.morning_act}|${day.afternoon_act}|${day.evening_act}`.toLowerCase().trim();
}

function itineraryHasDuplicateDays(itinerary) {
    if (!Array.isArray(itinerary) || itinerary.length <= 1) return false;
    const signatures = itinerary.map(dayActivitySignature);
    return new Set(signatures).size < signatures.length;
}

function normalizeItineraryResponse(data, destination, duration, travelStyle, budget, companion) {
    const mockFallback = generateMockTripData(destination, duration, travelStyle, budget, companion);
    const needsMockItinerary =
        !data.itinerary ||
        !Array.isArray(data.itinerary) ||
        data.itinerary.length === 0 ||
        data.itinerary.length !== duration ||
        itineraryHasDuplicateDays(data.itinerary);

    if (needsMockItinerary) {
        console.log('Itinerary missing, wrong length, or has duplicate days — using varied day-by-day plan.');
        data.itinerary = mockFallback.itinerary;
    }

    if (!data.hotels || !Array.isArray(data.hotels) || data.hotels.length === 0) {
        data.hotels = mockFallback.hotels;
    }
    if (!data.packing || !Array.isArray(data.packing) || data.packing.length === 0) {
        data.packing = mockFallback.packing;
    }

    return data;
}

// Generate Itinerary API
router.post('/generate-itinerary', authenticateToken, async (req, res) => {
    const { destination, duration, budget_limit, travel_style, companion_type } = req.body;

    if (!destination || !duration || !budget_limit || !travel_style || !companion_type) {
        return res.status(400).json({ error: 'Missing planning parameters.' });
    }

    // --- SERVER-SIDE EDGE CASE VALIDATIONS ---
    // 1. Destination: must be a meaningful string, not purely numbers or symbols
    const trimmedDest = String(destination).trim();
    if (trimmedDest.length < 2) {
        return res.status(400).json({ error: 'Destination name is too short. Please enter a valid city or country name.' });
    }
    if (/^[\d\s\W]+$/.test(trimmedDest)) {
        return res.status(400).json({ error: 'Destination cannot be purely numbers or special characters. Please enter a real city or country name.' });
    }

    // 2. Duration: must be between 1 and 30 days
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1) {
        return res.status(400).json({ error: 'Trip duration must be at least 1 day.' });
    }
    if (durationNum > 30) {
        return res.status(400).json({ error: `Trip duration of ${durationNum} days exceeds the 30-day limit. Please plan shorter trips for best AI quality.` });
    }

    // 3. Budget: must be a positive number, at least $50
    const budgetNum = parseFloat(budget_limit);
    if (isNaN(budgetNum) || budgetNum <= 0) {
        return res.status(400).json({ error: 'Please enter a valid budget amount.' });
    }
    if (budgetNum < 50) {
        return res.status(400).json({ error: 'Minimum trip budget is $50. Please enter a realistic budget.' });
    }

    // 1. If Groq Client is NOT active, return mock data immediately
    if (!groq) {
        console.log('GROQ_API_KEY not configured. Returning mock plan.');
        const mockData = generateMockTripData(trimmedDest, durationNum, travel_style, budgetNum, companion_type);
        return res.json(mockData);
    }

    // 2. Query Groq LLM using Llama-3.3-70b-versatile
    try {
        const systemPrompt = `You are an expert AI Travel Planner. Generate a detailed, highly personalized travel itinerary for the user.
You MUST output your response in JSON format. The JSON schema must match exactly this structure:
{
  "itinerary": [
    {
      "day_number": 1,
      "morning_act": "Morning activities in detail...",
      "afternoon_act": "Afternoon activities in detail...",
      "evening_act": "Evening activities in detail...",
      "transport_info": "Recommended transit mode between spots...",
      "notes": "Important local tip for the day..."
    }
  ],
  "hotels": [
    {
      "name": "Hotel Name",
      "rating": 4.5,
      "price_level": "Budget/Mid-range/Luxury",
      "description": "Short explanation of why this matches the travel style..."
    }
  ],
  "packing": [
    { "item_name": "Item Description", "category": "Clothing/Documents/Electronics/Toiletries/Other" }
  ]
}

Strictly follow these parameters:
- Destination: ${destination}
- Duration: ${duration} Days
- Travel Style: ${travel_style}
- Budget Limit: $${budget_limit}
- Companions: ${companion_type}

CRITICAL itinerary rules:
- Generate exactly ${duration} unique days — each day MUST have completely different morning, afternoon, and evening activities.
- Do NOT repeat the same activities, restaurants, or attractions across different days.
- Use real, specific attractions, neighborhoods, restaurants, and landmarks that actually exist in ${destination}.
- Day 1 should focus on arrival and orientation; the final day should include departure logistics.
- Each day's transport_info and notes must be specific to that day's activities.

Ensure you recommend at least 3 hotels matching Budget, Mid-range, and Luxury categories, and provide a full packing list with at least 8 essential items. Provide complete, engaging description fields. Do not include markdown code ticks (like \`\`\`json) or extra text. Output ONLY the raw JSON string.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You must output valid JSON.' },
                { role: 'user', content: systemPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 3000
        });

        const rawResult = chatCompletion.choices[0].message.content;
        const parsedData = JSON.parse(rawResult);
        res.json(normalizeItineraryResponse(parsedData, trimmedDest, durationNum, travel_style, budgetNum, companion_type));
    } catch (err) {
        console.error('Groq AI generation error:', err);
        console.log('Falling back to high-quality mock data generator...');
        // Fallback gracefully to mock data
        const mockData = generateMockTripData(destination, duration, travel_style, budget_limit, companion_type);
        res.json(mockData);
    }
});

// Chatbot Assistant API
router.post('/chat', authenticateToken, async (req, res) => {
    const { message, history, tripDetails } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message content is required.' });
    }

    if (!groq) {
        // Return standard responsive mock chatbot responses
        const tripDest = tripDetails ? tripDetails.destination : 'your destination';
        const lowerMsg = message.toLowerCase();
        let reply = '';

        if (lowerMsg.includes('tipping') || lowerMsg.includes('tip')) {
            reply = `In ${tripDest}, tipping practices vary. In the US, 15-20% is customary. In Europe/Asia, it's often included in the bill as a service charge, or a small round-up is appreciated. In Japan, tipping can actually be seen as polite but unnecessary/awkward.`;
        } else if (lowerMsg.includes('water') || lowerMsg.includes('drink')) {
            reply = `For ${tripDest}, it's generally recommended to check locally. If it's a major city in North America, Western Europe, or Japan, tap water is completely safe. For tropical destinations or developing nations, stick to bottled/filtered water to avoid stomach discomfort.`;
        } else if (lowerMsg.includes('packing') || lowerMsg.includes('pack')) {
            reply = `Since you are traveling to ${tripDest}, make sure to pack comfortable walking shoes, a universal power adapter, copies of travel documents, and layered clothing appropriate for the climate!`;
        } else {
            reply = `Thanks for asking about ${tripDest}! I recommend checking out the local street food, downloading a translation app (like Google Translate), keeping cash on hand for small merchants, and using local trains/subways which are highly optimized. What else would you like to know about ${tripDest}?`;
        }

        return res.json({ reply });
    }

    try {
        const chatMessages = [
            {
                role: 'system',
                content: `You are an expert, helpful AI Travel Guide. Provide practical, accurate, and concise recommendations about travel logistics, local culture, packing, safety, and tipping customs for the user's destination.
                ${tripDetails ? `Current Trip Context: Destination is ${tripDetails.destination}, style is ${tripDetails.travel_style}, budget is $${tripDetails.budget_limit}, traveling with ${tripDetails.companion_type}.` : ''}`
            }
        ];

        // Append history (limit to last 6 messages to save context space)
        if (history && Array.isArray(history)) {
            const cutHistory = history.slice(-6);
            cutHistory.forEach(msg => {
                chatMessages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            });
        }

        // Add user's latest query
        chatMessages.push({ role: 'user', content: message });

        const chatCompletion = await groq.chat.completions.create({
            messages: chatMessages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 800
        });

        const reply = chatCompletion.choices[0].message.content;
        res.json({ reply });
    } catch (err) {
        console.error('Groq AI chat error:', err);
        res.json({ reply: 'Sorry, I am facing a minor connection error. Tipping and water guidelines: generally drink bottled water in unfamiliar tropical areas, and search local blogs for tipping standards!' });
    }
});

module.exports = router;
