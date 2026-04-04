// Mock compass stances for the compass-first prototype.
// Keys: politician UUID. Values: { [short_title]: number (1-10) }
//
// Profiles: progressive, moderate, conservative, mixed
// Uses real topic short_titles from compass.topics for dual overlay compatibility.
// short_titles are exact case-sensitive strings from SELECT short_title FROM compass.topics WHERE is_active = true.
//
// Limited to 8 topics per profile — the compass max spoke count.
// Chosen for visual variety: a mix of social, economic, environment, and security topics.

// The 8 topics used across all mock profiles. Exported so CompassFirstCard can
// filter RadarChartCore spokes to match (avoids 20-spoke clutter).
export const MOCK_TOPICS = [
  "Healthcare", "Climate", "Immigration", "Taxes & Spending",
  "Civil Rights", "Deportation", "Housing", "Religious Freedom",
];

const PROFILES = {
  // Progressive: High on social/environment, low on restrictive topics
  progressive: {
    "Healthcare": 8,
    "Climate": 9,
    "Immigration": 8,
    "Taxes & Spending": 7,
    "Civil Rights": 9,
    "Deportation": 2,
    "Housing": 8,
    "Religious Freedom": 4,
  },
  // Moderate: Mid-range values — near-circular radar shape
  moderate: {
    "Healthcare": 5,
    "Climate": 6,
    "Immigration": 5,
    "Taxes & Spending": 5,
    "Civil Rights": 6,
    "Deportation": 5,
    "Housing": 5,
    "Religious Freedom": 5,
  },
  // Conservative: High on security/traditional, low on social/environment
  conservative: {
    "Healthcare": 3,
    "Climate": 3,
    "Immigration": 2,
    "Taxes & Spending": 2,
    "Civil Rights": 5,
    "Deportation": 9,
    "Housing": 4,
    "Religious Freedom": 9,
  },
  // Mixed: 2-3 strong spikes, remainder low — spiky asymmetric radar
  mixed: {
    "Healthcare": 9,
    "Climate": 3,
    "Immigration": 3,
    "Taxes & Spending": 2,
    "Civil Rights": 7,
    "Deportation": 4,
    "Housing": 2,
    "Religious Freedom": 2,
  },
};

// Mock user compass — a single consistent overlay (coral) across all politician cards.
// Slightly left-leaning moderate to create visible contrast against all 4 profiles.
export const MOCK_USER_COMPASS = {
  "Healthcare": 7,
  "Climate": 6,
  "Immigration": 5,
  "Taxes & Spending": 4,
  "Civil Rights": 8,
  "Deportation": 3,
  "Housing": 7,
  "Religious Freedom": 5,
};

