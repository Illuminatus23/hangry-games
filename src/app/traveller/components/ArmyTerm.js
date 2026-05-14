"use client";

import React, { useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill, getAgingRolls, careerCheckSimple, careerCheckSpecReinlist } from "../lib/helpers";

const PENSION_CAREERS = ['navy', 'marines', 'army', 'scouts', 'flyer', 'sailor'];

function getArmDataKey(career, branch) {
    if (career === "marines" && branch === "Marine Infantry") return "Marines";
    return branch;
}

function normalizeServiceSkill(skill, career) {
    const map = {
        "Strength": "STR", "Dexterity": "DEX", "Endurance": "END",
        "Intelligence": "INT", "Education": "EDU", "Social": "SOC",
        "Mechanics": "Mechanical", "Pistol": "Handguns",
        "Foward Observer": "Forward Observer",
    };
    const normalized = map[skill] ?? skill;
    if (normalized === "Blade Combat" && career === "marines") return "Large Blade";
    return normalized;
}

function getDecorationFromRoll(roll, threshold) {
    if (threshold <= 0) return null;
    if (roll >= threshold + 4) return "SEH";
    if (roll >= threshold + 2) return "MCG";
    if (roll >= threshold) return "MCUF";
    return null;
}

// All skill tables available this year based on status.
// commandCheckResult: true = has command, false = staff, null = not an officer
function getAvailablePools(career, isOfficer, rank, yearHadShipsTroops, commandCheckResult, yearMosAvailable, yearMosTable) {
    const ss = datatables.Army.ServiceSkills;
    const pools = [];

    const lifeName = career === "marines" ? "Marines Life" : "Army Life";
    pools.push({ name: lifeName, skills: ss[lifeName] });

    if (isOfficer) {
        const tableName = commandCheckResult ? "Command" : "Staff";
        pools.push({ name: tableName, skills: ss[tableName] });
    } else if (rank >= 3) {
        pools.push({ name: "NCO", skills: ss["NCO"] });
    }

    if (yearHadShipsTroops) {
        pools.push({ name: "Shipboard Life", skills: ss["Shipboard Life"] });
    }

    if (yearMosAvailable && yearMosTable.length > 0) {
        pools.push({ name: "MOS", skills: yearMosTable });
    }

    return pools;
}

// Roll d6 on a pool, resolve one level of cascade if needed.
function rollOnPool(pool, career) {
    const roll = d6(1, 0);
    const idx = Math.min(roll - 1, pool.skills.length - 1);
    let skill = normalizeServiceSkill(pool.skills[idx], career);
    const cascade = datatables.Skills?.[skill];
    if (Array.isArray(cascade) && cascade.length > 0) {
        const cascRoll = d6(1, 0);
        skill = normalizeServiceSkill(cascade[Math.min(cascRoll - 1, cascade.length - 1)], career);
    }
    return { roll, skill };
}

// Roll initial MOS for year 1 training.
function rollMosInitial(armData, career) {
    const mosList = armData?.["MOS"] ?? [];
    if (!mosList.length) return null;
    const roll = d6(1, 0);
    let skill = normalizeServiceSkill(mosList[Math.min(roll - 1, mosList.length - 1)], career);
    const cascade = datatables.Skills?.[skill];
    if (Array.isArray(cascade) && cascade.length > 0) {
        const cascRoll = d6(1, 0);
        skill = normalizeServiceSkill(cascade[Math.min(cascRoll - 1, cascade.length - 1)], career);
    }
    return skill;
}

