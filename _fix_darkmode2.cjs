const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/profile/page.tsx', 'utf8');

// 1. Fix import
s = s.replace(
  'import { THEMES, LS_THEME, applyTheme, type ThemeId } from "@/lib/theme";',
  'import { THEMES, LS_THEME, applyTheme, applyColorMode, LS_COLOR_MODE, type ThemeId, type ColorMode } from "@/lib/theme";'
);

// 2. Add colorMode state after savedTheme state
s = s.replace(
  '  const [savedTheme, setSavedTheme] = React.useState<ThemeId>("cyan");',
  '  const [savedTheme, setSavedTheme] = React.useState<ThemeId>("cyan");\n  const [colorMode, setColorMode] = React.useState<ColorMode>("dark");'
);

// 3. Load colorMode in useEffect
s = s.replace(
  '    setSavedTheme((localStorage.getItem(LS_THEME) as ThemeId) ?? "cyan");',
  '    setSavedTheme((localStorage.getItem(LS_THEME) as ThemeId) ?? "cyan");\n    setColorMode((localStorage.getItem(LS_COLOR_MODE) as ColorMode | null) ?? "dark");'
);

// 4. Insert dark/light toggle BEFORE the Téma card
const themeCard = `          {/* T`;
const toggleBlock = `          {/* Dark / Light mode toggle */}
          <div className="rounded-2xl overflow-hidden mb-3" style={{background:"rgba(255,255,255,0.04)"}}>
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
                style={{ position:"relative", width:52, height:28, flexShrink:0 }}
                className="pressable"
              >
                <div style={{
                  position:"absolute", inset:0, borderRadius:999,
                  background: colorMode === "dark" ? "rgba(255,255,255,0.12)" : "var(--accent-primary)",
                  transition:"background 0.3s"
                }} />
                <div style={{
                  position:"absolute", top:4, width:20, height:20, borderRadius:999,
                  left: colorMode === "dark" ? 4 : 28,
                  background: colorMode === "dark" ? "rgba(255,255,255,0.7)" : "#000",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, transition:"left 0.3s"
                }}>
                  {colorMode === "dark" ? "🌙" : "☀️"}
                </div>
              </button>
            </div>
          </div>

          {/* T`;

s = s.replace(themeCard, toggleBlock);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/profile/page.tsx', s, 'utf8');
console.log('toggle injected, chars replaced:', s.includes('colorMode') ? 'YES' : 'NO');
