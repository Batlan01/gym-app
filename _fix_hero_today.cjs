// fix_hero_today.cjs
const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/page.tsx', 'utf8');

// Cseréljük a teljes hero blokkot + mai edzés kártyát
const OLD_HERO = `        {/* ── HERO ── */}
        <button onClick={() => {}} className="w-full text-left pressable">
          <Link href="/workout" className="block">
            <div className="relative overflow-hidden rounded-3xl" style={{ background: "var(--accent-primary)" }}>
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: "repeating-linear-gradient(-45deg, #000 0px, #000 1px, transparent 1px, transparent 8px)" }} />
              <div className="relative p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[10px] font-black tracking-widest" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {hasActiveToday ? t.home.hero_active : t.home.hero_today}
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "rgba(0,0,0,0.15)" }}>
                      <span className="text-xs">🔥</span>
                      <span className="text-xs font-black" style={{ color: "#000" }}>{streak}</span>
                    </div>
                  )}
                </div>
                <div className="text-3xl font-black leading-none mb-1" style={{ color: "#000" }}>
                  {hasActiveToday ? t.home.hero_continue : t.home.hero_start}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
                  {lastWorkout
                    ? \`\${t.home.hero_last}: \${new Date(lastWorkout.startedAt).toLocaleDateString(lang, { weekday: "long" })}\`
                    : t.home.hero_no_workout}
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-black"
                  style={{ background: "rgba(0,0,0,0.15)", color: "#000" }}>
                  {hasActiveToday ? t.home.hero_cta_continue : t.home.hero_cta_start}
                </div>
              </div>
            </div>
          </Link>
        </button>

        {/* ── MAI EDZÉS ── */}
        {todaySessions.length > 0 && !hasActiveToday && (
          <div className="mt-3 rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <div className="text-[9px] font-black tracking-widest" style={{ color:"var(--text-muted)" }}>
                MAI EDZÉS
              </div>
              <div className="text-[9px]" style={{ color:"var(--text-muted)" }}>
                {todaySessions.length} session
              </div>
            </div>
            {todaySessions.map((sess, i) => (
              <div key={i} className="px-4 py-3"
                style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{SLOT_EMOJIS[sess.slotId] ?? "💪"}</span>
                  <span className="text-sm font-black" style={{ color:"var(--text-primary)" }}>{sess.sessionName}</span>
                  <span className="text-xs" style={{ color:"var(--text-muted)" }}>· {sess.programName}</span>
                </div>
                {sess.exercises.length > 0 && (
                  <div className="text-xs" style={{ color:"var(--text-muted)" }}>
                    {sess.exercises.join(" · ")}{sess.exerciseCount > 4 ? \` +\${sess.exerciseCount - 4}\` : ""}
                  </div>
                )}
              </div>
            ))}
            <div className="px-3 pb-3">
              <button onClick={() => { window.location.href = "/workout"; }}
                className="w-full rounded-xl py-3 text-sm font-black pressable"
                style={{ background:"var(--accent-primary)", color:"#000" }}>
                Edzés indítása →
              </button>
            </div>
          </div>
        )}

        {hasActiveToday && (
          <div className="mt-3 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.2)" }}>
            <span className="text-xl">✅</span>
            <div>
              <div className="text-sm font-black" style={{ color:"#4ade80" }}>Ma már edztél!</div>
              <div className="text-xs" style={{ color:"var(--text-muted)" }}>Szép munka, tartsuk a streeket!</div>
            </div>
          </div>
        )}`;

const NEW_HERO = `        {/* ── HERO ── */}
        <Link href="/workout" className="block pressable">
          <div className="relative overflow-hidden rounded-3xl" style={{ background: "var(--accent-primary)" }}>
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(-45deg, #000 0px, #000 1px, transparent 1px, transparent 8px)" }} />
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="text-[10px] font-black tracking-widest" style={{ color: "rgba(0,0,0,0.5)" }}>
                  {hasActiveToday ? "MA TELJESÍTVE" : todaySessions.length > 0 ? "MAI EDZÉS" : "EDZÉS"}
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "rgba(0,0,0,0.15)" }}>
                    <span className="text-xs">🔥</span>
                    <span className="text-xs font-black" style={{ color: "#000" }}>{streak}</span>
                  </div>
                )}
              </div>

              {/* Tartalom: mai session vagy alap */}
              {!hasActiveToday && todaySessions.length > 0 ? (
                <>
                  <div className="text-sm font-black mb-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>
                    Készen állsz a
                  </div>
                  <div className="text-2xl font-black leading-tight mb-1" style={{ color: "#000" }}>
                    "{todaySessions[0].sessionName}"
                    {todaySessions.length > 1 && (
                      <span className="text-base font-semibold" style={{ color: "rgba(0,0,0,0.5)" }}>
                        {" "}+{todaySessions.length - 1}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {todaySessions[0].programName}
                    {todaySessions[0].exercises.length > 0 && (
                      <> · {todaySessions[0].exercises.slice(0, 3).join(", ")}{todaySessions[0].exerciseCount > 3 ? \`… +\${todaySessions[0].exerciseCount - 3}\` : ""}</>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-black"
                    style={{ background: "rgba(0,0,0,0.15)", color: "#000" }}>
                    Edzés indítása →
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-black leading-none mb-1" style={{ color: "#000" }}>
                    {hasActiveToday ? t.home.hero_continue : t.home.hero_start}
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {hasActiveToday
                      ? "Szép munka ma! 💪"
                      : lastWorkout
                        ? \`\${t.home.hero_last}: \${new Date(lastWorkout.startedAt).toLocaleDateString(lang, { weekday: "long" })}\`
                        : t.home.hero_no_workout}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-black"
                    style={{ background: "rgba(0,0,0,0.15)", color: "#000" }}>
                    {hasActiveToday ? t.home.hero_cta_continue : t.home.hero_cta_start}
                  </div>
                </>
              )}
            </div>
          </div>
        </Link>`;

s = s.replace(OLD_HERO, NEW_HERO);
fs.writeFileSync('D:/gym-webapp/gym-webapp/app/page.tsx', s, 'utf8');
console.log('hero fixed:', s.includes('"Készen állsz'));
