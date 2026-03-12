// lib/i18n.ts — ARCX Internationalization
// 6 nyelv: magyar, angol, szlovák, cseh, német, spanyol
// Használat: const t = useTranslation(); t("workout.start")

export type Lang = "hu" | "en" | "sk" | "cs" | "de" | "es";
export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "hu", label: "Magyar",    flag: "🇭🇺" },
  { id: "en", label: "English",   flag: "🇬🇧" },
  { id: "sk", label: "Slovenčina",flag: "🇸🇰" },
  { id: "cs", label: "Čeština",   flag: "🇨🇿" },
  { id: "de", label: "Deutsch",   flag: "🇩🇪" },
  { id: "es", label: "Español",   flag: "🇪🇸" },
];
export const LS_LANG = "arcx:lang";

export type Translations = typeof HU;

const HU = {
  // ── Általános ──
  common: {
    save: "Mentés ✓",
    cancel: "Mégse",
    delete: "Törlés",
    close: "Bezárás",
    back: "Vissza",
    all: "Összes",
    loading: "Betöltés…",
    error: "Hiba történt",
    confirm: "Megerősítés",
    yes: "Igen",
    no: "Nem",
    new: "Új",
    edit: "Szerkesztés",
    add: "Hozzáadás",
    search: "Keresés…",
    settings: "Beállítások",
    profile: "Profil",
    soon: "Hamarosan",
  },
  // ── Nav ──
  nav: {
    home: "Főoldal",
    workout: "Edzés",
    programs: "Programok",
    progress: "Progress",
    calendar: "Naptár",
    profile: "Profil",
    exercises: "Gyakorlatok",
    team: "Csapat",
  },
  // ── Home ──
  home: {
    greeting_morning: "Jó reggelt",
    greeting_afternoon: "Jó napot",
    greeting_evening: "Jó estét",
    hero_active: "AKTÍV EDZÉS",
    hero_today: "MAI EDZÉS",
    hero_continue: "Folytatás",
    hero_start: "Kezdés",
    hero_cta_continue: "Folytatás →",
    hero_cta_start: "Edzés indítása →",
    hero_last: "Utolsó",
    hero_no_workout: "Még nincs edzésed — ideje elkezdeni",
    stats_streak: "nap streak",
    stats_workouts: "edzés / 30n",
    stats_volume: "kg volume",
    this_week: "EZEN A HÉTEN",
    programs: "PROGRAMOK",
    programs_all: "Összes →",
    programs_per_week: "edzés/hét",
    quick_access: "GYORS ELÉRÉS",
    quick_calendar: "Naptár",
    quick_stats: "Statisztika",
    quick_profile: "Profil",
  },
  // ── Workout ──
  workout: {
    title: "EDZÉS",
    today: "Mai edzés",
    today_program: "MAI PROGRAM",
    start: "Edzés indítása →",
    last: "Utolsó",
    exercise_count: "gyakorlat",
    active: "AKTÍV EDZÉS",
    add_exercise: "+ Gyakorlat",
    finish: "Befejezés ✓",
    discard: "Eldobás ✕",
    add_first: "+ Adj hozzá egy gyakorlatot",
    confirm_discard: "Eldobod az aktuális edzést?",
    confirm_empty: "Üres edzés. Mented így is?",
    confirm_no_sets: "Nincs kitöltött set. Mented így is?",
    saved_local: "Elmentve lokálisan",
    saved_cloud: "Elmentve",
    saved_local_body: "Vendég / lokális profil.",
    saved_cloud_body: "Lokálisan és a felhőbe is.",
    saved_offline: "Offline vagy hiba. Szinkron később automatikusan.",
    pr_new: "Új személyes rekord!",
    pr_more: "más",
    rest_timer: "Pihenő",
    set: "set",
    sets: "set",
    vol: "vol",
  },
  // ── Progress ──
  progress: {
    title: "Progress",
    tab_overview: "Áttekintés",
    tab_prs: "PR",
    tab_history: "Edzések",
    total_workouts: "Összes edzés",
    streak: "Streak",
    total_volume: "Összes volume",
    avg_per_week: "Átlag/hét",
    last_30: "az elmúlt 30 napban",
    last_7: "edzés 7 napban",
    kg_total: "kg összesen",
    per_week_30: "edzés/hét (30n)",
    chart: "GRAFIKON",
    chart_volume: "Volume",
    chart_freq: "Frekvencia",
    top_exercises: "TOP GYAKORLATOK",
    no_workouts: "Még nincs mentett edzés",
    cloud_wrong_user: "Cloud profil aktív, de nincs bejelentkezve. Lépj be újra.",
    cloud_loading: "Cloud adatok betöltése…",
    delete_workout: "Törlöd ezt az edzést?",
    delete_all: "Minden edzést törölsz?",
    csv_export: "CSV export",
    delete_all_btn: "Összes törlése",
    pr_none: "Még nincs PR",
    pr_none_sub: "Végezz el egy edzést és automatikusan megjelennek a személyes rekordjaid",
    pr_exercises: "GYAKORLAT",
    pr_best_weight: "LEGJOBB SÚLY",
    pr_best_set: "SZEMÉLYES REKORD",
    pr_chart_btn: "Grafikon →",
    pr_history: "ELŐZMÉNYEK",
    pr_sessions: "alkalom",
    pr_sets: "szet",
    pr_total_sets: "Össz. szet",
    pr_best_vol: "Legjobb vol.",
    pr_total_vol: "Össz. vol.",
    pr_occasions: "Alkalmak",
    pr_min_chart: "Legalább 2 edzés kell a grafikonhoz",
    nap: "nap",
    days: "nap",
  },
  // ── Profile ──
  profile: {
    title: "Profil",
    unnamed: "Névtelen",
    edit_btn: "Profil szerkesztése",
    tab_stats: "Statisztika",
    tab_achievements: "Achievementek",
    tab_appearance: "Megjelenés",
    stat_workouts: "Edzés",
    stat_streak: "Streak",
    stat_volume: "Volume",
    stat_streak_unit: "nap",
    top_exercises: "TOP GYAKORLATOK",
    weight: "TESTSÚLY",
    weight_add: "+ Felvétel",
    weight_modal_title: "Súly felvétele",
    achievements_count: "FELOLDVA",
    xp_label: "XP",
    theme_label: "TÉMA SZÍN",
    lang_label: "NYELV",
    tech_settings: "Technikai beállítások",
    tech_settings_sub: "Sync, fiók, onboarding",
    edit_name: "NÉV",
    edit_age: "KOR",
    edit_height: "MAGASSÁG (CM)",
    edit_goal: "CÉL",
    edit_level: "SZINT",
    goal_lose: "Fogyás",
    goal_maintain: "Szinten",
    goal_gain: "Tömegelés",
    level_beginner: "Kezdő",
    level_mid: "Közép",
    level_advanced: "Haladó",
    edit_title: "Profil szerkesztése",
    weight_chart_min: "Legalább 2 mérés kell a grafikonhoz",
  },
  // ── Settings ──
  settings: {
    title: "Beállítások",
    subtitle: "Értesítések, szinkron, fiók",
    notif_section: "🔔 ÉRTESÍTÉSEK",
    notif_unsupported: "A böngésződ nem támogatja a push értesítéseket.",
    notif_enable: "Értesítések bekapcsolása",
    notif_status: "Állapot",
    notif_granted: "Engedélyezve",
    notif_denied: "Blokkolva",
    notif_default: "Nincs beállítva",
    notif_daily: "Napi emlékeztető",
    notif_daily_sub: "Minden nap figyelmeztet az edzésre",
    notif_time: "Értesítés időpontja:",
    notif_days: "Melyik napokon:",
    notif_streak: "Streak veszély értesítés",
    notif_streak_sub: "napja nem edzettél",
    notif_post: "Edzés utáni motiváció",
    notif_post_sub: "30 perccel az edzés után küld egy üzenetet",
    notif_test: "🔔 Teszt értesítés küldése",
    notif_sent: "✓ Elküldve!",
    notif_blocked: "Az értesítések blokkolva vannak. Engedélyezd a böngésző beállításokban, majd töltsd újra az oldalt.",
    notif_blocked_alert: "Az értesítések blokkolva vannak. Engedélyezd a böngészőben.",
    sync_section: "☁️ FELHŐ SZINKRON",
    app_section: "ℹ️ APP",
    app_name: "ARCX",
    app_sub: "Edzésnapló PWA · v1.0",
    app_offline: "Offline-first",
    app_offline_sub: "Minden adat lokálban tárolódik",
    app_profile: "Profil & Achievements",
    app_profile_sub: "XP, szintek, achievementek",
    account_section: "👤 FIÓK",
    account_logged: "Belépve",
    account_google_linked: "Google összekapcsolva",
    account_google_linked_sub: "Google-lel és email/jelszóval is beléphetsz",
    account_google_unlink: "Leválaszt",
    account_google_link: "Google összekapcsolása",
    account_google_link_sub: "Ezután Google-lel is beléphetsz",
    account_linking: "Összekapcsolás...",
  },
  // ── Programs ──
  programs: {
    title: "Programok",
    catalog: "Katalógus",
    browse: "Felfedezés",
    mine: "Saját",
    search: "Keresés…",
    results: "TALÁLAT",
    no_results: "Nincs találat",
    featured: "🔥 Kiemelt programok",
    gym: "🏋️ Edzőterem",
    running: "🏃 Futás",
    boxing: "🥊 Box",
    empty_title: "Még nincs saját programod",
    empty_sub: "Válassz egy sablont a Felfedezés tabban",
    empty_btn: "Sablonok böngészése →",
    mine_label: "SAJÁT PROGRAMOK",
    owned: "✓ Megvan",
  },
  // ── Calendar ──
  calendar: {
    this_week: "Ez a hét",
    session_picker_title: "Session hozzáadása",
    session_added: "hozzáadva",
    no_sessions: "Nincs session",
  },
};

