// 🌿 FLORA DIRECTORY (flora_db.js) 🌿
// The scientific baseline for the Agronomy Engine

const floraDB = {
    // ==========================================
    // 🌿 CATEGORY 1: THE INDOOR JUNGLE
    // ==========================================
    "rhaphidophora_tetrasperma": {
        name: "Mini Monstera",
        type: "Tropical Epiphyte",
        temp_floor: 50, // Lethal below this
        temp_ceiling: 95, // Stress above this
        optimal_temp: [68, 82],
        min_humidity: 60,
        water_frequency: "moderate",
        wind_tolerance: 15, // Max mph before damage
        toxic_pets: true,
        lunar_affinity: "waxing", // Upward sap flow
        stamp_img: "mini_monstera_stamp.png"
    },
    "epipremnum_aureum": {
        name: "Golden Pothos",
        type: "Tropical Epiphyte",
        temp_floor: 45,
        temp_ceiling: 100,
        optimal_temp: [65, 85],
        min_humidity: 40,
        water_frequency: "low",
        wind_tolerance: 10,
        toxic_pets: true,
        lunar_affinity: "new", // Stasis, good for propagation
        stamp_img: "pothos_stamp.png"
    },
    "maranta_leuconeura": {
        name: "Prayer Plant",
        type: "Herbaceous Perennial",
        temp_floor: 55,
        temp_ceiling: 90,
        optimal_temp: [65, 80],
        min_humidity: 60,
        water_frequency: "high",
        wind_tolerance: 5, // Very delicate leaves
        toxic_pets: false,
        lunar_affinity: "waxing",
        stamp_img: "prayer_plant_stamp.png"
    },
    "chlorophytum_comosum": {
        name: "Spider Plant",
        type: "Herbaceous Perennial",
        temp_floor: 35,
        temp_ceiling: 95,
        optimal_temp: [55, 80],
        min_humidity: 30,
        water_frequency: "moderate",
        wind_tolerance: 20,
        toxic_pets: false,
        lunar_affinity: "full", // High hydrostatic pressure for spiderettes
        stamp_img: "spider_plant_stamp.png"
    },
    "nepeta_cataria": {
        name: "Catnip",
        type: "Herbaceous Perennial",
        temp_floor: -20, // Roots survive hard freezes
        temp_ceiling: 90,
        optimal_temp: [55, 75],
        min_humidity: 40,
        water_frequency: "moderate",
        wind_tolerance: 25,
        toxic_pets: false,
        lunar_affinity: "waning",
        stamp_img: "catnip_stamp.png"
    },

    // ==========================================
    // 🥕 CATEGORY 2: THE OUTDOOR EDIBLES
    // ==========================================
    "raphanus_sativus": {
        name: "French Breakfast Radish",
        type: "Cool-Weather Taproot",
        temp_floor: 20, // Frost-hardy
        temp_ceiling: 80, // Bolts in heat
        optimal_temp: [45, 68],
        min_humidity: 50,
        water_frequency: "high",
        wind_tolerance: 30, // Low profile, highly resistant
        toxic_pets: false,
        lunar_affinity: "waning", // Downward energy for root growth
        stamp_img: "radish_stamp.png"
    },
    "solanum_lycopersicum": {
        name: "Cherry Tomato",
        type: "Warm Annual",
        temp_floor: 40,
        temp_ceiling: 95,
        optimal_temp: [70, 88],
        min_humidity: 40,
        water_frequency: "high",
        wind_tolerance: 15,
        toxic_pets: true, // Foliage is toxic
        lunar_affinity: "waxing",
        stamp_img: "tomato_stamp.png"
    },
    "ocimum_basilicum": {
        name: "Sweet Basil",
        type: "Tender Annual",
        temp_floor: 45, // Zero frost tolerance
        temp_ceiling: 100,
        optimal_temp: [75, 92],
        min_humidity: 40,
        water_frequency: "high",
        wind_tolerance: 10,
        toxic_pets: false,
        lunar_affinity: "waxing",
        stamp_img: "basil_stamp.png"
    },
    "capsicum_annuum": {
        name: "Jalapeño Pepper",
        type: "Warm Perennial/Annual",
        temp_floor: 45,
        temp_ceiling: 105, // Extreme heat tolerance
        optimal_temp: [75, 95],
        min_humidity: 30,
        water_frequency: "moderate",
        wind_tolerance: 20,
        toxic_pets: true,
        lunar_affinity: "waxing",
        stamp_img: "jalapeno_stamp.png"
    },
    "lactuca_sativa": {
        name: "Butterhead Lettuce",
        type: "Cool Leafy Green",
        temp_floor: 25,
        temp_ceiling: 75, // Wilts and turns bitter
        optimal_temp: [45, 65],
        min_humidity: 50,
        water_frequency: "high",
        wind_tolerance: 20,
        toxic_pets: false,
        lunar_affinity: "waxing",
        stamp_img: "lettuce_stamp.png"
    },

    // ==========================================
    // 🌵 CATEGORY 3: THE DESERT HARDY
    // ==========================================
    "aloe_barbadensis": {
        name: "True Aloe Vera",
        type: "Succulent",
        temp_floor: 32, // Cells burst if frozen
        temp_ceiling: 115,
        optimal_temp: [60, 85],
        min_humidity: 10,
        water_frequency: "very_low",
        wind_tolerance: 25,
        toxic_pets: true,
        lunar_affinity: "new",
        stamp_img: "aloe_stamp.png"
    },
    "echeveria_ghost": {
        name: "Ghost Echeveria",
        type: "Rosette Succulent",
        temp_floor: 30,
        temp_ceiling: 100,
        optimal_temp: [55, 80],
        min_humidity: 10,
        water_frequency: "very_low",
        wind_tolerance: 40, // Highly aerodynamic ground-hugger
        toxic_pets: false,
        lunar_affinity: "waning",
        stamp_img: "echeveria_stamp.png"
    },
    "sansevieria_trifasciata": {
        name: "Snake Plant",
        type: "Rhizomatous Succulent",
        temp_floor: 50,
        temp_ceiling: 110,
        optimal_temp: [65, 90],
        min_humidity: 20,
        water_frequency: "very_low",
        wind_tolerance: 20,
        toxic_pets: true,
        lunar_affinity: "new",
        stamp_img: "snake_plant_stamp.png"
    },
    "schlumbergera": {
        name: "Christmas Cactus",
        type: "Epiphytic Cactus",
        temp_floor: 35,
        temp_ceiling: 95,
        optimal_temp: [60, 75],
        min_humidity: 50, // Prefers higher moisture than desert cacti
        water_frequency: "moderate",
        wind_tolerance: 10, // Brittle segments snap easily
        toxic_pets: false,
        lunar_affinity: "waning",
        stamp_img: "christmas_cactus_stamp.png"
    },
    "senecio_rowleyanus": {
        name: "String of Pearls",
        type: "Trailing Succulent",
        temp_floor: 40,
        temp_ceiling: 90,
        optimal_temp: [60, 80],
        min_humidity: 20,
        water_frequency: "low",
        wind_tolerance: 5, // Strings whip and break easily
        toxic_pets: true,
        lunar_affinity: "waxing",
        stamp_img: "string_pearls_stamp.png"
    }
};

// Make it accessible to the main HTML file
window.floraDB = floraDB;
