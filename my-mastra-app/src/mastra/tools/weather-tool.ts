import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
    country: string;
    admin1?: string;
  }[];
}

interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

// Common location mappings for better international support
const locationMappings: Record<string, string> = {
  // Hebrew to English
  'כרמיאל': 'Karmiel, Israel',
  'תל אביב': 'Tel Aviv, Israel',
  'ירושלים': 'Jerusalem, Israel',
  'חיפה': 'Haifa, Israel',
  'באר שבע': 'Beer Sheva, Israel',
  'אילת': 'Eilat, Israel',
  'נתניה': 'Netanya, Israel',
  'פתח תקווה': 'Petah Tikva, Israel',
  'ראשון לציון': 'Rishon LeZion, Israel',
  'אשדוד': 'Ashdod, Israel',
  'חולון': 'Holon, Israel',
  'בני ברק': 'Bnei Brak, Israel',
  'רמת גן': 'Ramat Gan, Israel',
  'גבעתיים': 'Givatayim, Israel',
  'הרצליה': 'Herzliya, Israel',
  'רעננה': 'Ra\'anana, Israel',
  'כפר סבא': 'Kfar Saba, Israel',
  'רמת השרון': 'Ramat Hasharon, Israel',
  'מודיעין': 'Modi\'in, Israel',
  'אשקלון': 'Ashkelon, Israel',
  'רחובות': 'Rehovot, Israel',
  'לוד': 'Lod, Israel',
  'רמלה': 'Ramla, Israel',
  'בת ים': 'Bat Yam, Israel',
  'טבריה': 'Tiberias, Israel',
  'צפת': 'Safed, Israel',
  'עכו': 'Acre, Israel',
  'נהריה': 'Nahariya, Israel',
  'קריית שמונה': 'Kiryat Shmona, Israel',
  'דימונה': 'Dimona, Israel',
  'ערד': 'Arad, Israel',
  'מצפה רמון': 'Mitzpe Ramon, Israel',
  'יַרְכָּא': 'Yarka, Israel',
  'דליית אל כרמל': 'Daliyat al-Karmel, Israel',
  'עוספיא': 'Isfiya, Israel',
  'מגדל שמס': 'Majdal Shams, Israel',
  'בוקעתא': 'Buq\'ata, Israel',
  'מסעדה': 'Mas\'ada, Israel',
  'חורפיש': 'Hurfeish, Israel',
  'פקיעין': 'Peki\'in, Israel',
  'ג\'ולס': 'Jish, Israel',
  'כסרא סמיע': 'Kisra-Sumei, Israel',
  'רמה': 'Rama, Israel',
  'שפרעם': 'Shfar\'am, Israel',
  'טמרה': 'Tamra, Israel',
  'סח\'נין': 'Sakhnin, Israel',
  'ערערה': 'Ar\'ara, Israel',
  'באקה אל גרביה': 'Baqa al-Gharbiyye, Israel',
  'אום אל פחם': 'Umm al-Fahm, Israel',
  
  // Climbing areas and natural sites in Israel/Palestine region
  'עין פארה': 'Ramallah, West Bank',
  'עין פרה': 'Ramallah, West Bank',
  'נחל פארה': 'Ramallah, West Bank',
  'עין פארה, ישראל': 'Jerusalem, Israel',
  'עין פרה, ישראל': 'Jerusalem, Israel',
  'ואדי קלט': 'Jericho, West Bank',
  'נחל דרגה': 'Dead Sea, Israel',
  'נחל צאלים': 'Dead Sea, Israel',
  'מצדה': 'Masada, Israel',
  'עין גדי': 'Ein Gedi, Israel',
  'נחל חבר': 'Dead Sea, Israel',
  'נחל פרצים': 'Dead Sea, Israel',
  'מכתש רמון': 'Mitzpe Ramon, Israel',
  'נחל זין': 'Mitzpe Ramon, Israel',
  'עמק צין': 'Mitzpe Ramon, Israel',
  'הר ארבל': 'Tiberias, Israel',
  'נחל עמוד': 'Safed, Israel',
  'גליל עליון': 'Safed, Israel',
  'רמת הגולן': 'Golan Heights, Israel',
  'הר חרמון': 'Mount Hermon, Israel',
  
  // Israeli cities - English variations and common typos
  'karmiel': 'Karmiel, Israel',
  'tel aviv': 'Tel Aviv, Israel',
  'telaviv': 'Tel Aviv, Israel',
  'jerusalem': 'Jerusalem, Israel',
  'haifa': 'Haifa, Israel',
  'beer sheva': 'Beer Sheva, Israel',
  'beersheva': 'Beer Sheva, Israel',
  'eilat': 'Eilat, Israel',
  'netanya': 'Netanya, Israel',
  'petah tikva': 'Petah Tikva, Israel',
  'petach tikva': 'Petah Tikva, Israel',
  'rishon lezion': 'Rishon LeZion, Israel',
  'rishon le zion': 'Rishon LeZion, Israel',
  'ashdod': 'Ashdod, Israel',
  'holon': 'Holon, Israel',
  'bnei brak': 'Bnei Brak, Israel',
  'ramat gan': 'Ramat Gan, Israel',
  'givatayim': 'Givatayim, Israel',
  'givataim': 'Givatayim, Israel',
  'gita': 'Givatayim, Israel', // Common shorthand/typo
  'herzliya': 'Herzliya, Israel',
  'herzelia': 'Herzliya, Israel',
  'raanana': 'Ra\'anana, Israel',
  'ra\'anana': 'Ra\'anana, Israel',
  'kfar saba': 'Kfar Saba, Israel',
  'ramat hasharon': 'Ramat Hasharon, Israel',
  'modiin': 'Modi\'in, Israel',
  'modi\'in': 'Modi\'in, Israel',
  'ashkelon': 'Ashkelon, Israel',
  'rehovot': 'Rehovot, Israel',
  'lod': 'Lod, Israel',
  'ramla': 'Ramla, Israel',
  'bat yam': 'Bat Yam, Israel',
  'tiberias': 'Tiberias, Israel',
  'safed': 'Safed, Israel',
  'acre': 'Acre, Israel',
  'akko': 'Acre, Israel',
  'nahariya': 'Nahariya, Israel',
  'kiryat shmona': 'Kiryat Shmona, Israel',
  'dimona': 'Dimona, Israel',
  'arad': 'Arad, Israel',
  'mitzpe ramon': 'Mitzpe Ramon, Israel',
  
  // Smaller Israeli localities and villages
  'yarka': 'Yarka, Israel',
  'daliyat al-karmel': 'Daliyat al-Karmel, Israel',
  'daliyat al karmel': 'Daliyat al-Karmel, Israel',
  'isfiya': 'Isfiya, Israel',
  'majdal shams': 'Majdal Shams, Israel',
  'buqata': 'Buq\'ata, Israel',
  'masada village': 'Mas\'ada, Israel',
  'hurfeish': 'Hurfeish, Israel',
  'pekin': 'Peki\'in, Israel',
  'pekiin': 'Peki\'in, Israel',
  'jish': 'Jish, Israel',
  'gush halav': 'Jish, Israel',
  'kisra sumei': 'Kisra-Sumei, Israel',
  'rama': 'Rama, Israel',
  'shfaram': 'Shfar\'am, Israel',
  'tamra': 'Tamra, Israel',
  'sakhnin': 'Sakhnin, Israel',
  'arara': 'Ar\'ara, Israel',
  'baqa al gharbiyye': 'Baqa al-Gharbiyye, Israel',
  'umm al fahm': 'Umm al-Fahm, Israel',
  
  // Common climbing destinations with typo variations
  'yosemite': 'Yosemite Valley, California, USA',
  'yosemite valley': 'Yosemite Valley, California, USA',
  'yosemity': 'Yosemite Valley, California, USA',
  'yosemiti': 'Yosemite Valley, California, USA',
  'yosemite national park': 'Yosemite Valley, California, USA',
  
  'joshua tree': 'Joshua Tree, California, USA',
  'joshua tree national park': 'Joshua Tree, California, USA',
  'josua tree': 'Joshua Tree, California, USA',
  'joshua': 'Joshua Tree, California, USA',
  'jtree': 'Joshua Tree, California, USA',
  'j tree': 'Joshua Tree, California, USA',
  
  'red rocks': 'Las Vegas, Nevada, USA',
  'red rock': 'Las Vegas, Nevada, USA',
  'red rocks nevada': 'Las Vegas, Nevada, USA',
  'red rock canyon': 'Las Vegas, Nevada, USA',
  'redrocks': 'Las Vegas, Nevada, USA',
  'redrock': 'Las Vegas, Nevada, USA',
  
  'bishop': 'Bishop, California, USA',
  'bishop california': 'Bishop, California, USA',
  'bishop ca': 'Bishop, California, USA',
  'bishup': 'Bishop, California, USA',
  
  'fontainebleau': 'Fontainebleau, France',
  'fontainbleau': 'Fontainebleau, France',
  'fontainebleu': 'Fontainebleau, France',
  'font': 'Fontainebleau, France',
  'bleau': 'Fontainebleau, France',
  
  'chamonix': 'Chamonix, France',
  'chamonix mont blanc': 'Chamonix, France',
  'chamoni': 'Chamonix, France',
  'chamonix france': 'Chamonix, France',
  
  'kalymnos': 'Kalymnos, Greece',
  'kalymno': 'Kalymnos, Greece',
  'kalymnos greece': 'Kalymnos, Greece',
  'kalimno': 'Kalymnos, Greece',
  
  'el capitan': 'Yosemite Valley, California, USA',
  'el cap': 'Yosemite Valley, California, USA',
  'elcap': 'Yosemite Valley, California, USA',
  'el captain': 'Yosemite Valley, California, USA',
  
  'hueco tanks': 'El Paso, Texas, USA',
  'hueco': 'El Paso, Texas, USA',
  'huecos': 'El Paso, Texas, USA',
  'hueco tanks state park': 'El Paso, Texas, USA',
  
  'squamish': 'Squamish, British Columbia, Canada',
  'squamish bc': 'Squamish, British Columbia, Canada',
  'squamish canada': 'Squamish, British Columbia, Canada',
  'squamish british columbia': 'Squamish, British Columbia, Canada',
  
  // Common city typos
  'new york': 'New York, New York, USA',
  'newyork': 'New York, New York, USA',
  'ny': 'New York, New York, USA',
  'nyc': 'New York, New York, USA',
  
  'los angeles': 'Los Angeles, California, USA',
  'la': 'Los Angeles, California, USA',
  'los angelos': 'Los Angeles, California, USA',
  'los angeles ca': 'Los Angeles, California, USA',
  
  'san francisco': 'San Francisco, California, USA',
  'sf': 'San Francisco, California, USA',
  'san fransisco': 'San Francisco, California, USA',
  'san francisco ca': 'San Francisco, California, USA',
  
  'las vegas': 'Las Vegas, Nevada, USA',
  'vegas': 'Las Vegas, Nevada, USA',
  'las vegas nv': 'Las Vegas, Nevada, USA',
  'las vagas': 'Las Vegas, Nevada, USA',
  
  // Climbing areas and natural sites - English variations
  'ein fara': 'Ramallah, West Bank',
  'ein para': 'Ramallah, West Bank',
  'wadi fara': 'Ramallah, West Bank',
  'nahal fara': 'Ramallah, West Bank',
  'ein fara israel': 'Jerusalem, Israel',
  'ein para israel': 'Jerusalem, Israel',
  'wadi fara israel': 'Jerusalem, Israel',
  'nahal fara israel': 'Jerusalem, Israel',
  'wadi qelt': 'Jericho, West Bank',
  'nahal darga': 'Dead Sea, Israel',
  'nahal tze\'elim': 'Dead Sea, Israel',
  'masada': 'Masada, Israel',
  'ein gedi': 'Ein Gedi, Israel',
  'nahal hever': 'Dead Sea, Israel',
  'nahal pratzim': 'Dead Sea, Israel',
  'makhtesh ramon': 'Mitzpe Ramon, Israel',
  'ramon crater': 'Mitzpe Ramon, Israel',
  'nahal zin': 'Mitzpe Ramon, Israel',
  'zin valley': 'Mitzpe Ramon, Israel',
  'mount arbel': 'Tiberias, Israel',
  'har arbel': 'Tiberias, Israel',
  'nahal amud': 'Safed, Israel',
  'upper galilee': 'Safed, Israel',
  'golan heights': 'Golan Heights, Israel',
  'mount hermon': 'Mount Hermon, Israel',
  'har hermon': 'Mount Hermon, Israel',
};

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Find closest match using fuzzy matching
function findClosestMatch(input: string, threshold: number = 3): string | null {
  const inputLower = input.toLowerCase().trim();
  let bestMatch = null;
  let bestDistance = threshold + 1;
  
  for (const [key, value] of Object.entries(locationMappings)) {
    const distance = levenshteinDistance(inputLower, key.toLowerCase());
    if (distance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = value;
    }
  }
  
  return bestMatch;
}

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a climbing location. Supports international locations including Hebrew text and handles typos. For climbing areas, use common names like "Yosemite", "Joshua Tree", "Red Rocks", etc.',
  inputSchema: z.object({
    location: z.string().describe('City name or climbing area (supports Hebrew, international locations, and handles typos)'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
    climbingAdvice: z.string(),
    correctedLocation: z.string().optional(),
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

const getWeather = async (location: string) => {
  const originalLocation = location;
  
  // Step 1: Try exact mapping
  let normalizedLocation = normalizeLocation(location);
  let correctedLocation: string | undefined;
  
  // Step 2: If no exact match, try fuzzy matching
  if (normalizedLocation === location) {
    const fuzzyMatch = findClosestMatch(location);
    if (fuzzyMatch) {
      normalizedLocation = fuzzyMatch;
      correctedLocation = fuzzyMatch;
    }
  }
  
  try {
    // Try the mapped/normalized location first
    const result = await fetchWeatherData(normalizedLocation);
    return {
      ...result,
      climbingAdvice: generateClimbingAdvice(result),
      correctedLocation,
    };
  } catch (error) {
    // If that fails, try alternative searches
    const alternatives = generateAlternatives(originalLocation);
    
    for (const alt of alternatives) {
      try {
        const result = await fetchWeatherData(alt);
        return {
          ...result,
          climbingAdvice: generateClimbingAdvice(result),
          correctedLocation: alt !== originalLocation ? alt : undefined,
        };
      } catch (altError) {
        // Continue to next alternative
      }
    }
    
    // Generate helpful suggestions based on fuzzy matching
    const suggestions = generateSuggestions(originalLocation);
    const suggestionText = suggestions.length > 0 
      ? ` Did you mean: ${suggestions.slice(0, 3).join(', ')}?`
      : '';
    
    throw new Error(`Location '${originalLocation}' not found.${suggestionText} Try using English names or include country (e.g., "Karmiel, Israel" instead of "כרמיאל"). For climbing areas, try "Yosemite Valley", "Joshua Tree", "Red Rocks Las Vegas", etc.`);
  }
};

function normalizeLocation(location: string): string {
  const lower = location.toLowerCase().trim();
  
  // Check direct mappings first
  if (locationMappings[location]) {
    return locationMappings[location];
  }
  
  if (locationMappings[lower]) {
    return locationMappings[lower];
  }
  
  // Return original if no mapping found
  return location;
}

function generateAlternatives(location: string): string[] {
  const alternatives: string[] = [];
  const lower = location.toLowerCase().trim();
  
  // Add common variations
  alternatives.push(location);
  alternatives.push(lower);
  alternatives.push(location + ', Israel'); // Common for Hebrew locations
  alternatives.push(location + ', USA');
  alternatives.push(location + ', California');
  alternatives.push(location + ', France');
  alternatives.push(location + ', Greece');
  alternatives.push(location + ', Canada');
  
  // For climbing-specific terms with partial matching
  if (lower.includes('yosemite') || lower.includes('yosemity')) {
    alternatives.push('Yosemite Valley, California, USA');
  }
  if (lower.includes('joshua') || lower.includes('josua')) {
    alternatives.push('Joshua Tree, California, USA');
  }
  if (lower.includes('red rock') || lower.includes('redrock')) {
    alternatives.push('Las Vegas, Nevada, USA');
  }
  if (lower.includes('bishop') || lower.includes('bishup')) {
    alternatives.push('Bishop, California, USA');
  }
  if (lower.includes('font') || lower.includes('bleau')) {
    alternatives.push('Fontainebleau, France');
  }
  if (lower.includes('chamonix') || lower.includes('chamoni')) {
    alternatives.push('Chamonix, France');
  }
  if (lower.includes('kalymnos') || lower.includes('kalymno')) {
    alternatives.push('Kalymnos, Greece');
  }
  
  return [...new Set(alternatives)]; // Remove duplicates
}

function generateSuggestions(input: string): string[] {
  const suggestions: string[] = [];
  const inputLower = input.toLowerCase().trim();
  
  // Find close matches with different thresholds
  for (const threshold of [1, 2, 3]) {
    const match = findClosestMatch(input, threshold);
    if (match && !suggestions.includes(match)) {
      suggestions.push(match);
    }
  }
  
  // Add partial matches for climbing areas
  const climbingAreas = [
    'Yosemite Valley, California, USA',
    'Joshua Tree, California, USA', 
    'Las Vegas, Nevada, USA',
    'Bishop, California, USA',
    'Fontainebleau, France',
    'Chamonix, France',
    'Kalymnos, Greece'
  ];
  
  for (const area of climbingAreas) {
    const areaName = area.split(',')[0].toLowerCase();
    if (areaName.includes(inputLower) || inputLower.includes(areaName.substring(0, 4))) {
      if (!suggestions.includes(area)) {
        suggestions.push(area);
      }
    }
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

async function fetchWeatherData(location: string) {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name, country, admin1 } = geocodingData.results[0];
  const fullLocationName = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: fullLocationName,
  };
}

function generateClimbingAdvice(weather: {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  conditions: string;
}): string {
  const advice: string[] = [];
  
  // Temperature advice
  if (weather.temperature >= 10 && weather.temperature <= 20) {
    advice.push("🌡️ Perfect temperature for climbing! Optimal finger strength conditions.");
  } else if (weather.temperature > 30) {
    advice.push("🔥 Very hot! Climb early morning or evening. Bring extra water. Poor friction expected.");
  } else if (weather.temperature < 0) {
    advice.push("🥶 Freezing conditions! Risk of frostbite. Consider indoor climbing.");
  } else if (weather.temperature > 25) {
    advice.push("☀️ Warm conditions. Early morning sessions recommended. Stay hydrated.");
  } else if (weather.temperature < 5) {
    advice.push("❄️ Cold conditions. Warm up thoroughly. Reduced finger dexterity expected.");
  }
  
  // Humidity advice
  if (weather.humidity > 70) {
    advice.push("💧 High humidity - reduced rock friction. Chalk up frequently.");
  } else if (weather.humidity < 40) {
    advice.push("🏜️ Low humidity - excellent friction conditions!");
  }
  
  // Wind advice
  if (weather.windGust > 20) {
    advice.push("💨 Dangerous wind gusts! Avoid exposed routes and multi-pitch climbing.");
  } else if (weather.windSpeed > 15) {
    advice.push("🌬️ Strong winds. Be cautious on exposed routes.");
  } else if (weather.windSpeed < 5) {
    advice.push("🍃 Calm conditions - perfect for technical climbing.");
  }
  
  // Conditions advice
  if (weather.conditions.toLowerCase().includes('rain') || 
      weather.conditions.toLowerCase().includes('drizzle')) {
    advice.push("🌧️ WET CONDITIONS - DO NOT CLIMB! Wait 24-48 hours after rain stops.");
  } else if (weather.conditions.toLowerCase().includes('thunderstorm')) {
    advice.push("⛈️ THUNDERSTORM - EXTREMELY DANGEROUS! Evacuate immediately if outdoors.");
  } else if (weather.conditions.toLowerCase().includes('snow')) {
    advice.push("🌨️ Snow conditions - outdoor climbing not recommended.");
  } else if (weather.conditions.toLowerCase().includes('clear') || 
             weather.conditions.toLowerCase().includes('sunny')) {
    advice.push("☀️ Clear skies - excellent visibility for route reading!");
  }
  
  return advice.join(' ');
}

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}