const EN: Translations = {
  common: { save:"Save ✓", cancel:"Cancel", delete:"Delete", close:"Close", back:"Back", all:"All", loading:"Loading…", error:"An error occurred", confirm:"Confirm", yes:"Yes", no:"No", new:"New", edit:"Edit", add:"Add", search:"Search…", settings:"Settings", profile:"Profile", soon:"Coming soon" },
  nav: { home:"Home", workout:"Workout", programs:"Programs", progress:"Progress", calendar:"Calendar", profile:"Profile", exercises:"Exercises", team:"Team" },
  home: { greeting_morning:"Good morning", greeting_afternoon:"Good afternoon", greeting_evening:"Good evening", hero_active:"ACTIVE WORKOUT", hero_today:"TODAY'S WORKOUT", hero_continue:"Continue", hero_start:"Start", hero_cta_continue:"Continue →", hero_cta_start:"Start workout →", hero_last:"Last", hero_no_workout:"No workouts yet — time to start", stats_streak:"day streak", stats_workouts:"workouts / 30d", stats_volume:"kg volume", this_week:"THIS WEEK", programs:"PROGRAMS", programs_all:"All →", programs_per_week:"sessions/week", quick_access:"QUICK ACCESS", quick_calendar:"Calendar", quick_stats:"Statistics", quick_profile:"Profile" },
  workout: { title:"WORKOUT", today:"Today's Workout", today_program:"TODAY'S PROGRAM", start:"Start workout →", last:"Last", exercise_count:"exercises", active:"ACTIVE WORKOUT", add_exercise:"+ Exercise", finish:"Finish ✓", discard:"Discard ✕", add_first:"+ Add an exercise", confirm_discard:"Discard this workout?", confirm_empty:"Empty workout. Save anyway?", confirm_no_sets:"No completed sets. Save anyway?", saved_local:"Saved locally", saved_cloud:"Saved", saved_local_body:"Guest / local profile.", saved_cloud_body:"Saved locally and to the cloud.", saved_offline:"Offline or error. Sync will happen automatically.", pr_new:"New personal record!", pr_more:"more", rest_timer:"Rest", set:"set", sets:"sets", vol:"vol" },
  progress: { title:"Progress", tab_overview:"Overview", tab_prs:"PRs", tab_history:"Workouts", total_workouts:"Total workouts", streak:"Streak", total_volume:"Total volume", avg_per_week:"Avg/week", last_30:"in the last 30 days", last_7:"workouts in 7 days", kg_total:"kg total", per_week_30:"workouts/week (30d)", chart:"CHART", chart_volume:"Volume", chart_freq:"Frequency", top_exercises:"TOP EXERCISES", no_workouts:"No workouts saved yet", cloud_wrong_user:"Cloud profile active but not signed in. Sign in again.", cloud_loading:"Loading cloud data…", delete_workout:"Delete this workout?", delete_all:"Delete all workouts?", csv_export:"CSV export", delete_all_btn:"Delete all", pr_none:"No PRs yet", pr_none_sub:"Complete a workout and your personal records will appear automatically", pr_exercises:"EXERCISES", pr_best_weight:"BEST WEIGHT", pr_best_set:"PERSONAL RECORD", pr_chart_btn:"Chart →", pr_history:"HISTORY", pr_sessions:"sessions", pr_sets:"sets", pr_total_sets:"Total sets", pr_best_vol:"Best set vol.", pr_total_vol:"Total vol.", pr_occasions:"Sessions", pr_min_chart:"At least 2 workouts needed for the chart", nap:"day", days:"days" },
  profile: { title:"Profile", unnamed:"Unnamed", edit_btn:"Edit profile", tab_stats:"Statistics", tab_achievements:"Achievements", tab_appearance:"Appearance", stat_workouts:"Workouts", stat_streak:"Streak", stat_volume:"Volume", stat_streak_unit:"days", top_exercises:"TOP EXERCISES", weight:"BODY WEIGHT", weight_add:"+ Add", weight_modal_title:"Log weight", achievements_count:"UNLOCKED", xp_label:"XP", theme_label:"THEME COLOR", lang_label:"LANGUAGE", tech_settings:"Technical settings", tech_settings_sub:"Sync, account, onboarding", edit_name:"NAME", edit_age:"AGE", edit_height:"HEIGHT (CM)", edit_goal:"GOAL", edit_level:"LEVEL", goal_lose:"Lose weight", goal_maintain:"Maintain", goal_gain:"Gain muscle", level_beginner:"Beginner", level_mid:"Intermediate", level_advanced:"Advanced", edit_title:"Edit profile", weight_chart_min:"At least 2 measurements needed for the chart" },
  settings: { title:"Settings", subtitle:"Notifications, sync, account", notif_section:"🔔 NOTIFICATIONS", notif_unsupported:"Your browser does not support push notifications.", notif_enable:"Enable notifications", notif_status:"Status", notif_granted:"Enabled", notif_denied:"Blocked", notif_default:"Not set", notif_daily:"Daily reminder", notif_daily_sub:"Reminds you to work out every day", notif_time:"Notification time:", notif_days:"Which days:", notif_streak:"Streak danger alert", notif_streak_sub:"days without a workout", notif_post:"Post-workout motivation", notif_post_sub:"Sends a message 30 min after your workout", notif_test:"🔔 Send test notification", notif_sent:"✓ Sent!", notif_blocked:"Notifications are blocked. Enable them in browser settings, then reload.", notif_blocked_alert:"Notifications are blocked. Enable them in your browser.", sync_section:"☁️ CLOUD SYNC", app_section:"ℹ️ APP", app_name:"ARCX", app_sub:"Workout log PWA · v1.0", app_offline:"Offline-first", app_offline_sub:"All data stored locally", app_profile:"Profile & Achievements", app_profile_sub:"XP, levels, achievements", account_section:"👤 ACCOUNT", account_logged:"Signed in as", account_google_linked:"Google connected", account_google_linked_sub:"You can sign in with Google or email/password", account_google_unlink:"Disconnect", account_google_link:"Connect Google", account_google_link_sub:"Then sign in with Google too", account_linking:"Connecting..." },
  programs: { title:"Programs", catalog:"Catalog", browse:"Explore", mine:"My programs", search:"Search…", results:"RESULTS", no_results:"No results", featured:"🔥 Featured programs", gym:"🏋️ Gym", running:"🏃 Running", boxing:"🥊 Boxing", empty_title:"No programs yet", empty_sub:"Choose a template in the Explore tab", empty_btn:"Browse templates →", mine_label:"MY PROGRAMS", owned:"✓ Added" },
  calendar: { this_week:"This week", session_picker_title:"Add session", session_added:"added", no_sessions:"No sessions" },
};

