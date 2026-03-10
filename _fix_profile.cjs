const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/profile/page.tsx', 'utf8');

// 1. Fix the old hardcoded language picker block → replace with LanguagePicker component
const oldLangBlock = `          {/* Nyelv */}
          <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>NYELV</div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[{id:"hu",label:"🇭🇺 Magyar"},{id:"en",label:"🇬🇧 English (hamarosan)"}].map(l => (
                <button key={l.id}
                  className="rounded-2xl py-3 text-sm font-black pressable"
                  style={l.id==="hu"
                    ? {background:"var(--accent-primary)",color:"#000"}
                    : {background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.25)"}}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>`;

const newLangBlock = `          {/* Nyelv / Language */}
          <div className="rounded-2xl overflow-hidden" style={{background:"rgba(255,255,255,0.04)"}}>
            <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div className="text-[9px] font-black tracking-widest" style={{color:"rgba(255,255,255,0.25)"}}>
                {t.profile.lang_label}
              </div>
            </div>
            <div className="p-3">
              <LanguagePicker currentLang={lang} />
            </div>
          </div>`;

s = s.replace(oldLangBlock, newLangBlock);

// 2. Remove duplicated LanguagePicker block that was added by the patch script
// (the patch added it after the theme section closing div but the old block is still there)
const dupLangBlock = `\n          {/* ── LANGUAGE ── */}\n          <div className="mt-5">\n            <div className="text-[9px] font-black tracking-widest mb-3"\n              style={{ color: "rgba(255,255,255,0.25)" }}>\n              {t.profile.lang_label}\n            </div>\n            <LanguagePicker currentLang={lang} />\n          </div>`;
s = s.replace(dupLangBlock, '');

// 3. Fix hardcoded Hungarian texts
s = s.replace('Névtelen', '{name ?? t.profile.unnamed}');
// fix double wrap issue
s = s.replace('{{name ?? t.profile.unnamed}}', '{name ?? t.profile.unnamed}');
s = s.replace('{name ?? "Névtelen"}', '{name ?? t.profile.unnamed}');

// Profile edit button
s = s.replace('>Profil szerkesztése\n        </button>', '>{t.profile.edit_btn}\n        </button>');

// GOAL labels
s = s.replace('const GOAL_LABEL: Record<string,string> = {lose:"Fogyás",maintain:"Szinten tartás",gain:"Tömegelés"};', 
  'const GOAL_LABEL = (t: any): Record<string,string> => ({lose:t.profile.goal_lose, maintain:t.profile.goal_maintain, gain:t.profile.goal_gain});');
// LEVEL labels
s = s.replace('const LEVEL_LABEL: Record<string,string> = {beginner:"Kezdő",intermediate:"Középhaladó",advanced:"Haladó"};',
  'const LEVEL_LABEL = (t: any): Record<string,string> => ({beginner:t.profile.level_beginner, intermediate:t.profile.level_mid, advanced:t.profile.level_advanced});');

// Fix usage of GOAL_LABEL and LEVEL_LABEL (they're now functions)
s = s.replace('{GOAL_LABEL[meta.goal]}', '{GOAL_LABEL(t)[meta.goal]}');
s = s.replace('{LEVEL_LABEL[meta.level]}', '{LEVEL_LABEL(t)[meta.level]}');

// Stat labels in stats tab
s = s.replace('{label:"Edzés",value:String(workouts.length)},', '{label:t.profile.stat_workouts,value:String(workouts.length)},');
s = s.replace('{label:"Streak",value:streak ? `${streak}` : "—",unit:streak ? "nap" : undefined},', '{label:t.profile.stat_streak,value:streak ? `${streak}` : "—",unit:streak ? t.profile.stat_streak_unit : undefined},');
s = s.replace('{label:"Volume",value:fmtK(vol),unit:vol>0?"kg":undefined},', '{label:t.profile.stat_volume,value:fmtK(vol),unit:vol>0?"kg":undefined},');

// Section headers
s = s.replace('>TOP GYAKORLATOK</div>', '>{t.profile.top_exercises}</div>');
s = s.replace('>TESTSÚLY</div>', '>{t.profile.weight}</div>');
s = s.replace('+ Felvétel', '{t.profile.weight_add}');
s = s.replace('`${unlockedIds.size} / ${ACHIEVEMENTS.length} FELOLDVA`', '`${unlockedIds.size} / ${ACHIEVEMENTS.length} ${t.profile.achievements_count}`');

// Settings link subtitle
s = s.replace('>Sync, fiók, onboarding</div>', '>{t.profile.tech_settings_sub}</div>');

