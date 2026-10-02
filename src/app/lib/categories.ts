import type { CSSProperties } from "react";

export const categories: Record<string, any> = {
  Moods: {
    Relaxing: {},
    Upbeat: {},
    Zen: {},
    Melancholic: {},
    Chaotic: {},
    Dark: {},
    Liminal: {},
    "Other Moods": {},
  },
  Rooms: {
    Cafe: {},
    Library: {},
    Office: {},
    Lounge: {},
    Tavern: {},
    Manor: {},
    "Other Rooms": {},
  },
  Musical: {
    "Lo-fi": {},
    Jazz: {},
    Instrumental: {},
    Electronic: {},
    Alternative: {},
    "Other Music": {},
  },
  "White Noise": {},
  Nature: {
    Forest: {},
    Meadows: {},
    Rivers: {},
    Coastline: {},
    Wilderness: {},
  },
  Weather: {
    Rain: {},
    Wind: {},
    Snow: {},
  },
  Seasonal: {
    Spring: {},
    Summer: {},
    Autumn: {},
    Winter: {},
    Halloween: {},
    Christmas: {},
    "Other Holidays": {},
  },
  Urban: {
    "City Streets": {},
    Suburbia: {},
    Transit: {},
    Industrial: {},
  },
  World: {},
  Activities: {},
  Ethereal: {},
  Surreal: {},
  Experimental: {},
};

export type CategoryImage = {
  src: string;
  alt?: string;
  author?: string;
  sourceUrl?: string;
};

export type CategoryMeta = {
  id: number;
  description: string;
  tags: string[];
  image: CategoryImage;
  imageStyle: CSSProperties;
};

