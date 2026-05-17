"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { datatables } from "../lib/data";
import SkillSelector from "./SkillSelector";
import { careerCheckSimple, careerCheckSpecReinlist, generateBattlename, d6, applySkill, getAgingRolls } from "../lib/helpers";
import { Button } from "@/components/ui/button";
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
    setStep,
    setPageWarning,
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

    // Skills gained only during postTerm (commission/promotion/spec duty picks)
    const [postTermPicks, setPostTermPicks] = useState([]);

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

        if (termStep === 'postTerm') {
            setPostTermPicks((prev) => [...prev, finalSkill]);
        }

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
            const isFirstInit = characterData.career.terms === 0;
            const narrative = resolvedPicks.length === 0
                ? `${characterName} began their career as a ${careerDisplay}.`
                : `${characterName} ${describeSkillGains(resolvedPicks, career)}.`;
            const prefix = isFirstInit
                ? `Starting a career as a ${careerDisplay}`
                : `Continuing their career as a ${careerDisplay}`;
            handleHistoryAdd?.(`${prefix}, ${narrative}`);
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
            const logStr = `${characterName} needed a 9 to succeed and rolled a ${roll} modified by their terms of service`;
            termResults.charSurvival = [result, logStr]
        }
        warningText = `Survival: ${termResults.charSurvival[1]}. `;

        if (!termResults.charSurvival[0]) {
            if (careerData.survival[0] <= 4) {
                handleHistoryAdd?.(`Even life as a ${career} is not without its risks. ${characterName} died in a freak accident. The story ends here.`);
            } else if (careerData.survival[0] === 5) {
                if (career === "scientist") {
                    handleHistoryAdd?.(`Perhaps laboratory safety was not a top priority. ${characterName} died in a laboratory accident. The story ends here.`);
                } else {
                    handleHistoryAdd?.(`Though ${characterName} took every precaution, they died in the line of duty. The story ends here.`);
                }

            } else if (careerData.survival[0] >= 6) {
                handleHistoryAdd?.(`Life as a ${career} can be brutal and violent. ${characterName} died in the line of duty. The story ends here.`);
            }
            setPageWarning?.(warningText);
            setStep("End")
        } else {
            historyText = (termResults.charPosition || termResults.charPromo || termResults.charSpec) ? historyText + `${characterName} spent 4 years as a ${career}. ` : historyText + `${characterName} spent 4 uneventful years as a ${career}. `;
            const isFirstTerm = characterData.career.terms === 0;
            const isDraftedFirstTerm = characterData.career?.drafted && isFirstTerm;
            //lived!
            if (isFirstTerm && !characterData.career?.officer && canPromote && !isDraftedFirstTerm) { // commish
                warningText = warningText + `  Position: ${termResults.charPosition[1]}`;
                if (termResults.charPosition[0]) {
                    skillGained = true;
                    const commDesc = termResults.charPosition[2] ? "excelled and" : "performed well and";
                    if (career === 'noble') {
                        const newSOC = characterData.SOC + 1;
                        const newTitle = datatables.Title.M[newSOC - 9]?.[0] ?? 'noble';
                        historyText = historyText + `${characterName} ${commDesc} was elevated to the rank of ${newTitle}. `;
                        setPicksRemaining((prev) => prev + 1);
                        setCharacterData((prev) => ({
                            ...prev,
                            SOC: newSOC,
                            career: { ...prev.career, rank: 1, officer: true },
                        }));
                    } else {
                        const ranks = datatables.rank[career]["O"];
                        historyText = historyText + `${characterName} ${commDesc} was commissioned as ${ranks[1][0]}. `;
                        setPicksRemaining((prev) => prev + 1);
                        setCharacterData((prev) => ({
                            ...prev,
                            career: { ...prev.career, rank: 1, officer: true },
                        }));
                    }
                }
            }
            if (characterData.career?.officer && canPromote) { //promote
                warningText = warningText + `  Promotion: ${termResults.charPromo[1]}. `;
                if (termResults.charPromo[0]) {
                    const newRank = characterData.career.rank + 1;
                    skillGained = true;
                    const promoDesc = termResults.charPromo[2] ? "an excellent" : "a good";
                    if (career === 'noble') {
                        const newSOC = characterData.SOC + 1;
                        const newTitle = datatables.Title.M[newSOC - 9]?.[0] ?? 'noble';
                        historyText = historyText + `${characterName} was ${promoDesc} noble and was elevated to ${newTitle}. `;
                        setPicksRemaining((prev) => prev + 1);
                        setCharacterData((prev) => ({
                            ...prev,
                            SOC: prev.SOC + 1,
                            career: { ...prev.career, rank: newRank },
                        }));
                    } else {
                        const ranks = datatables.rank[career]["O"];
                        historyText = historyText + `${characterName} was ${promoDesc} ${career} and was promoted to ${ranks[newRank][0]}. `;
                        setPicksRemaining((prev) => prev + 1);
                        setCharacterData((prev) => ({
                            ...prev,
                            career: { ...prev.career, rank: newRank },
                        }));
                    }
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
                historyText = historyText + `At the end of 4 years, social and political pressure kept them in their career. `
                nextStep = 'forced';
            } else if (!termResults.charReenlist[0]) {
                historyText = historyText + `At the end of 4 years, social and political pressure forced them out of their career. `
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
    const logPostTermSkills = () => {
        if (postTermPicks.length === 0) return;
        const skillNarrative = describeSkillGains(postTermPicks, career);
        handleHistoryAdd(`${characterName}'s skill as a ${careerDisplay} created opportunities. ${characterName} ${skillNarrative}.`);
    };

    const handleRetire = () => {
        logPostTermSkills();
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
        logPostTermSkills();
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
        setPostTermPicks([]);
        setPresetQueue([]);
        setPickIndex(prev => prev + 1);
        setWarning("");
    };

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">Career Term {terms}</h2>
            <p className="text-xs text-muted-foreground">{picksRemaining} skill pick{picksRemaining !== 1 ? "s" : ""} remaining</p>

            {warning !== "" && (
                <p className="text-xs text-destructive">{warning}</p>
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
                <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Skills gained:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {resolvedPicks.map((s, i) => (
                            <li key={i} className="capitalize">{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            {termStep === "init" && allResolved && (
                <Button type="button" onClick={handleTerm}>
                    Continue term as a {career}
                </Button>
            )}

            {termStep === "postTerm" && allResolved && (
                <div className="flex flex-wrap gap-2">
                    {pendingTermStep !== 'retire' && (
                        <Button type="button" onClick={handleReinlist}>
                            Reinlist as a {career}
                        </Button>
                    )}
                    {pendingTermStep !== 'forced' && (
                        <Button type="button" variant="outline" onClick={handleRetire}>
                            Retire
                        </Button>
                    )}
                </div>
            )}

            {(termStep === "retire" || termStep === "forced" || termStep === "reinlistChoice") && (
                <div className="flex flex-wrap gap-2">
                    {termStep !== 'retire' && (
                        <Button type="button" onClick={handleReinlist}>
                            Reinlist as a {career}
                        </Button>
                    )}
                    {termStep !== 'forced' && (
                        <Button type="button" variant="outline" onClick={handleRetire}>
                            Retire
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
