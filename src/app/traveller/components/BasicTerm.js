"use client";

import React, { useMemo, useState } from "react";
import { datatables } from "../lib/data";
import SkillSelector from "./SkillSelector";

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

    //const rookieSkills = useMemo(() => ["Vacc Suit", "Aircraft"], []);

    const automaticSkills = useMemo(() => {
        const skillData = datatables.rank[career].skills;
        let skillsGained = (skillData["E1"]) ? skillData["E1"] : [];
        if (career === "belter") {
            skillsGained = ['Vacc Suit'];
        }
        if (skillsGained.length !== 0) {
            setWarning(`Being a ${career} comes with experience in ${skillsGained.join(", ")}.`);
            handleHistoryAdd(`Starting a career as a ${career}, ${characterName} gained experience with ${skillsGained.join(" and ")}.`);
        }
        return skillsGained;
    }, [career])

    // Queue of preset skills to resolve (rookie skills)
    const [presetQueue, setPresetQueue] = useState(automaticSkills);

    // How many *category* picks remain for init step
    const [picksRemaining, setPicksRemaining] = useState(2);

    // Show what was resolved
    const [resolvedPicks, setResolvedPicks] = useState([]);

    // Used to reset SkillSelector UI cleanly between picks
    const [pickIndex, setPickIndex] = useState(0);

    const currentPreset = presetQueue.length > 0 ? presetQueue[0] : null;



    function addSkill(newSkill) {
        if (termStep === "init" && newSkill === "Vacc Suit") {
            //special condition for basic spacer skill
            setSkills((prev) => {
                return [...prev, [newSkill, 0]];
            })
        } else {
            setSkills((prev) => {
                const index = prev.findIndex(([name]) => name === newSkill);
                if (index === -1) return [...prev, [newSkill, 1]];
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
        handleHistoryAdd?.(`${characterName} gained ${finalSkill}.`);

        // Reset selector UI for the next pick
        setPickIndex((prev) => prev + 1);
    };

    const canPickCategory = presetQueue.length === 0 && picksRemaining > 0;
    const allResolved = presetQueue.length === 0 && picksRemaining === 0;

    return (
        <div>
            <h2 className="mt-section-title">Career Term {characterData.career.terms + 1}</h2>

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
                            setWarning("");
                        }}
                    >
                        Continue career as a {career}
                    </button>
                    &nbsp;
                    <button
                        className="mt-btn"
                        type="button"
                        onClick={() => {
                            setWarning("");
                        }}
                    >
                        Muster out (retire)
                    </button>
                </div>
            )}
        </div>
    );
}
