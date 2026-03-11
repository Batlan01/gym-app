const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/lib/i18n.ts', 'utf8');

// Add exercises to HU nav (multiline object)
s = s.replace(
  '    calendar: "Naptár",\n    profile: "Profil",\n  },\n  // ── Home',
  '    calendar: "Naptár",\n    profile: "Profil",\n    exercises: "Gyakorlatok",\n  },\n  // ── Home'
);

// Add to EN nav (inline)
s = s.replace(
  'nav: { home:"Home", workout:"Workout", programs:"Programs", progress:"Progress", calendar:"Calendar", profile:"Profile" },',
  'nav: { home:"Home", workout:"Workout", programs:"Programs", progress:"Progress", calendar:"Calendar", profile:"Profile", exercises:"Exercises" },'
);

// SK
s = s.replace(
  'nav: { home:"Domov", workout:"Tréning", programs:"Programy", progress:"Pokrok", calendar:"Kalendár", profile:"Profil" },',
  'nav: { home:"Domov", workout:"Tréning", programs:"Programy", progress:"Pokrok", calendar:"Kalendár", profile:"Profil", exercises:"Cvičenia" },'
);

// CS
s = s.replace(
  'nav: { home:"Domů", workout:"Trénink", programs:"Programy", progress:"Pokrok", calendar:"Kalendář", profile:"Profil" },',
  'nav: { home:"Domů", workout:"Trénink", programs:"Programy", progress:"Pokrok", calendar:"Kalendář", profile:"Profil", exercises:"Cvičení" },'
);

// DE
s = s.replace(
  'nav: { home:"Start", workout:"Training", programs:"Programme", progress:"Fortschritt", calendar:"Kalender", profile:"Profil" },',
  'nav: { home:"Start", workout:"Training", programs:"Programme", progress:"Fortschritt", calendar:"Kalender", profile:"Profil", exercises:"Übungen" },'
);

// ES
s = s.replace(
  'nav: { home:"Inicio", workout:"Entreno", programs:"Programas", progress:"Progreso", calendar:"Calendario", profile:"Perfil" },',
  'nav: { home:"Inicio", workout:"Entreno", programs:"Programas", progress:"Progreso", calendar:"Calendario", profile:"Perfil", exercises:"Ejercicios" },'
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/lib/i18n.ts', s, 'utf8');
const count = (s.match(/exercises:/g) || []).length;
console.log('exercises entries:', count, count === 6 ? '✓' : '✗ expected 6');