const SK: Translations = {
  common: { save:"Uložiť ✓", cancel:"Zrušiť", delete:"Vymazať", close:"Zavrieť", back:"Späť", all:"Všetky", loading:"Načítava sa…", error:"Nastala chyba", confirm:"Potvrdiť", yes:"Áno", no:"Nie", new:"Nový", edit:"Upraviť", add:"Pridať", search:"Hľadať…", settings:"Nastavenia", profile:"Profil", soon:"Čoskoro" },
  nav: { home:"Domov", workout:"Tréning", programs:"Programy", progress:"Pokrok", calendar:"Kalendár", profile:"Profil", exercises:"Cvičenia", team:"Tím" },
  home: { greeting_morning:"Dobré ráno", greeting_afternoon:"Dobrý deň", greeting_evening:"Dobrý večer", hero_active:"AKTÍVNY TRÉNING", hero_today:"DNEŠNÝ TRÉNING", hero_continue:"Pokračovať", hero_start:"Začať", hero_cta_continue:"Pokračovať →", hero_cta_start:"Spustiť tréning →", hero_last:"Posledný", hero_no_workout:"Ešte žiadny tréning — čas začať", stats_streak:"dní rad", stats_workouts:"tréningy / 30d", stats_volume:"kg objem", this_week:"TENTO TÝŽDEŇ", programs:"PROGRAMY", programs_all:"Všetky →", programs_per_week:"tréningy/týždeň", quick_access:"RÝCHLY PRÍSTUP", quick_calendar:"Kalendár", quick_stats:"Štatistika", quick_profile:"Profil" },
  workout: { title:"TRÉNING", today:"Dnešný tréning", today_program:"DNEŠNÝ PROGRAM", start:"Spustiť tréning →", last:"Posledný", exercise_count:"cvičení", active:"AKTÍVNY TRÉNING", add_exercise:"+ Cvičenie", finish:"Dokončiť ✓", discard:"Zahodiť ✕", add_first:"+ Pridaj cvičenie", confirm_discard:"Zahodiť tento tréning?", confirm_empty:"Prázdny tréning. Napriek tomu uložiť?", confirm_no_sets:"Žiadne dokončené série. Napriek tomu uložiť?", saved_local:"Uložené lokálne", saved_cloud:"Uložené", saved_local_body:"Hosť / lokálny profil.", saved_cloud_body:"Uložené lokálne aj do cloudu.", saved_offline:"Offline alebo chyba. Synchronizácia prebehne automaticky.", pr_new:"Nový osobný rekord!", pr_more:"ďalšie", rest_timer:"Odpočinok", set:"séria", sets:"série", vol:"objem" },
  progress: { title:"Pokrok", tab_overview:"Prehľad", tab_prs:"OR", tab_history:"Tréningy", total_workouts:"Celkom tréningov", streak:"Séria", total_volume:"Celkový objem", avg_per_week:"Priemer/týždeň", last_30:"za posledných 30 dní", last_7:"tréningov za 7 dní", kg_total:"kg celkom", per_week_30:"tréningy/týždeň (30d)", chart:"GRAF", chart_volume:"Objem", chart_freq:"Frekvencia", top_exercises:"TOP CVIČENIA", no_workouts:"Ešte žiadne uložené tréningy", cloud_wrong_user:"Cloud profil aktívny, ale nie ste prihlásený. Prihláste sa znova.", cloud_loading:"Načítavajú sa dáta z cloudu…", delete_workout:"Vymazať tento tréning?", delete_all:"Vymazať všetky tréningy?", csv_export:"Export CSV", delete_all_btn:"Vymazať všetko", pr_none:"Zatiaľ žiadne OR", pr_none_sub:"Dokončite tréning a osobné rekordy sa zobrazia automaticky", pr_exercises:"CVIČENIE", pr_best_weight:"NAJLEPŠIA VÁHA", pr_best_set:"OSOBNÝ REKORD", pr_chart_btn:"Graf →", pr_history:"HISTÓRIA", pr_sessions:"príležitostí", pr_sets:"sérií", pr_total_sets:"Celkom sérií", pr_best_vol:"Najlepší objem", pr_total_vol:"Celkový objem", pr_occasions:"Príležitosti", pr_min_chart:"Na graf sú potrebné aspoň 2 tréningy", nap:"deň", days:"dní" },
  profile: { title:"Profil", unnamed:"Bez mena", edit_btn:"Upraviť profil", tab_stats:"Štatistika", tab_achievements:"Úspechy", tab_appearance:"Vzhľad", stat_workouts:"Tréningy", stat_streak:"Séria", stat_volume:"Objem", stat_streak_unit:"dní", top_exercises:"TOP CVIČENIA", weight:"TELESNÁ VÁHA", weight_add:"+ Pridať", weight_modal_title:"Zaznamenať váhu", achievements_count:"ODOMKNUTÉ", xp_label:"XP", theme_label:"FARBA TÉMY", lang_label:"JAZYK", tech_settings:"Technické nastavenia", tech_settings_sub:"Sync, účet, onboarding", edit_name:"MENO", edit_age:"VEK", edit_height:"VÝŠKA (CM)", edit_goal:"CIEĽ", edit_level:"ÚROVEŇ", goal_lose:"Chudnúť", goal_maintain:"Udržiavať", goal_gain:"Naberať svaly", level_beginner:"Začiatočník", level_mid:"Stredne pokročilý", level_advanced:"Pokročilý", edit_title:"Upraviť profil", weight_chart_min:"Na graf sú potrebné aspoň 2 merania" },
  settings: { title:"Nastavenia", subtitle:"Notifikácie, sync, účet", notif_section:"🔔 NOTIFIKÁCIE", notif_unsupported:"Váš prehliadač nepodporuje push notifikácie.", notif_enable:"Zapnúť notifikácie", notif_status:"Stav", notif_granted:"Povolené", notif_denied:"Blokované", notif_default:"Nenastavené", notif_daily:"Denná pripomienka", notif_daily_sub:"Každý deň vás upozorní na tréning", notif_time:"Čas notifikácie:", notif_days:"Ktoré dni:", notif_streak:"Upozornenie na sériu", notif_streak_sub:"dní bez tréningu", notif_post:"Motivácia po tréningu", notif_post_sub:"Odošle správu 30 minút po tréningu", notif_test:"🔔 Odoslať testovaciu notifikáciu", notif_sent:"✓ Odoslané!", notif_blocked:"Notifikácie sú blokované. Povoľte ich v nastaveniach prehliadača.", notif_blocked_alert:"Notifikácie sú blokované. Povoľte ich v prehliadači.", sync_section:"☁️ CLOUD SYNC", app_section:"ℹ️ APLIKÁCIA", app_name:"ARCX", app_sub:"Tréningový denník PWA · v1.0", app_offline:"Offline-first", app_offline_sub:"Všetky dáta uložené lokálne", app_profile:"Profil a úspechy", app_profile_sub:"XP, úrovne, úspechy", account_section:"👤 ÚČET", account_logged:"Prihlásený ako", account_google_linked:"Google prepojený", account_google_linked_sub:"Môžete sa prihlásiť pomocou Google alebo emailu", account_google_unlink:"Odpojiť", account_google_link:"Prepojiť Google", account_google_link_sub:"Potom sa prihlásiť aj cez Google", account_linking:"Prepájam..." },
  programs: { title:"Programy", catalog:"Katalóg", browse:"Objavovať", mine:"Moje programy", search:"Hľadať…", results:"VÝSLEDKY", no_results:"Žiadne výsledky", featured:"🔥 Odporúčané programy", gym:"🏋️ Posilňovňa", running:"🏃 Beh", boxing:"🥊 Box", empty_title:"Zatiaľ žiadne programy", empty_sub:"Vyberte si šablónu na karte Objavovať", empty_btn:"Prehliadať šablóny →", mine_label:"MOJE PROGRAMY", owned:"✓ Pridané" },
  calendar: { this_week:"Tento týždeň", session_picker_title:"Pridať session", session_added:"pridané", no_sessions:"Žiadne sessiony" },
};

