"use client";

import React, { useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill, getAgingRolls, generateSystemName } from "../lib/helpers";
import {
    buildOfficeAssignmentScout, buildInitialTrainingScout,
    buildYearHistoryScout, buildSkillGainHistory, buildEndOfTermScout,
} from "../lib/historyText";
import { useCascade } from "../lib/useCascade";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CascadeSkillDialog } from "./shared/CascadeSkillDialog";
import { SkillPickSection } from "./shared/SkillPickSection";
import { ServiceLogSection } from "./shared/ServiceLogSection";
import { ReinlistRetireSection } from "./shared/ReinlistRetireSection";

const FIELD_OFFICES = ['Survey', 'Communications', 'Exploration'];
const ALL_OFFICES = ['Survey', 'Communications', 'Exploration', 'Detached', 'Technical', 'Operations', 'Administration'];

function getSection(office) {
    return FIELD_OFFICES.includes(office) ? 'Field' : 'Bureaucracy';
}

function getSurvivalMod(office, characterData, isAdministrator) {
    const survRow = datatables.Scouts?.[office]?.["Survival"];
    if (!Array.isArray(survRow) || survRow[0] === 'None') return 0;
    const [type, stat, threshold] = survRow;
    if (type === 'UUP') return (characterData[stat] ?? 0) >= threshold ? 1 : 0;
    if (type === 'Skill') {
        // Pilot 2+
        if (stat === 'Pilot') return (characterData.skills ?? []).some(s => s.name === 'Pilot' && s.level >= threshold) ? 1 : 0;
        return 0;
    }
    if (type === 'Officer') return isAdministrator ? 1 : 0;
    return 0;
}

function getPromoMod(office, characterData) {
    const promoRow = datatables.Scouts?.[office]?.["Promotion"];
    if (!Array.isArray(promoRow) || promoRow[0] === 'None') return 0;
    const [type, stat, threshold] = promoRow;
    if (type === 'UUP') return (characterData[stat] ?? 0) >= threshold ? 1 : 0;
    return 0;
}

function normalizeScoutSkill(skill) {
    const map = {
        "Strength": "STR", "Dexterity": "DEX", "Endurance": "END",
        "Intelligence": "INT", "Education": "EDU", "Social": "SOC",
        "Administration": "Admin",
    };
    return map[skill] ?? skill;
}

function getISRankName(rank, isAdministrator) {
    const isNum = isAdministrator ? 9 + rank : rank;
    return `IS-${isNum}`;
}

