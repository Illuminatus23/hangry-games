"use client";

import React, { useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill, getAgingRolls, generateBattlename, generateSystemName } from "../lib/helpers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const PENSION_CAREERS = ['navy', 'marines', 'army', 'scouts', 'flyer', 'sailor'];

function getBranchDataKey(branchName) {
    if (branchName === "Technical Services") return "Technical";
    return branchName;
}

function normalizeNavySkill(skill) {
    const map = {
        "Strength": "STR", "Dexterity": "DEX", "Endurance": "END",
        "Intelligence": "INT", "Education": "EDU", "Social": "SOC",
        "Mechanics": "Mechanical",
        "Administration": "Admin",
        "Jack-of-All-Trades": "Jack-of-all-Trades",
        "Leadership": "Leader",
    };
    return map[skill] ?? skill;
}

function getDecorationFromRoll(roll, threshold) {
    if (threshold <= 0) return null;
    if (roll >= threshold + 4) return "SEH";
    if (roll >= threshold + 2) return "MCG";
    if (roll >= threshold) return "MCUF";
    return null;
}

function getFleetType(subcareername) {
    const s = (subcareername ?? "").toLowerCase();
    if (s.includes("reserve")) return "reserve";
    if (s.includes("system")) return "system";
    return "imperial";
}

