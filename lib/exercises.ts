export type ExerciseDef = {
  id: string;
  name: string;
  group?: string; // "Chest (Machine)" => Category + Subcategory
  videoId?: string; // YouTube video ID, pl. "dQw4w9WgXcQ"
};

/**
 * VIDEÓK HOZZÁADÁSA:
 * 1. Keresd meg a YouTube videót
 * 2. Másold ki az ID-t: youtube.com/watch?v=ID_ITT
 * 3. Add hozzá:
 *    egyszerű:  bench_press_bb: { videoId: "SCVCLChPQFY" }
 *    időzített: bench_press_bb: { videoId: "SCVCLChPQFY", start: 45, end: 180 }
 *    start/end = másodpercben (pl. start:45 = 0:45-től kezd)
 */
/**
 * VIDEÓ KLIP — egy részlet egy YouTube videóból
 *   videoId : YouTube video ID (youtube.com/watch?v=ID)
 *   start   : kezdés másodpercben  (pl. 45  = 0:45-től)
 *   end     : vég másodpercben     (pl. 180 = 3:00-ig)
 *   label   : rövid felirat a klip gombján (pl. "Technika", "Hibák")
 *
 * HOZZÁADÁS:
 *   1 klip:   bench_press_bb: [{ videoId: "ID", start: 30, end: 90, label: "Technika" }]
 *   3 klip:   squat_bb: [
 *               { videoId: "ID", start: 0,   end: 60,  label: "Beállás" },
 *               { videoId: "ID", start: 90,  end: 180, label: "Leereszkedés" },
 *               { videoId: "ID", start: 240, end: 360, label: "Hibák" },
 *             ]
 */
export type ExerciseClip = {
  videoId: string;
  start?: number;
  end?: number;
  label: string;  // kötelező — megjelenik a klip gombján
};

// Típus-alias: mindig tömb, így egységes a kezelés
export type ExerciseVideo = ExerciseClip[];

export const EXERCISE_VIDEOS: Record<string, ExerciseVideo> = {
  // ── CHEST ──────────────────────────────────────────────────
  bench_press_bb: [
    { videoId: "SCVCLChPQFY", start: 30,  end: 120, label: "Fogás & beállás" },
    { videoId: "SCVCLChPQFY", start: 180, end: 300, label: "Mozgás ív" },
    { videoId: "SCVCLChPQFY", start: 380, end: 480, label: "Gyakori hibák" },
  ],
  incline_bench_bb: [
    { videoId: "DbFgADa2PL8", label: "Teljes technika" },
  ],

  // ── BACK ───────────────────────────────────────────────────
  deadlift_bb: [
    { videoId: "op9kVnSso6Q", start: 60,  end: 180, label: "Kiindulás" },
    { videoId: "op9kVnSso6Q", start: 200, end: 320, label: "Húzás fázis" },
    { videoId: "op9kVnSso6Q", start: 400, end: 500, label: "Visszaengedés" },
  ],
  row_bb: [
    { videoId: "T3N-TO4reLQ", start: 20, end: 150, label: "Technika" },
  ],
  pullup: [
    { videoId: "eGo4IYlbE5g", label: "Teljes technika" },
  ],

  // ── LEGS ───────────────────────────────────────────────────
  squat_bb: [
    { videoId: "ultWZbUMPL8", start: 45,  end: 140, label: "Beállás & fogás" },
    { videoId: "ultWZbUMPL8", start: 150, end: 260, label: "Leereszkedés" },
    { videoId: "ultWZbUMPL8", start: 270, end: 360, label: "Emelkedés" },
  ],

  // ── SHOULDERS ──────────────────────────────────────────────
  overhead_press_bb: [
    { videoId: "2yjwXTZTDaE", start: 30, end: 180, label: "Technika" },
  ],
};

