"use client";

import React, { useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill, getAgingRolls, careerCheckSpecReinlist, generateBattlename, generateOperationName, generateSystemName } from "../lib/helpers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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

// Rank-based DM for rolling on a skill pool.
// Officer ranks are stored as rank 1–6+ with isOfficer=true; enlisted as rank 1–9 with isOfficer=false.
function getPoolMod(poolName, rank, isOfficer) {
    if (poolName === "Army Life" || poolName === "Marines Life") {
        if (!isOfficer) return 0;
        if (rank >= 7) return 3;
        if (rank >= 4) return 2;
        return 1; // any officer (O1+)
    }
    if (poolName === "NCO") {
        if (rank >= 9) return 3;
        if (rank >= 7) return 2;
        if (rank >= 5) return 1;
        return 0;
    }
    if (poolName === "Command" || poolName === "Staff") {
        if (!isOfficer) return 0;
        if (rank >= 7) return 2;
        if (rank >= 4) return 1;
        return 0;
    }
    if (poolName === "Shipboard Life") {
        if (!isOfficer) return 0;
        if (rank >= 4) return 2;
        if (rank >= 2) return 1;
        return 0;
    }
    return 0;
}

// Roll d6 on a pool. Returns { roll, mod, skill, isCascade, cascadeOptions }.
// Caller is responsible for presenting cascade choice to the user.
function rollOnPool(pool, career, rank, isOfficer) {
    const mod = getPoolMod(pool.name, rank, isOfficer);
    const roll = d6(1, mod);
    const idx = Math.min(roll - 1, pool.skills.length - 1);
    const skill = normalizeServiceSkill(pool.skills[idx], career);
    const raw = datatables.Skills?.[skill];
    const isCascade = Array.isArray(raw) && raw.length > 0;
    return {
        roll,
        mod,
        skill,
        isCascade,
        cascadeOptions: isCascade ? raw.map(s => normalizeServiceSkill(s, career)) : [],
    };
}

// Roll initial MOS for year 1 training. Returns the raw skill name (may be a cascade parent).
function rollMosRaw(armData, career) {
    const mosList = armData?.["MOS"] ?? [];
    if (!mosList.length) return null;
    const roll = d6(1, 0);
    return normalizeServiceSkill(mosList[Math.min(roll - 1, mosList.length - 1)], career);
}