const CS: Translations = {
  common: { save:"Uložit ✓", cancel:"Zrušit", delete:"Smazat", close:"Zavřít", back:"Zpět", all:"Vše", loading:"Načítání…", error:"Nastala chyba", confirm:"Potvrdit", yes:"Ano", no:"Ne", new:"Nový", edit:"Upravit", add:"Přidat", search:"Hledat…", settings:"Nastavení", profile:"Profil", soon:"Brzy" },
  nav: { home:"Domů", workout:"Trénink", programs:"Programy", progress:"Pokrok", calendar:"Kalendář", profile:"Profil", exercises:"Cvičení", team:"Tým" },
  home: { greeting_morning:"Dobré ráno", greeting_afternoon:"Dobrý den", greeting_evening:"Dobrý večer", hero_active:"AKTIVNÍ TRÉNINK", hero_today:"DNEŠNÍ TRÉNINK", hero_continue:"Pokračovat", hero_start:"Začít", hero_cta_continue:"Pokračovat →", hero_cta_start:"Spustit trénink →", hero_last:"Poslední", hero_no_workout:"Zatím žádný trénink — čas začít", stats_streak:"dní v řadě", stats_workouts:"tréninky / 30d", stats_volume:"kg objem", this_week:"TENTO TÝDEN", programs:"PROGRAMY", programs_all:"Vše →", programs_per_week:"tréninky/týden", quick_access:"RYCHLÝ PŘÍSTUP", quick_calendar:"Kalendář", quick_stats:"Statistiky", quick_profile:"Profil" },
  workout: { title:"TRÉNINK", today:"Dnešní trénink", today_program:"DNEŠNÍ PROGRAM", start:"Spustit trénink →", last:"Poslední", exercise_count:"cvičení", active:"AKTIVNÍ TRÉNINK", add_exercise:"+ Cvičení", finish:"Dokončit ✓", discard:"Zahodit ✕", add_first:"+ Přidej cvičení", confirm_discard:"Zahodit tento trénink?", confirm_empty:"Prázdný trénink. Přesto uložit?", confirm_no_sets:"Žádné dokončené série. Přesto uložit?", saved_local:"Uloženo lokálně", saved_cloud:"Uloženo", saved_local_body:"Hostující / lokální profil.", saved_cloud_body:"Uloženo lokálně i do cloudu.", saved_offline:"Offline nebo chyba. Synchronizace proběhne automaticky.", pr_new:"Nový osobní rekord!", pr_more:"další", rest_timer:"Odpočinek", set:"série", sets:"série", vol:"objem" },
  progress: { title:"Pokrok", tab_overview:"Přehled", tab_prs:"OR", tab_history:"Tréninky", total_workouts:"Celkem tréninků", streak:"Série", total_volume:"Celkový objem", avg_per_week:"Průměr/týden", last_30:"za posledních 30 dní", last_7:"tréninků za 7 dní", kg_total:"kg celkem", per_week_30:"tréninky/týden (30d)", chart:"GRAF", chart_volume:"Objem", chart_freq:"Frekvence", top_exercises:"TOP CVIČENÍ", no_workouts:"Zatím žádné uložené tréninky", cloud_wrong_user:"Cloud profil aktivní, ale nejste přihlášeni. Přihlaste se znovu.", cloud_loading:"Načítání cloudových dat…", delete_workout:"Smazat tento trénink?", delete_all:"Smazat všechny tréninky?", csv_export:"Export CSV", delete_all_btn:"Smazat vše", pr_none:"Zatím žádné OR", pr_none_sub:"Dokončete trénink a osobní rekordy se zobrazí automaticky", pr_exercises:"CVIČENÍ", pr_best_weight:"NEJLEPŠÍ VÁHA", pr_best_set:"OSOBNÍ REKORD", pr_chart_btn:"Graf →", pr_history:"HISTORIE", pr_sessions:"příležitostí", pr_sets:"sérií", pr_total_sets:"Celkem sérií", pr_best_vol:"Nejlepší objem", pr_total_vol:"Celkový objem", pr_occasions:"Příležitosti", pr_min_chart:"Na graf jsou potřeba alespoň 2 tréninky", nap:"den", days:"dní" },
  profile: { title:"Profil", unnamed:"Bez jména", edit_btn:"Upravit profil", tab_stats:"Statistiky", tab_achievements:"Úspěchy", tab_appearance:"Vzhled", stat_workouts:"Tréninky", stat_streak:"Série", stat_volume:"Objem", stat_streak_unit:"dní", top_exercises:"TOP CVIČENÍ", weight:"TĚLESNÁ VÁHA", weight_add:"+ Přidat", weight_modal_title:"Zapsat váhu", achievements_count:"ODEMČENO", xp_label:"XP", theme_label:"BARVA TÉMATU", lang_label:"JAZYK", tech_settings:"Technická nastavení", tech_settings_sub:"Sync, účet, onboarding", edit_name:"JMÉNO", edit_age:"VĚK", edit_height:"VÝŠKA (CM)", edit_goal:"CÍL", edit_level:"ÚROVEŇ", goal_lose:"Hubnout", goal_maintain:"Udržovat", goal_gain:"Nabírat svaly", level_beginner:"Začátečník", level_mid:"Středně pokročilý", level_advanced:"Pokročilý", edit_title:"Upravit profil", weight_chart_min:"Na graf jsou potřeba alespoň 2 měření" },
  settings: { title:"Nastavení", subtitle:"Oznámení, sync, účet", notif_section:"🔔 OZNÁMENÍ", notif_unsupported:"Váš prohlížeč nepodporuje push oznámení.", notif_enable:"Zapnout oznámení", notif_status:"Stav", notif_granted:"Povoleno", notif_denied:"Blokováno", notif_default:"Nenastaveno", notif_daily:"Denní připomínka", notif_daily_sub:"Každý den vás upozorní na trénink", notif_time:"Čas oznámení:", notif_days:"Které dny:", notif_streak:"Upozornění na sérii", notif_streak_sub:"dní bez tréninku", notif_post:"Motivace po tréninku", notif_post_sub:"Odešle zprávu 30 minut po tréninku", notif_test:"🔔 Odeslat testovací oznámení", notif_sent:"✓ Odesláno!", notif_blocked:"Oznámení jsou blokována. Povolte je v nastavení prohlížeče.", notif_blocked_alert:"Oznámení jsou blokována. Povolte je v prohlížeči.", sync_section:"☁️ CLOUD SYNC", app_section:"ℹ️ APLIKACE", app_name:"ARCX", app_sub:"Tréninkový deník PWA · v1.0", app_offline:"Offline-first", app_offline_sub:"Veškerá data uložena lokálně", app_profile:"Profil & Úspěchy", app_profile_sub:"XP, úrovně, úspěchy", account_section:"👤 ÚČET", account_logged:"Přihlášen jako", account_google_linked:"Google propojen", account_google_linked_sub:"Můžete se přihlásit přes Google nebo e-mail", account_google_unlink:"Odpojit", account_google_link:"Propojit Google", account_google_link_sub:"Pak se přihlásit i přes Google", account_linking:"Propojuji..." },
  programs: { title:"Programy", catalog:"Katalog", browse:"Objevovat", mine:"Moje programy", search:"Hledat…", results:"VÝSLEDKY", no_results:"Žádné výsledky", featured:"🔥 Doporučené programy", gym:"🏋️ Posilovna", running:"🏃 Běh", boxing:"🥊 Box", empty_title:"Zatím žádné programy", empty_sub:"Vyberte šablonu na kartě Objevovat", empty_btn:"Procházet šablony →", mine_label:"MOJE PROGRAMY", owned:"✓ Přidáno" },
  calendar: { this_week:"Tento týden", session_picker_title:"Přidat session", session_added:"přidáno", no_sessions:"Žádné sessiony" },
};

