"use client";

import React, { useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill, getAgingRolls, careerCheckSpecReinlist, generateBattlename, generateOperationName, generateSystemName, getDecorationFromRoll, resolveCourtMartialResult } from "../lib/helpers";
import { buildYearHistoryArmy, buildBranchAssignmentArmy, buildInitialTrainingArmy, buildSkillGainHistory, buildEndOfTermArmy } from "../lib/historyText";
import { useCascade } from "../lib/useCascade";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CascadeSkillDialog } from "./shared/CascadeSkillDialog";
import { SkillPickSection } from "./shared/SkillPickSection";
import { ServiceLogSection } from "./shared/ServiceLogSection";
import { ReinlistRetireSection } from "./shared/ReinlistRetireSection";

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

    const { pendingCascade, cascadeChoice, setCascadeChoice, triggerCascade, handleCascadeConfirm } =
        useCascade(s => normalizeServiceSkill(s, career));

    // Career-level check arrays — army/marines not in Basics, use fallbacks
    const basicsData = datatables.Basics?.[career];
    const specCheck = basicsData?.specduty ?? [7];
    const reinCheck = basicsData?.reenlist ?? [6];

    const handleArmSelect = (arm) => {
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, branch: arm },
        }));
        handleHistoryAdd(buildBranchAssignmentArmy(characterName, arm, career));

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
            handleHistoryAdd(buildInitialTrainingArmy(characterName, characterData.career?.branch ?? career, career, year1GunCombatPick, finalMosSkill));
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
        let log = `Term ${displayTerm}, Year ${currentYear}: rolled ${assignRoll} — ${rolledAssignment}${reassigned ? ` → ${assignmentName}` : ""}. `;
        const flags = {
            term: displayTerm,
            year: currentYear,
            assignment: assignmentName,
            worldName,
            battleName,
            isCombat,
            kia: false,
            decoration: null,
            special: null,
            specialCommission: null,
            commissionedAuto: false,
            commissionedRolled: false,
            commissionedRankName: null,
            promoted: false,
            promotedToRankName: null,
        };

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
        } else {
            log += `Safe duty. `;
        }

        if (!survived) {
            flags.kia = true;
            handleHistoryAdd(buildYearHistoryArmy(flags, characterName, career));
            setWarning(log);
            setYearLogs(prev => [...prev, log]);
            setPageWarning?.(log);
            setStep("End");
            return;
        }

        // Decoration (combat assignments only)
        let courtMartialTriggered = false;
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
                flags.decoration = { key: decoKey, full: decoFull };
            } else {
                log += `No decoration (rolled ${decoRoll} vs ${decoTarget}+). `;
                if (decoRoll <= decoTarget - 6) courtMartialTriggered = true;
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
            flags.special = { name: specialAssignment };

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
                    if (characterData.chronoAge > 38) {
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
                        flags.specialCommission = datatables.rank[career]?.["O"]?.[oRank]?.[0] ?? `O${oRank}`;
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

        // Court martial (decoration failed by 6+)
        let cmHistoryText = "";
        if (courtMartialTriggered) {
            let mod = 0;
            if (!isOfficer && rank >= 7) mod += 1;
            if (isCombat) mod += 2;
            if (assignmentName === "Training") mod -= 2;
            if (isOfficer && rank >= 7) mod -= 1;
            if (hasCommand) mod += 2;
            const cmRoll = d6(1, mod);
            const cmResult = Math.max(-1, Math.min(10, cmRoll));
            const dmStr = mod !== 0 ? ` DM${mod > 0 ? "+" : ""}${mod}` : "";
            log += `Court Martial! 1d6${dmStr} = ${cmRoll}. `;

            const effects = resolveCourtMartialResult(cmResult, { characterName });
            log += effects.logText + " ";

            setCharacterData(prev => {
                const next = { ...prev, career: { ...prev.career } };
                if (effects.rankChange) next.career.rank = Math.max(1, next.career.rank + effects.rankChange);
                if (effects.ageIncrease) {
                    next.bioAge = (next.bioAge ?? 18) + effects.ageIncrease;
                    next.chronoAge = (next.chronoAge ?? 18) + effects.ageIncrease;
                }
                if (effects.promotionDMPenalty) next.career.promotionDMPenalty = (next.career.promotionDMPenalty ?? 0) + effects.promotionDMPenalty;
                if (effects.musterPenalty) next.career.musterPenalty = (next.career.musterPenalty ?? 0) + effects.musterPenalty;
                if (effects.extraAwards.length) next.awards = [...(next.awards ?? []), ...effects.extraAwards];
                if (effects.forcedRetire) next.career.terms = next.career.terms + 1;
                return next;
            });

            if (effects.forcedRetire || effects.jailNoService) {
                handleHistoryAdd(buildYearHistoryArmy(flags, characterName, career) + " " + effects.historyText);
                setYearLogs(prev => [...prev, log]);
                setWarning(log);
                if (effects.forcedRetire) setStep("retire");
                return;
            }

            cmHistoryText = effects.historyText;
        }

        // Commission / Promotion (years 2–4 only; year 1 is initial training)
        // promoTarget === 0 means this assignment has no promotion opportunity
        if (currentYear > 1 && promoTarget > 0) {
            // +1 DM: Support arm + INT 8+, Commando + END 8+, all other arms + EDU 7+
            const currentBranchForPromo = characterData.career?.branch ?? "";
            const reprimandDM = characterData.career?.promotionDMPenalty ?? 0;
            const promoDM =
                (currentBranchForPromo === "Support" ? (characterData.INT >= 8 ? 1 : 0) :
                    currentBranchForPromo === "Commando" ? (characterData.END >= 8 ? 1 : 0) :
                        characterData.EDU >= 7 ? 1 : 0) + reprimandDM;
            const dmStr = promoDM !== 0 ? ` DM${promoDM > 0 ? "+" : ""}${promoDM}` : "";

            const currentIsOfficer = isOfficer || commissionedThisYear;
            const hasPendingCommission =
                characterData.commission === career ||
                (career === "marines" && characterData.commission === "navy");

            if (!currentIsOfficer) {
                // Non-officer: commission check every year, no per-term cap
                if (hasPendingCommission) {
                    const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                    log += `Auto-commissioned as ${o1Name} (pending commission). `;
                    flags.commissionedAuto = true;
                    flags.commissionedRankName = o1Name;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
                } else {
                    const posRoll = d6(2, promoDM);
                    const commissioned = posRoll >= promoTarget;
                    log += `Commission (${promoTarget}+${dmStr}): rolled ${posRoll} — ${commissioned ? "Commissioned!" : "Not commissioned"}. `;
                    if (commissioned) {
                        const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                        flags.commissionedRolled = true;
                        flags.commissionedRankName = o1Name;
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true, promotionDMPenalty: 0 } }));
                    } else if (reprimandDM !== 0) {
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, promotionDMPenalty: 0 } }));
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
                    flags.promoted = true;
                    flags.promotedToRankName = rankName;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: newRank, promotionDMPenalty: 0 } }));
                    setPromotedThisTerm(true);
                } else if (reprimandDM !== 0) {
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, promotionDMPenalty: 0 } }));
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
        handleHistoryAdd(buildYearHistoryArmy(flags, characterName, career) + (cmHistoryText ? " " + cmHistoryText : ""));

        if (skillsPassed) {
            setArmStep("yearSkillPick");
        } else {
            advanceYearOrEnd();
        }
    };

    const advanceYearOrEnd = () => {
        const newBioAge = (characterData.bioAge ?? 18) + 1;
        setCharacterData(prev => ({
            ...prev,
            bioAge: (prev.bioAge ?? 18) + 1,
            chronoAge: (prev.chronoAge ?? 18) + 1,
        }));
        if (currentYear < 4) {
            setCurrentYear(prev => prev + 1);
            setArmStep("yearStart");
        } else {
            handleEndOfTerm(newBioAge);
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
        handleHistoryAdd(buildSkillGainHistory(displayTerm, currentYear, characterName, pendingSkillResult.skill, pendingSkillResult.tableName, career));

        // Reset per-year state
        setPendingSkillResult(null);
        setCommandCheckResult(null);
        setYearHadShipsTroops(false);
        setYearMosAvailable(false);
        setYearMosTable([]);

        advanceYearOrEnd();
    };

    const handleEndOfTerm = (endBioAge) => {
        let warnText = "";

        // Special duty
        const specResult = careerCheckSpecReinlist(specCheck, characterName);
        warnText += `Special Duty: ${specResult[1]} `;

        // Reinlist roll
        const reinlistResult = careerCheckSpecReinlist(reinCheck, characterName);
        warnText += `Reinlist: ${reinlistResult[1]}`;

        // Aging — bioAge already incremented by advanceYearOrEnd
        const endAge = endBioAge;
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
            }
            warnText += agingWarn;
            if (Object.keys(agingUpdates).length > 0) {
                setCharacterData(prev => ({ ...prev, ...agingUpdates }));
            }
            handleHistoryAdd(buildEndOfTermArmy(characterName, displayTerm, career, characterData.career?.branch, bonusSkill, agingHist));
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
        const pension = (newTerms >= 5 && PENSION_CAREERS.includes(career)) ? 2000 * newTerms : 0;
        setCharacterData(prev => ({
            ...prev,
            pension,
            career: { ...prev.career, terms: newTerms },
        }));
        setStep("retire");
    };

    const handleReinlist = () => {
        const newTerms = characterData.career.terms + 1;
        setCharacterData(prev => ({
            ...prev,
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
                <p className="text-xs text-destructive whitespace-pre-line">
                    {warning.replace(/\. (?=[A-Z])/g, ".\n").trim()}
                </p>
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

            {armStep === "yearSkillPick" && (
                <SkillPickSection
                    availablePools={availablePools}
                    pendingSkillResult={pendingSkillResult}
                    currentYear={currentYear}
                    onTableSelect={handleTableSelect}
                    onSkillConfirm={handleSkillConfirm}
                />
            )}

            {(armStep === "reinlistChoice" || armStep === "forced" || armStep === "retire") && (
                <ReinlistRetireSection
                    step={armStep}
                    characterName={characterName}
                    reinlistLabel={`Reinlist as ${career}`}
                    onReinlist={handleReinlist}
                    onRetire={handleRetire}
                />
            )}

            <ServiceLogSection yearLogs={yearLogs} displayTerm={displayTerm} />
            <CascadeSkillDialog
                pendingCascade={pendingCascade}
                cascadeChoice={cascadeChoice}
                setCascadeChoice={setCascadeChoice}
                onConfirm={handleCascadeConfirm}
            />
        </div>
    );
}