export default function ArmyTerm({
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
    // Officers can only be promoted once per term; reset on reinlist
    const [promotedThisTerm, setPromotedThisTerm] = useState(false);

    // Cascade skill selection
    const [pendingCascade, setPendingCascade] = useState(null);
    // { parentSkill: string, options: string[], onConfirm: (skill: string) => void }
    const [cascadeChoice, setCascadeChoice] = useState("");

    const triggerCascade = (parentSkill, options, onConfirm) => {
        setPendingCascade({ parentSkill, options, onConfirm });
        setCascadeChoice("");
    };

    const handleCascadeConfirm = () => {
        if (!cascadeChoice || !pendingCascade) return;
        const callback = pendingCascade.onConfirm;
        const nestedRaw = datatables.Skills?.[cascadeChoice];
        if (Array.isArray(nestedRaw) && nestedRaw.length > 0) {
            // The chosen option is itself a cascade — show a new dialog, keep the same callback
            setPendingCascade({
                parentSkill: cascadeChoice,
                options: nestedRaw.map(s => normalizeServiceSkill(s, career)),
                onConfirm: callback,
            });
            setCascadeChoice("");
        } else {
            setPendingCascade(null);
            setCascadeChoice("");
            callback(cascadeChoice);
        }
    };

    // Career-level check arrays — army/marines not in Basics, use fallbacks
    const basicsData = datatables.Basics?.[career];
    const specCheck = basicsData?.specduty ?? [7];
    const reinCheck = basicsData?.reenlist ?? [6];

    const handleArmSelect = (arm) => {
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, branch: arm },
        }));
        handleHistoryAdd(`${characterName} selected the ${arm} arm of the ${career}.`);

        if (isFirstTerm) {
            const dataKey = getArmDataKey(career, arm);
            const armData = datatables.Army?.[dataKey];
            setYear1MosResult(rollMosRaw(armData, career));
            setArmStep("initialTraining");
        } else {
            setArmStep("yearStart");
        }
    };

    const handleInitialTrainingConfirm = () => {
        if (!year1GunCombatPick) { setWarning("Please pick a Gun Combat specialty."); return; }
        applySkill(setSkills, setCharacterData, year1GunCombatPick, { maxSkills: characterData.INT + characterData.EDU });

        const finishInit = (finalMosSkill) => {
            if (finalMosSkill) {
                applySkill(setSkills, setCharacterData, finalMosSkill, { maxSkills: characterData.INT + characterData.EDU });
            }
            handleHistoryAdd(
                `${characterName} completed initial training in the ${characterData.career?.branch ?? career}, ` +
                `gaining proficiency in ${year1GunCombatPick}${finalMosSkill ? ` and ${finalMosSkill}` : ""}.`
            );
            setCurrentYear(2);
            setArmStep("yearStart");
        };

        if (year1MosResult) {
            const cascadeOpts = datatables.Skills?.[year1MosResult];
            if (Array.isArray(cascadeOpts) && cascadeOpts.length > 0) {
                triggerCascade(year1MosResult, cascadeOpts.map(s => normalizeServiceSkill(s, career)), finishInit);
            } else {
                finishInit(year1MosResult);
            }
        } else {
            finishInit(null);
        }
    };

    const handleYearRoll = () => {
        const currentBranch = characterData.career?.branch;
        const dataKey = getArmDataKey(career, currentBranch);
        const armData = datatables.Army?.[dataKey];
        if (!armData) { setWarning(`No data for branch: ${currentBranch}`); return; }

        const assignRoll = d6(2, 0);
        const rolledAssignment = armData["Assignement"][Math.max(0, Math.min(10, assignRoll - 2))];

        // Marines cannot serve Counter Insurgency or Internal Security — reassign to Ship's Troops
        const assignmentName =
            career === "marines" &&
                (rolledAssignment === "Counter Insurgency" || rolledAssignment === "Internal Security")
                ? "Ship's Troops"
                : rolledAssignment;

        const assignmentData = armData[assignmentName];

        if (!Array.isArray(assignmentData)) {
            setWarning(`Unknown assignment: ${assignmentName}`);
            return;
        }

        const [survivalTarget, decoTarget, promoTarget, skillThreshold, isCombat] = assignmentData;
        // if needed
        const worldName = generateSystemName();
        const battleName = (isCombat) ? (assignmentName === "Raid") ? generateOperationName() : generateBattlename("ground") : null;

        const reassigned = assignmentName !== rolledAssignment;
        let log = `Year ${currentYear}: rolled ${assignRoll} — ${rolledAssignment}${reassigned ? ` → ${assignmentName}` : ""}. `;
        let historyLog = `Year ${currentYear}: ${characterName} spent an uneventful year on garrison duty. `;
        switch (assignmentName) {
            case "Training":
                historyLog = `Year ${currentYear}: ${characterName} spent a year in training.`
                break;
            case "Internal Security":
                historyLog = `Year ${currentYear}: ${characterName} was stationed as security for a spaceport on the world ${worldName}.`;
                break;
            case "Ship's Troops":
                historyLog = `Year ${currentYear}: ${characterName} served as security on a military ship.`
                break;
            case "Raid":
                historyLog = `Year ${currentYear}: Armed conflict broke out and ${characterName} participated in ${battleName}`;
                break;
            case "Counter Insurgency":
                historyLog = `Year ${currentYear}: Revolution erupted and ${characterName} fought in the ${battleName}`;
                break;
            case "Police Action":
                historyLog = `Year ${currentYear}: The ${battleName} broke out and ${characterName} was deployed into the heart of the conflict`;
                break;
        }

        //(isCombat) ? `${currentYear} years in to their service term armed conflict errupted and ${characterName} as deployed and participated ib a ${assignmentName}.` : ``;

        // Survival check
        // Support arm gets no MOS-based modifier; all other arms get +1 if any MOS skill is level 2+
        let survived = true;
        if (survivalTarget > 0) {
            const mosList = armData["MOS"] ?? [];
            const hasMosProficiency = currentBranch !== "Support" &&
                mosList.some(mosSkill => skills.some(s => s.name === mosSkill && s.level >= 2));
            const survivalDM = hasMosProficiency ? 1 : 0;
            const survRoll = d6(2, survivalDM);
            survived = survRoll >= survivalTarget;
            log += `Survival (${survivalTarget}+): rolled ${survRoll}${survivalDM ? ` DM+${survivalDM}` : ""} — ${survived ? "Survived" : "KIA"}. `;
            if (isCombat && !survived) {
                historyLog += " and was killed in action.";
            } else {
                historyLog += ".";
            }
        } else {
            log += `Safe duty. `;
        }

        if (!survived) {
            const deathMsg = career === "marines"
                ? `The perils of service claimed ${characterName} during a ${assignmentName} assignment. The story ends here.`
                : `${characterName} was killed in action during a ${assignmentName} assignment. The story ends here.`;
            handleHistoryAdd((isCombat) ? historyLog : deathMsg);
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
                const decoFull = datatables.decorationDescriptor?.[decoKey] ?? decoKey;
                const decoFullWBattle = `${decoFull} (${battleName})`;
                log += `Awarded ${decoFull} during the ${battleName}! (rolled ${decoRoll} vs ${decoTarget}+). `;
                setCharacterData(prev => ({
                    ...prev,
                    awards: [...(prev.awards ?? []), decoFullWBattle],
                }));
                historyLog += ` where they performed heroically under fire and were awarded the ${decoFull}.`
            } else {
                log += `No decoration (rolled ${decoRoll} vs ${decoTarget}+). `;
            }
        }

        let commissionedThisYear = false;

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
                        const cascadeOpts = datatables.Skills?.[normalized];
                        if (Array.isArray(cascadeOpts) && cascadeOpts.length > 0) {
                            triggerCascade(normalized, cascadeOpts.map(s => normalizeServiceSkill(s, career)), (finalSkill) => {
                                applySkill(setSkills, setCharacterData, finalSkill, { maxSkills: characterData.INT + characterData.EDU });
                            });
                            gained.push(normalized);
                        } else {
                            applySkill(setSkills, setCharacterData, normalized, { maxSkills: characterData.INT + characterData.EDU });
                            gained.push(normalized);
                        }
                    }
                });
                return gained;
            };
            historyLog = `Year ${currentYear}: ${characterName} was granted a special assignment and sent to ${specialAssignment}.`;

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
                            setCharacterData(prev => ({ ...prev, awards: [...(prev.awards ?? []), `Cross-trained: ${crossArm}`] }));
                            log += `Cross-trained in ${crossArm}, rolled ${crossSkill}. `;
                            const crossCascadeOpts = datatables.Skills?.[crossSkill];
                            if (Array.isArray(crossCascadeOpts) && crossCascadeOpts.length > 0) {
                                triggerCascade(crossSkill, crossCascadeOpts.map(s => normalizeServiceSkill(s, career)), (finalSkill) => {
                                    applySkill(setSkills, setCharacterData, finalSkill, { maxSkills: characterData.INT + characterData.EDU });
                                });
                            } else {
                                applySkill(setSkills, setCharacterData, crossSkill, { maxSkills: characterData.INT + characterData.EDU });
                            }
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
                    log += `Specialist School in ${school}. `;
                    const schoolCascadeOpts = datatables.Skills?.[school];
                    if (Array.isArray(schoolCascadeOpts) && schoolCascadeOpts.length > 0) {
                        triggerCascade(school, schoolCascadeOpts.map(s => normalizeServiceSkill(s, career)), (finalSkill) => {
                            applySkill(setSkills, setCharacterData, finalSkill, { maxSkills: characterData.INT + characterData.EDU });
                        });
                    } else {
                        applySkill(setSkills, setCharacterData, school, { maxSkills: characterData.INT + characterData.EDU });
                    }
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
                        commissionedThisYear = true;
                        const eRank = characterData.career?.rank ?? 0;
                        const oRank = eRank >= 8 ? 3 : eRank >= 7 ? 2 : 1;
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: oRank, officer: true } }));
                        // One Command skill roll
                        const cmdPool = datatables.Army.ServiceSkills["Command"] ?? [];
                        if (cmdPool.length) {
                            const cmdSkill = normalizeServiceSkill(cmdPool[Math.min(d6(1, 0) - 1, cmdPool.length - 1)], career);
                            log += `OCS Command: ${cmdSkill}. `;
                            const cmdCascadeOpts = datatables.Skills?.[cmdSkill];
                            if (Array.isArray(cmdCascadeOpts) && cmdCascadeOpts.length > 0) {
                                triggerCascade(cmdSkill, cmdCascadeOpts.map(s => normalizeServiceSkill(s, career)), (finalSkill) => {
                                    applySkill(setSkills, setCharacterData, finalSkill, { maxSkills: characterData.INT + characterData.EDU });
                                });
                            } else {
                                applySkill(setSkills, setCharacterData, cmdSkill, { maxSkills: characterData.INT + characterData.EDU });
                            }
                        }
                        // Two MOS skill rolls
                        const ocsArmData = datatables.Army?.[getArmDataKey(career, branch)];
                        const ocsMos = ocsArmData?.["MOS"] ?? [];
                        if (ocsMos.length) {
                            for (let i = 0; i < 2; i++) {
                                const ms = normalizeServiceSkill(ocsMos[Math.min(d6(1, 0) - 1, ocsMos.length - 1)], career);
                                log += `OCS MOS: ${ms}. `;
                                const msCascadeOpts = datatables.Skills?.[ms];
                                if (Array.isArray(msCascadeOpts) && msCascadeOpts.length > 0) {
                                    triggerCascade(ms, msCascadeOpts.map(s => normalizeServiceSkill(s, career)), (finalSkill) => {
                                        applySkill(setSkills, setCharacterData, finalSkill, { maxSkills: characterData.INT + characterData.EDU });
                                    });
                                } else {
                                    applySkill(setSkills, setCharacterData, ms, { maxSkills: characterData.INT + characterData.EDU });
                                }
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
                    awards: [...(prev.awards ?? []), `Combat Cluster (${battleName})`],
                }));
                log += `Combat Cluster (${battleName}) awarded. `;
            }
        }
        setCommandCheckResult(hasCommand);

        // Commission / Promotion (years 2–4 only; year 1 is initial training)
        // promoTarget === 0 means this assignment has no promotion opportunity
        if (currentYear > 1 && promoTarget > 0) {
            // +1 DM: Support arm + INT 8+, Commando + END 8+, all other arms + EDU 7+
            const currentBranchForPromo = characterData.career?.branch ?? "";
            const promoDM =
                currentBranchForPromo === "Support" ? (characterData.INT >= 8 ? 1 : 0) :
                    currentBranchForPromo === "Commando" ? (characterData.END >= 8 ? 1 : 0) :
                        characterData.EDU >= 7 ? 1 : 0;
            const dmStr = promoDM ? ` DM+${promoDM}` : "";

            const currentIsOfficer = isOfficer || commissionedThisYear;
            const hasPendingCommission =
                characterData.commission === career ||
                (career === "marines" && characterData.commission === "navy");

            if (!currentIsOfficer) {
                // Non-officer: commission check every year, no per-term cap
                if (hasPendingCommission) {
                    const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                    log += `Auto-commissioned as ${o1Name} (pending commission). `;
                    historyLog += ` ${characterName}'s commission was confirmed as ${o1Name}.`;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
                } else {
                    const posRoll = d6(2, promoDM);
                    const commissioned = posRoll >= promoTarget;
                    log += `Commission (${promoTarget}+${dmStr}): rolled ${posRoll} — ${commissioned ? "Commissioned!" : "Not commissioned"}. `;
                    if (commissioned) {
                        const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                        historyLog += ` ${characterName} received a commission as ${o1Name}.`;
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
                    }
                }
            } else if (!promotedThisTerm && !commissionedThisYear) {
                // Officer: promotion check, capped at once per term
                const promoRoll = d6(2, promoDM);
                const promoted = promoRoll >= promoTarget;
                log += `Promotion (${promoTarget}+${dmStr}): rolled ${promoRoll} — ${promoted ? "Promoted!" : "Not promoted"}. `;
                if (promoted) {
                    const newRank = (characterData.career.rank ?? 0) + 1;
                    const rankName = datatables.rank[career]?.["O"]?.[newRank]?.[0] ?? `Rank ${newRank}`;
                    historyLog += ` ${characterName} was promoted to ${rankName}.`;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: newRank } }));
                    setPromotedThisTerm(true);
                }
            }
        }

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
        handleHistoryAdd(historyLog);

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
        const result = rollOnPool(pool, career, rank, isOfficer);
        if (result.isCascade) {
            triggerCascade(result.skill, result.cascadeOptions, (finalSkill) => {
                setPendingSkillResult({ skill: finalSkill, tableName: pool.name, roll: result.roll, mod: result.mod });
            });
        } else {
            setPendingSkillResult({ skill: result.skill, tableName: pool.name, roll: result.roll, mod: result.mod });
        }
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
        let histText = `${characterName} completed Term ${displayTerm} as ${career} (${characterData.career?.branch}). `;
        let warnText = "";

        // Special duty
        const specResult = careerCheckSpecReinlist(specCheck, characterName);
        warnText += `Special Duty: ${specResult[1]} `;

        // Reinlist roll
        const reinlistResult = careerCheckSpecReinlist(reinCheck, characterName);
        warnText += `Reinlist: ${reinlistResult[1]}`;

        // Aging (pre-compute so it's available in the closure)
        const endAge = characterData.age + 4;
        const agingUpdates = {};
        let agingWarn = "";
        let agingHist = "";
        if (endAge >= 34) {
            const agingResult = getAgingRolls(endAge);
            if (agingResult.decreases.length > 0) {
                agingResult.decreases.forEach(stat => {
                    agingUpdates[stat] = Math.max(1, (characterData[stat] ?? 1) - 1);
                });
                agingWarn = ` Aging: ${agingResult.decreases.join(", ")} -1.`;
                agingHist = ` Age took its toll: ${agingResult.decreases.join(", ")} each reduced by 1.`;
            }
        }

        const finishEndOfTerm = (bonusSkill) => {
            if (bonusSkill) {
                applySkill(setSkills, setCharacterData, bonusSkill, { maxSkills: characterData.INT + characterData.EDU });
                histText += `Special assignment granted ${characterName} additional training in ${bonusSkill}. `;
            }
            histText += agingHist;
            warnText += agingWarn;
            if (Object.keys(agingUpdates).length > 0) {
                setCharacterData(prev => ({ ...prev, ...agingUpdates }));
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

        if (specResult[0]) {
            const dataKey = getArmDataKey(career, characterData.career?.branch);
            const armData = datatables.Army?.[dataKey];
            if (armData) {
                const mosList = armData["MOS"] ?? [];
                const rawSkill = normalizeServiceSkill(mosList[Math.floor(Math.random() * mosList.length)], career);
                const cascadeOpts = datatables.Skills?.[rawSkill];
                if (Array.isArray(cascadeOpts) && cascadeOpts.length > 0) {
                    triggerCascade(rawSkill, cascadeOpts.map(s => normalizeServiceSkill(s, career)), finishEndOfTerm);
                } else {
                    finishEndOfTerm(rawSkill);
                }
            } else {
                finishEndOfTerm(null);
            }
        } else {
            finishEndOfTerm(null);
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
        setPromotedThisTerm(false);
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
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">
                {career.charAt(0).toUpperCase() + career.slice(1)} — Term {displayTerm}
                {branch ? ` (${branch})` : ""}
                {isOfficer ? ` [Officer]` : ` [Enlisted]`}
            </h2>

            {warning && (
                <p className="text-xs text-destructive">{warning}</p>
            )}

            {/* ARM SELECTION */}
            {armStep === "selectArm" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Choose your combat arm:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableArms.map(arm => {
                            const desc = armDescriptions[arm]?.[1] ?? "";
                            return (
                                <div key={arm}>
                                    <Button onClick={() => handleArmSelect(arm)}>{arm}</Button>
                                    {desc && (
                                        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* YEAR 1: INITIAL TRAINING */}
            {armStep === "initialTraining" && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Year 1 — Initial Training</p>
                    <p className="text-xs text-muted-foreground">Choose your Gun Combat specialty:</p>
                    <Select value={year1GunCombatPick} onValueChange={setYear1GunCombatPick}>
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="-- Select --">
                                {year1GunCombatPick || undefined}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {gunCombatSubskills.map((skill, i) => (
                                <SelectItem key={i} value={skill}>{skill}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {year1MosResult && (
                        <p className="text-xs text-muted-foreground">
                            MOS roll: <span className="font-semibold text-foreground">{year1MosResult}</span>
                        </p>
                    )}
                    <Button onClick={handleInitialTrainingConfirm} disabled={!year1GunCombatPick}>
                        Complete Training &amp; Begin Year 2
                    </Button>
                </div>
            )}

            {/* YEARS 2–4: ASSIGNMENT ROLL */}
            {armStep === "yearStart" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Year {currentYear} of 4 ready.</p>
                    <Button onClick={handleYearRoll}>Roll Year {currentYear} Assignment</Button>
                </div>
            )}

            {/* YEARS 2–4: SKILL TABLE PICK */}
            {armStep === "yearSkillPick" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Skills check passed. Choose a table to roll on:</p>
                    <div className="flex flex-wrap gap-2">
                        {availablePools.map(pool => (
                            <Button
                                key={pool.name}
                                onClick={() => handleTableSelect(pool)}
                                disabled={pendingSkillResult !== null}
                            >
                                {pool.name}
                            </Button>
                        ))}
                    </div>
                    {pendingSkillResult && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Rolled <span className="font-semibold text-foreground">{pendingSkillResult.roll}</span>
                                {pendingSkillResult.mod > 0 && <span> (DM+{pendingSkillResult.mod})</span>}
                                {" "}on {pendingSkillResult.tableName}:{" "}
                                <span className="font-semibold text-foreground">{pendingSkillResult.skill}</span>
                            </p>
                            <Button onClick={handleSkillConfirm}>
                                {currentYear < 4
                                    ? `Accept & Continue to Year ${currentYear + 1}`
                                    : "Accept & Resolve Term"}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* RE-ENLIST / RETIRE */}
            {(armStep === "reinlistChoice" || armStep === "forced" || armStep === "retire") && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {armStep === "forced"
                            ? `${characterName} is compelled to remain in service.`
                            : armStep === "retire"
                                ? `${characterName} has been discharged from service.`
                                : "Service term complete. Reinlist or retire?"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {armStep !== "retire" && (
                            <Button onClick={handleReinlist}>Reinlist as {career}</Button>
                        )}
                        {armStep !== "forced" && (
                            <Button variant="outline" onClick={handleRetire}>Retire</Button>
                        )}
                    </div>
                </div>
            )}

            {/* YEAR LOG */}
            {yearLogs.length > 0 && (
                <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground">Service Record — Term {displayTerm}:</p>
                    {yearLogs.map((log, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {log}</p>
                    ))}
                </div>
            )}

            {/* CASCADE SKILL MODAL */}
            <Dialog open={!!pendingCascade} onOpenChange={() => { }}>
                <DialogContent
                    className="max-w-md"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Cascade Skill</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground bg-muted border-l-4 border-primary px-3 py-2 rounded-md">
                            You rolled <span className="font-medium text-foreground">{pendingCascade?.parentSkill}</span> — choose a specialization:
                        </p>
                        <Select value={cascadeChoice} onValueChange={setCascadeChoice}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- Select --">
                                    {cascadeChoice || undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {(pendingCascade?.options ?? []).map((s, i) => (
                                    <SelectItem key={i} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCascadeConfirm} disabled={!cascadeChoice}>
                            Confirm Skill
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