const DE: Translations = {
  common: { save:"Speichern ✓", cancel:"Abbrechen", delete:"Löschen", close:"Schließen", back:"Zurück", all:"Alle", loading:"Lädt…", error:"Ein Fehler ist aufgetreten", confirm:"Bestätigen", yes:"Ja", no:"Nein", new:"Neu", edit:"Bearbeiten", add:"Hinzufügen", search:"Suchen…", settings:"Einstellungen", profile:"Profil", soon:"Demnächst" },
  nav: { home:"Start", workout:"Training", programs:"Programme", progress:"Fortschritt", calendar:"Kalender", profile:"Profil", exercises:"Übungen", team:"Team" },
  home: { greeting_morning:"Guten Morgen", greeting_afternoon:"Guten Tag", greeting_evening:"Guten Abend", hero_active:"AKTIVES TRAINING", hero_today:"HEUTIGES TRAINING", hero_continue:"Fortfahren", hero_start:"Starten", hero_cta_continue:"Fortfahren →", hero_cta_start:"Training starten →", hero_last:"Letztes", hero_no_workout:"Noch kein Training — Zeit anzufangen", stats_streak:"Tage Serie", stats_workouts:"Trainings / 30T", stats_volume:"kg Volumen", this_week:"DIESE WOCHE", programs:"PROGRAMME", programs_all:"Alle →", programs_per_week:"Einheiten/Woche", quick_access:"SCHNELLZUGRIFF", quick_calendar:"Kalender", quick_stats:"Statistiken", quick_profile:"Profil" },
  workout: { title:"TRAINING", today:"Heutiges Training", today_program:"HEUTIGES PROGRAMM", start:"Training starten →", last:"Letztes", exercise_count:"Übungen", active:"AKTIVES TRAINING", add_exercise:"+ Übung", finish:"Beenden ✓", discard:"Verwerfen ✕", add_first:"+ Übung hinzufügen", confirm_discard:"Dieses Training verwerfen?", confirm_empty:"Leeres Training. Trotzdem speichern?", confirm_no_sets:"Keine abgeschlossenen Sätze. Trotzdem speichern?", saved_local:"Lokal gespeichert", saved_cloud:"Gespeichert", saved_local_body:"Gast / lokales Profil.", saved_cloud_body:"Lokal und in der Cloud gespeichert.", saved_offline:"Offline oder Fehler. Sync erfolgt automatisch.", pr_new:"Neuer persönlicher Rekord!", pr_more:"weitere", rest_timer:"Pause", set:"Satz", sets:"Sätze", vol:"Vol." },
  progress: { title:"Fortschritt", tab_overview:"Übersicht", tab_prs:"PR", tab_history:"Trainings", total_workouts:"Trainings gesamt", streak:"Serie", total_volume:"Gesamtvolumen", avg_per_week:"Ø/Woche", last_30:"in den letzten 30 Tagen", last_7:"Trainings in 7 Tagen", kg_total:"kg gesamt", per_week_30:"Trainings/Woche (30T)", chart:"GRAFIK", chart_volume:"Volumen", chart_freq:"Häufigkeit", top_exercises:"TOP-ÜBUNGEN", no_workouts:"Noch keine gespeicherten Trainings", cloud_wrong_user:"Cloud-Profil aktiv, aber nicht angemeldet. Bitte erneut anmelden.", cloud_loading:"Cloud-Daten werden geladen…", delete_workout:"Dieses Training löschen?", delete_all:"Alle Trainings löschen?", csv_export:"CSV-Export", delete_all_btn:"Alle löschen", pr_none:"Noch keine PRs", pr_none_sub:"Schließe ein Training ab und deine persönlichen Rekorde erscheinen automatisch", pr_exercises:"ÜBUNG", pr_best_weight:"BESTES GEWICHT", pr_best_set:"PERSÖNLICHER REKORD", pr_chart_btn:"Grafik →", pr_history:"VERLAUF", pr_sessions:"Einheiten", pr_sets:"Sätze", pr_total_sets:"Sätze gesamt", pr_best_vol:"Bestes Vol.", pr_total_vol:"Gesamt-Vol.", pr_occasions:"Einheiten", pr_min_chart:"Mindestens 2 Trainings für die Grafik nötig", nap:"Tag", days:"Tage" },
  profile: { title:"Profil", unnamed:"Kein Name", edit_btn:"Profil bearbeiten", tab_stats:"Statistiken", tab_achievements:"Erfolge", tab_appearance:"Darstellung", stat_workouts:"Trainings", stat_streak:"Serie", stat_volume:"Volumen", stat_streak_unit:"Tage", top_exercises:"TOP-ÜBUNGEN", weight:"KÖRPERGEWICHT", weight_add:"+ Eintragen", weight_modal_title:"Gewicht eintragen", achievements_count:"FREIGESCHALTET", xp_label:"XP", theme_label:"DESIGNFARBE", lang_label:"SPRACHE", tech_settings:"Technische Einstellungen", tech_settings_sub:"Sync, Konto, Onboarding", edit_name:"NAME", edit_age:"ALTER", edit_height:"GRÖSSE (CM)", edit_goal:"ZIEL", edit_level:"LEVEL", goal_lose:"Abnehmen", goal_maintain:"Halten", goal_gain:"Aufbauen", level_beginner:"Anfänger", level_mid:"Mittelfortgeschritten", level_advanced:"Fortgeschritten", edit_title:"Profil bearbeiten", weight_chart_min:"Mindestens 2 Messungen für die Grafik nötig" },
  settings: { title:"Einstellungen", subtitle:"Benachrichtigungen, Sync, Konto", notif_section:"🔔 BENACHRICHTIGUNGEN", notif_unsupported:"Dein Browser unterstützt keine Push-Benachrichtigungen.", notif_enable:"Benachrichtigungen aktivieren", notif_status:"Status", notif_granted:"Erlaubt", notif_denied:"Blockiert", notif_default:"Nicht eingestellt", notif_daily:"Tägliche Erinnerung", notif_daily_sub:"Erinnert dich täglich ans Training", notif_time:"Benachrichtigungszeit:", notif_days:"Welche Tage:", notif_streak:"Serien-Alarm", notif_streak_sub:"Tage ohne Training", notif_post:"Motivation nach dem Training", notif_post_sub:"Sendet 30 Minuten nach dem Training eine Nachricht", notif_test:"🔔 Testbenachrichtigung senden", notif_sent:"✓ Gesendet!", notif_blocked:"Benachrichtigungen sind blockiert. Aktiviere sie in den Browsereinstellungen.", notif_blocked_alert:"Benachrichtigungen sind blockiert. Aktiviere sie im Browser.", sync_section:"☁️ CLOUD-SYNC", app_section:"ℹ️ APP", app_name:"ARCX", app_sub:"Trainings-PWA · v1.0", app_offline:"Offline-first", app_offline_sub:"Alle Daten lokal gespeichert", app_profile:"Profil & Erfolge", app_profile_sub:"XP, Level, Erfolge", account_section:"👤 KONTO", account_logged:"Angemeldet als", account_google_linked:"Google verknüpft", account_google_linked_sub:"Du kannst dich mit Google oder E-Mail anmelden", account_google_unlink:"Trennen", account_google_link:"Google verknüpfen", account_google_link_sub:"Dann auch mit Google anmelden", account_linking:"Wird verknüpft..." },
  programs: { title:"Programme", catalog:"Katalog", browse:"Entdecken", mine:"Meine Programme", search:"Suchen…", results:"ERGEBNISSE", no_results:"Keine Ergebnisse", featured:"🔥 Empfohlene Programme", gym:"🏋️ Fitnessstudio", running:"🏃 Laufen", boxing:"🥊 Boxen", empty_title:"Noch keine Programme", empty_sub:"Wähle eine Vorlage im Tab Entdecken", empty_btn:"Vorlagen durchsuchen →", mine_label:"MEINE PROGRAMME", owned:"✓ Hinzugefügt" },
  calendar: { this_week:"Diese Woche", session_picker_title:"Session hinzufügen", session_added:"hinzugefügt", no_sessions:"Keine Sessions" },
};