export default function ScoutTerm({
    characterData,
    setCharacterData,
    characterName,
    handleHistoryAdd,
    setSkills,
    setStep,
    skills,
    setPageWarning,
}) {
    const terms = characterData.career?.terms ?? 0;
    const displayTerm = terms + 1;
    const isFirstTerm = terms === 0;
    const office = characterData.career?.branch ?? "";
    const isAdministrator = characterData.career?.officer ?? false;
    const rank = characterData.career?.rank ?? 0;
    const isHonorsGrad = characterData.grad?.[1] ?? false;
    const isCollegeGrad = characterData.grad?.[0] ?? false;

    const section = getSection(office);

    // termStartAge for 3-year first term support
    const [termStartAge, setTermStartAge] = useState(characterData.bioAge ?? 18);
    const termLength = termStartAge === 19 ? 3 : 4;

    const [scoutStep, setScoutStep] = useState(office ? (isFirstTerm ? "initialTraining" : "yearStart") : "officeAssign");
    const [currentYear, setCurrentYear] = useState(1);
    const [yearLogs, setYearLogs] = useState([]);
    const [warning, setWarning] = useState("");

    // Office assignment
    const [rolledOffice, setRolledOffice] = useState("");
    const [manualOfficeChoice, setManualOfficeChoice] = useState("");

    // Transfer state
    const [transferPending, setTransferPending] = useState(false);
    const [transferForcePending, setTransferForcePending] = useState(false);
    const [transferTargetOffice, setTransferTargetOffice] = useState("");

    // School state
    const [adminSchoolDone, setAdminSchoolDone] = useState(characterData.career?.adminSchoolDone ?? false);
    const [pendingSchoolSkills, setPendingSchoolSkills] = useState([]); // [{skill, picked}]
    const [schoolPickIdx, setSchoolPickIdx] = useState(0);

    // Skill pick state
    const [availablePools, setAvailablePools] = useState([]);
    const [pendingSkillResult, setPendingSkillResult] = useState(null);
    const [promotedThisTerm, setPromotedThisTerm] = useState(false);

    const { pendingCascade, cascadeChoice, setCascadeChoice, triggerCascade, handleCascadeConfirm } =
        useCascade(normalizeScoutSkill);

    const maxSkills = characterData.INT + characterData.EDU;
    const applyScoutSkill = (skill) => applySkill(setSkills, setCharacterData, skill, { maxSkills });

    const applyWithCascade = (rawSkill, onDone) => {
        const skill = normalizeScoutSkill(rawSkill);
        const opts = datatables.Skills?.[skill];
        if (Array.isArray(opts) && opts.length > 0) {
            triggerCascade(skill, opts.map(s => normalizeScoutSkill(s)), (finalSkill) => {
                applyScoutSkill(finalSkill);
                onDone?.(finalSkill);
            });
        } else {
            applyScoutSkill(skill);
            onDone?.(skill);
        }
    };

    // ─── Office Assignment ──────────────────────────────────────────────────

    const handleRollOffice = () => {
        if (isHonorsGrad) {
            setWarning("Honors graduate — choose your office assignment.");
            return;
        }
        // College grads go to Bureaucracy; non-grads go to Field
        const tableKey = (isCollegeGrad || isAdministrator) ? "O" : "E";
        const table = datatables.Scouts.BranchSelect[tableKey];
        const roll = d6(2, 0);
        const idx = Math.max(0, Math.min(table.length - 1, roll - 2));
        const picked = table[idx];
        setRolledOffice(picked);
        setWarning(`Office roll: 2d6 (${roll}) → ${picked}`);
    };

    const confirmOffice = (chosenOffice) => {
        setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: chosenOffice } }));
        handleHistoryAdd(buildOfficeAssignmentScout(characterName, chosenOffice, getSection(chosenOffice)));
        setRolledOffice("");
        setManualOfficeChoice("");
        setScoutStep(isFirstTerm ? "initialTraining" : "yearStart");
    };

    // ─── Initial Training ───────────────────────────────────────────────────

    const handleInitialTraining = () => {
        const currentOffice = characterData.career?.branch ?? office;
        const skillName = datatables.Scouts.InitialSkill?.[currentOffice];
        if (!skillName) { setWarning("No initial skill found for this office."); return; }
        const normalized = normalizeScoutSkill(skillName);
        applyWithCascade(normalized, (finalSkill) => {
            handleHistoryAdd(buildInitialTrainingScout(characterName, currentOffice, finalSkill));
            setCurrentYear(1);
            setScoutStep("yearStart");
        });
    };

    // ─── Year Roll ──────────────────────────────────────────────────────────

    const advanceYearOrEnd = (bioInc = 1, chronoInc = 1) => {
        const newBioAge = (characterData.bioAge ?? 18) + bioInc;
        setCharacterData(prev => ({
            ...prev,
            bioAge: (prev.bioAge ?? 18) + bioInc,
            chronoAge: (prev.chronoAge ?? 18) + chronoInc,
        }));
        if (currentYear < termLength) {
            setCurrentYear(prev => prev + 1);
            setScoutStep("yearStart");
        } else {
            handleEndOfTerm(newBioAge);
        }
    };

    const handleYearRoll = () => {
        const currentOffice = characterData.career?.branch ?? office;
        const currentSection = getSection(currentOffice);
        const officeData = datatables.Scouts?.[currentOffice];
        if (!officeData) { setWarning(`No data for office: ${currentOffice}`); return; }

        let log = `Term ${displayTerm}, Year ${currentYear}: `;
        const flags = {
            term: displayTerm, year: currentYear, office: currentOffice,
            section: currentSection, assignment: null, worldName: null,
            isCombat: false, kia: false, special: false, warMission: false,
            transferred: false, transferDeclined: false, adminSchool: false,
            promoted: false, promotedToRankName: null,
        };

        // Step 1 — Assignment roll
        const assignDM = isAdministrator ? 2 : 0;
        const assignRoll = d6(2, assignDM);
        const rawRoll = Math.max(2, Math.min(12, assignRoll));
        // Table is 0-indexed for rolls 2-12 (11 entries)
        const assignTable = datatables.Scouts.Assignments[currentSection];
        const assignIdx = Math.max(0, Math.min(assignTable.length - 1, rawRoll - 2));
        let assignment = assignTable[assignIdx];
        // Roll 2 always stays as-is even with DM
        if (assignDM > 0 && assignRoll - assignDM === 2) assignment = assignTable[0];

        log += `Assignment roll: ${assignRoll}${assignDM ? ` DM+${assignDM}` : ""} → ${assignment}. `;
        flags.assignment = assignment;

        // Transfer handling (Field only)
        if (assignment === "Transfer" && currentSection === "Field") {
            const bTable = datatables.Scouts.BranchSelect["O"];
            const tRoll = d6(2, 0);
            const tIdx = Math.max(0, Math.min(bTable.length - 1, tRoll - 2));
            const newOffice = bTable[tIdx];
            setTransferTargetOffice(newOffice);
            setTransferPending(true);
            log += `Transfer to Bureaucracy (${newOffice}) — accept or decline?`;
            setYearLogs(prev => [...prev, log]);
            setWarning(log);
            return;
        }

        // Special / War Mission
        const isSpecial = assignment === "Special" || assignment === "Wartime";
        if (isSpecial) {
            flags.special = assignment === "Special";
            flags.warMission = assignment === "Wartime";
            // Grant a Wartime skill roll
            const wartimeTable = datatables.Scouts.ServiceSkills["Wartime"] ?? [];
            if (wartimeTable.length) {
                const wRoll = d6(1, 0);
                const wSkill = normalizeScoutSkill(wartimeTable[Math.min(wRoll - 1, wartimeTable.length - 1)]);
                applyWithCascade(wSkill, null);
                log += `Wartime skill: ${wSkill}. `;
            }
        }

        // Training — service school
        if (assignment === "Training") {
            const schoolTable = officeData["School"] ?? [];
            const sRoll = d6(1, 0);
            const schoolKey = schoolTable[Math.min(sRoll - 1, schoolTable.length - 1)];
            log += `School: ${schoolKey}. `;

            if (schoolKey === "Administrator" && !adminSchoolDone) {
                // Administrator School — one-time, transfer to Bureaucracy IS-10
                setAdminSchoolDone(true);
                setCharacterData(prev => ({
                    ...prev,
                    career: { ...prev.career, officer: true, rank: 1, adminSchoolDone: true },
                }));
                // Roll Bureaucracy office
                const bTable = datatables.Scouts.BranchSelect["O"];
                const aRoll = d6(2, 0);
                const aIdx = Math.max(0, Math.min(bTable.length - 1, aRoll - 2));
                const adminOffice = bTable[aIdx];
                setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: adminOffice } }));
                flags.adminSchool = true;
                handleHistoryAdd(buildYearHistoryScout(flags, characterName));
                log += `Administrator School → IS-10, transferred to ${adminOffice}.`;
                setYearLogs(prev => [...prev, log]);
                setWarning(log);
                advanceYearOrEnd();
                return;
            } else if (schoolKey === "Administrator" && adminSchoolDone) {
                // Already done — treat as Specialist
                const entry = datatables.Scouts.ServiceSchools["Specialist"];
                if (entry) resolveSchool("Specialist", entry, log, flags);
                return;
            } else {
                const entry = datatables.Scouts.ServiceSchools[schoolKey];
                if (entry) {
                    resolveSchool(schoolKey, entry, log, flags);
                    return;
                }
            }
        }

        // Step 2 — Survival
        const worldName = generateSystemName();
        flags.worldName = worldName;
        const survTarget = officeData[assignment]?.[0] ?? 0;
        const isCombat = officeData[assignment]?.[4] ?? false;
        flags.isCombat = isCombat;

        let survived = true;
        if (survTarget > 0) {
            const survDM = getSurvivalMod(currentOffice, characterData, isAdministrator);
            const survRoll = d6(2, survDM);
            survived = survRoll >= survTarget;
            log += `Survival (${survTarget}+${survDM ? ` DM+${survDM}` : ""}): ${survRoll} — ${survived ? "Survived" : "Killed"}.`;
            if (!survived) flags.kia = true;
        }

        if (!survived) {
            handleHistoryAdd(buildYearHistoryScout(flags, characterName));
            setWarning(log);
            setYearLogs(prev => [...prev, log]);
            setPageWarning?.(log);
            setStep("End");
            return;
        }

        // Promotion (Bureaucracy only, not Detached)
        const promoTarget = officeData[assignment]?.[2] ?? 0;
        if (promoTarget > 0 && !FIELD_OFFICES.includes(currentOffice) && currentOffice !== "Detached") {
            const canPromote = isAdministrator ? !promotedThisTerm : true; // admin: once/term; ordinary: once/year
            if (canPromote) {
                const promoDM = getPromoMod(currentOffice, characterData);
                const promoRoll = d6(2, promoDM);
                const promoted = promoRoll >= promoTarget;
                log += ` Promotion (${promoTarget}+${promoDM ? ` DM+${promoDM}` : ""}): ${promoRoll} — ${promoted ? "Promoted!" : "Not promoted"}.`;
                if (promoted) {
                    const newRank = rank + 1;
                    const rankName = getISRankName(newRank, isAdministrator);
                    flags.promoted = true;
                    flags.promotedToRankName = rankName;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: newRank } }));
                    setPromotedThisTerm(true);
                    // Promotion skill pick
                    const pools = buildSkillPools(currentOffice, isAdministrator, currentSection);
                    setAvailablePools(pools);
                    handleHistoryAdd(buildYearHistoryScout(flags, characterName));
                    setYearLogs(prev => [...prev, log]);
                    setWarning(log);
                    setScoutStep("yearSkillPick");
                    return;
                }
            }
        }

        // Skill check
        const skillThreshold = isSpecial ? 0 : (officeData[assignment]?.[3] ?? 0);
        let skillsPassed = false;
        if (skillThreshold > 0) {
            const skillRoll = d6(2, 0);
            skillsPassed = skillRoll >= skillThreshold;
            log += ` Skills (${skillThreshold}+): ${skillRoll} — ${skillsPassed ? "table available" : "no skill"}.`;
        }

        handleHistoryAdd(buildYearHistoryScout(flags, characterName));
        setYearLogs(prev => [...prev, log]);
        setWarning(log);

        if (skillsPassed) {
            const pools = buildSkillPools(currentOffice, isAdministrator, currentSection);
            setAvailablePools(pools);
            setScoutStep("yearSkillPick");
        } else {
            advanceYearOrEnd();
        }
    };

    const resolveSchool = (schoolKey, entry, log, flags) => {
        const [numPicks, skillList] = entry;
        if (numPicks === 0 || skillList.length === 0) {
            handleHistoryAdd(buildYearHistoryScout(flags, characterName));
            setYearLogs(prev => [...prev, log + `(${schoolKey} — no skills).`]);
            setWarning(log);
            advanceYearOrEnd();
            return;
        }
        // Build pending school skills list
        const picks = [];
        for (let i = 0; i < numPicks; i++) {
            const r = d6(1, 0);
            const s = normalizeScoutSkill(skillList[Math.min(r - 1, skillList.length - 1)]);
            picks.push(s);
        }
        handleHistoryAdd(buildYearHistoryScout(flags, characterName));
        setYearLogs(prev => [...prev, log + `School skills: ${picks.join(", ")}.`]);
        setWarning(log);
        setPendingSchoolSkills(picks);
        setSchoolPickIdx(0);
        setScoutStep("schoolSkill");
    };

    const handleSchoolSkillConfirm = () => {
        const skill = pendingSchoolSkills[schoolPickIdx];
        if (!skill) return;
        applyWithCascade(skill, () => {
            const nextIdx = schoolPickIdx + 1;
            if (nextIdx < pendingSchoolSkills.length) {
                setSchoolPickIdx(nextIdx);
            } else {
                setPendingSchoolSkills([]);
                setSchoolPickIdx(0);
                advanceYearOrEnd();
            }
        });
    };

    // ─── Transfer Handlers ──────────────────────────────────────────────────

    const confirmTransfer = () => {
        const newOffice = transferTargetOffice;
        const newRank = Math.max(1, terms + 1); // rank = terms served
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, branch: newOffice, rank: newRank, officer: false },
        }));
        const flags = {
            term: displayTerm, year: currentYear, office: newOffice,
            assignment: "Transfer", transferred: true, transferDeclined: false,
            isCombat: false, kia: false, special: false, warMission: false,
            adminSchool: false, promoted: false, promotedToRankName: null,
        };
        handleHistoryAdd(buildYearHistoryScout(flags, characterName));
        setTransferPending(false);
        setTransferForcePending(false);
        setTransferTargetOffice("");
        advanceYearOrEnd();
    };

    const declineTransfer = () => {
        setTransferPending(false);
        // Reroll assignment; if Transfer again → forced
        const bTable = datatables.Scouts.BranchSelect["O"];
        const tRoll2 = d6(2, 0);
        const tIdx2 = Math.max(0, Math.min(bTable.length - 1, tRoll2 - 2));
        const newOffice2 = bTable[tIdx2];
        const currentOffice = characterData.career?.branch ?? office;
        const assignTable = datatables.Scouts.Assignments["Field"];
        const r2 = d6(2, isAdministrator ? 2 : 0);
        const idx2 = Math.max(0, Math.min(assignTable.length - 1, r2 - 2));
        const reroll = assignTable[idx2];
        if (reroll === "Transfer") {
            // Forced transfer
            setTransferTargetOffice(newOffice2);
            setTransferForcePending(true);
            setWarning(`Transfer denied but forced! Assigned to ${newOffice2} in the Bureaucracy.`);
        } else {
            // Continue with new assignment — simplified: treat as Base
            setWarning(`Transfer declined. Rerolled: ${reroll}. Continuing.`);
            // Just advance — the reroll result isn't resolved for survival etc. (simplification per spec)
            advanceYearOrEnd();
        }
    };

    const confirmForcedTransfer = () => {
        const newOffice = transferTargetOffice;
        const newRank = Math.max(1, terms + 1);
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, branch: newOffice, rank: newRank, officer: false },
        }));
        const flags = {
            term: displayTerm, year: currentYear, office: newOffice,
            assignment: "Transfer", transferred: false, transferDeclined: true,
            isCombat: false, kia: false, special: false, warMission: false,
            adminSchool: false, promoted: false, promotedToRankName: null,
        };
        handleHistoryAdd(buildYearHistoryScout(flags, characterName));
        setTransferForcePending(false);
        setTransferTargetOffice("");
        advanceYearOrEnd();
    };

    // ─── Skill Table Pick ───────────────────────────────────────────────────

    const buildSkillPools = (currentOffice, isAdmin, sect) => {
        const ss = datatables.Scouts.ServiceSkills;
        const pools = [{ name: "Scouts Life", skills: ss["Scouts Life"] }];
        const mosTable = datatables.Scouts?.[currentOffice]?.["MOS"] ?? [];
        if (mosTable.length) pools.push({ name: currentOffice, skills: mosTable });
        if (FIELD_OFFICES.includes(currentOffice)) {
            pools.push({ name: "Field", skills: ss["Field"] });
        } else {
            pools.push({ name: "Bureaucracy", skills: ss["Bureaucracy"] });
        }
        if (isAdmin) {
            pools.push({ name: "Administrator", skills: ss["Administrator"] });
        }
        return pools;
    };

    const handleTableSelect = (pool) => {
        const skills = pool.skills ?? [];
        const roll = d6(1, 0);
        const idx = Math.min(roll - 1, skills.length - 1);
        const rawSkill = normalizeScoutSkill(skills[idx]);
        const opts = datatables.Skills?.[rawSkill];
        if (Array.isArray(opts) && opts.length > 0) {
            triggerCascade(rawSkill, opts.map(s => normalizeScoutSkill(s)), (finalSkill) => {
                setPendingSkillResult({ skill: finalSkill, tableName: pool.name, roll, mod: 0 });
            });
        } else {
            setPendingSkillResult({ skill: rawSkill, tableName: pool.name, roll, mod: 0 });
        }
    };

    const handleSkillConfirm = () => {
        if (!pendingSkillResult) return;
        applyScoutSkill(pendingSkillResult.skill);
        handleHistoryAdd(buildSkillGainHistory(displayTerm, currentYear, characterName, pendingSkillResult.skill, pendingSkillResult.tableName, 'scouts'));
        setPendingSkillResult(null);
        setAvailablePools([]);
        advanceYearOrEnd();
    };

    // ─── End of Term ────────────────────────────────────────────────────────

    const handleEndOfTerm = (endBioAge) => {
        const currentOffice = characterData.career?.branch ?? office;
        const currentSection = getSection(currentOffice);

        // Up-or-out check: IS-2 to IS-9 (ordinary bureaucracy, !officer, rank >= 2)
        if (!isAdministrator && rank >= 2 && currentSection === "Bureaucracy") {
            if (rank < displayTerm) {
                // Rank < terms served → denied reinlistment
                let warnText = `Up-or-out: IS-${rank} rank is less than ${displayTerm} terms served. Denied reinlistment.`;
                let agingHist = "";
                if (endBioAge >= 34) {
                    const agingResult = getAgingRolls(endBioAge);
                    if (agingResult.decreases.length > 0) {
                        const agingUpdates = {};
                        agingResult.decreases.forEach(({ stat, loss }) => {
                            agingUpdates[stat] = Math.max(1, (characterData[stat] ?? 1) - loss);
                        });
                        setCharacterData(prev => ({ ...prev, ...agingUpdates }));
                        const agingStr = agingResult.decreases.map(({ stat, loss }) => `${stat} -${loss}`).join(", ");
                        warnText += ` Aging: ${agingStr}.`;
                        agingHist = ` The years took their toll: ${agingStr}.`;
                    }
                }
                handleHistoryAdd(buildEndOfTermScout(characterName, displayTerm, currentOffice, currentSection, agingHist));
                setWarning(warnText);
                setScoutStep("retire");
                return;
            }
        }

        const reinRoll = d6(2, 0);
        const forced = reinRoll >= 12;
        const canReinlist = reinRoll >= 3;
        let warnText = `Reenlistment (3+): rolled ${reinRoll} — ${forced ? "Must reinlist!" : canReinlist ? "May reinlist" : "Discharged"}.`;

        let agingHist = "";
        if (endBioAge >= 34) {
            const agingResult = getAgingRolls(endBioAge);
            if (agingResult.decreases.length > 0) {
                const agingUpdates = {};
                agingResult.decreases.forEach(({ stat, loss }) => {
                    agingUpdates[stat] = Math.max(1, (characterData[stat] ?? 1) - loss);
                });
                setCharacterData(prev => ({ ...prev, ...agingUpdates }));
                const agingStr = agingResult.decreases.map(({ stat, loss }) => `${stat} -${loss}`).join(", ");
                warnText += ` Aging: ${agingStr}.`;
                agingHist = ` The years took their toll: ${agingStr}.`;
            }
        }

        handleHistoryAdd(buildEndOfTermScout(characterName, displayTerm, currentOffice, currentSection, agingHist));
        setWarning(warnText);
        setScoutStep(forced ? "forced" : canReinlist ? "reinlistChoice" : "retire");
    };

    const handleRetire = () => {
        const newTerms = terms + 1;
        const currentOffice = characterData.career?.branch ?? office;
        // Detached Duty muster special: 9+ on 2d6 DM+terms → permanent detached duty
        let detachedDuty = false;
        if (currentOffice === "Detached") {
            const detRoll = d6(2, newTerms);
            detachedDuty = detRoll >= 9;
            if (detachedDuty) {
                setCharacterData(prev => ({
                    ...prev,
                    pension: 4000,
                    ship: "Scout Ship",
                    career: { ...prev.career, terms: newTerms, detachedDuty: true },
                }));
                handleHistoryAdd(`${characterName} was granted permanent Detached Duty, receiving a Scout Ship and a yearly stipend of Cr4,000.`);
            }
        }
        if (!detachedDuty) {
            setCharacterData(prev => ({
                ...prev,
                pension: 0,
                career: { ...prev.career, terms: newTerms },
            }));
        }
        setStep("retire");
    };

    const handleReinlist = () => {
        const newTerms = terms + 1;
        setTermStartAge(characterData.bioAge ?? 18);
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, terms: newTerms },
        }));
        setCurrentYear(1);
        setYearLogs([]);
        setWarning("");
        setPendingSkillResult(null);
        setAvailablePools([]);
        setPromotedThisTerm(false);
        setScoutStep("reinlistOffice");
    };

    const handleReinlistStay = () => {
        setScoutStep("yearStart");
    };

    const handleReinlistReassign = () => {
        const currentOff = characterData.career?.branch ?? office;
        const tableKey = (getSection(currentOff) === "Bureaucracy" || isAdministrator) ? "O" : "E";
        const table = datatables.Scouts.BranchSelect[tableKey];
        const roll = d6(2, isAdministrator ? 2 : 0);
        const idx = Math.max(0, Math.min(table.length - 1, roll - 2));
        const newOff = table[idx];
        setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: newOff } }));
        handleHistoryAdd(buildOfficeAssignmentScout(characterName, newOff, getSection(newOff)));
        setWarning(`Reassigned to ${newOff} (rolled ${roll}).`);
        setScoutStep("yearStart");
    };

    const exitLabel = (terms + 1) >= 5 ? "Retire" : "Muster Out";
    const currentOffice = characterData.career?.branch ?? office;
    const currentSection = getSection(currentOffice);
    const isRankSuffix = isAdministrator ? `IS-${9 + rank} (O${rank})` : rank > 0 ? `IS-${rank} (E${rank})` : "IS-1";

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">
                Scout Service — Term {displayTerm}
                {currentOffice ? ` (${currentOffice})` : ""}
                {currentOffice ? ` [${isRankSuffix}]` : ""}
            </h2>

            {warning && (
                <p className="text-xs text-destructive whitespace-pre-line">
                    {warning.replace(/\. (?=[A-Z])/g, ".\n").trim()}
                </p>
            )}

            {/* OFFICE ASSIGNMENT */}
            {scoutStep === "officeAssign" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Determine office assignment.
                        {isHonorsGrad ? " Honors graduate — choose your office." : " Roll 2d6 on the assignment table."}
                        {isAdministrator ? " IS-10+ (O1): +2 DM." : ""}
                    </p>
                    {!isHonorsGrad && !rolledOffice && (
                        <Button onClick={handleRollOffice}>Roll Office Assignment</Button>
                    )}
                    {isHonorsGrad && !manualOfficeChoice && (
                        <div className="space-y-2">
                            <Select value={manualOfficeChoice} onValueChange={setManualOfficeChoice}>
                                <SelectTrigger className="w-56">
                                    <SelectValue placeholder="-- Select Office --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_OFFICES.map(o => (
                                        <SelectItem key={o} value={o}>{o}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {isHonorsGrad && manualOfficeChoice && (
                        <Button onClick={() => confirmOffice(manualOfficeChoice)}>
                            Confirm {manualOfficeChoice}
                        </Button>
                    )}
                    {rolledOffice && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Assigned to: <span className="font-semibold text-foreground">{rolledOffice}</span>
                            </p>
                            <Button onClick={() => confirmOffice(rolledOffice)}>Confirm Assignment</Button>
                        </div>
                    )}
                </div>
            )}

            {/* INITIAL TRAINING */}
            {scoutStep === "initialTraining" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Year 1 — Initial Training ({currentOffice}).
                        Gain the office initial skill.
                    </p>
                    <Button onClick={handleInitialTraining}>Gain Initial Skill</Button>
                </div>
            )}

            {/* YEAR START */}
            {scoutStep === "yearStart" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Year {currentYear} of {termLength} — {currentOffice} ({currentSection}).
                    </p>
                    <Button onClick={handleYearRoll}>Roll Year {currentYear} Assignment</Button>
                </div>
            )}

            {/* TRANSFER PENDING */}
            {transferPending && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Transfer order to <span className="font-semibold text-foreground">{transferTargetOffice}</span> (Bureaucracy).
                        Accept or decline?
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={confirmTransfer}>Accept Transfer</Button>
                        <Button variant="outline" onClick={declineTransfer}>Decline</Button>
                    </div>
                </div>
            )}

            {/* FORCED TRANSFER */}
            {transferForcePending && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Request denied — transfer to <span className="font-semibold text-foreground">{transferTargetOffice}</span> is mandatory.
                    </p>
                    <Button onClick={confirmForcedTransfer}>Acknowledge Transfer</Button>
                </div>
            )}

            {/* SCHOOL SKILL CONFIRM */}
            {scoutStep === "schoolSkill" && pendingSchoolSkills.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        School skill {schoolPickIdx + 1} of {pendingSchoolSkills.length}:{" "}
                        <span className="font-semibold text-foreground">{pendingSchoolSkills[schoolPickIdx]}</span>
                    </p>
                    <Button onClick={handleSchoolSkillConfirm}>Apply Skill</Button>
                </div>
            )}

            {/* SKILL TABLE PICK */}
            {scoutStep === "yearSkillPick" && (
                <SkillPickSection
                    availablePools={availablePools}
                    pendingSkillResult={pendingSkillResult}
                    currentYear={currentYear}
                    onTableSelect={handleTableSelect}
                    onSkillConfirm={handleSkillConfirm}
                />
            )}

            {/* REINLIST / RETIRE */}
            {(scoutStep === "reinlistChoice" || scoutStep === "forced" || scoutStep === "retire") && (
                <ReinlistRetireSection
                    step={scoutStep}
                    characterName={characterName}
                    reinlistLabel="Reinlist (Scout Service)"
                    retireLabel={exitLabel}
                    onReinlist={handleReinlist}
                    onRetire={handleRetire}
                />
            )}

            {/* Reinlist office reassignment */}
            {scoutStep === "reinlistOffice" && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Reinlisted. Stay in <span className="font-semibold text-foreground">{currentOffice}</span> or roll for reassignment?
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={handleReinlistStay}>Stay in {currentOffice}</Button>
                        <Button variant="outline" onClick={handleReinlistReassign}>Roll Reassignment</Button>
                    </div>
                </div>
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