// Bloomington, IN politicians (108 total from 100 W Kirkwood Ave address).
// Profiles assigned round-robin (P=progressive, M=moderate, C=conservative, X=mixed)
// to ensure visual variety in every tier section.
const MOCK_STANCES = {
  // === LOCAL: Bloomington City / Monroe County ===
  "1c6dbdaf-e110-48d3-9b88-27f911d9521f": PROFILES.progressive,  // Kerry Thomson (Mayor)
  "7dc7e4a1-9e52-4287-a100-6e1d715b5085": PROFILES.moderate,     // Matt Flaherty (City Council)
  "4aa0dadf-a3c0-41e9-a5de-66582a393622": PROFILES.conservative, // Kate Rosenbarger (City Council)
  "ec5eefcb-8f41-4bdd-8782-8751f1ed3fb6": PROFILES.mixed,        // Andy Ruff (City Council)
  "2b280bdf-bf17-48ad-853d-a4f0a854c548": PROFILES.progressive,  // Isak Asare (City Council)
  "f562d63a-d7f8-4fd0-bbe5-7b6a19205fdf": PROFILES.moderate,     // Brianne Gregory (City Council)
  "ee683fa3-f186-4771-9197-e5297118756e": PROFILES.conservative, // Trohn Enright-Randolph (City Council)
  "ed914571-dd22-4ab5-b764-92a1a465e980": PROFILES.mixed,        // Erika Oliphant (City Council)
  "b3799cb0-d361-4405-b82e-59031c5ffe73": PROFILES.progressive,  // Brandon Shurr (City Council)
  "4d20abb8-b05a-444c-883d-03eb4b43d166": PROFILES.moderate,     // Nicole Bolden (City Council)
  "18d5fa5e-d52d-48f9-aa53-2575129e1fe4": PROFILES.conservative, // Julie Thomas (Monroe County Commissioner)
  "c8a73d2a-205d-482e-bc78-8c81d965a28c": PROFILES.mixed,        // Barbara E McKinney (Monroe County Commissioner)
  "cb98d180-2a02-4c6f-b25e-06a17635f68a": PROFILES.progressive,  // Catherine Smith (Monroe County Commissioner)
  "44f92086-c01e-4a39-bf54-84f3b8083f32": PROFILES.moderate,     // Don Lamb (Monroe County Council)
  "db4e6911-9dbb-430e-831c-08be094fd637": PROFILES.conservative, // Trent Deckard (Indiana Senate)
  "29ab827f-6e34-4579-b3b4-e122c96d308b": PROFILES.mixed,        // Bob Deig (Indiana Senate)
  "fa4cbcff-06c5-4f31-a034-0c9b4b268868": PROFILES.progressive,  // Amy Swain
  "fed384b0-7af7-4f8d-b8f4-06d40282abb5": PROFILES.moderate,     // Jeffrey Hall
  "d3977ab4-22b8-4ac3-a14f-565bc2969f1a": PROFILES.conservative, // Judith A Sharp
  "d60ef0ea-b764-47eb-989a-3d5f1c461d10": PROFILES.mixed,        // Darcie L Fawcett
  "c7dee89b-1ee2-4858-a11e-b3775a4b4bfd": PROFILES.progressive,  // Efrat Feferman
  "b8d4f904-23c8-4baa-8426-fbc44aafdf88": PROFILES.moderate,     // Ruben D Marte
  "ad57a33b-7714-4148-a70a-b1fa4701bc30": PROFILES.conservative, // L. M Bailey
  "b3830ff1-3b9b-463a-bb7d-311bf1bf0168": PROFILES.mixed,        // Liz Feitl
  "15c278e1-20d8-4a2c-9575-2e130a0ec37f": PROFILES.progressive,  // Elizabeth Sensenstein
  "06464416-e8f4-4df1-af4c-2d785863721e": PROFILES.moderate,     // Dorothy Granger
  "0be7d42f-9363-40ad-bbc5-733c862f4395": PROFILES.conservative, // David G Henry
  "048cb4ba-9b07-42e6-b45d-f4dffad2a088": PROFILES.mixed,        // Kara E Krothe
  "36af947b-b548-4964-8003-889cffbf7dad": PROFILES.progressive,  // Christine Talley Haseman
  "3e95fc5c-6927-492c-9f1c-6d65b5b7b9cb": PROFILES.moderate,     // Mary Ellen Diekhoff
  "52a1db12-bef7-4e68-9daf-bdd17c82f6c0": PROFILES.conservative, // Holly M Harvey
  "5aa536e1-faaa-485c-b6d8-0e4d99d16361": PROFILES.mixed,        // Shelli Yoder
  "60843da4-951d-4137-bd1f-61b3655c0f10": PROFILES.progressive,  // Nicole Browne
  "741be6f7-eac1-4458-bef1-6576ba5acd98": PROFILES.moderate,     // Valeri Haughton
  "8ef73cee-511d-4108-8708-7cfcb4a2a4cd": PROFILES.conservative, // Jody Madeira
  "999a9d38-9894-45f0-80c7-228880089699": PROFILES.mixed,        // Geoffrey J. Bradley
  "db6db0c9-2eb5-474f-bb91-ca6ac9750dbf": PROFILES.progressive,  // Elizabeth L Jones
  "1db5eafb-b7c5-4716-b3a8-ad0ff8a7dc63": PROFILES.moderate,     // Catherine B. Stafford
  "30753c4d-e145-417f-8448-c2192e010a14": PROFILES.conservative, // Jennifer Crossley
  "4e058a9c-a4ab-403c-88d3-32918e860cc8": PROFILES.mixed,        // Emily A Salzmann
  "68568faf-1e0f-4ca2-89d9-bda625665712": PROFILES.progressive,  // Erin Houchin
  "72dd5219-490f-48bb-986e-183a6098d602": PROFILES.moderate,     // Matt Pierce

  // === STATE: Indiana officials ===
  "a73e7a2a-48b0-4636-8fa4-5324ede65833": PROFILES.conservative, // Mike Braun (Governor)
  "ac732037-2172-4899-95c9-ca42ea69c4a0": PROFILES.mixed,        // Todd Rokita (AG)
  "929346a2-8037-4b14-af33-4820eb365323": PROFILES.conservative, // Micah Beckwith (Lt Gov)
  "4bc8f962-a24a-4c40-aa5a-59d86db21336": PROFILES.mixed,        // Katie Jenner
  "35269bd5-4f5b-42dc-8226-3a04c2f55b80": PROFILES.conservative, // Diego Morales
  "8aa9d111-e5f5-4b1f-8ce3-a1c9eef70bf8": PROFILES.mixed,        // Mike Speedy
  "c9ec6da3-a13e-4dd7-911c-47d93d7f84bc": PROFILES.conservative, // Andy Zay
  "6f34f598-47d0-4b38-ab24-c454021521eb": PROFILES.mixed,        // Robert R Altice
  "2d25418d-2bc7-4e38-a722-b55f231c0f52": PROFILES.conservative, // David Ziegner
  "3f39cb5b-31fe-4252-8614-54d5948c9630": PROFILES.mixed,        // Anthony Swinger
  "9ffd199b-c5d9-4317-b80b-8290d51625aa": PROFILES.conservative, // Derek R Molter
  "3d1e3c05-096a-4bb0-b105-420a5f61548e": PROFILES.mixed,        // Christopher M Goff
  "ae8e525b-63e6-4505-bfde-2ebd88cecdc2": PROFILES.progressive,  // Loretta H Rush (Chief Justice)
  "a2173449-f227-4b20-a268-029cc9a3390f": PROFILES.moderate,     // Melissa S May
  "c7670a65-abc2-43af-8375-eeb212a25e71": PROFILES.conservative, // Margret G Robb
  "ccbd986f-6986-4d0e-9739-b02578a62672": PROFILES.moderate,     // Holly Williams Lambert
  "638e8faa-c671-447e-9fec-8720cbaf42ec": PROFILES.conservative, // Cale J Bradford
  "b1e0cfeb-326d-4985-95a1-52e0f458f6bd": PROFILES.mixed,        // Elise M. Nieshalla
  "1456b743-4e91-44d0-a3a5-66c0e79fa840": PROFILES.conservative, // Mark S Massa
  "c2741c7b-d4a5-4b66-a406-2fa2a4d0bdcd": PROFILES.mixed,        // David Veleta
  "d219bb5a-6bce-472f-91ed-04613bf86b0d": PROFILES.moderate,     // Geoffrey Slaughter
  "9a203de1-f2dc-46d6-86d1-ee40562a79c6": PROFILES.conservative, // Tulsi Gabbard (IN related)
  "0ddd632f-0ee9-4a56-b0a3-c1c2e7fa4dfd": PROFILES.moderate,     // Patricia A Riley
  "5ee3e5fb-9409-4041-8ac4-fdec3a674c24": PROFILES.conservative, // Peter R Foley
  "918a0693-cd3b-4449-b82e-e59dc4be26f4": PROFILES.mixed,        // James Kirsch
  "085e88aa-edfd-435e-90bb-d84c5912efde": PROFILES.conservative, // Daniel Elliott
  "2a054186-d76d-4e50-81f8-2f4e9dd9e871": PROFILES.mixed,        // Terry Crone
  "168caef1-a84a-4d02-aae7-045f7e505959": PROFILES.moderate,     // Elaine B Brown
  "18998c5d-c518-4644-8483-60983f916c4c": PROFILES.mixed,        // Pierre Yared
  "01fad440-8f74-477f-8eea-f2f392f53b0f": PROFILES.conservative, // Rudolph R Pyle

  // === FEDERAL: Indiana delegation + federal officials ===
  "023c6644-356e-4afb-925b-e20f9c32209b": PROFILES.conservative, // Jim Banks (U.S. Senate)
  "102b239c-0a3d-44b9-ae32-88d8179197e2": PROFILES.conservative, // Todd Young (U.S. Senate)
  "03fc5a13-9a66-49b3-a6cc-97bc8696fb18": PROFILES.conservative, // Chris Wright (Cabinet)
  "104102e6-08c1-494f-a9d4-6ef129595bf2": PROFILES.conservative, // Donald J. Trump (President)
  "a809747d-3e53-4e9e-b3a1-6641dac2455c": PROFILES.conservative, // James David Vance (VP)
  "9f756a19-c14a-4546-911d-8d86a4eef430": PROFILES.conservative, // Kristi Noem
  "98b35591-cae2-4428-8a5c-c527e8f9c2d1": PROFILES.mixed,        // Susan Wiles
  "2e19b56e-a4cd-4fb1-8e21-e92f526e1844": PROFILES.conservative, // Russell Vought
  "76e38c6e-12b2-4286-9bfe-22ea0b05c947": PROFILES.conservative, // Doug Burgum
  "90d2bd3f-818e-4c40-8987-854142ff31c8": PROFILES.conservative, // Pete Hegseth
  "b7dde767-495b-4d62-8e04-9ff27c193ee5": PROFILES.mixed,        // Michael Waltz
  "7c8e4442-e13e-485a-8993-b05ca110410d": PROFILES.conservative, // Marco Rubio
  "a3ffbc1e-cdd5-41d3-bd66-402ef122af63": PROFILES.mixed,        // Scott Bessent
  "9e485eee-c129-48b9-a256-22946f5a4cdd": PROFILES.conservative, // Pamela Bondi
  "5c5760c3-7d1c-4a4a-9cf0-918a88d7d711": PROFILES.conservative, // Howard W. Lutnick
  "95cb342b-9b34-4a67-9297-2baa447da356": PROFILES.mixed,        // Lori Chavez-DeRemer
  "8951d851-ed95-45dc-97f8-9928857bcecb": PROFILES.mixed,        // Robert F. Kennedy
  "cb3c91b6-df47-479a-8dc7-1207106dbbcc": PROFILES.conservative, // Lee Zeldin
  "00d1924e-50d9-485c-8e35-f3856553fdf9": PROFILES.conservative, // Doug Collins
  "b78e80fe-f111-403d-97ac-4948f63ac845": PROFILES.conservative, // Brooke Rollins
  "ba3d9cfd-9c80-45cc-9c25-b66471f0e3b7": PROFILES.mixed,        // Kelly Loeffler
  "becbb10c-fc9a-4125-9650-caec79be0d46": PROFILES.conservative, // Sean Duffy
  "32768af6-7d8c-4727-aec2-9110f38d375e": PROFILES.conservative, // Scott Turner
  "1de0327f-2f4a-4e79-99be-e71344592204": PROFILES.conservative, // Jamieson Greer
  "1fef16b9-5ae7-4ae8-9c3d-5cb3b5dcd813": PROFILES.moderate,     // Alan Morrison
  "2164130d-e11f-41c4-add5-4ed1553bc77e": PROFILES.conservative, // Linda McMahon
  "8e07b2bb-d3e7-42f1-94a9-2df892ba11ac": PROFILES.mixed,        // Michael Kratsios
  // === FEDERAL: Supreme Court ===
  "5451de63-168f-4d86-b4b9-4e334fc39c9d": PROFILES.conservative, // John G. Roberts Jr.
  "271cb982-37fd-4894-9662-440c13ae3b70": PROFILES.conservative, // Clarence Thomas
  "18a77e35-5a28-49aa-b2aa-c6cd16ef2683": PROFILES.progressive,  // Sonia Sotomayor
  "8d2f904f-9acf-46c5-9740-02e840b6b654": PROFILES.progressive,  // Elena Kagan
  "89d3e869-1dce-4209-b2d4-761c8a364a59": PROFILES.conservative, // Brett M. Kavanaugh
  "91bf3009-5727-4209-b6a1-92e838ab9d72": PROFILES.conservative, // Amy Coney Barrett
  "caea1052-fcad-431b-82c0-9d563f9f5361": PROFILES.conservative, // Neil M. Gorsuch
  "c7c66fbb-0423-4c6f-86d2-e6e6618ed8fe": PROFILES.conservative, // Samuel A. Alito Jr.
  "cf9eedf6-6b3a-4392-a208-96c13dee5c31": PROFILES.progressive,  // Ketanji Brown Jackson

};

export default MOCK_STANCES;
