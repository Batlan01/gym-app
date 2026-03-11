// lib/exercises.ts - meglévő exercises mellé exportálva
// Ez a fájl CSAK az ALL_EXERCISE_GROUPS exportot adja hozzá a meglévők mellé.
// Ha a fájl már tartalmaz exercise adatokat, csak az exportot illesztjük be.

export const ALL_EXERCISE_GROUPS: { name: string; emoji: string; exercises: string[] }[] = [
  {
    name: "Mell", emoji: "💪",
    exercises: [
      "Bench Press", "Incline Bench Press", "Decline Bench Press",
      "Dumbbell Fly", "Cable Crossover", "Chest Dip", "Push-up",
      "Incline Dumbbell Press", "Machine Chest Press", "Pec Deck"
    ],
  },
  {
    name: "Hát", emoji: "🔙",
    exercises: [
      "Deadlift", "Barbell Row", "Pull-up", "Lat Pulldown",
      "Seated Cable Row", "T-Bar Row", "Single Arm DB Row",
      "Face Pull", "Straight Arm Pulldown", "Hyperextension"
    ],
  },
  {
    name: "Váll", emoji: "🔝",
    exercises: [
      "Overhead Press", "Dumbbell Shoulder Press", "Arnold Press",
      "Lateral Raise", "Front Raise", "Rear Delt Fly",
      "Upright Row", "Cable Lateral Raise", "Face Pull", "Shrug"
    ],
  },
  {
    name: "Kar — Bicepsz", emoji: "💪",
    exercises: [
      "Barbell Curl", "Dumbbell Curl", "Hammer Curl",
      "Preacher Curl", "Concentration Curl", "Cable Curl",
      "Incline Dumbbell Curl", "Spider Curl"
    ],
  },
  {
    name: "Kar — Tricepsz", emoji: "💪",
    exercises: [
      "Tricep Pushdown", "Skull Crusher", "Close Grip Bench Press",
      "Overhead Tricep Extension", "Tricep Dip", "Kick Back",
      "Cable Overhead Extension", "Diamond Push-up"
    ],
  },
  {
    name: "Lábak", emoji: "🦵",
    exercises: [
      "Back Squat", "Front Squat", "Leg Press", "Hack Squat",
      "Romanian Deadlift", "Leg Curl", "Leg Extension",
      "Bulgarian Split Squat", "Lunge", "Step Up",
      "Calf Raise", "Seated Calf Raise", "Sumo Squat"
    ],
  },
  {
    name: "Gluteus", emoji: "🍑",
    exercises: [
      "Hip Thrust", "Glute Bridge", "Cable Kickback",
      "Donkey Kick", "Clamshell", "Romanian Deadlift",
      "Sumo Deadlift", "Step Up", "Hip Abduction Machine"
    ],
  },
  {
    name: "Core / Has", emoji: "🔘",
    exercises: [
      "Plank", "Crunch", "Hanging Leg Raise", "Ab Rollout",
      "Russian Twist", "L-sit", "Dragon Flag",
      "Cable Crunch", "Side Plank", "Hollow Body Hold",
      "Dead Bug", "Bird Dog", "Mountain Climber"
    ],
  },
  {
    name: "Olimpiai emelés", emoji: "🏅",
    exercises: [
      "Clean and Jerk", "Snatch", "Power Clean", "Power Snatch",
      "Hang Clean", "Hang Snatch", "Push Press", "Push Jerk"
    ],
  },
  {
    name: "Kettelbell", emoji: "🏋️",
    exercises: [
      "Kettlebell Swing", "Turkish Get-Up", "Kettlebell Clean",
      "Kettlebell Press", "Goblet Squat", "Kettlebell Snatch",
      "Figure 8", "Kettlebell Row", "Windmill"
    ],
  },
  {
    name: "Testsúlyos", emoji: "🤸",
    exercises: [
      "Pull-up", "Chin-up", "Dip", "Push-up", "Pike Push-up",
      "Handstand Push-up", "Pistol Squat", "Nordic Curl",
      "L-sit", "Muscle Up", "Front Lever", "Back Lever"
    ],
  },
  {
    name: "Küzdősport", emoji: "🥊",
    exercises: [
      "Jab", "Cross", "Hook", "Uppercut",
      "Teep", "Roundhouse Kick", "Low Kick", "High Kick",
      "Sprawl", "Shrimping", "Hip Escape", "Guard Pass",
      "Double Leg Takedown", "Single Leg Takedown"
    ],
  },
  {
    name: "Kardio / Kondíció", emoji: "🏃",
    exercises: [
      "Box Jump", "Burpee", "Jumping Jack", "Jump Squat",
      "High Knee Run", "Battle Ropes", "Sled Push", "Sled Pull",
      "Rowing Machine", "Assault Bike", "Jump Rope", "Shuttle Run"
    ],
  },
  {
    name: "Bemelegítés / Mobilitás", emoji: "🔥",
    exercises: [
      "Leg Swing", "Hip Circle", "Arm Circle", "Inchworm",
      "World's Greatest Stretch", "Cat-Cow", "Bird Dog",
      "Glute Bridge", "Band Pull-Apart", "Face Pull",
      "Thoracic Rotation", "Ankle Mobility"
    ],
  },
];
