// Search-only words for each category, on top of its name and tags. Never shown to users.
// A parent category's words also apply to all of its subcategories.
export const categoryKeywords: Record<string, string[]> = {
  // Moods
  Relaxing: ["cozy", "calm", "peaceful", "soothing", "chill", "stress", "anxiety"],
  Upbeat: ["happy", "cheerful", "lively", "fun"],
  Zen: ["meditation", "calm", "peaceful", "yoga", "stress", "anxiety"],
  Melancholic: ["sad", "melancholy", "lonely", "gloomy"],
  Chaotic: ["chaos", "noisy", "loud", "busy"],
  Dark: ["scary", "creepy", "horror", "eerie", "sinister", "mysterious", "mystery"],
  Liminal: ["backrooms", "empty", "abandoned", "eerie", "dreamlike", "mysterious"],

  // Rooms
  Rooms: ["indoor", "interior"],
  Cafe: ["coffee", "shop", "coffeehouse", "bakery", "cozy"],
  Library: ["books", "reading", "study", "academia", "homework", "concentration"],
  Office: ["work", "workplace", "typing", "keyboard", "computer", "coding", "programming"],
  Lounge: ["bar", "cocktail", "hotel", "lobby"],
  Tavern: ["pub", "inn", "bar", "fantasy", "dnd", "rpg"],
  Manor: ["castle", "mansion", "victorian", "fireplace"],
  "Other Rooms": ["home", "house"],

  // Musical
  Musical: ["music", "songs"],
  "Lo-fi": ["beats", "chillhop", "study", "homework", "coding", "programming"],
  Jazz: ["saxophone", "blues", "swing", "noir"],
  Instrumental: ["classical", "guitar", "violin", "strings", "orchestra"],
  Electronic: ["synthwave", "retrowave", "techno", "edm", "cyberpunk", "ambient"],
  Alternative: ["rock", "indie", "shoegaze", "metal"],
  "Other Music": ["country", "folk", "soul", "pop"],

  "White Noise": ["sleep", "nap", "bedtime", "static", "fan", "brown", "pink", "focus", "concentration"],

  // Nature
  Nature: ["outdoors", "outside", "wildlife"],
  Forest: ["woods", "trees", "rainforest", "birds"],
  Meadows: ["field", "farm", "prairie", "crickets"],
  Rivers: ["water", "stream", "creek", "lake", "waterfall", "pond"],
  Coastline: ["ocean", "sea", "seaside", "surf", "seagulls"],
  Wilderness: ["canyon", "arctic", "wild", "remote"],

  // Weather
  Rain: ["thunderstorm", "rainfall", "downpour", "showers", "lightning", "sleep"],
  Wind: ["gale", "blustery", "storm", "hurricane"],
  Snow: ["snowfall", "snowstorm", "ice", "cold"],

  // Seasonal
  Seasonal: ["season"],
  Spring: ["garden", "bloom", "birds"],
  Summer: ["heat", "hot", "vacation", "crickets"],
  Autumn: ["fall", "cozy"],
  Winter: ["snow", "ice", "frozen"],
  Halloween: ["holiday", "scary", "horror", "creepy", "ghost", "witch", "vampire", "zombie"],
  Christmas: ["holiday", "xmas", "santa", "cozy", "winter"],
  "Other Holidays": ["thanksgiving", "easter", "party", "carnival", "fair"],

  // Urban
  "City Streets": ["cars", "sirens", "bustling"],
  Suburbia: ["suburb", "suburban", "backyard", "home"],
  Transit: ["subway", "metro", "railway", "station", "travel"],
  Industrial: ["machines", "workshop", "construction", "engine"],

  World: ["travel", "international", "traditional"],
  Activities: ["workout", "exercise", "hobby", "games"],
  Ethereal: ["church", "cathedral", "choir", "heavenly", "sacred", "monastery", "monk"],
  Surreal: ["space", "dream", "scifi", "alien"],
  Experimental: ["weird", "strange", "glitch"],
};