// IDs are permanent — never reuse or change an ID.
// Top-level categories are spaced by 100s, subcategories are spaced by 10s within each century (e.g. 110, 120, 130...).
// This leaves room to insert new subcategories between existing ones (e.g. 115, 125) without breaking order.
export const categoryMeta: Record<string, CategoryMeta> = {
  // Moods (100s)
  Moods: {
    id: 100,
    description:
      "Ambiances that span every mood, from meditative stillness to productive chaos.",
    tags: ["relaxing", "upbeat", "melancholic", "chaotic"],
    image: {
      src: "/images/categories/moods.jpg",
      alt: "A collage of mood-related images with a woven hammock tied between trees in the center, a peaceful rock garden on the left, and a modern apartment building at dusk on the right.",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Relaxing: {
    id: 110,
    description: "Comfortable, gentle sounds for unwinding and decompressing.",
    tags: ["tranquil", "serene", "gentle"],
    image: {
      src: "/images/categories/relaxing.jpg",
      alt: "A white woven hammock hangs between two trees in a lush lakeside park, inviting peaceful relaxation on a bright, sunny summer day.",
      author: "Syuhei Inoue",
      sourceUrl:
        "https://unsplash.com/photos/green-hammock-tied-on-tree-trunk-near-body-of-water-during-daytime-Rdt8sDsFFwk",
    },
    imageStyle: {},
  },
  Upbeat: {
    id: 120,
    description:
      "Lively, energetic sounds that keep momentum and lift your mood.",
    tags: ["energetic", "bright", "motivated"],
    image: {
      src: "/images/categories/upbeat.jpg",
      alt: "Two people leap joyfully against a blue sky: a man in a red shirt and shorts and a woman in a polka-dot dress, both raising their arms.",
      author: "",
      sourceUrl:
        "https://pixabay.com/photos/jump-sky-man-clouds-height-girl-2731641/",
    },
    imageStyle: {},
  },
  Zen: {
    id: 130,
    description:
      "Intentionally still and focused ambiance for meditation and deep work.",
    tags: ["meditative", "mindful", "contemplative"],
    image: {
      src: "/images/categories/zen.jpg",
      alt: "Serene Japanese Zen rock garden with raked gravel, sculpted stones, and a traditional temple pavilion amid lush trees; tranquil atmosphere.",
      author: "Ray Wyman Jr",
      sourceUrl:
        "https://unsplash.com/photos/a-japanese-garden-with-rocks-and-a-building-OmY2XArLKcs",
    },
    imageStyle: {},
  },
  Melancholic: {
    id: 140,
    description:
      "Bittersweet, reflective sounds that sit comfortably with quiet sadness.",
    tags: ["somber", "wistful", "introspective"],
    image: {
      src: "/images/categories/melancholic.jpg",
      alt: "Dusk view of a gray apartment building framed by dark trees, with several warmly lit windows glowing against the cool, moody evening sky.",
      author: "Elina Volkova",
      sourceUrl:
        "https://www.pexels.com/photo/a-building-in-a-city-at-dusk-17572905/",
    },
    imageStyle: {},
  },
  Chaotic: {
    id: 150,
    description:
      "A wash of competing sounds pulling in every direction. The kind of noise certain minds need to settle in and work.",
    tags: ["frenetic", "layered", "cacophony"],
    image: {
      src: "/images/categories/chaotic.jpg",
      alt: "Abstract expressionist painting with layered splashes and drips of blue, red, white, black, and gray, creating a chaotic, energetic texture.",
      author: "Sen Sen",
      sourceUrl:
        "https://www.pexels.com/photo/close-up-shot-of-an-abstract-painting-9902081/",
    },
    imageStyle: {},
  },
  Dark: {
    id: 160,
    description:
      "Weighty, oppressive atmospheres for those drawn to the darker side of sound.",
    tags: ["ominous", "haunting", "foreboding"],
    image: {
      src: "/images/categories/dark.jpg",
      alt: "Fog-shrouded forest of tall, leafless trees under a gray sky, creating a quiet, eerie, and mysterious atmosphere.",
      author: "Mathias Reding",
      sourceUrl:
        "https://www.pexels.com/photo/bare-trees-under-white-sky-10974341/",
    },
    imageStyle: {},
  },
  Liminal: {
    id: 170,
    description:
      "Sounds from places that feel slightly out of time. Empty and familiar, but somehow not quite right.",
    tags: ["adrift", "vacant", "nowhere"],
    image: {
      src: "/images/categories/liminal.jpg",
      alt: "Empty escalators descend into a large dark room, lit by fluorescent lights; teal tones and shadows create a quiet, eerie mood.",
      author: "Sam Operchuck",
      sourceUrl:
        "https://unsplash.com/photos/an-empty-parking-garage-with-an-escalator-aaTFObM39wo",
    },
    imageStyle: {},
  },
  "Other Moods": {
    id: 180,
    description:
      "Moods without a named category. Feelings that sit between the others, or outside them entirely.",
    tags: ["nostalgic", "emotional", "yearning"],
    image: {
      src: "/images/categories/other_moods.jpg",
      alt: "Two ornate Venetian carnival masks—one green and gold, one white and red—overlap against a shadowy vintage backdrop, evoking mystery.",
      author: "Lisa Fotios",
      sourceUrl:
        "https://www.pexels.com/photo/elegant-venetian-masks-in-mysterious-dark-setting-30937067/",
    },
    imageStyle: {},
  },

  // Rooms (200s)
  Rooms: {
    id: 200,
    description:
      "Indoor settings ranging from cozy reading nooks to functional workspaces.",
    tags: ["cafe", "library", "office", "lounge", "manor"],
    image: {
      src: "/images/categories/rooms.jpg",
      alt: "Cozy window seat with floral cushions, red and cream pillows, built-in bookshelves, and warm golden curtains creating an inviting reading nook.",
      author: "Rahul Pundit",
      sourceUrl:
        "https://www.pexels.com/photo/bench-seat-with-a-bookshelf-in-a-window-bay-15226810/",
    },
    imageStyle: {},
  },
  Cafe: {
    id: 210,
    description:
      "The warm clatter of a coffee shop. Espresso machines, soft conversation, and background music.",
    tags: ["espresso", "steam", "morning"],
    image: {
      src: "/images/categories/cafe2.jpg",
      alt: "Barista pours hot water from a polished gooseneck kettle into glass pour-over coffee drippers at a busy café, creating a focused mood.",
      author: "Burst",
      sourceUrl: "https://stocksnap.io/photo/barista-pouring-MD4L58LL1E",
    },
    imageStyle: {},
  },
  Library: {
    id: 220,
    description:
      "The rustle of pages, distant footsteps on hardwood, and the focused hush of a reading room.",
    tags: ["studious", "quiet", "tomes"],
    image: {
      src: "/images/categories/library.jpg",
      alt: "Ornate timber library with towering bookshelves, carved balconies, tall windows, and reading tables bathed in warm, scholarly light.",
      author: "Michael D Beckwith",
      sourceUrl:
        "https://www.pexels.com/photo/elegant-library-interior-in-hawarden-wales-31376701/",
    },
    imageStyle: {},
  },
  Office: {
    id: 230,
    description:
      "The sounds of getting work done. Keyboards, computer hum, and the low level background that helps you focus.",
    tags: ["productivity", "focus"],
    image: {
      src: "/images/categories/office2.jpg",
      alt: "Modern home office with a black mesh ergonomic chair, white corner desk, computer monitor, filing drawers, lamp, and wastebasket.",
      author: "websubs",
      sourceUrl:
        "https://pixabay.com/photos/iocenters-furnished-offices-2673326/",
    },
    imageStyle: {},
  },
  Lounge: {
    id: 240,
    description:
      "Dim lighting, cocktails, and the unhurried murmur of sophisticated company.",
    tags: ["mellow", "refined"],
    image: {
      src: "/images/categories/lounge.jpg",
      alt: "Moody, dimly lit lounge with a curved brown sofa, round black coffee table, large window, hanging drapes, plants, and warm lights.",
      author: "Teruo Kondo",
      sourceUrl: "https://www.pexels.com/photo/darkness-living-room-13722826/",
    },
    imageStyle: {},
  },
  Tavern: {
    id: 250,
    description:
      "Old drinking halls and inns filled with chatter, clinking glasses, and fireside warmth.",
    tags: ["medieval", "rustic", "lively"],
    image: {
      src: "/images/categories/tavern.jpg",
      alt: "Warm, rustic bar interior with a polished wooden counter, glowing candle, glass plates, and softly lit shelves creating a cozy atmosphere.",
      author: "DonnaSenzaFiato",
      sourceUrl:
        "https://pixabay.com/photos/bar-pub-comfortable-the-atmosphere-3407484/",
    },
    imageStyle: {},
  },
  Manor: {
    id: 260,
    description:
      "Old castles and manor houses. Crackling fires, ticking clocks, stone corridors, and rain lashed windows.",
    tags: ["solitary", "hushed", "gothic"],
    image: {
      src: "/images/categories/manor.jpg",
      alt: "Elegant antique sitting room with dark patterned walls, ornate furniture, mirror, fireplace, framed art, and a richly colored rug; moody and refined.",
      author: "Karam Alani",
      sourceUrl:
        "https://www.pexels.com/photo/elegant-interior-of-castle-howard-room-37150070/",
    },
    imageStyle: {},
  },
  "Other Rooms": {
    id: 270,
    description:
      "Indoor spaces that aren't quite like the others. Hallways, quiet corners, and personal spaces.",
    tags: ["interior", "secluded", "personal"],
    image: {
      src: "/images/categories/other_rooms.jpg",
      alt: "Ornate historic staircase with gilded walls, carved details, and intricate dark wrought-iron railing, lit by a tall window; elegant, regal mood.",
      author: "Max Avans",
      sourceUrl:
        "https://www.pexels.com/photo/brown-wooden-staircase-with-metal-railings-5058836/",
    },
    imageStyle: {},
  },

  // Musical (300s)
  Musical: {
    id: 300,
    description:
      "Mellow study beats, live instruments, and synthesized landscapes.",
    tags: ["melodic", "rhythmic", "immersive"],
    image: {
      src: "/images/categories/musical.jpg",
      alt: "A polished red drum kit with cymbals and microphones sits behind a black electronic keyboard, evoking a professional music studio.",
      author: "Matthew Moloney",
      sourceUrl:
        "https://unsplash.com/photos/black-and-white-electric-keyboard-W9H56HxLIec",
    },
    imageStyle: {},
  },
  "Lo-fi": {
    id: 310,
    description:
      "Beats that stay in the background and let you think. Unhurried and slightly muted, built for long sessions of focused work.",
    tags: ["chill", "mellow", "understated"],
    image: {
      src: "/images/categories/lo-fi.jpg",
      alt: "An woman wearing headphones sits at a desk inside a dimly lit room, writing beside a small lamp. Viewed through a window during a snowy night.",
      author: "Kaue Barbier",
      sourceUrl:
        "https://www.pexels.com/photo/cozy-indoor-study-scene-on-a-snowy-night-30668368/",
    },
    imageStyle: {},
  },
  Jazz: {
    id: 320,
    description:
      "Upright bass, brushed drums, and saxophone. The calm sophistication of a live performance late at night.",
    tags: ["sophisticated", "smooth", "late night"],
    image: {
      src: "/images/categories/jazz.jpg",
      alt: "Close-up of a saxophonist’s hands playing a shiny saxophone on a purple-lit jazz stage, with a drum kit blurred behind, creating an intimate mood.",
      author: "Big Bag Films",
      sourceUrl:
        "https://www.pexels.com/photo/close-up-photo-of-man-playing-saxophone-8512617/",
    },
    imageStyle: {},
  },
  Instrumental: {
    id: 330,
    description:
      "Solo instruments and ensembles. Piano, strings, and music built around the instrument alone.",
    tags: ["piano", "acoustic", "orchestral"],
    image: {
      src: "/images/categories/instrumental.jpg",
      alt: "Warm-toned acoustic guitar in the foreground, with an upright piano and electric guitar behind it, creating a cozy music-room scene.",
      author: "Yuma Nozaki",
      sourceUrl:
        "https://unsplash.com/photos/a-guitar-sitting-on-top-of-a-table-next-to-a-piano-CeE9q01DxuQ",
    },
    imageStyle: {},
  },
  Electronic: {
    id: 340,
    description:
      "Synthesizers, pulsing beats, and layered textures. From lo-fi retrofuture to full electronic production.",
    tags: ["synth", "vaporwave", "hypnotic"],
    image: {
      src: "/images/categories/electronic.jpg",
      alt: "Close-up of a modular synthesizer packed with colorful patch cables, knobs, and glowing LEDs, creating an intricate, creative electronic mood.",
      author: "Adi Goldstein",
      sourceUrl:
        "https://unsplash.com/photos/black-and-red-audio-mixer-aIZahsfZSVA",
    },
    imageStyle: {},
  },
  Alternative: {
    id: 350,
    description:
      "Quiet and textured to raw and loud. Indie, shoegaze, and the harder sounds.",
    tags: ["post-rock", "dream pop", "grunge", "punk"],
    image: {
      src: "/images/categories/alternative.jpg",
      alt: "Rock band performs on a smoky stage, with guitarist and drummer silhouetted in dramatic blue and orange concert lights.",
      author: "Rocco Dipoppa",
      sourceUrl:
        "https://unsplash.com/photos/three-people-playing-assorted-instruments-on-stage-_uDj_lyPVpA",
    },
    imageStyle: {},
  },
  "Other Music": {
    id: 360,
    description:
      "Country, folk, soul, pop, or anything else that didn't get its own category.",
    tags: ["timeless", "traditional", "modern"],
    image: {
      src: "/images/categories/other_music.jpg",
      alt: "Overlapping vintage sheet music pages with printed musical notation create a warm, nostalgic collage in cream, beige, and sepia tones.",
      author: "Buchkiste",
      sourceUrl: "https://www.pexels.com/photo/pile-of-music-sheets-4861059/",
    },
    imageStyle: {},
  },

  // White Noise (400)
  "White Noise": {
    id: 400,
    description:
      "Pure, consistent tones designed for focus, sleep, and tuning out the world.",
    tags: ["hums", "tones"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // Nature (500s)
  Nature: {
    id: 500,
    description:
      "Wildlife, water, and open land. The sounds of the natural world at its most uninterrupted.",
    tags: ["forest", "meadows", "rivers", "coastline"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Forest: {
    id: 510,
    description:
      "The layered sound of old growth, temperate or tropical. Rustling canopy, distant calls, and the deep quiet within.",
    tags: ["woodland", "jungle", "birdsong"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Meadows: {
    id: 520,
    description:
      "Open fields and gentle countryside. Soft wind, animals, insects, and the unhurried pace of open land.",
    tags: ["grassland", "savannah", "countryside"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Rivers: {
    id: 530,
    description:
      "The sound of moving freshwater, from gentle murmurs to the roar of a cascade.",
    tags: ["watefalls", "brooks", "marshes"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Coastline: {
    id: 540,
    description:
      "Waves breaking on rock and sand, salt air, and the call of seagulls. From a quiet cove to the open sea.",
    tags: ["waves", "shore", "beach"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Wilderness: {
    id: 550,
    description:
      "Remote, extreme environments far from the familiar. Vast, sparse, and indifferent.",
    tags: ["desert", "mountains", "tundra", "caves"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // Weather (600s)
  Weather: {
    id: 600,
    description:
      "Rain, wind, and snow. From a light drizzle to a full winter storm.",
    tags: ["rain", "wind", "snow"],
    image: {
      src: "/images/categories/weather.jpg",
      alt: "Towering blue-gray storm clouds billow across the sky, with pale sunlight glowing through an opening, creating a vast, dramatic scene.",
      author: "Samuel Jerome",
      sourceUrl:
        "https://www.pexels.com/photo/dramatic-cloudscape-over-indian-beach-28840873/",
    },
    imageStyle: {},
  },
  Rain: {
    id: 610,
    description:
      "A soft patter on glass, a steady rainfall, or the full weight of a thunderstorm.",
    tags: ["drizzle", "storm", "thunder"],
    image: {
      src: "/images/categories/rain.jpg",
      alt: "Close-up of raindrops hitting a pavement, creating ripples and splashes.",
      author: "brazil topno",
      sourceUrl: "https://www.pexels.com/photo/water-splash-on-ground-9604806/",
    },
    imageStyle: {},
  },
  Wind: {
    id: 620,
    description:
      "Air in motion. From a gentle rustle through leaves to a howling gale.",
    tags: ["gust", "breeze", "howling"],
    image: {
      src: "/images/categories/wind.jpg",
      alt: "Palm trees bending under strong winds and cloudy skies during a tropical storm.",
      author: "Guilherme Christmann",
      sourceUrl:
        "https://www.pexels.com/photo/palm-trees-during-a-hurricane-16313103/",
    },
    imageStyle: {},
  },
  Snow: {
    id: 630,
    description:
      "The world under snowfall. Muffled sounds, crunching underfoot, and a rare, deep silence.",
    tags: ["blizzard", "winter", "frost"],
    image: {
      src: "/images/categories/snow.jpg",
      alt: "Snowy pine trees create a serene winter forest scene under falling snowflakes.",
      author: "Arina Dmitrieva",
      sourceUrl:
        "https://www.pexels.com/photo/low-angle-shot-of-pine-trees-covered-with-snow-during-winter-10888334/",
    },
    imageStyle: {},
  },

  // Seasonal (700s)
  Seasonal: {
    id: 700,
    description: "The sounds of each season and the holidays that shape them.",
    tags: ["spring", "autumn", "halloween", "christmas"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Spring: {
    id: 710,
    description:
      "Fresh breezes, returning birdsong, and soft rain after a long winter.",
    tags: ["renewal", "awakening"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Summer: {
    id: 720,
    description:
      "Hot afternoons, insects at dusk, and evenings that don't want to end.",
    tags: ["sunny", "porch", "cicadas"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Autumn: {
    id: 730,
    description:
      "Crisp air, falling leaves, and wood smoke in a forest turning amber and crimson.",
    tags: ["leaves", "harvest", "bonfire"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Winter: {
    id: 740,
    description:
      "Frozen landscapes and the deep quiet of snow. Cold air, bare trees, and long nights.",
    tags: ["cold", "snowfall", "stillness"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Halloween: {
    id: 750,
    description:
      "Creaking doors, distant howls, jack-o-lanterns. The unsettling edge of the year's darkest night.",
    tags: ["spooky", "haunted", "macabre"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Christmas: {
    id: 760,
    description:
      "Crackling fires, bells, and carols in the air. December at its most familiar.",
    tags: ["festive", "carols", "yuletide"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  "Other Holidays": {
    id: 770,
    description:
      "Harvest festivals, midsummer celebrations, and all the seasonal holidays that don't have their own category.",
    tags: ["fireworks", "festivals", "celebration"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // Urban (800s)
  Urban: {
    id: 800,
    description:
      "Civilization in motion. Crowded streets, quiet corners, and the hum of infrastructure.",
    tags: ["city", "suburbia", "transit", "industrial"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  "City Streets": {
    id: 810,
    description:
      "The full intensity of city life. Sirens, street vendors, bus engines, and the constant motion of people.",
    tags: ["traffic", "crowds", "downtown"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Suburbia: {
    id: 820,
    description:
      "The unhurried sounds of residential life. Lawn mowers, dogs barking, distant voices, and occasional traffic.",
    tags: ["neighborhood", "residential", "quiet"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Transit: {
    id: 830,
    description:
      "The sounds of moving through the world. Rumbling carriages, echoing platforms, and the rhythm of a commute.",
    tags: ["train", "bus", "commute"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
  Industrial: {
    id: 840,
    description:
      "The rhythmic noise of large-scale production. Metalwork, steam, equipment, and the hum of infrastructure.",
    tags: ["machinery", "factory"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // World (900)
  World: {
    id: 900,
    description:
      "Ambiance only heard in one particular corner of the globe. Sounds tied to specific cultures, regions, or historical periods.",
    tags: ["cultural", "regional"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // Activities (1000)
  Activities: {
    id: 1000,
    description:
      "Ambiances defined by what you're doing. From the gym to the kitchen, the workshop to the study.",
    tags: ["sports", "gym", "cooking", "crafts"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // Ethereal (1100)
  Ethereal: {
    id: 1100,
    description:
      "Temple bells, abbey choirs, and a lingering  carrying a sense of the sacred and transcendent.",
    tags: ["mystical", "transcendent", "spiritual"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // Surreal (1200)
  Surreal: {
    id: 1200,
    description:
      "Sounds that exist outside ordinary experience. Vast, weightless, and impossible to place.",
    tags: ["abstract", "otherworldly", "cosmic", "underwater"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },

  // Experimental (1300)
  Experimental: {
    id: 1300,
    description:
      "Ambiances that don't fit anywhere else. Some are unconventional by design, others simply resist categorization.",
    tags: ["unique", "unconventional"],
    image: {
      src: "/images/categories/horror.jpg",
      alt: "",
      author: "",
      sourceUrl: "",
    },
    imageStyle: {},
  },
};

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/ /g, "-");
}

function findCategoryPath(
  name: string,
  tree: Record<string, any>,
  prefix: string,
): string | undefined {
  for (const key of Object.keys(tree)) {
    const path = `${prefix}/${nameToSlug(key)}`;
    if (key === name) return path;
    const subtree = tree[key];
    if (subtree && Object.keys(subtree).length > 0) {
      const found = findCategoryPath(name, subtree, path);
      if (found) return found;
    }
  }
  return undefined;
}

function getCategoryHref(name: string): string {
  return (
    findCategoryPath(name, categories, "/categories") ??
    `/categories/${nameToSlug(name)}`
  );
}

export const categoryById: Record<number, { name: string; href: string }> =
  Object.fromEntries(
    Object.entries(categoryMeta).map(([name, meta]) => [
      meta.id,
      { name, href: getCategoryHref(name) },
    ]),
  );
