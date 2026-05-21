"use client";
import React, { useState, useMemo } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill, getAgingRolls } from "../lib/helpers";
import { Button } from "@/components/ui/button";
import SkillSelector from "./SkillSelector";
import {
    buildMerchantYearHistory,
    buildMerchantDeathHistory,
    buildMerchantEndOfTermHistory,
} from "../lib/historyText";

// ── Constants ───────────────────────────────────────────────────────────────

const LINE_MAP = {
    'megacorp trader': 5,
    'sector-wide trader': 4,
    'subsector-wide trader': 3,
    'interface trader': 2,
    'fledgling trader': 1,
    'free trader': 0,
};

// Maps department display name → data key in datatables.Merchants
const DEPT_KEY = {
    'Deck': 'Deck',
    'Engineering': 'Engineering',
    'Purser': 'Purser',
    'Admin': 'Admin',
    'Sales': 'Sales',
    'Free Trader': 'Freetraders',
};

const ALL_DEPTS = ['Deck', 'Engineering', 'Purser', 'Admin', 'Sales'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomFrom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// Check a single compound qualification string like 'Admin-2+Liaison-1' (AND)
function checkQual(qualStr, skills) {
    return qualStr.split('+').every(part => {
        const m = part.match(/^(.+?)-(\d+)$/);
        if (!m) return false;
        const found = skills.find(s => s.name === m[1]);
        return found && found.level >= parseInt(m[2], 10);
    });
}

// Check an exam qualification array — items are OR alternatives, '+' within item is AND
function checkExamQuals(qualArray, skills, isRoute) {
    if (!qualArray || qualArray.length === 0) return true;
    if (qualArray[0] === 'Route') return isRoute;
    return qualArray.some(q => checkQual(q, skills));
}

function hasSurvivalSkillAt2(deptKey, skills) {
    const ss = datatables.Merchants[deptKey]?.SurvivalSkills ?? [];
    return skills.some(s => ss.includes(s.name) && s.level >= 2);
}

function getSkillLevel(skills, name) {
    return skills.find(s => s.name === name)?.level ?? 0;
}

function pickEligibleDepts(awards, currentDept) {
    return (awards ?? [])
        .filter(a => a.startsWith('Merchant ') && a.endsWith(' Training'))
        .map(a => a.replace('Merchant ', '').replace(' Training', ''))
        .filter(d => d !== currentDept);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MerchantTerm({
    upp,
    characterData,
    setCharacterData,
    characterName,
    handleHistoryAdd,
    setSkills,
    setStep,
    setPageWarning,
    skills,
}) {
    const career = characterData.career?.subcareername ?? characterData.career?.careername ?? '';
    const lineIndex = LINE_MAP[career] ?? 0;
    const isFreeTrader = lineIndex === 0;
    const isLargeLine = lineIndex >= 4;
    const lineName = datatables.Merchants.Lines[lineIndex] ?? 'Unknown Line';
    const terms = characterData.career?.terms ?? 0;
    const termNumber = terms + 1;
    const isOfficer = characterData.career?.officer ?? false;
    const rank = characterData.career?.rank ?? 0;
    const currentDept = characterData.career?.branch ?? '';
    const deptKey = DEPT_KEY[currentDept] ?? 'Freetraders';
    const deptData = datatables.Merchants[deptKey] ?? {};

    // ── Initial step ──────────────────────────────────────────────────────
    const initialStep = useMemo(() => {
        if (isFreeTrader && !currentDept) return 'deptAuto';
        if (!currentDept) {
            if (isLargeLine && !characterData.career?.merchantAcademyDone) return 'academyOffer';
            return 'deptAssign';
        }
        const eligible = pickEligibleDepts(characterData.awards, currentDept);
        return eligible.length > 0 && !isFreeTrader ? 'deptSelectEnd' : 'yearStart';
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── State ─────────────────────────────────────────────────────────────
    const [merchantStep, setMerchantStep] = useState(initialStep);
    const [currentYear, setCurrentYear] = useState(1);
    const [termStartAge] = useState(characterData.bioAge ?? 18);
    const [companyName] = useState(() =>
        randomFrom(datatables.Merchants.Companies[lineIndex] ?? []) ?? lineName
    );
    const [warning, setWarning] = useState('');
    const [yearAssignment, setYearAssignment] = useState(null);
    const [positionAvailable, setPositionAvailable] = useState(true);
    const [skillGainedThisYear, setSkillGainedThisYear] = useState(false);
    const [examEligible, setExamEligible] = useState(false);
    const [examPassedThisTerm, setExamPassedThisTerm] = useState(false);
    const [pickIndex, setPickIndex] = useState(0);
    const [schoolQueue, setSchoolQueue] = useState([]);
    const [pendingDeptTransfer, setPendingDeptTransfer] = useState(null);
    const [pendingYearLog, setPendingYearLog] = useState('');
    const [ftRerollAvailable, setFtRerollAvailable] = useState(false);
    const [ftRerollUsed, setFtRerollUsed] = useState(false);
    const [pendingAssignment, setPendingAssignment] = useState(null);
    const [pendingTransferLog, setPendingTransferLog] = useState('');
    const [deptTestOverride, setDeptTestOverride] = useState(false);

    // ── Derived ───────────────────────────────────────────────────────────
    const examRanks = datatables.Merchants.ExamsRanks[currentDept] ?? [];
    const maxRankInDept = examRanks.length - 1;
    const atMaxRank = isOfficer && rank >= maxRankInDept;
    const assignTable = isFreeTrader ? 'Freetraders' : isLargeLine ? 'Large' : 'Small';
    const exitLabel = termNumber >= 5 ? 'Retire' : 'Muster Out';

    // ── Skill tables ──────────────────────────────────────────────────────
    const getSkillTables = () => {
        const ss = datatables.Merchants.ServiceSkills;
        const tables = {};
        const add = (name) => { if (ss[name]) tables[name] = ss[name]; };
        add('Merchants Life');
        if (!['Sales', 'Admin'].includes(currentDept)) add('Shipboard Life');
        if (isOfficer) add('Officer Skills');
        if (currentDept !== 'Engineering') add('Mercantile Skills');
        if (currentDept === 'Deck' && isOfficer && rank >= 4) add('Master Skills');
        if (isFreeTrader) {
            add('Free Trader Life');
            add('Free Trader Service');
            add('Free Trader Business');
        } else {
            add(currentDept);
            if (['Admin', 'Sales'].includes(currentDept)) add('Planet Bound Life');
        }
        return tables;
    };

    // ── Assignment rolling ────────────────────────────────────────────────
    const resolveAssignmentRoll = (curLineIdx) => {
        const isFT = curLineIdx === 0;
        const isLarge = curLineIdx >= 4;
        const tableKey = isFT ? 'Freetraders' : isLarge ? 'Large' : 'Small';
        let dm = 0;
        if (!isFT) {
            if (characterData.EDU <= 6) dm -= 1;
            if (isOfficer && rank >= 4) dm += 1;
        } else {
            if (characterData.SOC <= 5) dm += 1;
        }
        const roll = d6(2, dm);
        const idx = Math.max(0, Math.min(13, roll));
        const table = datatables.Merchants.Assignments[tableKey] ?? [];
        return { result: table[idx] || 'Route', roll, tableKey };
    };

    // Handles transfer cascades, returns { assignment, transferLog, finalLineIndex }
    const rollFullAssignment = () => {
        let curLineIdx = lineIndex;
        let { result, roll } = resolveAssignmentRoll(curLineIdx);
        let transferLog = `Roll ${roll}: ${result}.`;
        let transfers = 0;

        while ((result === 'Up' || result === 'Down') && transfers < 6) {
            const dir = result === 'Up' ? 1 : -1;
            const next = curLineIdx + dir;
            if (next < 0 || next > 4) { result = 'Route'; break; } // can't go beyond bounds
            curLineIdx = next;
            const newName = datatables.Merchants.Lines[curLineIdx];
            transferLog += ` Transferred ${result === 'Up' ? 'up' : 'down'} to ${newName}.`;
            const reroll = resolveAssignmentRoll(curLineIdx);
            result = reroll.result;
            transferLog += ` Roll ${reroll.roll}: ${result}.`;
            transfers++;
        }

        return { assignment: result, transferLog, finalLineIndex: curLineIdx };
    };

    // ── Academy ───────────────────────────────────────────────────────────
    const handleAcademyDecline = () => {
        setCharacterData(prev => ({ ...prev, career: { ...prev.career, merchantAcademyDone: true } }));
        setMerchantStep('deptAssign');
    };

    const handleAcademyAttempt = () => {
        const sd = datatables.schools.merchants;
        let admDM = characterData[sd.admission[1]] >= sd.admission[2] ? sd.admission[3] : 0;
        const admRoll = d6(2, admDM);
        if (admRoll < sd.admission[0]) {
            handleHistoryAdd(`${characterName} applied to the Merchant Academy but was not admitted (needed ${sd.admission[0]}+, rolled ${admRoll}).`);
            setWarning(`Academy admission failed: ${admRoll} vs ${sd.admission[0]}+.`);
            setCharacterData(prev => ({ ...prev, career: { ...prev.career, merchantAcademyDone: true } }));
            setMerchantStep('deptAssign');
            return;
        }
        let sucDM = characterData[sd.success[1]] >= sd.success[2] ? sd.success[3] : 0;
        const sucRoll = d6(2, sucDM);
        if (sucRoll < sd.success[0]) {
            handleHistoryAdd(`${characterName} enrolled in the Merchant Academy but failed to graduate.`);
            setWarning(`Academy: admitted (${admRoll}), failed graduation (${sucRoll} vs ${sd.success[0]}+).`);
            setCharacterData(prev => ({ ...prev, career: { ...prev.career, merchantAcademyDone: true } }));
            setMerchantStep('deptAssign');
            return;
        }
        let honDM = characterData[sd.honors[1]] >= sd.honors[2] ? sd.honors[3] : 0;
        const honRoll = d6(2, honDM);
        const isHonors = honRoll >= sd.honors[0];
        setWarning(`Academy: admitted (${admRoll}), graduated (${sucRoll})${isHonors ? ', HONORS!' : ''}.`);
        handleHistoryAdd(
            isHonors
                ? `${characterName} graduated from the Merchant Academy with honors. Commissioned O1 and given choice of department.`
                : `${characterName} graduated from the Merchant Academy. Commissioned O1.`
        );
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, merchantAcademyDone: true, officer: true, rank: 1, honorsGrad: isHonors },
        }));
        setMerchantStep(isHonors ? 'deptFreeChoice' : 'deptAssign');
    };

    // ── Department assignment ─────────────────────────────────────────────
    const handleDeptRoll = () => {
        const table = datatables.Merchants.BranchSelect[isLargeLine ? 'Large' : 'Small'] ?? [];
        let dm = characterData.EDU <= 6 ? -1 : 0;
        if (isOfficer && rank >= 4) dm += 1;
        const roll = d6(1, dm);
        const idx = Math.max(0, Math.min(6, roll - 1));
        const dept = table[idx] ?? 'Purser';
        handleHistoryAdd(`${characterName} was assigned to the ${dept} Department at ${companyName}.`);
        setWarning(`Department roll: ${roll} (DM${dm >= 0 ? '+' : ''}${dm}) → ${dept}.`);
        setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: dept } }));
        setMerchantStep('yearStart');
    };

    const handleFreeDeptChoice = (dept) => {
        handleHistoryAdd(`${characterName}, as an honors graduate, selected the ${dept} Department.`);
        setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: dept } }));
        setMerchantStep('yearStart');
    };

    const handleFreeDeptAuto = () => {
        handleHistoryAdd(`${characterName} joined the Free Traders, choosing to fly independent of any corporation.`);
        setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: 'Free Trader' } }));
        setMerchantStep('yearStart');
    };

    // ── End-of-term dept transfer ─────────────────────────────────────────
    const handleEndTermDept = (dept) => {
        if (dept && dept !== currentDept) {
            handleHistoryAdd(`${characterName} transferred to the ${dept} Department for the next term.`);
            setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: dept } }));
        }
        startNewTerm();
    };

    // ── Year roll ─────────────────────────────────────────────────────────
    const handleYearRoll = () => {
        setFtRerollUsed(false);
        const { assignment, transferLog, finalLineIndex } = rollFullAssignment();

        // Apply line transfer to character if changed
        if (finalLineIndex !== lineIndex) {
            const newCareername = Object.entries(LINE_MAP).find(([, v]) => v === finalLineIndex)?.[0] ?? career;
            const newIsFT = finalLineIndex === 0;
            const newDept = newIsFT ? 'Free Trader' : (isOfficer && rank >= 4) ? 'Deck' : currentDept;
            const newCompanyOptions = datatables.Merchants.Companies[finalLineIndex] ?? [];
            const newCompany = randomFrom(newCompanyOptions) ?? datatables.Merchants.Lines[finalLineIndex];
            handleHistoryAdd(`${characterName} was ${finalLineIndex > lineIndex ? 'recruited by' : 'let go and joined'} ${newCompany} (${datatables.Merchants.Lines[finalLineIndex]}).`);
            setCharacterData(prev => ({
                ...prev,
                career: { ...prev.career, subcareername: newCareername, branch: newDept },
            }));
        }

        if (assignment === 'Special') {
            setWarning(transferLog);
            handleSpecialDuty();
            return;
        }

        // FT O6 reroll offer
        if (isFreeTrader && isOfficer && rank >= 6 && !ftRerollUsed && assignment !== 'No Business') {
            setPendingAssignment(assignment);
            setPendingTransferLog(transferLog);
            setFtRerollAvailable(true);
            setWarning(`${transferLog} Assignment: ${assignment}. Senior Captain may reroll.`);
            setYearAssignment(assignment);
            setMerchantStep('ftRerollOffer');
            return;
        }

        setYearAssignment(assignment);
        setWarning(transferLog);
        resolveYear(assignment, false);
    };

    const handleFtReroll = () => {
        setFtRerollUsed(true);
        setFtRerollAvailable(false);
        const { assignment, transferLog } = rollFullAssignment();
        setYearAssignment(assignment);
        setWarning(`Reroll: ${transferLog}`);
        setMerchantStep('yearStart'); // brief pause before resolve
        resolveYear(assignment, false);
    };

    const handleFtAccept = () => {
        setFtRerollAvailable(false);
        resolveYear(pendingAssignment, false);
    };

    // ── Special duty ──────────────────────────────────────────────────────
    const handleSpecialDuty = () => {
        const isEnlisted = !isOfficer;
        const table = datatables.Merchants.SpecialDuty[isEnlisted ? 'E' : 'O'] ?? [];
        let dm = 0;
        if (characterData.EDU >= 9) dm += 1;
        if (isOfficer && rank >= 4 && currentDept !== 'Deck') dm += 1;
        const roll = d6(1, dm);
        const idx = Math.max(0, Math.min(6, roll - 1));
        const schoolName = table[idx];
        const schoolEntry = datatables.Merchants.SpecialDutySchools?.[schoolName];

        setWarning(prev => `${prev} Special duty roll ${roll}: ${schoolName}.`);

        if (!schoolEntry) {
            resolveYear('Route', false);
            return;
        }

        const [threshold, skillList, transferDept, flags] = schoolEntry;

        // Commission
        if (flags.commission) {
            const newRank = isFreeTrader ? 1 : 0;
            const prevERank = isOfficer ? null : rank;
            handleHistoryAdd(`${characterName} received a commission (O${newRank}) in the ${currentDept} Department. Must be promoted within 4 years.`);
            setCharacterData(prev => ({
                ...prev,
                career: { ...prev.career, officer: true, rank: newRank, commissionTerm: termNumber, preCommissionRank: prevERank },
            }));
            resolveYear('Route', false);
            return;
        }

        // Department Test — allow exam without Route or position requirements
        if (flags.deptTest) {
            handleHistoryAdd(`${characterName} was given the opportunity to take a Department Test.`);
            setDeptTestOverride(true);
            resolveYear('Route', true);
            return;
        }

        // School — roll for each skill
        const gained = [];
        if (flags.autoSkill) gained.push(flags.autoSkill);
        const tried = skillList.map(skill => {
            const r = d6(1, 0);
            const ok = r >= threshold;
            if (ok) gained.push(skill);
            return `${skill}(${r}${ok ? '✓' : '✗'})`;
        });
        setWarning(prev => `${prev} ${schoolName}: ${tried.join(', ')}.`);
        handleHistoryAdd(`${characterName} attended ${schoolName}.`);

        // Add training award for dept eligibility
        if (transferDept && !(characterData.awards ?? []).includes(`Merchant ${transferDept} Training`)) {
            setCharacterData(prev => ({
                ...prev,
                awards: [...(prev.awards ?? []), `Merchant ${transferDept} Training`],
            }));
        }

        let doTransfer = !!(transferDept && transferDept !== currentDept && !(isOfficer && rank >= 5));

        if (gained.length > 0) {
            setSchoolQueue(gained);
            setPendingDeptTransfer(doTransfer ? transferDept : null);
            setMerchantStep('schoolSkillPick');
        } else if (doTransfer) {
            setPendingDeptTransfer(transferDept);
            setMerchantStep('transferOffer');
        } else {
            resolveYear('Route', false);
        }
    };

    const handleSchoolSkillResolved = (skill) => {
        applySkill(setSkills, setCharacterData, skill, { maxSkills: characterData.INT + characterData.EDU });
        setPickIndex(prev => prev + 1);
        const next = schoolQueue.slice(1);
        if (next.length > 0) {
            setSchoolQueue(next);
        } else {
            setSchoolQueue([]);
            if (pendingDeptTransfer) {
                setMerchantStep('transferOffer');
            } else {
                resolveYear('Route', deptTestOverride);
            }
        }
    };

    const handleTransferAccept = () => {
        if (pendingDeptTransfer) {
            handleHistoryAdd(`${characterName} transferred to the ${pendingDeptTransfer} Department.`);
            setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: pendingDeptTransfer } }));
        }
        setPendingDeptTransfer(null);
        resolveYear('Route', deptTestOverride);
    };

    const handleTransferDecline = () => {
        setPendingDeptTransfer(null);
        resolveYear('Route', deptTestOverride);
    };

    // ── Year resolution ───────────────────────────────────────────────────
    const resolveYear = (assignment, deptTest) => {
        const dept = characterData.career?.branch ?? currentDept;
        const dk = DEPT_KEY[dept] ?? 'Freetraders';
        const dd = datatables.Merchants[dk] ?? {};
        const assignData = dd[assignment] ?? dd['Route'] ?? [0, 0, 16];
        const isRoute = assignment === 'Route' || deptTest;
        const ftNow = dept === 'Free Trader';
        const largeLine = !ftNow && lineIndex >= 4;

        let warnParts = [];
        let histFlags = { survived: true, skillGained: false, bonusAmount: 0, posAvail: true };

        // Position check (O ranks)
        let posAvail = true;
        if (isOfficer) {
            const avail = datatables.Merchants.Availability ?? {};
            let target;
            if (ftNow) {
                target = avail.Freetraders?.[0] ?? 8;
            } else {
                const entry = avail[dept] ?? [8, 8];
                target = entry[largeLine ? 0 : 1] ?? 8;
            }
            let posRoll = d6(2, 0);
            if (characterData.INT >= 9) posRoll++;
            if (characterData.EDU >= 9) posRoll++;
            posAvail = posRoll >= target || deptTest;
            warnParts.push(`Position: ${posRoll}${deptTest ? '+DeptTest' : ''} vs ${target}+ → ${posAvail ? 'available' : 'not available'}`);
        }
        setPositionAvailable(posAvail);
        histFlags.posAvail = posAvail;

        // Survival
        const survTarget = assignData[0];
        if (survTarget > 0) {
            let survDM = 0;
            if (['Engineering', 'Sales', 'Freetraders', 'Admin'].includes(dk)) {
                if (hasSurvivalSkillAt2(dk, skills)) survDM += 1;
            }
            const survRoll = d6(2, survDM);
            histFlags.survived = survRoll >= survTarget;
            warnParts.push(`Survival: ${survRoll} vs ${survTarget}+`);
        } else {
            warnParts.push('Survival: auto');
        }

        if (!histFlags.survived) {
            setWarning(warnParts.join('. ') + ' — FAILED SURVIVAL');
            handleHistoryAdd(buildMerchantDeathHistory(characterName, assignment, dept, largeLine, ftNow));
            setPageWarning?.('Survival failed');
            setStep('End');
            return;
        }

        // Skill roll
        const skillTarget = assignData[1];
        if (skillTarget > 0) {
            let skillDM = 0;
            if (['Admin', 'Sales'].includes(dept) && hasSurvivalSkillAt2(dk, skills)) skillDM += 1;
            const skillRoll = d6(2, skillDM);
            histFlags.skillGained = skillRoll >= skillTarget;
            warnParts.push(`Skills: ${skillRoll} vs ${skillTarget}+`);
        }

        // Bonus roll
        const bonusTarget = assignData[2];
        if (bonusTarget <= 12) {
            let bonusDM = 0;
            if (['Admin', 'Sales'].includes(dept) && hasSurvivalSkillAt2(dk, skills)) bonusDM += 1;
            if (ftNow && getSkillLevel(skills, 'Trader') >= 2) bonusDM += 1;
            if (dept === 'Purser' && getSkillLevel(skills, 'Steward') >= 2) bonusDM += 1;
            const bonusRoll = d6(2, bonusDM);
            if (bonusRoll >= bonusTarget) {
                const cashTable = datatables.Merchants.MusterCash ?? [1, 5, 10, 10, 10, 20, 50];
                const cashRoll = d6(1, 0);
                const cashIdx = Math.min(cashRoll - 1, cashTable.length - 1);
                const bonus = Math.floor(cashTable[cashIdx] * 1000 / 2);
                histFlags.bonusAmount = bonus;
                setCharacterData(prev => ({ ...prev, cash: (prev.cash ?? 0) + bonus }));
                warnParts.push(`Bonus: ${bonusRoll} vs ${bonusTarget}+ → Cr${bonus.toLocaleString()}`);
            } else {
                warnParts.push(`Bonus: ${bonusRoll} vs ${bonusTarget}+`);
            }
        }

        // Exam eligibility
        const examIdx = isOfficer ? rank : 0;
        const examQuals = dd.Exam?.[examIdx] ?? [];
        const qualsOk = checkExamQuals(examQuals, skills, isRoute);
        const canExam = !atMaxRank && (posAvail || deptTest) && (isRoute || deptTest) && qualsOk;
        setExamEligible(canExam);

        // Build history
        const log = buildMerchantYearHistory(
            characterName, assignment, dept, currentYear, termNumber,
            largeLine, ftNow, lineName, companyName, histFlags
        );
        setPendingYearLog(log);
        setSkillGainedThisYear(histFlags.skillGained);
        setWarning(warnParts.join('. '));

        if (histFlags.skillGained) {
            setMerchantStep('yearSkillPick');
        } else if (canExam) {
            setMerchantStep('examOffer');
        } else {
            finishYear(log);
        }
    };

    // ── Skill picked ──────────────────────────────────────────────────────
    const handleSkillResolved = (skill) => {
        applySkill(setSkills, setCharacterData, skill, { maxSkills: characterData.INT + characterData.EDU });
        setPickIndex(prev => prev + 1);
        if (examEligible) {
            setMerchantStep('examOffer');
        } else {
            finishYear(pendingYearLog);
        }
    };

    // ── Promotion exam ────────────────────────────────────────────────────
    const handleExamAttempt = (attempt) => {
        if (!attempt) { finishYear(pendingYearLog); return; }

        const examScores = deptData.ExamScore ?? [];
        const examIdx = isOfficer ? rank : 0;
        const score = examScores[examIdx] ?? 6;
        const roll = d6(1, 0);
        const passed = roll >= score;
        setWarning(prev => `${prev}. Exam (${score}+): ${roll} → ${passed ? 'PASSED' : 'failed'}.`);

        if (passed) {
            if (!isOfficer) {
                // E rank → O0 commission
                const title = examRanks[0]?.[0] ?? 'Apprentice';
                setCharacterData(prev => ({
                    ...prev,
                    career: { ...prev.career, officer: true, rank: 0, commissionTerm: null },
                }));
                handleHistoryAdd(`${characterName} passed the commission exam and was commissioned as ${title} (O0).`);
            } else {
                const newRank = rank + 1;
                const title = examRanks[newRank]?.[0] ?? `O${newRank}`;
                setCharacterData(prev => ({
                    ...prev,
                    career: { ...prev.career, rank: newRank },
                }));
                handleHistoryAdd(`${characterName} passed the promotion exam and was promoted to ${title}.`);
            }
            setExamPassedThisTerm(true);
        } else {
            handleHistoryAdd(`${characterName} attempted the promotion exam but did not pass.`);
        }
        finishYear(pendingYearLog);
    };

    // ── Finish year ───────────────────────────────────────────────────────
    const finishYear = (log) => {
        if (log) handleHistoryAdd(log);
        setDeptTestOverride(false);

        if (currentYear < 4) {
            setCurrentYear(prev => prev + 1);
            setYearAssignment(null);
            setSkillGainedThisYear(false);
            setExamEligible(false);
            setFtRerollAvailable(false);
            setFtRerollUsed(false);
            setPendingYearLog('');
            setMerchantStep('yearStart');
        } else {
            handleEndOfTerm();
        }
    };

    // ── End of term ───────────────────────────────────────────────────────
    const handleEndOfTerm = () => {
        const endAge = termStartAge + 4;
        let warnText = '';
        let agingHist = '';

        // E rank auto-promotion (E1→E2→E3→E4 max)
        if (!isOfficer) {
            const newERank = Math.min(rank + 1, 4);
            if (newERank > rank) {
                setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: newERank } }));
                warnText += ` Promoted to E${newERank}.`;
            }
        }

        // Commission revert: got commissioned this term (commissionTerm === termNumber) and still O0 and no exam passed
        if (isOfficer && rank === 0 && characterData.career?.commissionTerm === termNumber && !examPassedThisTerm) {
            const prevRank = characterData.career?.preCommissionRank ?? 1;
            setCharacterData(prev => ({
                ...prev,
                career: { ...prev.career, officer: false, rank: prevRank, commissionTerm: null, preCommissionRank: null },
            }));
            handleHistoryAdd(`${characterName} failed to earn promotion within the term and was reverted to enlisted status (E${prevRank}).`);
            warnText += ' Commission reverted.';
        }

        // O4 mandatory Deck transfer
        if (isOfficer && rank === 4 && currentDept !== 'Deck' && !isFreeTrader) {
            setCharacterData(prev => ({ ...prev, career: { ...prev.career, branch: 'Deck' } }));
            handleHistoryAdd(`${characterName} reached O4 and was automatically assigned to the Deck Department.`);
            warnText += ' Transferred to Deck (O4 rule).';
        }

        // Aging
        if (endAge >= 34) {
            const agingResult = getAgingRolls(endAge);
            if (agingResult.decreases.length > 0) {
                const agingUpdates = {};
                agingResult.decreases.forEach(({ stat, loss }) => {
                    agingUpdates[stat] = Math.max(1, (characterData[stat] ?? 1) - loss);
                });
                setCharacterData(prev => ({ ...prev, ...agingUpdates }));
                const agingStr = agingResult.decreases.map(({ stat, loss }) => `${stat} -${loss}`).join(', ');
                warnText += ` Aging: ${agingStr}.`;
                agingHist = ` The years took their toll: ${agingStr}.`;
            }
        }

        handleHistoryAdd(buildMerchantEndOfTermHistory(characterName, termNumber, currentDept, lineName, agingHist));
        setWarning(warnText.trim());

        // Reenlistment roll: 4+, DM+1 if O1+
        const reinDM = (isOfficer && rank >= 1) ? 1 : 0;
        const reinRoll = d6(2, reinDM);
        const forced = reinRoll >= 12;
        const canReinlist = reinRoll >= 4;

        if (forced) setMerchantStep('forced');
        else if (!canReinlist) setMerchantStep('retire');
        else setMerchantStep('reinlistChoice');
    };

    // ── Reinlist ──────────────────────────────────────────────────────────
    const startNewTerm = () => {
        setCurrentYear(1);
        setYearAssignment(null);
        setExamEligible(false);
        setExamPassedThisTerm(false);
        setFtRerollUsed(false);
        setWarning('');
        setPendingYearLog('');
        setDeptTestOverride(false);
        setMerchantStep('yearStart');
    };

    const handleReinlist = () => {
        const newTerms = terms + 1;
        setCharacterData(prev => ({
            ...prev,
            bioAge: termStartAge + 4,
            chronoAge: (prev.chronoAge ?? 18) + 4,
            career: { ...prev.career, terms: newTerms },
        }));
        const eligible = pickEligibleDepts(characterData.awards, currentDept);
        if (eligible.length > 0 && !isFreeTrader) {
            setMerchantStep('deptSelectEnd');
        } else {
            startNewTerm();
        }
    };

    const handleRetire = () => {
        const newTerms = terms + 1;
        let ship = characterData.ship ?? '';
        // Free Trader O5/O6 auto-ship on muster
        if (isFreeTrader && isOfficer && rank >= 5 && !ship) {
            ship = rank >= 6 ? 'Fat Trader' : 'Far Trader';
            handleHistoryAdd(`${characterName} took possession of a ${ship} as part of mustering out.`);
        }
        setCharacterData(prev => ({
            ...prev,
            bioAge: termStartAge + 4,
            chronoAge: (prev.chronoAge ?? 18) + 4,
            ship: ship || prev.ship,
            career: { ...prev.career, terms: newTerms },
        }));
        setStep('retire');
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">
                Term {termNumber} — {lineName}
            </h2>
            <p className="text-xs text-muted-foreground">
                {companyName}{currentDept ? ` · ${currentDept} Dept` : ''}{currentDept ? ` · Year ${currentYear}/4` : ''}
            </p>

            {warning && <p className="text-xs text-destructive">{warning}</p>}

            {/* Academy offer */}
            {merchantStep === 'academyOffer' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {characterName} may attend the Merchant Academy before department assignment. Graduation grants O1 rank.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        <Button type="button" onClick={handleAcademyAttempt}>Attend Merchant Academy</Button>
                        <Button type="button" variant="outline" onClick={handleAcademyDecline}>Decline</Button>
                    </div>
                </div>
            )}

            {/* Honors grad free dept choice */}
            {merchantStep === 'deptFreeChoice' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">As an honors graduate, choose your department:</p>
                    <div className="flex flex-wrap gap-2">
                        {ALL_DEPTS.map(d => (
                            <Button key={d} type="button" variant="outline" onClick={() => handleFreeDeptChoice(d)}>{d}</Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Free Trader auto-assign */}
            {merchantStep === 'deptAuto' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Free Traders fly independent of corporate structure. No department assignment required.
                    </p>
                    <Button type="button" onClick={handleFreeDeptAuto}>Begin Free Trader Career</Button>
                </div>
            )}

            {/* Dept roll */}
            {merchantStep === 'deptAssign' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Roll for department assignment at {companyName}.</p>
                    <Button type="button" onClick={handleDeptRoll}>Roll Department Assignment</Button>
                </div>
            )}

            {/* End-of-term dept transfer */}
            {merchantStep === 'deptSelectEnd' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Cross-training allows a department transfer. Currently in {currentDept} Department.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {pickEligibleDepts(characterData.awards, currentDept).map(d => (
                            <Button key={d} type="button" variant="outline" onClick={() => handleEndTermDept(d)}>
                                Transfer to {d}
                            </Button>
                        ))}
                        <Button type="button" variant="outline" onClick={() => handleEndTermDept(null)}>
                            Stay in {currentDept}
                        </Button>
                    </div>
                </div>
            )}

            {/* Year start */}
            {merchantStep === 'yearStart' && (
                <div className="space-y-2">
                    <Button type="button" onClick={handleYearRoll}>Roll Year {currentYear}</Button>
                </div>
            )}

            {/* FT O6 reroll offer */}
            {merchantStep === 'ftRerollOffer' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Assignment: <strong>{yearAssignment}</strong>. As Senior Captain, you may reroll once.
                    </p>
                    <div className="flex gap-2">
                        <Button type="button" onClick={handleFtAccept}>Accept {yearAssignment}</Button>
                        <Button type="button" variant="outline" onClick={handleFtReroll}>Reroll Assignment</Button>
                    </div>
                </div>
            )}

            {/* School skill pick */}
            {merchantStep === 'schoolSkillPick' && schoolQueue.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">School skill ({schoolQueue.length} remaining):</p>
                    <SkillSelector
                        key={`school-${pickIndex}`}
                        presetSkill={schoolQueue[0]}
                        skillTables={{}}
                        characterData={characterData}
                        setWarning={setWarning}
                        skillIncrease={(s) => {}}
                        onResolved={handleSchoolSkillResolved}
                    />
                </div>
            )}

            {/* Department transfer offer */}
            {merchantStep === 'transferOffer' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Transfer to the {pendingDeptTransfer} Department?
                    </p>
                    <div className="flex gap-2">
                        <Button type="button" onClick={handleTransferAccept}>Transfer to {pendingDeptTransfer}</Button>
                        <Button type="button" variant="outline" onClick={handleTransferDecline}>Stay in {currentDept}</Button>
                    </div>
                </div>
            )}

            {/* Year skill pick */}
            {merchantStep === 'yearSkillPick' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Select a skill:</p>
                    <SkillSelector
                        key={`skill-${pickIndex}`}
                        skillTables={getSkillTables()}
                        characterData={characterData}
                        setWarning={setWarning}
                        skillIncrease={(s) => {}}
                        onResolved={handleSkillResolved}
                    />
                </div>
            )}

            {/* Exam offer */}
            {merchantStep === 'examOffer' && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {characterName} is eligible for the promotion exam. Attempt it?
                    </p>
                    <div className="flex gap-2">
                        <Button type="button" onClick={() => handleExamAttempt(true)}>Take Exam</Button>
                        <Button type="button" variant="outline" onClick={() => handleExamAttempt(false)}>Skip</Button>
                    </div>
                </div>
            )}

            {/* Reinlist / muster */}
            {(merchantStep === 'reinlistChoice' || merchantStep === 'forced') && (
                <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleReinlist}>Reinlist at {companyName}</Button>
                    {merchantStep !== 'forced' && (
                        <Button type="button" variant="outline" onClick={handleRetire}>{exitLabel}</Button>
                    )}
                </div>
            )}

            {merchantStep === 'retire' && (
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleRetire}>{exitLabel}</Button>
                </div>
            )}
        </div>
    );
}
