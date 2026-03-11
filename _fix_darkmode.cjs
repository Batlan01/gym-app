const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/profile/page.tsx', 'utf8');

// 1. Add ColorMode + applyColorMode to theme import
s = s.replace(
  "import { THEMES, LS_THEME, applyTheme, loadSavedTheme } from \"@/lib/theme\";",
  "import { THEMES, LS_THEME, applyTheme, loadSavedTheme, applyColorMode, LS_COLOR_MODE, type ColorMode } from \"@/lib/theme\";"
);

// 2. Add colorMode state after savedTheme state
s = s.replace(
  "const [savedTheme, setSavedTheme] = React.useState<string>(\"cyan\");",
  "const [savedTheme, setSavedTheme] = React.useState<string>(\"cyan\");\n  const [colorMode, setColorMode] = React.useState<ColorMode>(\"dark\");"
);

// 3. Load colorMode in useEffect where theme is loaded
s = s.replace(
  "const saved = localStorage.getItem(LS_THEME) as any;\n    if (saved) setSavedTheme(saved);",
  "const saved = localStorage.getItem(LS_THEME) as any;\n    if (saved) setSavedTheme(saved);\n    const cm = (localStorage.getItem(LS_COLOR_MODE) as ColorMode | null) ?? \"dark\";\n    setColorMode(cm);"
);

// 4. Insert dark/light toggle BEFORE the theme section (before t.profile.theme_label block)
const themeBlock = `<div className="rounded-2xl overflow-hidden mb-3" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>{t.profile.theme_label}</div>
            </div>`;

const darkLightToggle = `<div className="rounded-2xl overflow-hidden mb-3" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>
                {colorMode === "dark" ? "🌙 DARK MODE" : "☀️ LIGHT MODE"}
              </div>
              <button
                onClick={() => {
                  const next: ColorMode = colorMode === "dark" ? "light" : "dark";
                  setColorMode(next);
                  applyColorMode(next);
                }}
                className="relative pressable"
                style={{ width: 52, height: 28 }}
              >
                <div className="absolute inset-0 rounded-full transition-all duration-300"
                  style={{ background: colorMode === "dark" ? "rgba(255,255,255,0.1)" : "var(--accent-primary)" }} />
                <div className="absolute top-1 transition-all duration-300 rounded-full flex items-center justify-center text-[10px]"
                  style={{
                    width: 20, height: 20,
                    left: colorMode === "dark" ? 4 : 28,
                    background: colorMode === "dark" ? "rgba(255,255,255,0.6)" : "#000",
                  }}>
                  {colorMode === "dark" ? "🌙" : "☀️"}
                </div>
              </button>
            </div>
          </div>

          ` + themeBlock;

s = s.replace(themeBlock, darkLightToggle);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/profile/page.tsx', s, 'utf8');
console.log('dark/light toggle added to profile page');
