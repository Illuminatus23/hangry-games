import {
    buildYearHistoryArmy,
    buildYearHistoryNavy,
    buildYearHistoryScout,
    buildMerchantDeathHistory,
} from "../traveller/lib/historyText";

const NAME = "Tomas Reeves";

// ── Army / Marines ────────────────────────────────────────────────────────────

const ARMY_CASES = [
    // non-combat
    { career: "army",    assignment: "Training",          isCombat: false, label: "Army — Training (accident)" },
    { career: "army",    assignment: "Garrison",          isCombat: false, label: "Army — Garrison (accident)" },
    { career: "army",    assignment: "Internal Security", isCombat: false, label: "Army — Internal Security (hazardous)" },
    { career: "marines", assignment: "Training",          isCombat: false, label: "Marines — Training (accident)" },
    { career: "marines", assignment: "Ship's Troops",     isCombat: false, label: "Marines — Ship's Troops (hazardous)" },
    { career: "marines", assignment: "Internal Security", isCombat: false, label: "Marines — Internal Security (hazardous)" },
    // combat
    { career: "army",    assignment: "Raid",              isCombat: true,  label: "Army — Raid (combat)" },
    { career: "army",    assignment: "Counter Insurgency",isCombat: true,  label: "Army — Counter Insurgency (combat)" },
    { career: "army",    assignment: "Police Action",     isCombat: true,  label: "Army — Police Action (combat)" },
    { career: "marines", assignment: "Raid",              isCombat: true,  label: "Marines — Raid (intense)" },
    { career: "marines", assignment: "Counter Insurgency",isCombat: true,  label: "Marines — Counter Insurgency (combat)" },
    { career: "marines", assignment: "Police Action",     isCombat: true,  label: "Marines — Police Action (combat)" },
];

const armyResults = ARMY_CASES.map(({ career, assignment, isCombat, label }) => ({
    label,
    text: buildYearHistoryArmy(
        { term: 1, year: 2, assignment, isCombat, kia: true, worldName: "Mora", battleName: "the Battle of Mora", decoration: null, special: null, specialCommission: null, commissionedAuto: false, commissionedRolled: false, promoted: false },
        NAME, career
    ),
}));

// ── Navy ──────────────────────────────────────────────────────────────────────

const NAVY_CASES = [
    { assignment: "Training",   isCombat: false, label: "Navy — Training (accident)" },
    { assignment: "Shore Duty", isCombat: false, label: "Navy — Shore Duty (hazardous)" },
    { assignment: "Patrol",     isCombat: false, label: "Navy — Patrol (hazardous)" },
    { assignment: "Siege",      isCombat: true,  label: "Navy — Siege (combat)" },
    { assignment: "Strike",     isCombat: true,  label: "Navy — Strike (combat)" },
    { assignment: "Battle",     isCombat: true,  label: "Navy — Battle (intense)" },
];

const navyResults = NAVY_CASES.map(({ assignment, isCombat, label }) => ({
    label,
    text: buildYearHistoryNavy(
        { term: 2, year: 1, assignment, isCombat, kia: true, worldName: "Regina", battleName: "the Battle of Regina", operationName: "Operation Harrow", fleetType: "imperial", special: null, specialOCS: false, frozenWatch: false, routineDuty: false, decoration: null, combatCluster: false, courtMartialHistory: null, commissionedAuto: false, commissionedRolled: false, promoted: false },
        NAME
    ),
}));

// ── Scouts ────────────────────────────────────────────────────────────────────

const SCOUT_CASES = [
    { office: "Survey",      assignment: "Routine",  isCombat: false, warMission: false, label: "Scouts — Survey/Routine (accident, field)" },
    { office: "Exploration", assignment: "Mission",  isCombat: false, warMission: false, label: "Scouts — Exploration/Mission (accident, field)" },
    { office: "Administration", assignment: "Routine", isCombat: false, warMission: false, label: "Scouts — Admin/Routine (accident, buro)" },
    { office: "Survey",      assignment: "Wartime",  isCombat: false, warMission: true,  label: "Scouts — Field/Wartime non-combat (combat)" },
    { office: "Survey",      assignment: "Wartime",  isCombat: true,  warMission: true,  label: "Scouts — Field/Wartime combat (intense)" },
    { office: "Detached",    assignment: "Mission",  isCombat: false, warMission: false, label: "Scouts — Detached/Mission (black ops)" },
    { office: "Detached",    assignment: "Wartime",  isCombat: true,  warMission: true,  label: "Scouts — Detached/Wartime (black ops)" },
];

const scoutResults = SCOUT_CASES.map(({ office, assignment, isCombat, warMission, label }) => ({
    label,
    text: buildYearHistoryScout(
        { term: 1, year: 3, office, assignment, isCombat, warMission, kia: true, worldName: "Zhodane", special: false, transferred: false, transferDeclined: false, adminSchool: false, promoted: false },
        NAME
    ),
}));

// ── Merchants ─────────────────────────────────────────────────────────────────

const MERCHANT_CASES = [
    { assignment: "Route",       isFT: false, label: "Corp — Route" },
    { assignment: "Speculative", isFT: false, label: "Corp — Speculative (hazardous)" },
    { assignment: "Exploratory", isFT: false, label: "Corp — Exploratory (hazardous)" },
    { assignment: "Route",       isFT: true,  label: "FT — Route" },
    { assignment: "Charter",     isFT: true,  label: "FT — Charter" },
    { assignment: "Speculative", isFT: true,  label: "FT — Speculative" },
    { assignment: "Exploratory", isFT: true,  label: "FT — Exploratory" },
    { assignment: "Smuggling",   isFT: true,  label: "FT — Smuggling (criminal)" },
    { assignment: "Piracy",      isFT: true,  label: "FT — Piracy (criminal)" },
];

const merchantResults = MERCHANT_CASES.map(({ assignment, isFT, label }) => ({
    label,
    text: buildMerchantDeathHistory(NAME, assignment, "Cargo", true, isFT),
}));

// ── Render ────────────────────────────────────────────────────────────────────

function Section({ title, results }) {
    return (
        <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", borderBottom: "1px solid #444", paddingBottom: "0.25rem", marginBottom: "1rem" }}>{title}</h2>
            {results.map(({ label, text }, i) => (
                <div key={i} style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.25rem", fontFamily: "monospace" }}>{label}</div>
                    <div style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "#ddd" }}>{text}</div>
                </div>
            ))}
        </section>
    );
}

export default function SmokeTestPage() {
    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem", fontFamily: "Georgia, serif", background: "#1a1a1a", minHeight: "100vh", color: "#ccc" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Death Flavor Smoke Test</h1>
            <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "2rem" }}>
                Each entry below is one random draw from the pool. Reload the page to resample. Character: <em>{NAME}</em>.
            </p>
            <Section title="Army / Marines" results={armyResults} />
            <Section title="Navy" results={navyResults} />
            <Section title="Scouts" results={scoutResults} />
            <Section title="Merchants" results={merchantResults} />
        </div>
    );
}
