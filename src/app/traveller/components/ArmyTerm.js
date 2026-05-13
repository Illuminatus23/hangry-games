"use client";

import React, { useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill, getAgingRolls, careerCheckSimple, careerCheckSpecReinlist } from "../lib/helpers";

const PENSION_CAREERS = ['navy', 'marines', 'army', 'scouts', 'flyer', 'sailor'];

// Marines "Infantry" arm uses the Army.Marines data block, not Army.Infantry
function getArmDataKey(career, branch) {
    if (career === "marines" && branch === "Marine Infantry") return "Marines";
    return branch;
}

function normalizeServiceSkill(skill, career) {
    const map = {
        "Strength": "STR",
        "Dexterity": "DEX",
        "Endurance": "END",
        "Intelligence": "INT",
        "Education": "EDU",
        "Social": "SOC",
        "Mechanics": "Mechanical",
        "Pistol": "Handguns",
        "Foward Observer": "Forward Observer",
        "Ships Boat": "Ships Boat",
    };
    const normalized = map[skill] ?? skill;
    // Marines always receive Blade Combat as Large Blade (cutlass tradition)
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

function getServicePool(career, isOfficer, rank, hadShipsTroops) {
    const ss = datatables.Army.ServiceSkills;
    if (hadShipsTroops) return { name: "Shipboard Life", skills: ss["Shipboard Life"] };
    if (isOfficer) return { name: "Command", skills: ss["Command"] };
    if (rank >= 3) return { name: "NCO", skills: ss["NCO"] };
    const lifeName = career === "marines" ? "Marines Life" : "Army Life";
    return { name: lifeName, skills: ss[lifeName] };
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
    const career = characterData.career?.careername; // "army" or "marines"
    const terms = characterData.career?.terms ?? 0;
    const displayTerm = terms + 1;
    const isFirstTerm = terms === 0;
    const branch = characterData.career?.branch ?? "";

    const availableArms = (() => {
        if (career === "marines") return ["Marine Infantry", "Support"];
        const arms = ["Infantry", "Cavalry", "Artillery", "Support"];
        const hasHonors = characterData.awards?.some(
            a => a.includes("honors") && (a.includes("military") || a.includes("college"))
        );
        if (hasHonors) arms.push("Commando");
        return arms;
    })();

    const [armStep, setArmStep] = useState(branch ? "yearStart" : "selectArm");
    const [currentYear, setCurrentYear] = useState(1);
    const [yearLogs, setYearLogs] = useState([]);
    const [hadShipsTroops, setHadShipsTroops] = useState(false);
    const [warning, setWarning] = useState("");
    const [selectedServiceSkill, setSelectedServiceSkill] = useState("");

    const handleArmSelect = (arm) => {
        setCharacterData(prev => ({
            ...prev,
            career: { ...prev.career, branch: arm },
        }));
        handleHistoryAdd(`${characterName} was assigned to the ${arm}.`);
        setArmStep("yearStart");
    };

    const handleYearRoll = () => {
        const currentBranch = characterData.career?.branch;
        const dataKey = getArmDataKey(career, currentBranch);
        const armData = datatables.Army?.[dataKey];
        if (!armData) { setWarning(`No data for branch: ${currentBranch}`); return; }

        // Roll 2d6 for assignment (array indexed 0-10 → roll 2-12)
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
            log += `Survival (${survivalTarget}+): rolled ${survRoll}${survivalDM ? `+${survivalDM}` : ""} — ${survived ? "Survived" : "Killed in action"}. `;
        } else {
            log += `Safe duty, no survival risk. `;
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

        // MOS skill (auto-rolled, applied immediately)
        if (skillThreshold > 0) {
            const skillRoll = d6(2, 0);
            if (skillRoll >= skillThreshold) {
                const mosList = armData["MOS"] ?? [];
                const mosIndex = Math.floor(Math.random() * mosList.length);
                let mosSkill = mosList[mosIndex];
                // Marine blade combat tradition
                if (mosSkill === "Blade Combat" && career === "marines") mosSkill = "Large Blade";
                applySkill(setSkills, setCharacterData, mosSkill, {
                    maxSkills: characterData.INT + characterData.EDU,
                });
                log += `MOS skill gained: ${mosSkill}. `;
            } else {
                log += `No MOS skill this year (rolled ${skillRoll} vs ${skillThreshold}+). `;
            }
        }

        if (career === "marines" && assignmentName === "Ship's Troops") {
            setHadShipsTroops(true);
        }

        setYearLogs(prev => [...prev, log]);
        setWarning(log);
        handleHistoryAdd(log);

        if (currentYear < 4) {
            setCurrentYear(prev => prev + 1);
            // armStep stays "yearStart" for next year click
        } else {
            setArmStep("pickServiceSkill");
        }
    };

    const handleServiceSkillPick = () => {
        if (!selectedServiceSkill) { setWarning("Please select a skill."); return; }
        const normalized = normalizeServiceSkill(selectedServiceSkill, career);
        applySkill(setSkills, setCharacterData, normalized, {
            maxSkills: characterData.INT + characterData.EDU,
        });
        handleHistoryAdd(`${characterName} drew on their ${servicePool.name} experience, gaining ${normalized}.`);
        handleEndOfTerm();
    };

    const handleEndOfTerm = () => {
        const careerData = datatables.Basics?.[career];
        if (!careerData) return;

        let histText = `${characterName} completed Term ${displayTerm} as ${career} (${characterData.career?.branch}). `;
        let warnText = "";

        const canPromote = careerData.position?.[0] !== 99;
        const isDraftedFirstTerm = characterData.career?.drafted && isFirstTerm;
        const hasPendingCommission =
            characterData.commission === career ||
            (career === "marines" && characterData.commission === "navy");

        // Commission (first term, not already an officer)
        if (isFirstTerm && !characterData.career?.officer && canPromote && !isDraftedFirstTerm) {
            if (hasPendingCommission) {
                // Auto-commission for academy/OTC graduates
                const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                histText += `${characterName}'s commission was confirmed as ${o1Name}. `;
                warnText += `Auto-commissioned (${characterData.commission} candidate). `;
                setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
            } else {
                const posResult = careerCheckSimple(careerData.position, upp, characterName);
                warnText += `Commission: ${posResult[1]} `;
                if (posResult[0]) {
                    const o1Name = datatables.rank[career]?.["O"]?.[1]?.[0] ?? "Officer";
                    histText += `${characterName} received a commission as ${o1Name}. `;
                    setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: 1, officer: true } }));
                }
            }
        }

        // Promotion (officer in subsequent terms)
        if (characterData.career?.officer && canPromote) {
            const promoResult = careerCheckSimple(careerData.promotion, upp, characterName);
            warnText += `Promotion: ${promoResult[1]} `;
            if (promoResult[0]) {
                const newRank = (characterData.career.rank ?? 0) + 1;
                const rankName = datatables.rank[career]?.["O"]?.[newRank]?.[0] ?? `Rank ${newRank}`;
                histText += `${characterName} was promoted to ${rankName}. `;
                setCharacterData(prev => ({ ...prev, career: { ...prev.career, rank: newRank } }));
            }
        }

        // Special duty (simplified: successful roll grants a bonus MOS skill)
        const specResult = careerCheckSpecReinlist(careerData.specduty, characterName);
        warnText += `Special Duty: ${specResult[1]} `;
        if (specResult[0]) {
            const dataKey = getArmDataKey(career, characterData.career?.branch);
            const armData = datatables.Army?.[dataKey];
            if (armData) {
                const mosList = armData["MOS"] ?? [];
                const mosIndex = Math.floor(Math.random() * mosList.length);
                let bonusSkill = mosList[mosIndex];
                if (bonusSkill === "Blade Combat" && career === "marines") bonusSkill = "Large Blade";
                applySkill(setSkills, setCharacterData, bonusSkill, {
                    maxSkills: characterData.INT + characterData.EDU,
                });
                histText += `Special assignment gave ${characterName} additional experience in ${bonusSkill}. `;
            }
        }

        // Reinlist roll
        const reinlistResult = careerCheckSpecReinlist(careerData.reenlist, characterName);
        warnText += `Reinlist: ${reinlistResult[1]}`;

        // Aging check
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
                warnText += ` Aging: ${agingResult.decreases.join(", ")} decreased by 1.`;
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
        setHadShipsTroops(false);
        setSelectedServiceSkill("");
        setWarning("");
    };

    // Service pool uses current officer/rank status (before end-of-term commission)
    const isOfficer = characterData.career?.officer ?? false;
    const rank = characterData.career?.rank ?? 0;
    const servicePool = getServicePool(career, isOfficer, rank, hadShipsTroops);

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
                                        <p className="mt-label" style={{ marginTop: "0.2rem", fontSize: "0.8em" }}>
                                            {desc}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* YEAR ROLL */}
            {armStep === "yearStart" && (
                <div>
                    <p className="mt-label">Year {currentYear} of 4 ready.</p>
                    <button className="mt-btn" onClick={handleYearRoll}>
                        Roll Year {currentYear} Assignment
                    </button>
                </div>
            )}

            {/* SERVICE SKILL PICK */}
            {armStep === "pickServiceSkill" && (
                <div>
                    <p className="mt-label" style={{ marginBottom: "0.25rem" }}>
                        Four years of service complete. Pick a <b>{servicePool.name}</b> skill:
                    </p>
                    <select
                        className="mt-select mt-cap"
                        value={selectedServiceSkill}
                        onChange={e => setSelectedServiceSkill(e.target.value)}
                        style={{ marginBottom: "0.5rem" }}
                    >
                        <option value="" disabled>-- Select --</option>
                        {servicePool.skills.map((skill, i) => {
                            const normalized = normalizeServiceSkill(skill, career);
                            return <option key={i} value={skill}>{normalized}</option>;
                        })}
                    </select>
                    <br />
                    <button
                        className="mt-btn"
                        onClick={handleServiceSkillPick}
                        disabled={!selectedServiceSkill}
                    >
                        Confirm Skill &amp; Resolve Term
                    </button>
                </div>
            )}

            {/* RE-ENLIST / RETIRE CHOICE */}
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
                        <button
                            className="mt-btn"
                            style={{ marginRight: "0.5rem" }}
                            onClick={handleReinlist}
                        >
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
                        <p key={i} className="mt-label" style={{ marginBottom: "0.25rem" }}>
                            • {log}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
