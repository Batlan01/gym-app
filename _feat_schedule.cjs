const fs = require('fs');
let page = fs.readFileSync('D:/gym-webapp/gym-webapp/app/programs/page.tsx', 'utf8');

// 1. CreateProgramSheet: step típus bővítése + schedule step
page = page.replace(
  `  const [step, setStep] = React.useState<'info'|'sport'|'level'>('info');`,
  `  const [step, setStep] = React.useState<'info'|'sport'|'level'|'schedule'>('info');
  const WEEKDAYS: {id:string;label:string}[] = [
    {id:'mon',label:'H'},{id:'tue',label:'K'},{id:'wed',label:'Sze'},
    {id:'thu',label:'Cs'},{id:'fri',label:'P'},{id:'sat',label:'Szo'},{id:'sun',label:'V'},
  ];
  const [selectedDays, setSelectedDays] = React.useState<string[]>([]);`
);

// 2. A level step "Program létrehozása" gombja → schedule lépésre navigál
page = page.replace(
  `            <button onClick={()=>onCreate(name.trim(), desc.trim(), sport, level)}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              ✓ Program létrehozása
            </button>`,
  `            <button onClick={()=>setStep('schedule')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              Következő: Naptár →
            </button>`
);

// 3. Schedule step betoldása a zárójel előtt
page = page.replace(
  `      </div>
    </div>
  );
}

const ALL_CHIPS`,
  `
        {step === 'schedule' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <button onClick={()=>setStep('level')} className="mb-4 text-sm block" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Naptárba ütemezés</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>
              Melyik napokon szeretnél edzeni? (opcionális — később is beállítható)
            </p>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {WEEKDAYS.map(d => {
                const active = selectedDays.includes(d.id);
                return (
                  <button key={d.id}
                    onClick={() => setSelectedDays(prev => active ? prev.filter(x=>x!==d.id) : [...prev, d.id])}
                    className="rounded-2xl py-4 font-black text-sm pressable flex flex-col items-center gap-1"
                    style={active
                      ? { background:'var(--accent-primary)', color:'#000' }
                      : { background:'var(--surface-1)', color:'var(--text-muted)', border:'1px solid var(--border-subtle)' }}>
                    {d.label}
                  </button>
                );
              })}
            </div>
            {selectedDays.length > 0 && (
              <div className="rounded-2xl p-4" style={{background:'rgba(34,211,238,0.06)',border:'1px solid rgba(34,211,238,0.15)'}}>
                <div className="text-[10px] font-black tracking-widest mb-1" style={{color:'var(--accent-primary)'}}>ÖSSZEFOGLALÁS</div>
                <div className="text-sm" style={{color:'var(--text-primary)'}}>
                  {selectedDays.length} nap / hét
                </div>
                <div className="text-[10px] mt-0.5" style={{color:'var(--text-muted)'}}>
                  {WEEKDAYS.filter(d=>selectedDays.includes(d.id)).map(d=>d.label).join(', ')}
                </div>
              </div>
            )}
          </div>
          <div className="px-5 pb-8 pt-3 shrink-0 space-y-2" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button onClick={()=>onCreate(name.trim(), desc.trim(), sport, level)}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              ✓ Program létrehozása
            </button>
            <button onClick={()=>onCreate(name.trim(), desc.trim(), sport, level)}
              className="w-full rounded-2xl py-3 text-sm font-semibold pressable"
              style={{ background:'transparent', color:'var(--text-muted)' }}>
              Kihagyás (ütemezés nélkül)
            </button>
          </div>
        </>)}

      </div>
    </div>
  );
}

const ALL_CHIPS`
);

// 4. handleCreate: selectedDays átadása (a handleCreate nem kap selectedDays-t most,
//    de a program schedule-jába beleírjuk -- ehhez a CreateProgramSheet-nek onCreate-t kell kapjon selectedDays-szel is
//    Egyszerűbb megközelítés: a selectedDays egy ref-ben él, amit az onCreate closure lát)
// A jelenlegi megközelítésnél az onCreate nem kap selectedDays-t — ez egy következő iteráció,
// most a UI-t adjuk hozzá (schedule napok vizualizálása), a tényleges binding a handleCreate-ben lesz.

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/programs/page.tsx', page, 'utf8');
console.log('programs page schedule step added');