export const EXERCISES: ExerciseDef[] = [
  // ---------------- CHEST ----------------
  { id: "bench_press_bb", name: "Bench Press (Barbell)", group: "Chest (BB)" },
  { id: "incline_bench_bb", name: "Incline Bench Press (Barbell)", group: "Chest (BB)" },
  { id: "decline_bench_bb", name: "Decline Bench Press (Barbell)", group: "Chest (BB)" },
  { id: "bench_press_db", name: "Bench Press (Dumbbell)", group: "Chest (DB)" },
  { id: "incline_press_db", name: "Incline Press (Dumbbell)", group: "Chest (DB)" },
  { id: "decline_press_db", name: "Decline Press (Dumbbell)", group: "Chest (DB)" },
  { id: "fly_db", name: "Dumbbell Fly", group: "Chest (DB)" },
  { id: "fly_incline_db", name: "Incline DB Fly", group: "Chest (DB)" },
  { id: "pushup", name: "Push-up", group: "Chest (Bodyweight)" },
  { id: "pushup_weighted", name: "Weighted Push-up", group: "Chest (Bodyweight)" },
  { id: "dips_chest", name: "Dips (Chest)", group: "Chest (Bodyweight)" },

  // Chest machines / plate
  { id: "machine_chest_press", name: "Machine Chest Press", group: "Chest (Machine)" },
  { id: "machine_incline_press", name: "Machine Incline Press", group: "Chest (Machine)" },
  { id: "machine_decline_press", name: "Machine Decline Press", group: "Chest (Machine)" },
  { id: "plate_chest_press", name: "Plate-Loaded Chest Press", group: "Chest (Plate)" },
  { id: "plate_incline_press", name: "Plate-Loaded Incline Press", group: "Chest (Plate)" },
  { id: "pec_deck", name: "Pec Deck", group: "Chest (Machine)" },
  { id: "machine_fly", name: "Chest Fly Machine", group: "Chest (Machine)" },

  // Chest cable
  { id: "cable_fly_high_low", name: "Cable Fly (High → Low)", group: "Chest (Cable)" },
  { id: "cable_fly_low_high", name: "Cable Fly (Low → High)", group: "Chest (Cable)" },
  { id: "cable_fly_mid", name: "Cable Fly (Mid)", group: "Chest (Cable)" },
  { id: "cable_press", name: "Cable Chest Press", group: "Chest (Cable)" },
  { id: "cable_single_arm_press", name: "Single-Arm Cable Press", group: "Chest (Cable)" },
  { id: "cable_crossover", name: "Cable Crossover", group: "Chest (Cable)" },

  // Chest smith
  { id: "smith_bench", name: "Smith Machine Bench Press", group: "Chest (Smith)" },
  { id: "smith_incline", name: "Smith Machine Incline Press", group: "Chest (Smith)" },
  { id: "smith_decline", name: "Smith Machine Decline Press", group: "Chest (Smith)" },

  // ---------------- BACK ----------------
  { id: "deadlift_bb", name: "Deadlift", group: "Back (BB)" },
  { id: "rack_pull", name: "Rack Pull", group: "Back (BB)" },
  { id: "row_bb", name: "Barbell Row", group: "Back (BB)" },
  { id: "row_pendlay", name: "Pendlay Row", group: "Back (BB)" },
  { id: "row_db_one_arm", name: "One-Arm DB Row", group: "Back (DB)" },
  { id: "row_db_chest_supported", name: "Chest-Supported DB Row", group: "Back (DB)" },
  { id: "pullup", name: "Pull-up", group: "Back (Bodyweight)" },
  { id: "chinup", name: "Chin-up", group: "Back (Bodyweight)" },
  { id: "inverted_row", name: "Inverted Row", group: "Back (Bodyweight)" },

  // Back machines / plate
  { id: "lat_pulldown_wide", name: "Lat Pulldown (Wide)", group: "Back (Machine)" },
  { id: "lat_pulldown_close", name: "Lat Pulldown (Close)", group: "Back (Machine)" },
  { id: "lat_pulldown_neutral", name: "Lat Pulldown (Neutral)", group: "Back (Machine)" },
  { id: "lat_pulldown_underhand", name: "Lat Pulldown (Underhand)", group: "Back (Machine)" },
  { id: "pulldown_vbar", name: "Lat Pulldown (V-Bar)", group: "Back (Machine)" },
  { id: "assisted_pullup_machine", name: "Assisted Pull-up Machine", group: "Back (Machine)" },
  { id: "row_machine_seated", name: "Seated Row Machine", group: "Back (Machine)" },
  { id: "row_machine_chest_supported", name: "Chest-Supported Row Machine", group: "Back (Machine)" },
  { id: "plate_row_hammer", name: "Plate-Loaded Row (Hammer)", group: "Back (Plate)" },
  { id: "tbar_row_machine", name: "T-Bar Row (Machine)", group: "Back (Plate)" },
  { id: "pullover_machine", name: "Pullover Machine", group: "Back (Machine)" },
  { id: "reverse_pec_deck", name: "Reverse Pec Deck", group: "Back (Machine)" },

  // Back cable
  { id: "cable_row_seated", name: "Seated Cable Row", group: "Back (Cable)" },
  { id: "cable_row_wide", name: "Cable Row (Wide)", group: "Back (Cable)" },
  { id: "cable_row_close", name: "Cable Row (Close)", group: "Back (Cable)" },
  { id: "cable_row_single_arm", name: "Single-Arm Cable Row", group: "Back (Cable)" },
  { id: "straight_arm_pulldown", name: "Straight-Arm Cable Pulldown", group: "Back (Cable)" },
  { id: "face_pull", name: "Face Pull", group: "Back (Cable)" },
  { id: "cable_pullover", name: "Cable Pullover", group: "Back (Cable)" },

  // ---------------- SHOULDERS ----------------
  { id: "ohp_bb", name: "Overhead Press (Barbell)", group: "Shoulders (BB)" },
  { id: "press_db", name: "Shoulder Press (Dumbbell)", group: "Shoulders (DB)" },
  { id: "arnold_press", name: "Arnold Press", group: "Shoulders (DB)" },
  { id: "lateral_raise_db", name: "Lateral Raise (DB)", group: "Shoulders (DB)" },
  { id: "front_raise_db", name: "Front Raise (DB)", group: "Shoulders (DB)" },
  { id: "rear_delt_fly_db", name: "Rear Delt Fly (DB)", group: "Shoulders (DB)" },
  { id: "upright_row_bb", name: "Upright Row (Barbell)", group: "Shoulders (BB)" },

  { id: "machine_shoulder_press", name: "Machine Shoulder Press", group: "Shoulders (Machine)" },
  { id: "plate_shoulder_press", name: "Plate-Loaded Shoulder Press", group: "Shoulders (Plate)" },
  { id: "machine_lateral_raise", name: "Machine Lateral Raise", group: "Shoulders (Machine)" },
  { id: "cable_lateral_raise", name: "Cable Lateral Raise", group: "Shoulders (Cable)" },
  { id: "cable_front_raise", name: "Cable Front Raise", group: "Shoulders (Cable)" },
  { id: "cable_rear_delt_fly", name: "Cable Rear Delt Fly", group: "Shoulders (Cable)" },
  { id: "smith_ohp", name: "Smith Machine Overhead Press", group: "Shoulders (Smith)" },

  // ---------------- LEGS ----------------
  // Quads / machines
  { id: "leg_press", name: "Leg Press", group: "Legs (Machine)" },
  { id: "leg_press_hack", name: "Hack Squat", group: "Legs (Machine)" },
  { id: "pendulum_squat", name: "Pendulum Squat", group: "Legs (Machine)" },
  { id: "belt_squat", name: "Belt Squat", group: "Legs (Machine)" },
  { id: "leg_extension", name: "Leg Extension", group: "Legs (Machine)" },
  { id: "sissy_squat_machine", name: "Sissy Squat (Machine)", group: "Legs (Machine)" },
  { id: "smith_squat", name: "Smith Machine Squat", group: "Legs (Smith)" },

  // Quads / free
  { id: "back_squat_bb", name: "Back Squat", group: "Legs (BB)" },
  { id: "front_squat_bb", name: "Front Squat", group: "Legs (BB)" },
  { id: "goblet_squat_db", name: "Goblet Squat", group: "Legs (DB)" },
  { id: "bulgarian_split_squat", name: "Bulgarian Split Squat", group: "Legs (DB)" },
  { id: "walking_lunge", name: "Walking Lunge", group: "Legs (DB)" },
  { id: "step_up", name: "Step-Up", group: "Legs (DB)" },

  // Hams/Glutes machines
  { id: "lying_leg_curl", name: "Lying Leg Curl", group: "Legs (Machine)" },
  { id: "seated_leg_curl", name: "Seated Leg Curl", group: "Legs (Machine)" },
  { id: "standing_leg_curl", name: "Standing Leg Curl", group: "Legs (Machine)" },
  { id: "glute_ham_raise", name: "Glute-Ham Raise (GHR)", group: "Legs (Machine)" },
  { id: "back_extension", name: "Back Extension", group: "Legs (Machine)" },
  { id: "hip_abductor", name: "Hip Abductor Machine", group: "Legs (Machine)" },
  { id: "hip_adductor", name: "Hip Adductor Machine", group: "Legs (Machine)" },
  { id: "hip_thrust_machine", name: "Hip Thrust Machine", group: "Legs (Machine)" },
  { id: "glute_drive", name: "Glute Drive Machine", group: "Legs (Machine)" },
  { id: "kickback_machine", name: "Glute Kickback Machine", group: "Legs (Machine)" },

  // Hams/Glutes free + cable
  { id: "rdl_bb", name: "Romanian Deadlift", group: "Legs (BB)" },
  { id: "stiff_leg_deadlift", name: "Stiff-Leg Deadlift", group: "Legs (BB)" },
  { id: "good_morning", name: "Good Morning", group: "Legs (BB)" },
  { id: "hip_thrust_bb", name: "Hip Thrust (Barbell)", group: "Legs (BB)" },
  { id: "glute_bridge", name: "Glute Bridge", group: "Legs (BB)" },
  { id: "cable_pull_through", name: "Cable Pull-Through", group: "Legs (Cable)" },
  { id: "cable_kickback", name: "Cable Glute Kickback", group: "Legs (Cable)" },

  // Calves
  { id: "standing_calf_raise", name: "Standing Calf Raise", group: "Legs (Machine)" },
  { id: "seated_calf_raise", name: "Seated Calf Raise", group: "Legs (Machine)" },
  { id: "leg_press_calf_raise", name: "Leg Press Calf Raise", group: "Legs (Machine)" },
  { id: "smith_calf_raise", name: "Smith Calf Raise", group: "Legs (Smith)" },

  // ---------------- ARMS ----------------
  // Biceps
  { id: "curl_db", name: "Dumbbell Curl", group: "Arms (DB)" },
  { id: "curl_hammer_db", name: "Hammer Curl", group: "Arms (DB)" },
  { id: "curl_incline_db", name: "Incline DB Curl", group: "Arms (DB)" },
  { id: "curl_bb", name: "Barbell Curl", group: "Arms (BB)" },
  { id: "curl_ez", name: "EZ-Bar Curl", group: "Arms (BB)" },
  { id: "preacher_curl_machine", name: "Preacher Curl Machine", group: "Arms (Machine)" },
  { id: "biceps_curl_machine", name: "Biceps Curl Machine", group: "Arms (Machine)" },
  { id: "cable_curl", name: "Cable Curl", group: "Arms (Cable)" },
  { id: "cable_rope_hammer_curl", name: "Cable Rope Hammer Curl", group: "Arms (Cable)" },
  { id: "cable_preacher_curl", name: "Cable Preacher Curl", group: "Arms (Cable)" },

  // Triceps
  { id: "close_grip_bench", name: "Close-Grip Bench Press", group: "Arms (BB)" },
  { id: "skull_crushers_ez", name: "Skull Crushers (EZ-Bar)", group: "Arms (BB)" },
  { id: "overhead_triceps_db", name: "Overhead Triceps Extension (DB)", group: "Arms (DB)" },
  { id: "dip_machine", name: "Dip Machine (Assisted/Weighted)", group: "Arms (Machine)" },
  { id: "triceps_extension_machine", name: "Triceps Extension Machine", group: "Arms (Machine)" },
  { id: "pushdown_rope", name: "Triceps Pushdown (Rope)", group: "Arms (Cable)" },
  { id: "pushdown_bar", name: "Triceps Pushdown (Bar)", group: "Arms (Cable)" },
  { id: "overhead_triceps_cable", name: "Overhead Cable Extension", group: "Arms (Cable)" },
  { id: "single_arm_pushdown", name: "Single-Arm Cable Pushdown", group: "Arms (Cable)" },

  // ---------------- CORE ----------------
  { id: "plank", name: "Plank", group: "Core (Bodyweight)" },
  { id: "side_plank", name: "Side Plank", group: "Core (Bodyweight)" },
  { id: "hanging_knee_raise", name: "Hanging Knee Raise", group: "Core (Bodyweight)" },
  { id: "hanging_leg_raise", name: "Hanging Leg Raise", group: "Core (Bodyweight)" },
  { id: "ab_wheel", name: "Ab Wheel Rollout", group: "Core (Other)" },
  { id: "cable_crunch", name: "Cable Crunch", group: "Core (Cable)" },
  { id: "machine_crunch", name: "Ab Crunch Machine", group: "Core (Machine)" },
  { id: "roman_chair_leg_raise", name: "Roman Chair Leg Raise", group: "Core (Machine)" },

  // ---------------- CARDIO ----------------
  { id: "treadmill", name: "Treadmill", group: "Cardio (Machine)" },
  { id: "bike", name: "Stationary Bike", group: "Cardio (Machine)" },
  { id: "rowing_machine", name: "Rowing Machine", group: "Cardio (Machine)" },
  { id: "stair_climber", name: "Stair Climber", group: "Cardio (Machine)" },
  { id: "elliptical", name: "Elliptical", group: "Cardio (Machine)" },

  // ---------------- TRAPS / FOREARMS ----------------
  { id: "shrug_db", name: "Dumbbell Shrug", group: "Traps (DB)" },
  { id: "shrug_bb", name: "Barbell Shrug", group: "Traps (BB)" },
  { id: "shrug_machine", name: "Shrug Machine", group: "Traps (Machine)" },

  { id: "wrist_curl", name: "Wrist Curl", group: "Forearms (DB)" },
  { id: "reverse_wrist_curl", name: "Reverse Wrist Curl", group: "Forearms (DB)" },
  { id: "farmer_walk", name: "Farmer Walk", group: "Forearms (DB)" },
];
