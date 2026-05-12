"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { datatables } from "../lib/data";
import SkillSelector from "./SkillSelector";
import { careerCheckSimple, careerCheckSpecReinlist, generateBattlename, d6, applySkill, getAgingRolls } from "../lib/helpers";
import { describeSkillGains } from "../lib/historyText";

const ALWAYS_TWO_CAREERS = ['belter', 'rogue', 'hunter', 'doctor', 'scientist'];
const PENSION_CAREERS = ['navy', 'marines', 'army', 'scouts', 'flyer', 'sailor'];

export default function BasicTerm({
    upp,
    characterData,
    setCharacterData,
    characterName,
    handleHistoryAdd,
    setSkills,
    setStep, // optional if you use it to advance screens
}) {
    const [warning, setWarning] = useState("");
    const [termStep, setTermStep] = useState("init");
    const [pendingTermStep, setPendingTermStep] = useState(null);

    const career = characterData.career?.careername;
    const careerData = datatables.Basics?.[career];
    const skillTables = careerData?.skills ?? {};
    const canPromote = careerData?.position[0] !== 99;
    const skillData = datatables.rank?.[career]?.skills;
    const terms = characterData.career.terms + 1;

    const automaticSkills = useMemo(() => {
        if (!career) return [];
        if (!skillData) return [];
        let skillsGained = (skillData["E1"]) ? skillData["E1"] : [];
        if (career === "belter") {
            skillsGained = ['Vacc Suit'];
        }
        return skillsGained;
    }, [career, skillData])

    // Queue of preset skills to resolve (rookie skills)
    const [presetQueue, setPresetQueue] = useState([]);

    // How many *category* picks remain for init step
    const [picksRemaining, setPicksRemaining] = useState(() => {
        const isFirstTerm = (characterData.career?.terms ?? 0) === 0;
        return (isFirstTerm || ALWAYS_TWO_CAREERS.includes(characterData.career?.careername ?? '')) ? 2 : 1;
    });

    // Show what was resolved
    const [resolvedPicks, setResolvedPicks] = useState([]);

    // Used to reset SkillSelector UI cleanly between picks
    const [pickIndex, setPickIndex] = useState(0);

    const currentPreset = presetQueue.length > 0 ? presetQueue[0] : null;

    function addSkill(newSkill) {
        applySkill(setSkills, setCharacterData, newSkill, {
            zeroIfNew: termStep === "init" && newSkill === "Vacc Suit",
            maxSkills: characterData.INT + characterData.EDU,
        });
    }

    // Apply FINAL skill only (already resolved from cascade if needed)
    const skillIncrease = (finalSkill) => {
        // If you also allow characteristic bumps, keep your logic here.
        // This version assumes “finalSkill is a real skill name”:
        addSkill(finalSkill);
    };

    // Called when SkillSelector resolves a final skill (preset or category)
    const onPickResolved = (finalSkill) => {
        setResolvedPicks((prev) => [...prev, finalSkill]);

        // If we were resolving preset skills, consume one preset
        if (currentPreset) {
            setPresetQueue((prev) => prev.slice(1));
        } else {
            // Otherwise consume one normal pick
            setPicksRemaining((prev) => Math.max(0, prev - 1));
        }

        // Reset selector UI for the next pick
        setPickIndex((prev) => prev + 1);
    };

    const canPickCategory = presetQueue.length === 0 && picksRemaining > 0;
    const allResolved = presetQueue.length === 0 && picksRemaining === 0;
    const didInitAuto = useRef(false);

    useEffect(() => {
        // Wait until we have a career
        if (!career) return;

        // Run once per mount (and avoid StrictMode double effect)
        if (didInitAuto.current) return;
        didInitAuto.current = true;

        if (automaticSkills.length !== 0) {
            setWarning(`Being a ${career} comes with experience in ${automaticSkills.join(", ")}.`);
        }

        // Seed the preset queue (rookie/auto skills) once
        setPresetQueue(automaticSkills);
    }, [career, automaticSkills, characterName, handleHistoryAdd, allResolved, resolvedPicks]);

    const CAREER_DISPLAY = { law: 'law enforcement officer' };
    const careerDisplay = CAREER_DISPLAY[career] ?? career;

    const handleTerm = () => {
        let warningText = "";
        let historyText = "";
        if (termStep === 'init') {
            const narrative = resolvedPicks.length === 0
                ? `${characterName} began their career as a ${careerDisplay}.`
                : `${characterName} ${describeSkillGains(resolvedPicks, career)}.`;
            handleHistoryAdd?.(`Starting a career as a ${careerDisplay}, ${narrative}`);
        }
        let skillGained = false;
        const termResults = {
            charSurvival: careerCheckSimple(careerData.survival, upp, characterName),
            charPosition: (canPromote) ? careerCheckSimple(careerData.position, upp, characterName) : [false, ""],
            charPromo: (canPromote) ? careerCheckSimple(careerData.promotion, upp, characterName) : [false, ""],
            charSpec: careerCheckSpecReinlist(careerData.specduty, characterName),
            charReenlist: careerCheckSpecReinlist(careerData.reenlist, characterName),
        }

        if (career === "belter") {
            //skillsGained = ['Vacc Suit'];
            const roll = d6(2, terms);
            const result = (roll >= 9);
            const logStr = `${characterName} needed an 8 to succeed and rolled a ${roll} modified by their terms of service`;
            termResults.charSurvival = [result, logStr]
        }
        warningText = `Survival: ${termResults.charSurvival[1]}. `;

        if (!termResults.charSurvival[0]) {
            if (careerData.survival[0] <= 4) {
                handleHistoryAdd?.(`Even life as a ${career} is not without its risks. ${characterName} died in a freak accident. The story ends here.`);
            } else if (careerData.survival[0] === 5) {
                if (career === "scientist") {
                    handleHistoryAdd?.(`Perhaps labrotory safety was not a top priority. ${characterName} died in a laboratory accident. The story ends here.`);
                } else {
                    handleHistoryAdd?.(`Though ${characterName} took every precaution, they died in the line of duty. The story ends here.`);
                }

            } else if (careerData.survival[0] >= 6) {
                handleHistoryAdd?.(`Life as a ${career} can be brutal and violent. ${characterName} dies in the line of duty. The story ends here.`);
            }
            setStep("End")
        } else {
            historyText = historyText + `${characterName} spent 4 years as a ${career}. `;
            const isFirstTerm = characterData.career.terms === 0;
            const isDraftedFirstTerm = characterData.career?.drafted && isFirstTerm;
            //lived!
            if (isFirstTerm && !characterData.career?.officer && canPromote && !isDraftedFirstTerm) { // commish
                warningText = warningText + `  Position: ${termResults.charPosition[1]}`;
                if (termResults.charPosition[0]) {
                    skillGained = true;
                    const ranks = datatables.rank[career]["O"];
                    const commDesc = termResults.charPosition[2] ? "excelled and" : "performed well and";
                    historyText = historyText + `${characterName} ${commDesc} was commissioned as ${ranks[1][0]}. `;
                    setPicksRemaining((prev) => prev + 1);
                    setCharacterData((prev) => ({
                        ...prev,
                        career: { ...prev.career, rank: 1, officer: true },
                    }));
                }
            }
            if (characterData.career?.officer && canPromote) { //promote
                warningText = warningText + `  Promotion: ${termResults.charPromo[1]}. `;
                if (termResults.charPromo[0]) {
                    const ranks = datatables.rank[career]["O"];
                    const newRank = characterData.career.rank + 1;
                    skillGained = true;
                    const promoDesc = termResults.charPromo[2] ? "an excellent" : "a good";
                    historyText = historyText + `${characterName} was ${promoDesc} ${career} and was promoted to ${ranks[newRank][0]}. `;
                    setPicksRemaining((prev) => prev + 1);
                    setCharacterData((prev) => ({
                        ...prev,
                        career: { ...prev.career, rank: newRank },
                    }));
                }
            }
            warningText = warningText + `Special Assignment: ${termResults.charSpec[1]}. `;

            if (termResults.charSpec[0]) {
                const rando = Math.floor((Math.random() * 5) + 1);
                let descriptor = "";
                if (career === "flyer" || career === "sailor") {
                    const battleName = generateBattlename();
                    descriptor = `saw combat during the ${battleName}`;
                } else {
                    descriptor = datatables.Basics[career].specDutyDesc[rando];
                }
                historyText = historyText + `During that time ${characterName} ${descriptor}. `;
                skillGained = true;
                setPicksRemaining((prev) => prev + 1);
            }
            warningText = warningText + `Reinlist: ${termResults.charReenlist[1]}. `;

            let nextStep = 'reinlistChoice';
            if (termResults.charReenlist[3]) {
                historyText = historyText + `At the end of 4 years, social and political presure kept them in their career. `
                nextStep = 'forced';
            } else if (!termResults.charReenlist[0]) {
                historyText = historyText + `At the end of 4 years, social and political presure forced them out of their career. `
                nextStep = 'retire';
            }

            if (skillGained) {
                setPendingTermStep(nextStep);
                setTermStep('postTerm');
            } else {
                setTermStep(nextStep);
            }

            // Aging check at end of term
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
                    warningText += ` Aging: ${agingResult.decreases.join(', ')} decreased by 1.`;
                    historyText += ` The years caught up with ${characterName}: ${agingResult.decreases.join(', ')} each reduced by 1.`;
                }
            }
        }
        setWarning(warningText)
        handleHistoryAdd(historyText)
    }
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
        setStep('retire');
    };

    const handleReinlist = () => {
        const newTerms = characterData.career.terms + 1;
        const newAge = characterData.age + 4;
        setCharacterData(prev => ({
            ...prev,
            age: newAge,
            career: { ...prev.career, terms: newTerms },
        }));
        setTermStep("init");
        setPendingTermStep(null);
        setPicksRemaining(ALWAYS_TWO_CAREERS.includes(career) ? 2 : 1);
        setResolvedPicks([]);
        setPresetQueue([]);
        setPickIndex(prev => prev + 1);
        setWarning("");
    };

    return (
        <div>
            <h2 className="mt-section-title">Career Term {terms}</h2>
            <h5>{picksRemaining} skill picks remaining</h5>

            {warning !== "" && (
                <p className="mt-label" style={{ marginBottom: "0.5rem", color: "red" }}>
                    {warning}
                </p>
            )}

            {(termStep === "init" || termStep === "postTerm") && (currentPreset || canPickCategory) && (
                <SkillSelector
                    key={pickIndex}
                    presetSkill={currentPreset ?? undefined}
                    skillTables={skillTables}
                    characterData={characterData}
                    setWarning={setWarning}
                    skillIncrease={skillIncrease}
                    onResolved={onPickResolved}
                />
            )}

            {resolvedPicks.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                    <p className="mt-label">You&apos;ve gained the following skills:</p>
                    <ul className="mt-label">
                        {resolvedPicks.map((s, i) => (
                            <li key={i} className="mt-cap">{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            {termStep === "init" && allResolved && (
                <div>
                    <button
                        className="mt-btn"
                        type="button"
                        onClick={handleTerm}
                    >
                        Continue term as a {career}
                    </button>
                </div>
            )}

            {termStep === "postTerm" && allResolved && (
                <div>
                    {pendingTermStep !== 'retire' && (
                        <button className="mt-btn" type="button" onClick={handleReinlist}>
                            Reinlist as a {career}
                        </button>
                    )}
                    &nbsp;
                    {pendingTermStep !== 'forced' && (
                        <button className="mt-btn" type="button" onClick={handleRetire}>
                            Retire
                        </button>
                    )}
                </div>
            )}

            {(termStep === "retire" || termStep === "forced" || termStep === "reinlistChoice") && (
                <div>
                    {termStep !== 'retire' && (
                        <button className="mt-btn" type="button" onClick={handleReinlist}>
                            Reinlist as a {career}
                        </button>
                    )}
                    &nbsp;
                    {termStep !== 'forced' && (
                        <button className="mt-btn" type="button" onClick={handleRetire}>
                            Retire
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