// WeightModal - add t prop or use hardcoded (modal is internal, pass t)
// Actually WeightModal has hardcoded HU - let's fix inline texts
s = s.replace('>Súly felvétele</div>', '>{t.profile.weight_modal_title}</div>');
s = s.replace('>Mégse\n            </button>', '>{t.common.cancel}\n            </button>');
s = s.replace('>Mentés ✓\n            </button>', '>{t.common.save}\n            </button>');

// WeightModal doesn't have access to t - it's a separate component
// We need to pass t or make it a closure. Let's convert it to an inline section approach.
// Actually simplest: pass the labels as props
// Let's update WeightModal signature
s = s.replace(
  'function WeightModal({ current, onSave, onClose }: {\n  current?: number; onSave: (kg: number) => void; onClose: () => void;\n})',
  'function WeightModal({ current, onSave, onClose, labels }: {\n  current?: number; onSave: (kg: number) => void; onClose: () => void;\n  labels: { title: string; cancel: string; save: string };\n})'
);
s = s.replace(
  '<div className="text-base font-black mb-4" style={{color:"var(--text-primary)"}}>Súly felvétele</div>',
  '<div className="text-base font-black mb-4" style={{color:"var(--text-primary)"}}>{labels.title}</div>'
);
s = s.replace(
  '>Mégse\n          </button>\n          <button onClick={() => { const n=parseFloat(val.replace(",",".")); if(n>0) { onSave(n); onClose(); }}}\n            className="flex-1 rounded-2xl py-3.5 text-sm font-black pressable"\n            style={{background:"var(--accent-primary)",color:"#000"}}>\n            Mentés ✓',
  '>{labels.cancel}\n          </button>\n          <button onClick={() => { const n=parseFloat(val.replace(",",".")); if(n>0) { onSave(n); onClose(); }}}\n            className="flex-1 rounded-2xl py-3.5 text-sm font-black pressable"\n            style={{background:"var(--accent-primary)",color:"#000"}}>\n            {labels.save}'
);
// Fix WeightModal usage - add labels prop
s = s.replace(
  '<WeightModal current={weightHistory[0]?.weightKg}',
  '<WeightModal current={weightHistory[0]?.weightKg}\n        labels={{title:t.profile.weight_modal_title,cancel:t.common.cancel,save:t.common.save}}'
);

// Edit modal titles
s = s.replace('>Profil szerkesztése</div>\n            <button onClick={() => setEditMode(false)}', '>{t.profile.edit_title}</div>\n            <button onClick={() => setEditMode(false)}');
s = s.replace('>Mégse\n            </button>\n          </div>\n          <div className="space-y-4">', '>{t.common.cancel}\n            </button>\n          </div>\n          <div className="space-y-4">');

// Edit field labels
s = s.replace('{label:"NÉV",value:editName,set:setEditName,type:"text",placeholder:"Teljes neved"},', '{label:t.profile.edit_name,value:editName,set:setEditName,type:"text",placeholder:""},');
s = s.replace('{label:"KOR",value:editAge,set:setEditAge,type:"number",placeholder:"éves"},', '{label:t.profile.edit_age,value:editAge,set:setEditAge,type:"number",placeholder:""},');
s = s.replace('{label:"MAGASSÁG (CM)",value:editHeight,set:setEditHeight,type:"number",placeholder:"cm"},', '{label:t.profile.edit_height,value:editHeight,set:setEditHeight,type:"number",placeholder:""},');

// Goal edit buttons
s = s.replace('{v:"lose",l:"Fogyás"},{v:"maintain",l:"Szinten"},{v:"gain",l:"Tömegelés"}', '{v:"lose",l:t.profile.goal_lose},{v:"maintain",l:t.profile.goal_maintain},{v:"gain",l:t.profile.goal_gain}');
// Level edit buttons  
s = s.replace('{v:"beginner",l:"Kezdő"},{v:"intermediate",l:"Közép"},{v:"advanced",l:"Haladó"}', '{v:"beginner",l:t.profile.level_beginner},{v:"intermediate",l:t.profile.level_mid},{v:"advanced",l:t.profile.level_advanced}');

// Save button in edit modal
s = s.replace('>Mentés ✓\n            </button>\n          </div>\n        </div>\n      </div>\n    )}', '>{t.common.save}\n            </button>\n          </div>\n        </div>\n      </div>\n    )}');

// WeightChart text
s = s.replace(
  'Legalább 2 mérés kell a grafikonhoz',
  '{/* i18n via prop */}\n      Legalább 2 mérés kell a grafikonhoz'
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/profile/page.tsx', s, 'utf8');
console.log('profile fixed, lines:', s.split('\n').length);