function getPoolMod(poolName, rank, isOfficer) {
    if (poolName === "Navy Life") {
        if (!isOfficer) return 0;
        if (rank >= 7) return 3;
        if (rank >= 4) return 2;
        return 1;
    }
    if (poolName === "Petty Officer") {
        if (isOfficer || rank < 4) return 0;
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

function rollOnPool(pool, rank, isOfficer) {
    const mod = getPoolMod(pool.name, rank, isOfficer);
    const roll = d6(1, mod);
    const idx = Math.min(roll - 1, pool.skills.length - 1);
    const skill = normalizeNavySkill(pool.skills[idx]);
    const raw = datatables.Skills?.[skill];
    const isCascade = Array.isArray(raw) && raw.length > 0;
    return {
        roll, mod, skill, isCascade,
        cascadeOptions: isCascade ? raw.map(s => normalizeNavySkill(s)) : [],
    };
}

function buildAssignmentHistory(assignmentName, year, characterName, worldName, battleName) {
    switch (assignmentName) {
        case "Training":
            return `Year ${year}: ${characterName} spent a year in training.`;
        case "Shore Duty":
            return `Year ${year}: ${characterName} was posted to shore duty on ${worldName}`;
        case "Patrol":
            return `Year ${year}: ${characterName} served aboard a patrol vessel in the ${worldName} system`;
        case "Siege":
            return `Year ${year}: ${characterName} participated in the siege of ${worldName}`;
        case "Strike":
            return `Year ${year}: ${characterName} took part in a strike mission at ${worldName}`;
        case "Battle":
            return `Year ${year}: ${characterName} served in ${battleName ?? "a major fleet engagement"}`;
        default:
            return `Year ${year}: ${characterName} spent the year on assignment.`;
    }
}

export default function NavyTerm({
    characterData,
    setCharacterData,
    characterName,
    handleHistoryAdd,
    setSkills,
    setStep,
    skills,
    setPageWarning,
}) {
    const subcareername = characterData.career?.subcareername ?? "";
    const terms = characterData.career?.terms ?? 0;
    const displayTerm = terms + 1;
    const isFirstTerm = terms === 0;
    const branch = characterData.career?.branch ?? "";
    const isOfficer = characterData.career?.officer ?? false;
    const rank = characterData.career?.rank ?? 0;
    const fleetType = getFleetType(subcareername);
    const fleetDisplay =
        fleetType === "reserve" ? "Reserve Fleet" :
        fleetType === "system" ? "System Squadron" : "Imperial Navy";

    const [navyStep, setNavyStep] = useState(branch ? "yearStart" : "branchAssign");
    const [currentYear, setCurrentYear] = useState(1);
    const [yearLogs, setYearLogs] = useState([]);
    const [warning, setWarning] = useState("");

    // Branch assignment
    const [rolledBranch, setRolledBranch] = useState("");
    const [canChooseBranch, setCanChooseBranch] = useState(false);
    const [manualBranchChoice, setManualBranchChoice] = useState("");

    // Boot camp (first term, year 1)
    const [bootPickNum, setBootPickNum] = useState(1);
    const [bootPick1, setBootPick1] = useState("");

    // Year assignment tracking
    const [forcedNextAssignment, setForcedNextAssignment] = useState(null);
    const [lastYearWasRepeat, setLastYearWasRepeat] = useState(false);

    // Per-year state
    const [availablePools, setAvailablePools] = useState([]);
    const [yearSkillAvailable, setYearSkillAvailable] = useState(false);
    const [pendingSkillResult, setPendingSkillResult] = useState(null);
    const [promotedThisTerm, setPromotedThisTerm] = useState(false);

    // Cascade dialog
    const [pendingCascade, setPendingCascade] = useState(null);
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
            setPendingCascade({
                parentSkill: cascadeChoice,
                options: nestedRaw.map(s => normalizeNavySkill(s)),
                onConfirm: callback,
            });
            setCascadeChoice("");
        } else {
            setPendingCascade(null);
            setCascadeChoice("");
            callback(cascadeChoice);
        }
    };

    const maxSkills = characterData.INT + characterData.EDU;
    const applyNavySkill = (skill) => applySkill(setSkills, setCharacterData, skill, { maxSkills });

    const applyWithCascadeCheck = (rawSkill, onDone) => {
        const skill = normalizeNavySkill(rawSkill);
        const opts = datatables.Skills?.[skill];
        if (Array.isArray(opts) && opts.length > 0) {
            triggerCascade(skill, opts.map(s => normalizeNavySkill(s)), (finalSkill) => {
                applyNavySkill(finalSkill);
                onDone?.(finalSkill);
            });
        } else {
            applyNavySkill(skill);
            onDone?.(skill);
        }
    };

    // ─── Branch Assignment ──────────────────────────────────────────────────

    const handleRollBranch = () => {
        if (characterData.medgrad?.[0]) { confirmBranch("Medical"); return; }
        if (characterData.awards?.some(a => a.toLowerCase().includes("flight school"))) {
            confirmBranch("Flight"); return;
        }
        if (characterData.SOC >= 9) {
            setCanChooseBranch(true);
            setWarning(`SOC ${characterData.SOC} grants ${characterName} a free branch choice.`);
            return;
        }
        let dm = 0;
        if (characterData.EDU >= 9) dm += 2;
        if (characterData.INT >= 10) dm += 2;
        if (fleetType === "imperial") dm -= 2;

        const raw = d6(2, dm);
        const idx = Math.max(0, Math.min(7, raw - 2));
        const table = isOfficer ? "O" : "E";
        const branchName = datatables.Navy.BranchSelect[table][idx];
        const dmStr = dm !== 0 ? ` DM${dm > 0 ? "+" : ""}${dm}` : "";
        setRolledBranch(branchName);
        setWarning(`Branch roll: 2d6 (${raw})${dmStr} → index ${idx} → ${branchName}`);
    };

    const confirmBranch = (branchName) => {
        setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: branchName } }));
        handleHistoryAdd(`${characterName} was assigned to the ${branchName} branch of the ${fleetDisplay}.`);
        setRolledBranch("");
        setCanChooseBranch(false);
        setManualBranchChoice("");
        setNavyStep(isFirstTerm ? "bootCamp" : "yearStart");
    };

    const allBranches = isOfficer
        ? ["Technical Services", "Line", "Crew", "Engineering", "Gunnery", "Medical", "Flight"]
        : ["Technical Services", "Crew", "Engineering", "Gunnery", "Medical"];

    // ─── Boot Camp ─────────────────────────────────────────────────────────

    const handleBootPick = (source) => {
        const b = characterData.career?.branch ?? branch;
        const branchData = datatables.Navy?.[getBranchDataKey(b)];
        const mosList = (branchData?.["MOS"] ?? []).map(normalizeNavySkill);
        const commandList = (datatables.Navy.ServiceSkills["Command"] ?? []).map(normalizeNavySkill);
        const list = source === "Command" ? commandList : mosList;
        if (!list.length) { setWarning("No skills available."); return; }

        const rawSkill = list[Math.min(d6(1, 0) - 1, list.length - 1)];

        if (bootPickNum === 1) {
            applyWithCascadeCheck(rawSkill, (finalSkill) => {
                setBootPick1(finalSkill);
                setBootPickNum(2);
            });
        } else {
            applyWithCascadeCheck(rawSkill, (finalSkill) => {
                handleHistoryAdd(
                    `${characterName} completed boot camp in the ${b} branch, gaining ${bootPick1} and ${finalSkill}.`
                );
                setBootPickNum(1);
                setCurrentYear(2);
                setNavyStep("yearStart");
            });
        }
    };

    // ─── Year Roll ──────────────────────────────────────────────────────────

    const advanceYearOrEnd = () => {
        if (currentYear < 4) {
            setCurrentYear(prev => prev + 1);
            setNavyStep("yearStart");
        } else {
            handleEndOfTerm();
        }
    };

    const handleYearRoll = () => {
        const currentBranch = characterData.career?.branch;
        const dataKey = getBranchDataKey(currentBranch);
        const branchData = datatables.Navy?.[dataKey];
        if (!branchData) { setWarning(`No data for branch: ${currentBranch}`); return; }

        let log = `Year ${currentYear}: `;
        let historyLog = "";
        let commissionedThisYear = false;

        // Step 1 — Command check (officers only)
        let hasCommand = null;
        if (isOfficer) {
            const commandTarget = branchData["Command"] ?? 99;
            let cmdDM = 0;
            if (rank <= 2) cmdDM -= 2;
            else if (rank <= 4) cmdDM -= 1;
            if (characterData.INT <= 7) cmdDM -= 1;
            if (characterData.EDU <= 7) cmdDM -= 1;
            const cmdRoll = d6(2, cmdDM);
            hasCommand = cmdRoll >= commandTarget;
            const dmStr = cmdDM !== 0 ? ` DM${cmdDM}` : "";
            log += `Command (${commandTarget}+${dmStr}): rolled ${cmdRoll} — ${hasCommand ? "Command" : "Staff"}. `;
        }

        // Step 2 — Assignment roll
        let displayAssignment;
        let wasRepeat = false;

        if (forcedNextAssignment) {
            displayAssignment = forcedNextAssignment;
            wasRepeat = true;
            setForcedNextAssignment(null);
            log += `Same assignment as last year: ${displayAssignment}. `;
        } else {
            const isCollegeGrad = characterData.grad?.[0] || characterData.medgrad?.[0];
            const assignDM = (isCollegeGrad && rank >= 4) ? 1 : 0;
            const assignRoll = d6(2, assignDM);
            const assignIdx = Math.max(0, Math.min(11, assignRoll - 2));
            displayAssignment = datatables.Navy.Assignments[assignIdx];
            log += `Assignment: rolled ${assignRoll}${assignDM ? ` DM+${assignDM}` : ""} → ${displayAssignment}. `;
        }
        setLastYearWasRepeat(wasRepeat);

        // Special sub-table
        let dataAssignment = displayAssignment;
        if (displayAssignment === "Special") {
            const specTable = isOfficer ? datatables.Navy.Special["O"] : datatables.Navy.Special["E"];
            const specDM = characterData.EDU >= 8 ? 1 : 0;
            const specRoll = Math.min(7, Math.max(1, d6(1, specDM)));
            const specialResult = specTable[specRoll] ?? "";
            log += `Special: rolled ${specRoll}${specDM ? " DM+1" : ""} → ${specialResult || "no event"}. `;
            historyLog = `Year ${currentYear}: ${characterName} was selected for special duty${specialResult ? ` — ${specialResult}` : ""}.`;

            if (specialResult === "Cross-Training") {
                const allDataKeys = ["Line", "Crew", "Flight", "Engineering", "Medical", "Gunnery", "Techical"];
                const otherKeys = allDataKeys.filter(k => k !== dataKey);
                const crossKey = otherKeys[Math.floor(Math.random() * otherKeys.length)];
                const crossMos = datatables.Navy?.[crossKey]?.["MOS"] ?? [];
                if (crossMos.length) {
                    const crossSkill = normalizeNavySkill(crossMos[Math.min(d6(1, 0) - 1, crossMos.length - 1)]);
                    const displayKey = crossKey === "Techical" ? "Technical Services" : crossKey;
                    log += `Cross-trained in ${displayKey}: ${crossSkill}. `;
                    setCharacterData(prev => ({ ...prev, awards: [...(prev.awards ?? []), `Cross-trained: ${displayKey}`] }));
                    applyWithCascadeCheck(crossSkill, null);
                }
            } else if (specialResult === "Specialist") {
                const useSchooling = (characterData.INT + characterData.EDU) > 16;
                const list = useSchooling ? datatables.Navy.Schooling : datatables.Navy.Training;
                const idx = Math.min(d6(1, 0), list.length - 1);
                const school = normalizeNavySkill(list[idx] ?? "");
                if (school) {
                    log += `${useSchooling ? "Schooling" : "Training"}: ${school}. `;
                    applyWithCascadeCheck(school, null);
                }
            } else if (specialResult === "Recruiting") {
                applyNavySkill("Recruiting");
                log += "Gained Recruiting. ";
            } else if (specialResult === "Gunnery") {
                const gMos = datatables.Navy.Gunnery?.["MOS"] ?? [];
                if (gMos.length) {
                    const s = normalizeNavySkill(gMos[Math.min(d6(1, 0) - 1, gMos.length - 1)]);
                    log += `Gunnery school: ${s}. `;
                    applyWithCascadeCheck(s, null);
                }
            } else if (specialResult === "Engineering") {
                const eMos = datatables.Navy.Engineering?.["MOS"] ?? [];
                if (eMos.length) {
                    const s = normalizeNavySkill(eMos[Math.min(d6(1, 0) - 1, eMos.length - 1)]);
                    log += `Engineering school: ${s}. `;
                    applyWithCascadeCheck(s, null);
                }
            } else if (specialResult === "OCS") {
                const overAge = characterData.age > 38;
                const waiverOk = !overAge || d6(1, specDM) >= 5;
                if (waiverOk) {
                    commissionedThisYear = true;
                    const eR = rank ?? 0;
                    const oR = eR >= 8 ? 3 : eR >= 7 ? 2 : 1;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: oR, officer: true } }));
                    const cmdPool = datatables.Navy.ServiceSkills["Command"] ?? [];
                    if (cmdPool.length) {
                        const cs = normalizeNavySkill(cmdPool[Math.min(d6(1, 0) - 1, cmdPool.length - 1)]);
                        log += `OCS Command: ${cs}. `;
                        applyWithCascadeCheck(cs, null);
                    }
                    const mosList = branchData?.["MOS"] ?? [];
                    for (let i = 0; i < 2; i++) {
                        if (mosList.length) {
                            const ms = normalizeNavySkill(mosList[Math.min(d6(1, 0) - 1, mosList.length - 1)]);
                            log += `OCS MOS: ${ms}. `;
                            applyWithCascadeCheck(ms, null);
                        }
                    }
                    log += `Commissioned O${oR}. `;
                    historyLog += ` ${characterName} completed OCS and was commissioned.`;
                } else {
                    log += "OCS waiver denied — over age 38. ";
                }
            } else if (specialResult === "Intelligence") {
                const staffPool = datatables.Navy.ServiceSkills["Staff"] ?? [];
                if (staffPool.length) {
                    const s = normalizeNavySkill(staffPool[Math.min(d6(1, 0) - 1, staffPool.length - 1)]);
                    log += `Intelligence duty: ${s}. `;
                    applyWithCascadeCheck(s, null);
                }
            } else if (specialResult === "Aide") {
                const aideRoll = d6(1, 0);
                setCharacterData(prev => ({ ...prev, SOC: (prev.SOC ?? 0) + 1 }));
                if (aideRoll <= 3) {
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: (prev.career?.rank ?? 0) + 1 } }));
                    log += "Military Aide: SOC +1, rank +1. ";
                } else {
                    log += "Military Aide: SOC +1. ";
                }
            } else if (specialResult === "Command College") {
                const cmdPool = datatables.Navy.ServiceSkills["Command"] ?? [];
                if (cmdPool.length) {
                    const s = normalizeNavySkill(cmdPool[Math.min(d6(1, 0) - 1, cmdPool.length - 1)]);
                    log += `Command College: ${s}. `;
                    applyWithCascadeCheck(s, null);
                }
            } else if (specialResult === "Staff College") {
                const stPool = datatables.Navy.ServiceSkills["Staff"] ?? [];
                if (stPool.length) {
                    const s = normalizeNavySkill(stPool[Math.min(d6(1, 0) - 1, stPool.length - 1)]);
                    log += `Staff College: ${s}. `;
                    applyWithCascadeCheck(s, null);
                }
            }

            dataAssignment = "Training"; // Special uses Training targets for step 3
        }

        // Frozen Watch — safe transit year
        if (displayAssignment === "Frozen Watch") {
            log += "Frozen Watch — safe transit, no events.";
            handleHistoryAdd(`Year ${currentYear}: ${characterName} spent the year in frozen watch aboard a transit vessel.`);
            setYearLogs(prev => [...prev, log]);
            setWarning(log);
            if (currentYear < 4 && !wasRepeat) {
                if (d6(1, 0) === 6) setForcedNextAssignment("Frozen Watch");
            }
            advanceYearOrEnd();
            return;
        }

        // Step 3 — Resolve assignment
        const assignmentData = branchData[dataAssignment];
        if (!Array.isArray(assignmentData)) {
            log += `Unknown assignment "${dataAssignment}" — treated as safe duty.`;
            handleHistoryAdd(`Year ${currentYear}: ${characterName} spent the year on routine duty.`);
            setYearLogs(prev => [...prev, log]);
            setWarning(log);
            advanceYearOrEnd();
            return;
        }

        const [survivalTarget, decoTarget, promoTarget, skillThreshold, isCombat] = assignmentData;
        const worldName = generateSystemName();
        const battleName = isCombat ? generateBattlename() : null;

        if (!historyLog) {
            historyLog = buildAssignmentHistory(displayAssignment, currentYear, characterName, worldName, battleName);
        }

        // Survival
        let survived = true;
        if (survivalTarget > 0) {
            const combatBranches = ["Line", "Crew", "Gunnery"];
            const mosList = branchData?.["MOS"] ?? [];
            const hasMosPro = combatBranches.includes(currentBranch) &&
                mosList.some(ms => skills.some(s => s.name === normalizeNavySkill(ms) && s.level >= 2));
            const survDM = hasMosPro ? 1 : 0;
            const survRoll = d6(2, survDM);
            survived = survRoll >= survivalTarget;
            log += `Survival (${survivalTarget}+): rolled ${survRoll}${survDM ? ` DM+${survDM}` : ""} — ${survived ? "Survived" : "KIA"}. `;
            historyLog += isCombat && !survived ? " and was killed in action." : ".";
        } else {
            historyLog += ".";
        }

        if (!survived) {
            handleHistoryAdd(isCombat
                ? historyLog
                : `${characterName} was killed during a ${displayAssignment} assignment. The story ends here.`
            );
            setWarning(log);
            setYearLogs(prev => [...prev, log]);
            setPageWarning?.(log);
            setStep("End");
            return;
        }

        // Decoration (combat only)
        if (isCombat && decoTarget > 0) {
            const decoRoll = d6(2, 0);
            const decoKey = getDecorationFromRoll(decoRoll, decoTarget);
            if (decoKey) {
                const decoFull = datatables.decorationDescriptor?.[decoKey] ?? decoKey;
                const withBattle = battleName ? `${decoFull} (${battleName})` : decoFull;
                log += `Decoration: ${decoFull} (rolled ${decoRoll} vs ${decoTarget}+). `;
                historyLog += ` ${characterName} was decorated for their service.`;
                setCharacterData(prev => ({ ...prev, awards: [...(prev.awards ?? []), withBattle] }));
            } else {
                log += `No decoration (rolled ${decoRoll} vs ${decoTarget}+). `;
            }
        }

        // Promotion / Commission
        if (promoTarget > 0) {
            const maxRank = fleetType === "system" ? 7 : fleetType === "reserve" ? 8 : 99;
            const currentIsOfficer = isOfficer || commissionedThisYear;

            const promoDM = (() => {
                if (currentBranch === "Line" || currentBranch === "Crew") return characterData.EDU >= 7 ? 1 : 0;
                if (currentBranch === "Flight" || currentBranch === "Engineering" || currentBranch === "Medical") return characterData.INT >= 8 ? 1 : 0;
                if (currentBranch === "Gunnery") return characterData.END >= 8 ? 1 : 0;
                return 0;
            })();
            const dmStr = promoDM ? ` DM+${promoDM}` : "";

            if (!currentIsOfficer) {
                const hasPending = characterData.commission === "navy";
                if (hasPending) {
                    const o1Name = datatables.rank?.navy?.["O"]?.[1]?.[0] ?? "Ensign";
                    log += `Auto-commissioned as ${o1Name} (pending commission). `;
                    historyLog += ` ${characterName}'s commission came through as ${o1Name}.`;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
                } else {
                    const posRoll = d6(2, promoDM);
                    const commissioned = posRoll >= promoTarget;
                    log += `Commission (${promoTarget}+${dmStr}): rolled ${posRoll} — ${commissioned ? "Commissioned!" : "Not commissioned"}. `;
                    if (commissioned) {
                        const o1Name = datatables.rank?.navy?.["O"]?.[1]?.[0] ?? "Ensign";
                        historyLog += ` ${characterName} received a commission as ${o1Name}.`;
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
                    }
                }
            } else if (!promotedThisTerm && !commissionedThisYear) {
                const promoRoll = d6(2, promoDM);
                const promoted = promoRoll >= promoTarget;
                log += `Promotion (${promoTarget}+${dmStr}): rolled ${promoRoll} — ${promoted ? "Promoted!" : "Not promoted"}. `;
                if (promoted) {
                    const newRank = rank + 1;
                    if (newRank <= maxRank) {
                        const rankName = datatables.rank?.navy?.["O"]?.[newRank]?.[0] ?? `O${newRank}`;
                        historyLog += ` ${characterName} was promoted to ${rankName}.`;
                        setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: newRank } }));
                        setPromotedThisTerm(true);
                    } else {
                        log += `(max rank for ${fleetDisplay} reached) `;
                    }
                }
            }
        }

        // Skill check
        let skillsPassed = false;
        if (skillThreshold > 0) {
            const skillRoll = d6(2, 0);
            skillsPassed = skillRoll >= skillThreshold;
            log += `Skills (${skillThreshold}+): rolled ${skillRoll} — ${skillsPassed ? "table available" : "no skill"}. `;
        }

        // Build available pools
        const ss = datatables.Navy.ServiceSkills;
        const isTrainingOrShore = dataAssignment === "Training" || dataAssignment === "Shore Duty";
        const pools = [{ name: "Navy Life", skills: ss["Navy Life"] }];
        if (isTrainingOrShore) {
            pools.push({ name: "Shore Duty Life", skills: ss["Shore Duty Life"] });
        } else {
            pools.push({ name: "Shipboard Life", skills: ss["Shipboard Life"] });
        }
        if (!isOfficer && !commissionedThisYear && rank >= 4) {
            pools.push({ name: "Petty Officer", skills: ss["Petty Officer"] });
        }
        if (isOfficer || commissionedThisYear) {
            const tableName = hasCommand ? "Command" : "Staff";
            pools.push({ name: tableName, skills: ss[tableName] });
        }
        setAvailablePools(pools);
        setYearSkillAvailable(skillsPassed);

        // Year-end same-assignment roll (not on year 4, not if this was already a repeat)
        if (currentYear < 4 && !wasRepeat) {
            const repeatRoll = d6(1, 0);
            log += `Year-end roll: ${repeatRoll}${repeatRoll === 6 ? " — same assignment next year!" : ""}. `;
            if (repeatRoll === 6) setForcedNextAssignment(displayAssignment);
        }

        setYearLogs(prev => [...prev, log]);
        setWarning(log);
        handleHistoryAdd(historyLog);

        if (skillsPassed) {
            setNavyStep("yearSkillPick");
        } else {
            advanceYearOrEnd();
        }
    };

    // ─── Skill Table Pick ───────────────────────────────────────────────────

    const handleTableSelect = (pool) => {
        const result = rollOnPool(pool, rank, isOfficer);
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
        applyNavySkill(pendingSkillResult.skill);
        handleHistoryAdd(
            `Year ${currentYear}: ${characterName} gained ${pendingSkillResult.skill} from ${pendingSkillResult.tableName} training.`
        );
        setPendingSkillResult(null);
        setYearSkillAvailable(false);
        setAvailablePools([]);
        advanceYearOrEnd();
    };

    // ─── End of Term ────────────────────────────────────────────────────────

    const handleEndOfTerm = () => {
        const reinDM = (isOfficer || rank >= 4) ? 1 : 0;
        const reinRoll = d6(2, reinDM);
        const forced = reinRoll >= 12;
        const canReinlist = reinRoll >= 6;
        const dmStr = reinDM ? " DM+1" : "";
        let warnText = `Reenlistment (6+${dmStr}): rolled ${reinRoll} — ${forced ? "Must reinlist!" : canReinlist ? "May reinlist" : "Discharged"}. `;

        // Aging
        const endAge = characterData.age + 4;
        let agingWarn = "";
        let agingHist = "";
        const agingUpdates = {};
        if (endAge >= 34) {
            const agingResult = getAgingRolls(endAge);
            if (agingResult.decreases.length > 0) {
                agingResult.decreases.forEach(stat => {
                    agingUpdates[stat] = Math.max(1, (characterData[stat] ?? 1) - 1);
                });
                agingWarn = ` Aging: ${agingResult.decreases.join(", ")} -1.`;
                agingHist = ` The years caught up with ${characterName}: ${agingResult.decreases.join(", ")} each reduced by 1.`;
            }
        }

        if (Object.keys(agingUpdates).length > 0) {
            setCharacterData(prev => ({ ...prev, ...agingUpdates }));
        }

        handleHistoryAdd(
            `${characterName} completed Term ${displayTerm} with the ${fleetDisplay} (${characterData.career?.branch}).${agingHist}`
        );
        setWarning(warnText + agingWarn);
        setNavyStep(forced ? "forced" : canReinlist ? "reinlistChoice" : "retire");
    };

    const handleRetire = () => {
        const newTerms = terms + 1;
        const newAge = characterData.age + 4;
        const pension = (newTerms >= 5 && PENSION_CAREERS.includes("navy")) ? 2000 * newTerms : 0;
        setCharacterData(prev => ({
            ...prev,
            age: newAge,
            pension,
            career: { ...prev.career, terms: newTerms },
        }));
        setStep("retire");
    };

    const handleReinlist = () => {
        const newTerms = terms + 1;
        const newAge = characterData.age + 4;
        setCharacterData(prev => ({
            ...prev,
            age: newAge,
            career: { ...prev.career, terms: newTerms },
        }));
        setNavyStep("yearStart");
        setCurrentYear(1);
        setYearLogs([]);
        setWarning("");
        setPendingSkillResult(null);
        setYearSkillAvailable(false);
        setAvailablePools([]);
        setForcedNextAssignment(null);
        setLastYearWasRepeat(false);
        setPromotedThisTerm(false);
        setBootPickNum(1);
    };

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">
                {fleetDisplay} — Term {displayTerm}
                {branch ? ` (${branch})` : ""}
                {isOfficer ? " [Officer]" : " [Enlisted]"}
            </h2>

            {warning && (
                <p className="text-xs text-destructive">{warning}</p>
            )}

            {/* BRANCH ASSIGNMENT */}
            {navyStep === "branchAssign" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Determine branch assignment.
                        {characterData.EDU >= 9 ? " EDU 9+ DM+2." : ""}
                        {characterData.INT >= 10 ? " INT 10+ DM+2." : ""}
                        {fleetType === "imperial" ? " Imperial Navy DM-2." : ""}
                    </p>
                    {!rolledBranch && !canChooseBranch && (
                        <Button onClick={handleRollBranch}>Roll Branch Assignment</Button>
                    )}
                    {rolledBranch && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Assigned to: <span className="font-semibold text-foreground">{rolledBranch}</span>
                            </p>
                            <Button onClick={() => confirmBranch(rolledBranch)}>Confirm Assignment</Button>
                        </div>
                    )}
                    {canChooseBranch && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Choose your branch:</p>
                            <Select value={manualBranchChoice} onValueChange={setManualBranchChoice}>
                                <SelectTrigger className="w-56">
                                    <SelectValue placeholder="-- Select Branch --">
                                        {manualBranchChoice || undefined}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {allBranches.map(b => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {manualBranchChoice && (
                                <Button onClick={() => confirmBranch(manualBranchChoice)}>
                                    Confirm {manualBranchChoice}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* BOOT CAMP */}
            {navyStep === "bootCamp" && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">
                        Year 1 — Boot Camp ({characterData.career?.branch})
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Pick {bootPickNum === 1 ? "first" : "second"} boot camp skill.
                        {!isOfficer ? " Roll from MOS." : " Choose MOS or Command table."}
                    </p>
                    {bootPickNum === 2 && bootPick1 && (
                        <p className="text-xs text-muted-foreground">
                            First skill gained: <span className="font-semibold text-foreground">{bootPick1}</span>
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={() => handleBootPick("MOS")}>Roll MOS Skill</Button>
                        {isOfficer && (
                            <Button variant="outline" onClick={() => handleBootPick("Command")}>
                                Roll Command Skill
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* YEAR START */}
            {navyStep === "yearStart" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Year {currentYear} of 4
                        {forcedNextAssignment ? ` — same assignment as last year (${forcedNextAssignment})` : ""}.
                    </p>
                    <Button onClick={handleYearRoll}>Roll Year {currentYear} Assignment</Button>
                </div>
            )}

            {/* YEAR SKILL PICK */}
            {navyStep === "yearSkillPick" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Skills check passed. Choose a table:</p>
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

            {/* REINLIST / RETIRE */}
            {(navyStep === "reinlistChoice" || navyStep === "forced" || navyStep === "retire") && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {navyStep === "forced"
                            ? `${characterName} is compelled to remain in service.`
                            : navyStep === "retire"
                                ? `${characterName} has been discharged from service.`
                                : "Service term complete. Reinlist or retire?"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {navyStep !== "retire" && (
                            <Button onClick={handleReinlist}>Reinlist ({fleetDisplay})</Button>
                        )}
                        {navyStep !== "forced" && (
                            <Button variant="outline" onClick={handleRetire}>Retire</Button>
                        )}
                    </div>
                </div>
            )}

            {/* YEAR LOG */}
            {yearLogs.length > 0 && (
                <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                        Service Record — Term {displayTerm}:
                    </p>
                    {yearLogs.map((log, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {log}</p>
                    ))}
                </div>
            )}

            {/* CASCADE MODAL */}
            <Dialog open={!!pendingCascade} onOpenChange={() => {}}>
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
