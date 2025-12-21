export type ExerciseDef = {
  id: string;
  name: string;
  group?: string; // címke, később szűrhető
};

export const EXERCISES: ExerciseDef[] = [
  // ---------------- Chest (free weights) ----------------
  { id: "bench_press", name: "Bench Press (Barbell)", group: "Chest" },
  { id: "incline_bench_press", name: "Incline Bench Press (Barbell)", group: "Chest" },
  { id: "decline_bench_press", name: "Decline Bench Press (Barbell)", group: "Chest" },
  { id: "db_bench_press", name: "Dumbbell Bench Press", group: "Chest" },
  { id: "db_incline_press", name: "Incline Dumbbell Press", group: "Chest" },
  { id: "db_decline_press", name: "Decline Dumbbell Press", group: "Chest" },
  { id: "db_fly", name: "Dumbbell Fly", group: "Chest" },
  { id: "incline_db_fly", name: "Incline Dumbbell Fly", group: "Chest" },
  { id: "pushup", name: "Push-up", group: "Chest" },
  { id: "weighted_pushup", name: "Weighted Push-up", group: "Chest" },
  { id: "dips_chest", name: "Dips (Chest focus)", group: "Chest" },

  // ---------------- Chest (machines/cables) ----------------
  { id: "machine_chest_press", name: "Machine Chest Press", group: "Chest (Machine)" },
  { id: "machine_incline_press", name: "Machine Incline Press", group: "Chest (Machine)" },
  { id: "smith_bench_press", name: "Smith Machine Bench Press", group: "Chest (Machine)" },
  { id: "smith_incline_press", name: "Smith Machine Incline Press", group: "Chest (Machine)" },
  { id: "pec_deck", name: "Pec Deck (Machine Fly)", group: "Chest (Machine)" },
  { id: "cable_fly_high_to_low", name: "Cable Fly (High to Low)", group: "Chest (Cable)" },
  { id: "cable_fly_low_to_high", name: "Cable Fly (Low to High)", group: "Chest (Cable)" },
  { id: "cable_fly_mid", name: "Cable Fly (Mid)", group: "Chest (Cable)" },
  { id: "cable_press", name: "Cable Chest Press", group: "Chest (Cable)" },

  // ---------------- Back (free weights) ----------------
  { id: "deadlift", name: "Deadlift", group: "Back" },
  { id: "rack_pull", name: "Rack Pull", group: "Back" },
  { id: "barbell_row", name: "Barbell Row", group: "Back" },
  { id: "pendlay_row", name: "Pendlay Row", group: "Back" },
  { id: "db_row", name: "One-Arm Dumbbell Row", group: "Back" },
  { id: "chest_supported_db_row", name: "Chest-Supported DB Row", group: "Back" },
  { id: "tbar_row", name: "T-Bar Row", group: "Back" },
  { id: "pullup", name: "Pull-up", group: "Back" },
  { id: "chinup", name: "Chin-up", group: "Back" },
  { id: "inverted_row", name: "Inverted Row", group: "Back" },

  // ---------------- Back (machines/cables) ----------------
  { id: "lat_pulldown_wide", name: "Lat Pulldown (Wide)", group: "Back (Machine)" },
  { id: "lat_pulldown_close", name: "Lat Pulldown (Close)", group: "Back (Machine)" },
  { id: "lat_pulldown_neutral", name: "Lat Pulldown (Neutral Grip)", group: "Back (Machine)" },
  { id: "lat_pulldown_underhand", name: "Lat Pulldown (Underhand)", group: "Back (Machine)" },
  { id: "machine_row_seated", name: "Seated Row Machine", group: "Back (Machine)" },
  { id: "machine_row_chest_supported", name: "Chest-Supported Row Machine", group: "Back (Machine)" },
  { id: "hammer_strength_row", name: "Plate-Loaded Row (Hammer)", group: "Back (Machine)" },
  { id: "cable_row_seated", name: "Seated Cable Row", group: "Back (Cable)" },
  { id: "cable_row_wide", name: "Cable Row (Wide)", group: "Back (Cable)" },
  { id: "cable_row_close", name: "Cable Row (Close)", group: "Back (Cable)" },
  { id: "single_arm_cable_row", name: "Single-Arm Cable Row", group: "Back (Cable)" },
  { id: "straight_arm_pulldown", name: "Straight-Arm Cable Pulldown", group: "Back (Cable)" },
  { id: "face_pull", name: "Face Pull", group: "Back (Cable)" },
  { id: "reverse_pec_deck", name: "Reverse Pec Deck", group: "Back (Machine)" },

  // ---------------- Shoulders (free weights) ----------------
  { id: "ohp", name: "Overhead Press (Barbell)", group: "Shoulders" },
  { id: "db_shoulder_press", name: "Dumbbell Shoulder Press", group: "Shoulders" },
  { id: "arnold_press", name: "Arnold Press", group: "Shoulders" },
  { id: "lateral_raise", name: "Lateral Raise (Dumbbell)", group: "Shoulders" },
  { id: "front_raise_db", name: "Front Raise (Dumbbell)", group: "Shoulders" },
  { id: "rear_delt_fly_db", name: "Rear Delt Fly (Dumbbell)", group: "Shoulders" },
  { id: "upright_row", name: "Upright Row (Barbell)", group: "Shoulders" },
  { id: "db_upright_row", name: "Upright Row (Dumbbell)", group: "Shoulders" },

  // ---------------- Shoulders (machines/cables) ----------------
  { id: "machine_shoulder_press", name: "Machine Shoulder Press", group: "Shoulders (Machine)" },
  { id: "smith_ohp", name: "Smith Machine Overhead Press", group: "Shoulders (Machine)" },
  { id: "cable_lateral_raise", name: "Cable Lateral Raise", group: "Shoulders (Cable)" },
  { id: "cable_front_raise", name: "Cable Front Raise", group: "Shoulders (Cable)" },
  { id: "cable_rear_delt_fly", name: "Cable Rear Delt Fly", group: "Shoulders (Cable)" },
  { id: "machine_lateral_raise", name: "Machine Lateral Raise", group: "Shoulders (Machine)" },

  // ---------------- Legs: Quads (free weights) ----------------
  { id: "squat", name: "Back Squat", group: "Legs (Quads)" },
  { id: "front_squat", name: "Front Squat", group: "Legs (Quads)" },
  { id: "goblet_squat", name: "Goblet Squat", group: "Legs (Quads)" },
  { id: "bulgarian_split_squat", name: "Bulgarian Split Squat", group: "Legs (Quads)" },
  { id: "walking_lunge", name: "Walking Lunge", group: "Legs (Quads)" },
  { id: "reverse_lunge", name: "Reverse Lunge", group: "Legs (Quads)" },
  { id: "step_up", name: "Step-Up", group: "Legs (Quads)" },

  // ---------------- Legs: Quads (machines) ----------------
  { id: "leg_press", name: "Leg Press", group: "Legs (Machine)" },
  { id: "hack_squat", name: "Hack Squat", group: "Legs (Machine)" },
  { id: "smith_squat", name: "Smith Machine Squat", group: "Legs (Machine)" },
  { id: "leg_extension", name: "Leg Extension", group: "Legs (Machine)" },
  { id: "pendulum_squat", name: "Pendulum Squat (Machine)", group: "Legs (Machine)" },
  { id: "belt_squat", name: "Belt Squat (Machine)", group: "Legs (Machine)" },

  // ---------------- Legs: Hamstrings/Glutes (free weights) ----------------
  { id: "rdl", name: "Romanian Deadlift", group: "Legs (Hams/Glutes)" },
  { id: "stiff_leg_deadlift", name: "Stiff-Leg Deadlift", group: "Legs (Hams/Glutes)" },
  { id: "good_morning", name: "Good Morning", group: "Legs (Hams/Glutes)" },
  { id: "hip_thrust", name: "Hip Thrust (Barbell)", group: "Legs (Glutes)" },
  { id: "glute_bridge", name: "Glute Bridge", group: "Legs (Glutes)" },

  // ---------------- Legs: Hamstrings/Glutes (machines/cables) ----------------
  { id: "lying_leg_curl", name: "Lying Leg Curl", group: "Legs (Machine)" },
  { id: "seated_leg_curl", name: "Seated Leg Curl", group: "Legs (Machine)" },
  { id: "standing_leg_curl", name: "Standing Leg Curl", group: "Legs (Machine)" },
  { id: "glute_ham_raise", name: "Glute-Ham Raise (GHR)", group: "Legs (Machine)" },
  { id: "back_extension", name: "Back Extension (Hyperextension)", group: "Legs (Hams/Glutes)" },
  { id: "machine_hip_thrust", name: "Hip Thrust Machine", group: "Legs (Machine)" },
  { id: "cable_pull_through", name: "Cable Pull-Through", group: "Legs (Cable)" },
  { id: "cable_kickback", name: "Cable Glute Kickback", group: "Legs (Cable)" },
  { id: "hip_abductor", name: "Hip Abductor Machine", group: "Legs (Machine)" },
  { id: "hip_adductor", name: "Hip Adductor Machine", group: "Legs (Machine)" },

  // ---------------- Calves ----------------
  { id: "standing_calf_raise", name: "Standing Calf Raise", group: "Calves" },
  { id: "seated_calf_raise", name: "Seated Calf Raise", group: "Calves" },
  { id: "leg_press_calf_raise", name: "Leg Press Calf Raise", group: "Calves" },
  { id: "smith_calf_raise", name: "Smith Machine Calf Raise", group: "Calves" },

  // ---------------- Arms: Biceps (free weights) ----------------
  { id: "biceps_curl", name: "Dumbbell Curl", group: "Arms (Biceps)" },
  { id: "barbell_curl", name: "Barbell Curl", group: "Arms (Biceps)" },
  { id: "ez_bar_curl", name: "EZ-Bar Curl", group: "Arms (Biceps)" },
  { id: "hammer_curl", name: "Hammer Curl", group: "Arms (Biceps)" },
  { id: "incline_db_curl", name: "Incline DB Curl", group: "Arms (Biceps)" },
  { id: "concentration_curl", name: "Concentration Curl", group: "Arms (Biceps)" },
  { id: "preacher_curl_free", name: "Preacher Curl (Free Weight)", group: "Arms (Biceps)" },

  // ---------------- Arms: Biceps (machines/cables) ----------------
  { id: "cable_curl", name: "Cable Curl", group: "Arms (Cable)" },
  { id: "cable_hammer_curl", name: "Cable Hammer Curl (Rope)", group: "Arms (Cable)" },
  { id: "cable_preacher_curl", name: "Cable Preacher Curl", group: "Arms (Cable)" },
  { id: "machine_biceps_curl", name: "Biceps Curl Machine", group: "Arms (Machine)" },

  // ---------------- Arms: Triceps (free weights) ----------------
  { id: "close_grip_bench", name: "Close-Grip Bench Press", group: "Arms (Triceps)" },
  { id: "skull_crushers", name: "Skull Crushers (EZ-Bar)", group: "Arms (Triceps)" },
  { id: "overhead_db_extension", name: "Overhead DB Triceps Extension", group: "Arms (Triceps)" },
  { id: "dips_triceps", name: "Dips (Triceps focus)", group: "Arms (Triceps)" },
  { id: "triceps_kickback_db", name: "DB Triceps Kickback", group: "Arms (Triceps)" },

  // ---------------- Arms: Triceps (machines/cables) ----------------
  { id: "triceps_pushdown_rope", name: "Triceps Pushdown (Rope)", group: "Arms (Cable)" },
  { id: "triceps_pushdown_bar", name: "Triceps Pushdown (Bar)", group: "Arms (Cable)" },
  { id: "overhead_cable_extension", name: "Overhead Cable Extension", group: "Arms (Cable)" },
  { id: "single_arm_pushdown", name: "Single-Arm Cable Pushdown", group: "Arms (Cable)" },
  { id: "machine_triceps_extension", name: "Triceps Extension Machine", group: "Arms (Machine)" },
  { id: "assisted_dip_machine", name: "Assisted Dip Machine", group: "Arms (Machine)" },

  // ---------------- Core ----------------
  { id: "plank", name: "Plank", group: "Core" },
  { id: "side_plank", name: "Side Plank", group: "Core" },
  { id: "hanging_knee_raise", name: "Hanging Knee Raise", group: "Core" },
  { id: "hanging_leg_raise", name: "Hanging Leg Raise", group: "Core" },
  { id: "cable_crunch", name: "Cable Crunch", group: "Core (Cable)" },
  { id: "machine_crunch", name: "Ab Crunch Machine", group: "Core (Machine)" },
  { id: "ab_wheel", name: "Ab Wheel Rollout", group: "Core" },
  { id: "back_extension_core", name: "Back Extension (Core)", group: "Core" },

  // ---------------- Cardio / Conditioning (machines) ----------------
  { id: "treadmill", name: "Treadmill", group: "Cardio" },
  { id: "bike", name: "Stationary Bike", group: "Cardio" },
  { id: "rowing_machine", name: "Rowing Machine", group: "Cardio" },
  { id: "stair_climber", name: "Stair Climber", group: "Cardio" },
  { id: "elliptical", name: "Elliptical", group: "Cardio" },

  // ---------------- Extra: Back/Chest common machines ----------------
  { id: "assisted_pullup_machine", name: "Assisted Pull-up Machine", group: "Back (Machine)" },
  { id: "machine_pullover", name: "Pullover Machine", group: "Back (Machine)" },
  { id: "cable_pullover", name: "Cable Pullover", group: "Back (Cable)" },

  // ---------------- Extra: Traps / Neck ----------------
  { id: "db_shrug", name: "Dumbbell Shrug", group: "Traps" },
  { id: "barbell_shrug", name: "Barbell Shrug", group: "Traps" },
  { id: "machine_shrug", name: "Shrug Machine", group: "Traps (Machine)" },

  // ---------------- Extra: Forearms ----------------
  { id: "wrist_curl", name: "Wrist Curl", group: "Forearms" },
  { id: "reverse_wrist_curl", name: "Reverse Wrist Curl", group: "Forearms" },
  { id: "farmer_walk", name: "Farmer Walk", group: "Forearms" },
];