const ES: Translations = {
  common: { save:"Guardar ✓", cancel:"Cancelar", delete:"Eliminar", close:"Cerrar", back:"Volver", all:"Todo", loading:"Cargando…", error:"Ocurrió un error", confirm:"Confirmar", yes:"Sí", no:"No", new:"Nuevo", edit:"Editar", add:"Añadir", search:"Buscar…", settings:"Ajustes", profile:"Perfil", soon:"Próximamente" },
  nav: { home:"Inicio", workout:"Entreno", programs:"Programas", progress:"Progreso", calendar:"Calendario", profile:"Perfil", exercises:"Ejercicios", team:"Equipo" },
  home: { greeting_morning:"Buenos días", greeting_afternoon:"Buenas tardes", greeting_evening:"Buenas noches", hero_active:"ENTRENO ACTIVO", hero_today:"ENTRENO DE HOY", hero_continue:"Continuar", hero_start:"Empezar", hero_cta_continue:"Continuar →", hero_cta_start:"Iniciar entreno →", hero_last:"Último", hero_no_workout:"Aún no hay entrenos — es hora de empezar", stats_streak:"días seguidos", stats_workouts:"entrenos / 30d", stats_volume:"kg volumen", this_week:"ESTA SEMANA", programs:"PROGRAMAS", programs_all:"Todos →", programs_per_week:"sesiones/semana", quick_access:"ACCESO RÁPIDO", quick_calendar:"Calendario", quick_stats:"Estadísticas", quick_profile:"Perfil" },
  workout: { title:"ENTRENO", today:"Entreno de hoy", today_program:"PROGRAMA DE HOY", start:"Iniciar entreno →", last:"Último", exercise_count:"ejercicios", active:"ENTRENO ACTIVO", add_exercise:"+ Ejercicio", finish:"Terminar ✓", discard:"Descartar ✕", add_first:"+ Añade un ejercicio", confirm_discard:"¿Descartar este entreno?", confirm_empty:"Entreno vacío. ¿Guardar de todos modos?", confirm_no_sets:"Sin series completadas. ¿Guardar de todos modos?", saved_local:"Guardado localmente", saved_cloud:"Guardado", saved_local_body:"Perfil de invitado / local.", saved_cloud_body:"Guardado localmente y en la nube.", saved_offline:"Sin conexión o error. La sincronización ocurrirá automáticamente.", pr_new:"¡Nuevo récord personal!", pr_more:"más", rest_timer:"Descanso", set:"serie", sets:"series", vol:"vol." },
  progress: { title:"Progreso", tab_overview:"Resumen", tab_prs:"RP", tab_history:"Entrenos", total_workouts:"Entrenos totales", streak:"Racha", total_volume:"Volumen total", avg_per_week:"Promedio/semana", last_30:"en los últimos 30 días", last_7:"entrenos en 7 días", kg_total:"kg total", per_week_30:"entrenos/semana (30d)", chart:"GRÁFICA", chart_volume:"Volumen", chart_freq:"Frecuencia", top_exercises:"TOP EJERCICIOS", no_workouts:"Aún no hay entrenos guardados", cloud_wrong_user:"Perfil en la nube activo pero sin sesión. Inicia sesión de nuevo.", cloud_loading:"Cargando datos de la nube…", delete_workout:"¿Eliminar este entreno?", delete_all:"¿Eliminar todos los entrenos?", csv_export:"Exportar CSV", delete_all_btn:"Eliminar todo", pr_none:"Aún no hay RPs", pr_none_sub:"Completa un entreno y tus récords personales aparecerán automáticamente", pr_exercises:"EJERCICIO", pr_best_weight:"MEJOR PESO", pr_best_set:"RÉCORD PERSONAL", pr_chart_btn:"Gráfica →", pr_history:"HISTORIAL", pr_sessions:"sesiones", pr_sets:"series", pr_total_sets:"Series totales", pr_best_vol:"Mejor vol.", pr_total_vol:"Vol. total", pr_occasions:"Sesiones", pr_min_chart:"Se necesitan al menos 2 entrenos para la gráfica", nap:"día", days:"días" },
  profile: { title:"Perfil", unnamed:"Sin nombre", edit_btn:"Editar perfil", tab_stats:"Estadísticas", tab_achievements:"Logros", tab_appearance:"Apariencia", stat_workouts:"Entrenos", stat_streak:"Racha", stat_volume:"Volumen", stat_streak_unit:"días", top_exercises:"TOP EJERCICIOS", weight:"PESO CORPORAL", weight_add:"+ Registrar", weight_modal_title:"Registrar peso", achievements_count:"DESBLOQUEADOS", xp_label:"XP", theme_label:"COLOR DE TEMA", lang_label:"IDIOMA", tech_settings:"Ajustes técnicos", tech_settings_sub:"Sync, cuenta, onboarding", edit_name:"NOMBRE", edit_age:"EDAD", edit_height:"ALTURA (CM)", edit_goal:"OBJETIVO", edit_level:"NIVEL", goal_lose:"Perder peso", goal_maintain:"Mantener", goal_gain:"Ganar músculo", level_beginner:"Principiante", level_mid:"Intermedio", level_advanced:"Avanzado", edit_title:"Editar perfil", weight_chart_min:"Se necesitan al menos 2 mediciones para la gráfica" },
  settings: { title:"Ajustes", subtitle:"Notificaciones, sync, cuenta", notif_section:"🔔 NOTIFICACIONES", notif_unsupported:"Tu navegador no admite notificaciones push.", notif_enable:"Activar notificaciones", notif_status:"Estado", notif_granted:"Permitido", notif_denied:"Bloqueado", notif_default:"Sin configurar", notif_daily:"Recordatorio diario", notif_daily_sub:"Te recuerda entrenar cada día", notif_time:"Hora de notificación:", notif_days:"Qué días:", notif_streak:"Alerta de racha", notif_streak_sub:"días sin entrenar", notif_post:"Motivación post-entreno", notif_post_sub:"Envía un mensaje 30 minutos después del entreno", notif_test:"🔔 Enviar notificación de prueba", notif_sent:"✓ ¡Enviado!", notif_blocked:"Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador.", notif_blocked_alert:"Las notificaciones están bloqueadas. Actívalas en el navegador.", sync_section:"☁️ SYNC EN LA NUBE", app_section:"ℹ️ APP", app_name:"ARCX", app_sub:"PWA de registro de entrenos · v1.0", app_offline:"Offline-first", app_offline_sub:"Todos los datos guardados localmente", app_profile:"Perfil y logros", app_profile_sub:"XP, niveles, logros", account_section:"👤 CUENTA", account_logged:"Sesión iniciada como", account_google_linked:"Google conectado", account_google_linked_sub:"Puedes iniciar sesión con Google o email", account_google_unlink:"Desconectar", account_google_link:"Conectar Google", account_google_link_sub:"Luego inicia sesión también con Google", account_linking:"Conectando..." },
  programs: { title:"Programas", catalog:"Catálogo", browse:"Explorar", mine:"Mis programas", search:"Buscar…", results:"RESULTADOS", no_results:"Sin resultados", featured:"🔥 Programas destacados", gym:"🏋️ Gimnasio", running:"🏃 Correr", boxing:"🥊 Boxeo", empty_title:"Aún no hay programas", empty_sub:"Elige una plantilla en la pestaña Explorar", empty_btn:"Ver plantillas →", mine_label:"MIS PROGRAMAS", owned:"✓ Añadido" },
  calendar: { this_week:"Esta semana", session_picker_title:"Añadir sesión", session_added:"añadido", no_sessions:"Sin sesiones" },
};