export default function ArmyTerm({
    upp,
    characterData,
    setCharacterData,
    characterName,
    handleHistoryAdd,
    setSkills,
    setStep,
    skills,
    setPageWarning,
}) {
    const career = characterData.career?.careername;
    const terms = characterData.career?.terms ?? 0;
    const displayTerm = terms + 1;
    const isFirstTerm = terms === 0;
    const branch = characterData.career?.branch ?? "";
    const isOfficer = characterData.career?.officer ?? false;
    const rank = characterData.career?.rank ?? 0;

    const availableArms = (() => {
        if (career === "marines") return ["Marine Infantry", "Support"];
        const arms = ["Infantry", "Cavalry", "Artillery", "Support"];
        const hasHonors = characterData.awards?.some(
            a => a.includes("honors") && (a.includes("military") || a.includes("college"))
        );
        if (hasHonors) arms.push("Commando");
        return arms;
    })();

    // Main state machine
    const [armStep, setArmStep] = useState(branch ? "yearStart" : "selectArm");
    const [currentYear, setCurrentYear] = useState(1);
    const [yearLogs, setYearLogs] = useState([]);
    const [warning, setWarning] = useState("");

    // Year 1 initial training
    const [year1GunCombatPick, setYear1GunCombatPick] = useState("");
    const [year1MosResult, setYear1MosResult] = useState(null);

    // Per-year assignment state (years 2–4)
    const [yearHadShipsTroops, setYearHadShipsTroops] = useState(false);
    const [commandCheckResult, setCommandCheckResult] = useState(null);
    const [yearMosAvailable, setYearMosAvailable] = useState(false);
    const [yearMosTable, setYearMosTable] = useState([]);

    // Skill pick: table chosen → auto-rolled result pending confirmation
    const [pendingSkillResult, setPendingSkillResult] = useState(null);

    const handleArmSelect = (arm) => {
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, branch: arm },
        }));
        handleHistoryAdd(`${characterName} was assigned to the ${arm}.`);

        if (isFirstTerm) {
            const dataKey = getArmDataKey(career, arm);
            const armData = datatables.Army?.[dataKey];
            setYear1MosResult(rollMosInitial(armData, career));
            setArmStep("initialTraining");
        } else {
            setArmStep("yearStart");
        }
    };

    const handleInitialTrainingConfirm = () => {
        if (!year1GunCombatPick) { setWarning("Please pick a Gun Combat specialty."); return; }
        applySkill(setSkills, setCharacterData, year1GunCombatPick, { maxSkills: characterData.INT + characterData.EDU });
        if (year1MosResult) {
            applySkill(setSkills, setCharacterData, year1MosResult, { maxSkills: characterData.INT + characterData.EDU });
        }
        handleHistoryAdd(
            `${characterName} completed initial training in the ${characterData.career?.branch ?? career}, ` +
            `gaining proficiency in ${year1GunCombatPick}${year1MosResult ? ` and ${year1MosResult}` : ""}.`
        );
        setCurrentYear(2);
        setArmStep("yearStart");
    };

    const handleYearRoll = () => {
        const currentBranch = characterData.career?.branch;
        const dataKey = getArmDataKey(career, currentBranch);
        const armData = datatables.Army?.[dataKey];
        if (!armData) { setWarning(`No data for branch: ${currentBranch}`); return; }

        const assignRoll = d6(2, 0);
        const assignmentName = armData["Assignement"][Math.max(0, Math.min(10, assignRoll - 2))];
        const assignmentData = armData[assignmentName];

        if (!Array.isArray(assignmentData)) {
            setWarning(`Unknown assignment: ${assignmentName}`);
            return;
        }

        const [survivalTarget, decoTarget, , skillThreshold, isCombat] = assignmentData;
        let log = `Year ${currentYear}: rolled ${assignRoll} — ${assignmentName}. `;

        // Survival check
        let survived = true;
        if (survivalTarget > 0) {
            let survivalDM = 0;
            const survRule = armData["Survival"];
            if (Array.isArray(survRule) && survRule[0] === "Skill") {
                const mosList = armData["MOS"] ?? [];
                const reqLevel = survRule[2] ?? 2;
                const dmBonus = survRule[3] ?? 1;
                if (skills.some(s => mosList.includes(s.name) && s.level >= reqLevel)) {
                    survivalDM = dmBonus;
                }
            }
            const survRoll = d6(2, survivalDM);
            survived = survRoll >= survivalTarget;
            log += `Survival (${survivalTarget}+): rolled ${survRoll}${survivalDM ? `+${survivalDM}` : ""} — ${survived ? "Survived" : "KIA"}. `;
        } else {
            log += `Safe duty. `;
        }

        if (!survived) {
            const deathMsg = career === "marines"
                ? `The perils of service claimed ${characterName} during a ${assignmentName} assignment. The story ends here.`
                : `${characterName} was killed in action during a ${assignmentName} assignment. The story ends here.`;
            handleHistoryAdd(deathMsg);
            setWarning(log);
            setYearLogs(prev => [...prev, log]);
            setPageWarning?.(log);
            setStep("End");
            return;
        }

        // Decoration (combat assignments only)
        if (isCombat && decoTarget > 0) {
            const decoRoll = d6(2, 0);
            const decoKey = getDecorationFromRoll(decoRoll, decoTarget);
            if (decoKey) {
                const decoFull = datatables.deocrationDescriptor?.[decoKey] ?? decoKey;
                log += `Awarded ${decoFull}! (rolled ${decoRoll} vs ${decoTarget}+). `;
                setCharacterData(prev => ({
                    ...prev,
                    awards: [...(prev.awards ?? []), decoFull],
                }));
            } else {
                log += `No decoration (rolled ${decoRoll} vs ${decoTarget}+). `;
            }
        }

        // Special assignments — only fires when assignmentName === "Special"
        if (assignmentName === "Special") {
            const specialTables = isOfficer ? datatables.Army.Special["O"] : datatables.Army.Special["E"];
            const specDM = (career === "marines" && characterData.EDU >= 7) || (career === "army" && characterData.END >= 7) ? 1 : 0;
            const specRoll = d6(1, specDM);
            const specialAssignment = specialTables[Math.min(specRoll - 1, specialTables.length - 1)];
            log += `Special assignment: ${specialAssignment}. `;

            const applySchoolSkills = (schoolKey) => {
                const [threshold, skillList] = datatables.Army.SchoolSkills[schoolKey];
                const gained = [];
                skillList.forEach(skill => {
                    if (d6(1, 0) >= threshold) {
                        const normalized = normalizeServiceSkill(skill, career);
                        applySkill(setSkills, setCharacterData, normalized, { maxSkills: characterData.INT + characterData.EDU });
                        gained.push(normalized);
                    }
                });
                return gained;
            };

            switch (specialAssignment) {
                case "Cross-Training": {
                    // TODO: ideally the player picks the arm; for now pick randomly (not Commando, not current arm)
                    const otherArms = availableArms.filter(a => a !== branch && a !== "Commando");
                    const crossArm = otherArms[Math.floor(Math.random() * otherArms.length)];
                    if (crossArm) {
                        const crossData = datatables.Army?.[getArmDataKey(career, crossArm)];
                        const crossMos = crossData?.["MOS"] ?? [];
                        if (crossMos.length) {
                            const crossRoll = d6(1, 0);
                            const crossSkill = normalizeServiceSkill(crossMos[Math.min(crossRoll - 1, crossMos.length - 1)], career);
                            applySkill(setSkills, setCharacterData, crossSkill, { maxSkills: characterData.INT + characterData.EDU });
                            setCharacterData(prev => ({ ...prev, awards: [...(prev.awards ?? []), `Cross-trained: ${crossArm}`] }));
                            log += `Cross-trained in ${crossArm}, gained ${crossSkill}. `;
                        }
                    }
                    break;
                }
                case "Specialist School": {
                    const schoolList = (characterData.INT + characterData.EDU > 16)
                        ? datatables.Army.Special["SmartSchools"]
                        : datatables.Army.Special["Schools"];
                    const schoolIdx = d6(1, 0) - 1;
                    const school = schoolList[Math.min(schoolIdx, schoolList.length - 1)];
                    applySkill(setSkills, setCharacterData, school, { maxSkills: characterData.INT + characterData.EDU });
                    log += `Specialist School in ${school}. `;
                    break;
                }
                case "Commando School": {
                    const gained = applySchoolSkills("Commando");
                    log += `Commando School: gained ${gained.length ? gained.join(", ") : "no skills"}. `;
                    break;
                }
                case "Protected Forces": {
                    const gained = applySchoolSkills("Protected");
                    log += `Protected Forces: gained ${gained.length ? gained.join(", ") : "no skills"}. `;
                    break;
                }
                case "Recruiting": {
                    applySkill(setSkills, setCharacterData, "Recruiting", { maxSkills: characterData.INT + characterData.EDU });
                    log += `Recruiting duty, gained Recruiting. `;
                    break;
                }
                case "OCS": {
                    let eligible = true;
                    if (characterData.age > 38) {
                        const waiverRoll = d6(1, specDM);
                        const waiverResult = specialTables[Math.min(waiverRoll - 1, specialTables.length - 1)];
                        eligible = waiverResult === "OCS";
                        log += eligible ? `OCS waiver granted (age ${characterData.age}). ` : `OCS denied — over age 38. `;
                    }
                    if (eligible) {
                        const eRank = characterData.career?.rank ?? 0;
                        const oRank = eRank >= 8 ? 3 : eRank >= 7 ? 2 : 1;
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: oRank, officer: true } }));
                        // One Command skill roll
                        const cmdPool = datatables.Army.ServiceSkills["Command"] ?? [];
                        if (cmdPool.length) {
                            const cmdSkill = normalizeServiceSkill(cmdPool[Math.min(d6(1, 0) - 1, cmdPool.length - 1)], career);
                            applySkill(setSkills, setCharacterData, cmdSkill, { maxSkills: characterData.INT + characterData.EDU });
                            log += `OCS Command: ${cmdSkill}. `;
                        }
                        // Two MOS skill rolls
                        const ocsArmData = datatables.Army?.[getArmDataKey(career, branch)];
                        const ocsMos = ocsArmData?.["MOS"] ?? [];
                        if (ocsMos.length) {
                            for (let i = 0; i < 2; i++) {
                                const ms = normalizeServiceSkill(ocsMos[Math.min(d6(1, 0) - 1, ocsMos.length - 1)], career);
                                applySkill(setSkills, setCharacterData, ms, { maxSkills: characterData.INT + characterData.EDU });
                                log += `OCS MOS: ${ms}. `;
                            }
                        }
                        log += `Commissioned O${oRank}. `;
                    }
                    break;
                }
                case "Intelligence School": {
                    const gained = applySchoolSkills("Intelligence");
                    log += `Intelligence School: gained ${gained.length ? gained.join(", ") : "no skills"}. `;
                    break;
                }
                case "Staff College": {
                    const gained = applySchoolSkills("Staff");
                    log += `Staff College: gained ${gained.length ? gained.join(", ") : "no skills"}. `;
                    break;
                }
                case "Command College": {
                    const gained = applySchoolSkills("Command");
                    log += `Command College: gained ${gained.length ? gained.join(", ") : "no skills"}. `;
                    break;
                }
                case "Military Aide": {
                    const aideRoll = d6(1, 0);
                    setCharacterData(prev => ({ ...prev, SOC: (prev.SOC ?? 0) + 1 }));
                    if (aideRoll <= 4) {
                        // Becomes Military Attaché: SOC+1 (done above) + rank promotion
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: (prev.career?.rank ?? 0) + 1 } }));
                        log += `Military Aide → Military Attaché: SOC +1, rank promoted. `;
                    } else {
                        log += `Military Aide: SOC +1. Command assignment available. `;
                    }
                    break;
                }
                default:
                    break;
            }
        }


        // Ship's Troops flag (marines only)
        const thisYearShipsTroops = (career === "marines" && assignmentName === "Ship's Troops");
        setYearHadShipsTroops(thisYearShipsTroops);

        // Command check (O1+ officers only)
        let hasCommand = null;
        if (isOfficer) {
            const commandTarget = armData["Command"]?.[career] ?? 99;
            const commandRoll = d6(2, 0);
            hasCommand = commandRoll >= commandTarget;
            log += `Command (${commandTarget}+): rolled ${commandRoll} — ${hasCommand ? "Command" : "Staff"}. `;
            if (hasCommand && isCombat) {
                setCharacterData(prev => ({
                    ...prev,
                    awards: [...(prev.awards ?? []), "Combat Cluster"],
                }));
                log += `Combat Cluster awarded. `;
            }
        }
        setCommandCheckResult(hasCommand);

        // Skills check — pass makes tables available for one pick
        const mosList = armData["MOS"] ?? [];
        let skillsPassed = false;
        if (skillThreshold > 0) {
            const skillRoll = d6(2, 0);
            skillsPassed = skillRoll >= skillThreshold;
            log += `Skills (${skillThreshold}+): rolled ${skillRoll} — ${skillsPassed ? "table available" : "no skill this year"}. `;
        } else {
            log += `No skill roll for this assignment. `;
        }
        setYearMosAvailable(skillsPassed);
        setYearMosTable(mosList);

        setYearLogs(prev => [...prev, log]);
        setWarning(log);
        handleHistoryAdd(log);

        if (skillsPassed) {
            setArmStep("yearSkillPick");
        } else {
            advanceYearOrEnd();
        }
    };

    const advanceYearOrEnd = () => {
        if (currentYear < 4) {
            setCurrentYear(prev => prev + 1);
            setArmStep("yearStart");
        } else {
            handleEndOfTerm();
        }
    };

    const handleTableSelect = (pool) => {
        const result = rollOnPool(pool, career);
        setPendingSkillResult({ skill: result.skill, tableName: pool.name, roll: result.roll });
    };

    const handleSkillConfirm = () => {
        if (!pendingSkillResult) return;
        applySkill(setSkills, setCharacterData, pendingSkillResult.skill, {
            maxSkills: characterData.INT + characterData.EDU,
        });
        handleHistoryAdd(
            `Year ${currentYear}: ${characterName} gained ${pendingSkillResult.skill} from ${pendingSkillResult.tableName} training.`
        );

        // Reset per-year state
        setPendingSkillResult(null);
        setCommandCheckResult(null);
        setYearHadShipsTroops(false);
        setYearMosAvailable(false);
        setYearMosTable([]);

        advanceYearOrEnd();
    };

    const handleEndOfTerm = () => {
        // Army/Marines are not in Basics — provide fallback career-level check values.
        const basicsData = datatables.Basics?.[career];
        const posCheck = basicsData?.position ?? (career === "marines" ? [6, 'EDU', 8, 1] : [5, 'EDU', 7, 1]);
        const promoCheck = basicsData?.promotion ?? (career === "marines" ? [7, 'EDU', 9, 1] : [6, 'EDU', 7, 1]);
        const specCheck = basicsData?.specduty ?? [7];
        const reinCheck = basicsData?.reenlist ?? [6];
        const canPromote = posCheck[0] !== 99;

        let histText = `${characterName} completed Term ${displayTerm} as ${career} (${characterData.career?.branch}). `;
        let warnText = "";

        const isDraftedFirstTerm = characterData.career?.drafted && isFirstTerm;
        const hasPendingCommission =
            characterData.commission === career ||
            (career === "marines" && characterData.commission === "navy");

        // Commission (first term, not yet an officer)
        if (isFirstTerm && !characterData.career?.officer && canPromote && !isDraftedFirstTerm) {
            if (hasPendingCommission) {
                const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                histText += `${characterName}'s commission was confirmed as ${o1Name}. `;
                warnText += `Auto-commissioned (${characterData.commission} candidate). `;
                setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
            } else {
                const posResult = careerCheckSimple(posCheck, upp, characterName);
                warnText += `Commission: ${posResult[1]} `;
                if (posResult[0]) {
                    const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                    histText += `${characterName} received a commission as ${o1Name}. `;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
                }
            }
        }

        // Promotion (officer, subsequent terms)
        if (characterData.career?.officer && canPromote) {
            const promoResult = careerCheckSimple(promoCheck, upp, characterName);
            warnText += `Promotion: ${promoResult[1]} `;
            if (promoResult[0]) {
                const newRank = (characterData.career.rank ?? 0) + 1;
                const rankName = datatables.rank[career]?.["O"]?.[newRank]?.[0] ?? `Rank ${newRank}`;
                histText += `${characterName} was promoted to ${rankName}. `;
                setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: newRank } }));
            }
        }

        // Special duty
        const specResult = careerCheckSpecReinlist(specCheck, characterName);
        warnText += `Special Duty: ${specResult[1]} `;
        if (specResult[0]) {
            const dataKey = getArmDataKey(career, characterData.career?.branch);
            const armData = datatables.Army?.[dataKey];
            if (armData) {
                const mosList = armData["MOS"] ?? [];
                const mosIndex = Math.floor(Math.random() * mosList.length);
                let bonusSkill = normalizeServiceSkill(mosList[mosIndex], career);
                applySkill(setSkills, setCharacterData, bonusSkill, {
                    maxSkills: characterData.INT + characterData.EDU,
                });
                histText += `Special assignment granted ${characterName} additional training in ${bonusSkill}. `;
            }
        }

        // Reinlist roll
        const reinlistResult = careerCheckSpecReinlist(reinCheck, characterName);
        warnText += `Reinlist: ${reinlistResult[1]}`;

        // Aging
        const endAge = characterData.age + 4;
        if (endAge >= 34) {
            const agingResult = getAgingRolls(endAge);
            if (agingResult.decreases.length > 0) {
                setCharacterData(prev => {
                    const updates = {};
                    agingResult.decreases.forEach(stat => {
                        updates[stat] = Math.max(1, (prev[stat] ?? 1) - 1);
                    });
                    return { ...prev, ...updates };
                });
                warnText += ` Aging: ${agingResult.decreases.join(", ")} -1.`;
                histText += ` Age took its toll: ${agingResult.decreases.join(", ")} each reduced by 1.`;
            }
        }

        handleHistoryAdd(histText);
        setWarning(warnText);

        if (reinlistResult[3]) {
            setArmStep("forced");
        } else if (!reinlistResult[0]) {
            setArmStep("retire");
        } else {
            setArmStep("reinlistChoice");
        }
    };

    const handleRetire = () => {
        const newTerms = characterData.career.terms + 1;
        const newAge = characterData.age + 4;
        const pension = (newTerms >= 5 && PENSION_CAREERS.includes(career)) ? 2000 * newTerms : 0;
        setCharacterData(prev => ({
            ...prev,
            age: newAge,
            pension,
            career: { ...prev.career, terms: newTerms },
        }));
        setStep("retire");
    };

    const handleReinlist = () => {
        const newTerms = characterData.career.terms + 1;
        const newAge = characterData.age + 4;
        setCharacterData(prev => ({
            ...prev,
            age: newAge,
            career: { ...prev.career, terms: newTerms },
        }));
        setArmStep("yearStart");
        setCurrentYear(1);
        setYearLogs([]);
        setWarning("");
        setPendingSkillResult(null);
        setCommandCheckResult(null);
        setYearHadShipsTroops(false);
        setYearMosAvailable(false);
        setYearMosTable([]);
    };

    const availablePools = getAvailablePools(
        career, isOfficer, rank,
        yearHadShipsTroops, commandCheckResult,
        yearMosAvailable, yearMosTable
    );

    const gunCombatSubskills = datatables.Skills?.["Gun Combat"] ?? [];
    const armDescriptions = datatables.serviceBranchOptions?.[
        career === "marines" ? "Marines" : "Army"
    ] ?? {};

    return (
        <div>
            <h2 className="mt-section-title">
                {career.charAt(0).toUpperCase() + career.slice(1)} — Term {displayTerm}
                {branch ? ` (${branch})` : ""}
                {isOfficer ? ` [Officer]` : ` [Enlisted]`}
            </h2>

            {warning && (
                <p className="mt-label" style={{ marginBottom: "0.5rem", color: "red" }}>
                    {warning}
                </p>
            )}

            {/* ARM SELECTION */}
            {armStep === "selectArm" && (
                <div>
                    <p className="mt-label" style={{ marginBottom: "0.5rem" }}>Choose your combat arm:</p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {availableArms.map(arm => {
                            const desc = armDescriptions[arm]?.[1] ?? "";
                            return (
                                <div key={arm} style={{ marginBottom: "0.5rem" }}>
                                    <button className="mt-btn" onClick={() => handleArmSelect(arm)}>
                                        {arm}
                                    </button>
                                    {desc && (
                                        <p className="mt-label" style={{ marginTop: "0.2rem", fontSize: "0.8em" }}>{desc}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* YEAR 1: INITIAL TRAINING */}
            {armStep === "initialTraining" && (
                <div>
                    <p className="mt-label" style={{ marginBottom: "0.4rem" }}>
                        <b>Year 1 — Initial Training</b>
                    </p>
                    <p className="mt-label" style={{ marginBottom: "0.5rem" }}>
                        Choose your Gun Combat specialty:
                    </p>
                    <select
                        className="mt-select"
                        value={year1GunCombatPick}
                        onChange={e => setYear1GunCombatPick(e.target.value)}
                        style={{ marginBottom: "0.75rem" }}
                    >
                        <option value="" disabled>-- Select --</option>
                        {gunCombatSubskills.map((skill, i) => (
                            <option key={i} value={skill}>{skill}</option>
                        ))}
                    </select>
                    {year1MosResult && (
                        <p className="mt-label" style={{ marginBottom: "0.75rem" }}>
                            MOS roll: <b>{year1MosResult}</b>
                        </p>
                    )}
                    <br />
                    <button
                        className="mt-btn"
                        onClick={handleInitialTrainingConfirm}
                        disabled={!year1GunCombatPick}
                    >
                        Complete Training &amp; Begin Year 2
                    </button>
                </div>
            )}

            {/* YEARS 2–4: ASSIGNMENT ROLL */}
            {armStep === "yearStart" && (
                <div>
                    <p className="mt-label">Year {currentYear} of 4 ready.</p>
                    <button className="mt-btn" onClick={handleYearRoll}>
                        Roll Year {currentYear} Assignment
                    </button>
                </div>
            )}

            {/* YEARS 2–4: SKILL TABLE PICK */}
            {armStep === "yearSkillPick" && (
                <div>
                    <p className="mt-label" style={{ marginBottom: "0.4rem" }}>
                        Skills check passed. Choose a table to roll on:
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        {availablePools.map(pool => (
                            <button
                                key={pool.name}
                                className="mt-btn"
                                onClick={() => handleTableSelect(pool)}
                                disabled={pendingSkillResult !== null}
                            >
                                {pool.name}
                            </button>
                        ))}
                    </div>
                    {pendingSkillResult && (
                        <div>
                            <p className="mt-label" style={{ marginBottom: "0.4rem" }}>
                                Rolled <b>{pendingSkillResult.roll}</b> on {pendingSkillResult.tableName}: <b>{pendingSkillResult.skill}</b>
                            </p>
                            <button className="mt-btn" onClick={handleSkillConfirm}>
                                {currentYear < 4
                                    ? `Accept & Continue to Year ${currentYear + 1}`
                                    : "Accept & Resolve Term"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* RE-ENLIST / RETIRE */}
            {(armStep === "reinlistChoice" || armStep === "forced" || armStep === "retire") && (
                <div>
                    <p className="mt-label" style={{ marginBottom: "0.5rem" }}>
                        {armStep === "forced"
                            ? `${characterName} is compelled to remain in service.`
                            : armStep === "retire"
                                ? `${characterName} has been discharged from service.`
                                : "Service term complete. Reinlist or retire?"}
                    </p>
                    {armStep !== "retire" && (
                        <button className="mt-btn" style={{ marginRight: "0.5rem" }} onClick={handleReinlist}>
                            Reinlist as {career}
                        </button>
                    )}
                    {armStep !== "forced" && (
                        <button className="mt-btn" onClick={handleRetire}>
                            Retire
                        </button>
                    )}
                </div>
            )}

            {/* YEAR LOG */}
            {yearLogs.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                    <p className="mt-label" style={{ fontWeight: "bold" }}>
                        Service Record — Term {displayTerm}:
                    </p>
                    {yearLogs.map((log, i) => (
                        <p key={i} className="mt-label" style={{ marginBottom: "0.25rem" }}>• {log}</p>
                    ))}
                </div>
            )}
        </div>
    );
}
