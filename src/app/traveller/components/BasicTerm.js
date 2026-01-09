"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { datatables } from "../lib/data";
import SkillSelector from "./SkillSelector";
import { careerCheckSimple, careerCheckSpecReinlist, generateBattlename, generateOperationName, d6 } from "../lib/helpers";

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

    const career = characterData.career?.careername;
    const careerData = datatables.Basics?.[career];
    const skillTables = careerData?.skills ?? {};
    const canPromote = careerData.position[0] !== 99;
    const skillData = datatables.rank?.[career]?.skills;
    const terms = characterData.career.terms + 1;

    //const rookieSkills = useMemo(() => ["Vacc Suit", "Aircraft"], []);

    const automaticSkills = useMemo(() => {
        if (!career) return [];
        if (!skillData) return [];
        let skillsGained = (skillData["E1"]) ? skillData["E1"] : [];
        if (career === "belter") {
            skillsGained = ['Vacc Suit'];
        }
        return skillsGained;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [career])

    // Queue of preset skills to resolve (rookie skills)
    const [presetQueue, setPresetQueue] = useState([]);

    // How many *category* picks remain for init step
    const [picksRemaining, setPicksRemaining] = useState(2);

    // Show what was resolved
    const [resolvedPicks, setResolvedPicks] = useState([]);

    // Used to reset SkillSelector UI cleanly between picks
    const [pickIndex, setPickIndex] = useState(0);

    const currentPreset = presetQueue.length > 0 ? presetQueue[0] : null;

    function addSkill(newSkill) {

        if (['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'].includes(newSkill)) {
            const currentVal = characterData[newSkill]
            setCharacterData((prev) => ({ ...prev, [newSkill]: currentVal + 1 }));
        } else {
            setSkills(prev => {
                // Find if skill already exists
                const index = prev.findIndex(([name]) => name === newSkill);

                if (index === -1) {
                    if (termStep === "init" && newSkill === "Vacc Suit") {
                        return [...prev, [newSkill, 0]];
                    }
                    // No match → add as new skill at level 1
                    return [...prev, [newSkill, 1]];
                }

                // Exists → increment level

                return prev.map((skill, i) =>
                    i === index ? [skill[0], skill[1] + 1] : skill
                );
            });
        }
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

        // history entry (optional)
        //handleHistoryAdd?.(`${characterName} gained ${finalSkill}.`);

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

    const handleTerm = () => {
        let warningText = "";
        let historyText = "";
        if (termStep === 'init')
            handleHistoryAdd?.(
                `Starting a career as a ${career}, ${characterName} gained experience with ${resolvedPicks.join(" and ")}.`
            );

        const termResults = {
            charSurvival: careerCheckSimple(careerData.survival, upp, characterName),
            charPosition: (canPromote) ? careerCheckSimple(careerData.position, upp, characterName) : [false, ""],
            charPromo: (canPromote) ? careerCheckSimple(careerData.promotion, upp, characterName) : [false, ""],
            charSpec: careerCheckSpecReinlist(careerData.specduty, characterName),
            charReenlist: careerCheckSpecReinlist(careerData.reenlist, characterName)
        }

        if (career === "belter") {
            //skillsGained = ['Vacc Suit'];
            const roll = d6(2, terms);
            const result = (roll >= 9);
            const logStr = `${characterName} needed an 8 to succeed and rolled a ${roll} modified by their terms of service`;
            termResults.charSurvival = [result, logStr]
        }
        warningText = `Survival: ${termResults.charSurvival[1]}. `;

        console.log(termResults)
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
        } else {
            historyText = historyText + `${characterName} spent 4 years as a ${career}. `;
            //lived!
            if (termStep !== "init" && !characterData.career?.officer && canPromote) { // commish
                warningText = warningText + `  Position: ${termResults.charPosition[1]}`;
                if (termResults.position[0]) {
                    const ranks = datatables.rank[career]["O"];
                    if (termResults.charPosition[2]) {
                        historyText = historyText + `${characterName} performed well and was made a ${ranks[1]} in recognition of their performance. `;
                        setPicksRemaining((prev) => Math.max(0, prev + 2));
                    } else {
                        historyText = historyText + `${characterName} performed execellently and was made a ${ranks[1]} in recognition of their performance. `;
                        setPicksRemaining((prev) => Math.max(0, prev + 1));
                    }

                    setCharacterData((prev) => (
                        {
                            ...prev, ["career"]: {
                                ...prev,
                                rank: 1,
                                officer: true,
                            }
                        }
                    ));
                }
            }
            if (characterData.career?.officer && canPromote) { //promote
                warningText = warningText + `  Promotion: ${termResults.charPromo}. `;
                if (termResults.charPromo[0]) {
                    const ranks = datatables.rank[career]["O"];
                    const newRank = characterData.career.rank + 1;
                    //handleHistoryAdd?.(`${characterName} a good ${career} and was promoted to ${ranks[newRank]}.`);
                    if (termResults.charPromo[2]) {
                        historyText = historyText + `${characterName} an excellent ${career} and was promoted to ${ranks[newRank]}. `;
                        setPicksRemaining((prev) => Math.max(0, prev + 2));
                    } else {
                        historyText = historyText + `${characterName} a good ${career} and was promoted to ${ranks[newRank]}. `;
                        setPicksRemaining((prev) => Math.max(0, prev + 1));
                    }

                    setCharacterData((prev) => (
                        {
                            ...prev, ["career"]: {
                                ...prev,
                                rank: newRank,
                            }
                        }
                    ));
                }
            }
            warningText = warningText + `Special Assignment: ${termResults.charSpec[1]}. `;

            if (termResults.charSpec[0]) {
                const rando = Math.floor((Math.random() * 5) + 1);
                let descriptor = "";
                if (career === "flyer" || career === "sailor") {
                    const battleName = generateBattlename()
                    descriptor = `saw combat during the ${battleName}`;
                } else {
                    descriptor = datatables.Basics[career].specDutyDesc[rando];
                }
                historyText = historyText + `During that time ${characterName} ${descriptor}. `;
                if (termResults.charSpec[2]) {
                    setPicksRemaining((prev) => Math.max(0, prev + 2));
                } else {
                    setPicksRemaining((prev) => Math.max(0, prev + 1));
                }
            }
            warningText = warningText + `Reinlist: ${termResults.charReenlist[1]}. `;

            if (termResults.charReenlist[3]) {
                historyText = historyText + `At the end of 4 years, social and political presure kept them in their career. `
                setTermStep('forced')
            } else if (!termResults.charReenlist[0]) {
                historyText = historyText + `At the end of 4 years, social and political presure forced them out of their career. `
                setTermStep('retire')
            } else {
                setTermStep('reinlistChoice')
            }
        }
        //setTermStep('results');
        setWarning(warningText)
        handleHistoryAdd(historyText)
    }
    return (
        <div>
            <h2 className="mt-section-title">Career Term {terms}</h2>

            {warning !== "" && (
                <p className="mt-label" style={{ marginBottom: "0.5rem", color: "red" }}>
                    {warning}
                </p>
            )}

            {termStep === "init" && (currentPreset || canPickCategory) && (
                <SkillSelector
                    key={pickIndex}
                    presetSkill={currentPreset ?? undefined} // when present, skips dropdown
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
                            <li key={i} className="mt-cap">
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {termStep === "init" && allResolved && (
                <div>
                    <button
                        className="mt-btn"
                        type="button"
                        onClick={() => {
                            handleTerm();
                        }}
                    >
                        Continue term as a {career}
                    </button>
                </div>
            )}
            {(termStep === "retire" || termStep === 'forced' || termStep === 'reinlistChoice') ?
                <div>
                    {termStep !== 'retire' ?
                        <button
                            className="mt-btn"
                            type="button"
                            onClick={() => {
                            }}
                        >
                            Reinlist as a {career}
                        </button> : null
                    }
                    &nbsp;
                    {termStep !== 'forced' ?
                        <button
                            className="mt-btn"
                            type="button"
                            onClick={() => {
                                setStep('retire');
                            }}
                        >
                            Retire
                        </button> : null
                    }
                </div>
                : null}
        </div>
    );
}