// ── Lookup map ────────────────────────────────────────────────────────────────
const TRANSLATIONS: Record<Lang, Translations> = { hu: HU, en: EN, sk: SK, cs: CS, de: DE, es: ES };

export function getTranslations(lang: Lang): Translations {
  return TRANSLATIONS[lang] ?? HU;
}

// ── Browser auto-detect ────────────────────────────────────────────────────────
export function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "hu";
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  const map: Record<string, Lang> = { hu:"hu", en:"en", sk:"sk", cs:"cs", de:"de", es:"es" };
  return map[nav] ?? "hu";
}

// ── React hook ────────────────────────────────────────────────────────────────
import * as React from "react";

function readLang(): Lang {
  if (typeof window === "undefined") return "hu";
  const stored = localStorage.getItem(LS_LANG) as Lang | null;
  if (stored && TRANSLATIONS[stored]) return stored;
  return detectBrowserLang();
}

/** Global lang state — shared across the app without a context provider */
let _listeners: Array<() => void> = [];
let _lang: Lang = "hu";

export function setGlobalLang(lang: Lang) {
  _lang = lang;
  if (typeof window !== "undefined") localStorage.setItem(LS_LANG, lang);
  _listeners.forEach(fn => fn());
}

export function useTranslation() {
  const [lang, setLang] = React.useState<Lang>("hu");

  React.useEffect(() => {
    const l = readLang();
    _lang = l;
    setLang(l);
    const listener = () => setLang(_lang);
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(x => x !== listener); };
  }, []);

  const t = React.useMemo(() => getTranslations(lang), [lang]);
  return { t, lang, setLang: setGlobalLang };
}
