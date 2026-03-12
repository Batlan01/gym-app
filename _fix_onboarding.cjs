// fix_onboarding.cjs — Onboarding flow javítás
const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/onboarding/page.tsx', 'utf8');

// 1. Import PROGRAM_TEMPLATES az ajánláshoz
s = s.replace(
  `import { lsGet, lsSet } from "@/lib/storage";`,
  `import { lsGet, lsSet } from "@/lib/storage";
import { PROGRAM_TEMPLATES } from "@/lib/programTemplates";
import { readPrograms, upsertProgram } from "@/lib/programsStorage";`
);

// 2. Steps kibővítése — "program" step hozzáadása finish előtt
s = s.replace(
  `type StepId = "welcome" | "basic" | "body" | "goals" | "training" | "experience" | "finish";`,
  `type StepId = "welcome" | "basic" | "body" | "goals" | "training" | "experience" | "program" | "finish";`
);

// 3. Steps array - "program" step betoldása finish elé
s = s.replace(
  `    { id: "finish",     title: "Kész!",               subtitle: "Ellenőrzöd és mentesz", emoji: "🚀" },`,
  `    { id: "program",   title: "Program ajánlás",      subtitle: "Kezdd rögtön ezzel", emoji: "📋" },
    { id: "finish",     title: "Kész!",               subtitle: "Ellenőrzöd és mentesz", emoji: "🚀" },`
);

// 4. canNext: program step mindig továbbléphet
s = s.replace(
  `    if (step.id === "training") {`,
  `    if (step.id === "program") return true;
    if (step.id === "training") {`
);

// 5. Welcome step — vizuálisabb, feature kártyák
const OLD_WELCOME = `          {step.id === "welcome" && (
            <div className="rounded-3xl p-5"
              style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04))", border: "1px solid rgba(34,211,238,0.2)" }}>
              <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Az ARCX-szel <strong style={{ color: "var(--text-primary)" }}>programokat tervezhetsz</strong>,
                edzéseket naplózhatsz, és nyomon követheted a fejlődésedet.<br /><br />
                Pár gyors kérdéssel személyre szabjuk az élményt.
              </div>
            </div>
          )}`;

const NEW_WELCOME = `          {step.id === "welcome" && (
            <div className="space-y-3">
              {[
                { icon: "📋", title: "Edzésprogramok", desc: "Tervezz saját vagy töltsd be a sablonokat" },
                { icon: "📝", title: "Edzésnapló", desc: "Kövesd a szetteket, súlyokat, fejlődést" },
                { icon: "📈", title: "Statisztikák", desc: "PR-ok, volum, streak — minden egy helyen" },
                { icon: "📅", title: "Heti naptár", desc: "Tervezd meg, mikor mit edzel" },
              ].map(f => (
                <div key={f.title} className="flex items-center gap-4 rounded-2xl px-4 py-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <span className="text-2xl shrink-0">{f.icon}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{f.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}`;

s = s.replace(OLD_WELCOME, NEW_WELCOME);

// 6. Body step — "Kihagyom" link (opcionális)
const OLD_BODY = `          {step.id === "body" && (
            <div className="grid grid-cols-3 gap-3">
              <NumberInput label="KOR" value={draftAge} onChange={setDraftAge} placeholder="29" unit="év" />
              <NumberInput label="MAGASSÁG" value={draftHeight} onChange={setDraftHeight} placeholder="175" unit="cm" />
              <NumberInput label="TESTSÚLY" value={draftWeight} onChange={setDraftWeight} placeholder="80" unit="kg" />
              <div className="col-span-3 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                💡 Opcionális — testsúly grafikonhoz és célokhoz hasznos
              </div>
            </div>
          )}`;

const NEW_BODY = `          {step.id === "body" && (
            <div className="grid grid-cols-3 gap-3">
              <NumberInput label="KOR" value={draftAge} onChange={setDraftAge} placeholder="29" unit="év" />
              <NumberInput label="MAGASSÁG" value={draftHeight} onChange={setDraftHeight} placeholder="175" unit="cm" />
              <NumberInput label="TESTSÚLY" value={draftWeight} onChange={setDraftWeight} placeholder="80" unit="kg" />
              <div className="col-span-3 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                💡 Ezek az adatok segítenek a testsúly grafikonban és a kalória becslésben. Bármikor módosíthatod a profilban.
              </div>
            </div>
          )}`;

s = s.replace(OLD_BODY, NEW_BODY);

// 7. Program ajánlás step - betoldás a finish elé
const PROGRAM_STEP = `
          {step.id === "program" && (() => {
            // Ajánl 1-2 programot szint + hely alapján
            const recommended = PROGRAM_TEMPLATES.filter(p => {
              const sportMatch = place === "home" ? p.sport === "home" || p.sport === "calisthenics"
                : place === "gym" ? p.sport === "gym" || p.sport === "powerlifting" || p.sport === "bodybuilding"
                : true;
              const levelMatch = !p.level || p.level === level || (level === "intermediate" && p.level === "beginner");
              return sportMatch && levelMatch;
            }).slice(0, 3);

            return (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  A megadott adatok alapján ezek illenek hozzád. Egyet rögtön hozzáadhatsz — vagy később is megcsinálod.
                </p>
                {recommended.map(tmpl => (
                  <div key={tmpl.id} className="rounded-2xl p-4"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{tmpl.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {tmpl.sessions?.length ?? 0} session · {tmpl.level === "beginner" ? "Kezdő" : tmpl.level === "intermediate" ? "Közép" : "Haladó"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!activeProfileId) return;
                          const existing = readPrograms(activeProfileId);
                          if (existing.some(p => p.name === tmpl.title)) return;
                          const prog = {
                            id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
                            createdAt: Date.now(), updatedAt: Date.now(),
                            name: tmpl.title, sport: tmpl.sport as any, level: tmpl.level as any,
                            sessions: (tmpl.sessions ?? []).map((s: any, i: number) => ({
                              id: String(Date.now() + i),
                              name: s.name ?? \`Session \${i+1}\`,
                              blocks: (s.exercises ?? []).map((e: string) => ({ kind: "exercise", name: e, targetSets: 3, targetReps: "8-12" })),
                            })),
                          };
                          upsertProgram(activeProfileId, prog as any);
                          alert(\`"\${tmpl.title}" hozzáadva! ✓\`);
                        }}
                        className="rounded-xl px-4 py-2 text-xs font-bold pressable shrink-0"
                        style={{ background: "rgba(34,211,238,0.12)", color: "var(--accent-primary)", border: "1px solid rgba(34,211,238,0.3)" }}>
                        + Hozzáad
                      </button>
                    </div>
                  </div>
                ))}
                {recommended.length === 0 && (
                  <div className="rounded-2xl p-4 text-sm text-center" style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}>
                    Programokat a Programok oldalon hozzáadhatsz bármikor.
                  </div>
                )}
              </div>
            );
          })()}

`;

// Betoldás finish elé
s = s.replace(
  `          {step.id === "finish" && (`,
  PROGRAM_STEP + `          {step.id === "finish" && (`
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/onboarding/page.tsx', s, 'utf8');
console.log('onboarding fixed, lines:', s.split('\n').length);
