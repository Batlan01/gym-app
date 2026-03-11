// fix_sheet_and_builder.cjs
const fs = require('fs');

// ── 1. FIX: CreateProgramSheet - sticky footer gomb ─────────
let page = fs.readFileSync('D:/gym-webapp/gym-webapp/app/programs/page.tsx', 'utf8');

// Cseréljük a sheet wrapper-t: overflow scroll + flex col + sticky footer
const OLD_WRAPPER = `    <div className="fixed inset-0 z-50 flex items-end" style={{ background:'rgba(0,0,0,0.6)' }}
      onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full rounded-t-3xl animate-in slide-in-from-bottom"
        style={{ background:'var(--bg-elevated)', maxHeight:'90dvh', overflowY:'auto',
          paddingBottom:'calc(80px + env(safe-area-inset-bottom, 0px))' }}>`;

const NEW_WRAPPER = `    <div className="fixed inset-0 z-50 flex items-end" style={{ background:'rgba(0,0,0,0.6)' }}
      onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full rounded-t-3xl animate-in slide-in-from-bottom flex flex-col"
        style={{ background:'var(--bg-elevated)', maxHeight:'85dvh' }}>`;

page = page.replace(OLD_WRAPPER, NEW_WRAPPER);

// step 'info' — wrap content in scrollable div, gomb sticky
const OLD_INFO = `        {step === 'info' && (
          <div className="px-5">
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>
              Új edzésprogram
            </h2>
            <p className="text-sm mb-6" style={{ color:'var(--text-muted)' }}>
              Hozd létre a saját programodat nulláról
            </p>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wide" style={{ color:'var(--text-muted)' }}>
              Program neve *
            </label>
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="pl. Heti Push/Pull/Legs"
              maxLength={50}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-4"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-mid)', color:'var(--text-primary)' }} />
            <label className="block mb-1 text-xs font-bold uppercase tracking-wide" style={{ color:'var(--text-muted)' }}>
              Leírás (opcionális)
            </label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Miről szól ez a program? Mi a célja?"
              rows={3} maxLength={200}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none mb-6"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-mid)', color:'var(--text-primary)' }} />
            <button disabled={!name.trim()} onClick={()=>setStep('sport')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background: name.trim() ? 'var(--accent-primary)' : 'var(--surface-2)',
                color: name.trim() ? '#000' : 'var(--text-muted)' }}>
              Következő: Kategória →
            </button>
          </div>
        )}`;

const NEW_INFO = `        {step === 'info' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>
              Új edzésprogram
            </h2>
            <p className="text-sm mb-6" style={{ color:'var(--text-muted)' }}>
              Hozd létre a saját programodat nulláról
            </p>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wide" style={{ color:'var(--text-muted)' }}>
              Program neve *
            </label>
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="pl. Heti Push/Pull/Legs"
              maxLength={50}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-4"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-mid)', color:'var(--text-primary)' }} />
            <label className="block mb-1 text-xs font-bold uppercase tracking-wide" style={{ color:'var(--text-muted)' }}>
              Leírás (opcionális)
            </label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)}
              placeholder="Miről szól ez a program? Mi a célja?"
              rows={3} maxLength={200}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background:'var(--surface-1)', border:'1px solid var(--border-mid)', color:'var(--text-primary)' }} />
          </div>
          <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button disabled={!name.trim()} onClick={()=>setStep('sport')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background: name.trim() ? 'var(--accent-primary)' : 'var(--surface-2)',
                color: name.trim() ? '#000' : 'var(--text-muted)' }}>
              Következő: Kategória →
            </button>
          </div>
        </>)}`;

page = page.replace(OLD_INFO, NEW_INFO);

// step 'sport' — wrap content + sticky footer
const OLD_SPORT_BTN = `            <button onClick={()=>setStep('level')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              Következő: Szint →
            </button>
          </div>
        )}

        {step === 'level'`;

const NEW_SPORT_BTN = `          </div>
          <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button onClick={()=>setStep('level')}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              Következő: Szint →
            </button>
          </div>
        </>)}

        {step === 'level'`;

// sport step header to scrollable
const OLD_SPORT_HEAD = `        {step === 'sport' && (
          <div className="px-5">
            <button onClick={()=>setStep('info')} className="mb-4 text-sm" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Válassz kategóriát</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>Mi jellemzi legjobban a programodat?</p>
            <div className="space-y-5 mb-6">`;

const NEW_SPORT_HEAD = `        {step === 'sport' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <button onClick={()=>setStep('info')} className="mb-4 text-sm block" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Válassz kategóriát</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>Mi jellemzi legjobban a programodat?</p>
            <div className="space-y-5">`;

page = page.replace(OLD_SPORT_HEAD, NEW_SPORT_HEAD);
page = page.replace(OLD_SPORT_BTN, NEW_SPORT_BTN);

// step 'level' — same treatment
const OLD_LEVEL_HEAD = `        {step === 'level' && (
          <div className="px-5">
            <button onClick={()=>setStep('sport')} className="mb-4 text-sm" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Nehézségi szint</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>Kinek szól ez a program?</p>
            <div className="space-y-3 mb-6">`;

const NEW_LEVEL_HEAD = `        {step === 'level' && (<>
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
            <button onClick={()=>setStep('sport')} className="mb-4 text-sm block" style={{ color:'var(--text-muted)' }}>
              ← Vissza
            </button>
            <h2 className="text-xl font-black mb-1" style={{ color:'var(--text-primary)' }}>Nehézségi szint</h2>
            <p className="text-sm mb-5" style={{ color:'var(--text-muted)' }}>Kinek szól ez a program?</p>
            <div className="space-y-3">`;

page = page.replace(OLD_LEVEL_HEAD, NEW_LEVEL_HEAD);

// level utolsó gomb
const OLD_LEVEL_BTN = `            </div>
            <button onClick={()=>onCreate(name.trim(), desc.trim(), sport, level)}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              ✓ Program létrehozása
            </button>
          </div>
        )}

      </div>
    </div>
  );
}`;

const NEW_LEVEL_BTN = `            </div>
          </div>
          <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop:'1px solid var(--border-subtle)' }}>
            <button onClick={()=>onCreate(name.trim(), desc.trim(), sport, level)}
              className="w-full rounded-2xl py-4 text-sm font-bold pressable"
              style={{ background:'var(--accent-primary)', color:'#000' }}>
              ✓ Program létrehozása
            </button>
          </div>
        </>)}

      </div>
    </div>
  );
}`;

page = page.replace(OLD_LEVEL_BTN, NEW_LEVEL_BTN);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/programs/page.tsx', page, 'utf8');
console.log('page.tsx sheet fixed, lines:', page.split('\n').length);
