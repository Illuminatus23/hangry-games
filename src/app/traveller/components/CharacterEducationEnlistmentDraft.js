"use client";

import { d6, handleSchoolApp, applySkill } from "../lib/helpers";
import React, { useState } from "react";
import SelectOrButton from "./SelectOrButton";

export default function CharacterEducationEnlistmentDraft({
    setStep,
    setSkills,
    characterData,
    setCharacterData,
    upp, characterName,
    handleHistoryAdd
}) {
    const [application, setApplication] = useState("");
    const [schoolOptions, setSchoolOptions] = useState(() => {
        const baseSchoolOptions = [
            { id: 1, name: "Enlist in a career", value: "skip" },
            { id: 2, name: "College (no officer candidate school)", value: "college" },
            { id: 3, name: "College (OTC)", value: "collegeotc" },
            { id: 4, name: "College (NOTC)", value: "collegenotc" },
        ];
        const options = [...baseSchoolOptions];

        if (characterData.SOC >= 8) {
            options.push({
                id: 5,
                name: "Naval Academy",
                value: "navy",
            });
        }

        if (characterData.SOC >= 6) {
            options.push({
                id: 6,
                name: "Military Academy",
                value: "military",
            });
        }

        return options;
    });
    const [warning, setWarning] = useState("");
    const handleSubmission = (val) => {
        setWarning("");
        const nextApplication = val ?? application;
        if (!nextApplication) return;

        if (nextApplication === "skip") {
            setStep("enlistment");
            return;
        }
        if (nextApplication === "enlistarmy") {
            setStep("army");
            setCharacterData((prev) => ({
                ...prev,
                career: { careername: "army", category: "army", subcareername: "", branch: "", terms: 0, rank: 1, officer: false },
            }));
            return;
        }
        if (nextApplication === "enlistnavy") {
            setStep("navy");
            setCharacterData((prev) => ({
                ...prev,
                career: { careername: "navy", category: "navy", subcareername: "imperial navy", branch: "", terms: 0, rank: 1, officer: false },
            }));
            return;
        }
        if (nextApplication === "enlistmarines") {
            setStep("marines");
            setCharacterData((prev) => ({
                ...prev,
                career: { careername: "marines", category: "marines", subcareername: "", branch: "", terms: 0, rank: 1, officer: false },
            }));
            return;
        }
        if (nextApplication === "enlistscouts") {
            setStep("year1");
            setCharacterData((prev) => ({
                ...prev,
                career: { careername: "scouts", category: "scouts", subcareername: "", branch: "", terms: 0, rank: 1, officer: false },
            }));
            return;
        }
        if (nextApplication === "navy") {
            setStep("navy");
            setCharacterData((prev) => ({
                ...prev,
                commission: "navy",
                career: { careername: "navy", category: "navy", subcareername: "imperial navy", branch: "", terms: 0, rank: 1, officer: false },
            }));
            return;
        }

        const results = handleSchoolApp(upp, nextApplication, characterName);
        let friendlyName = "college";
        switch (results.school) {
            case "military":
                friendlyName = "a military academy";
                break;
            case "navy":
                friendlyName = "the Naval Academy";
                break;
            case "medical":
                friendlyName = "medical school";
                break;
            case "flight":
                friendlyName = "flight school";
                break;
            case "autoflight":
                friendlyName = "flight school";
                break;
            default:
                friendlyName = "college"
        }

        if (nextApplication === "autoflight" ||
            nextApplication === "flight" ||
            nextApplication === "medical"
        ) {
            if (!results.admission) {
                handleHistoryAdd(results.history);
                //setStep("enlistment")
                setSchoolOptions([
                    { id: 1, name: "Enlist in a career", value: "skip" },
                ])
                setWarning(`${characterName} applied to ${friendlyName} but was rejected. ${results.reason}`);

            } else if (!results.success) {

                handleHistoryAdd(`${characterName} applied to ${friendlyName} and was accepted but washed out of the program.`);
                if (results.school === "medical") {
                    setCharacterData((prev) => ({ ...prev, bioAge: 23, chronoAge: 23 }));
                }
                //setStep("enlistment")
                setSchoolOptions([
                    { id: 1, name: "Enlist in a career", value: "skip" },
                ])
                setWarning(`${characterName} applied to ${friendlyName} and was accepted but washed out of the program.`);

            } else if (results.success) {
                let historyStr = (`${characterName} applied to ${friendlyName}, was accepted and graduated.`);

                if (results.school === "flight" || results.school === "autoflight") {
                    const levelGained = d6(1, -4);
                    if (levelGained === 1) {
                        applySkill(setSkills, setCharacterData, "Pilot");
                    }
                    if (levelGained === 2) {
                        applySkill(setSkills, setCharacterData, "Pilot");
                        applySkill(setSkills, setCharacterData, "Pilot");
                    }
                    setCharacterData((prev) => ({ ...prev, bioAge: 23, chronoAge: 23 }));
                    //setStep("navy")
                    setSchoolOptions([
                        { id: 1, name: "Take a commission as a Navy pilot", value: "navy" },
                    ])
                    setWarning(`${characterName} applied to flight school, was accepted and graduated.`);
                    setCharacterData(prev => ({
                        ...prev,
                        awards: [...prev.awards, `flight school graduate`],
                    }));
                } else {
                    const currentEDU = characterData.EDU;
                    setCharacterData((prev) => ({ ...prev, bioAge: 24, chronoAge: 24 }));
                    setCharacterData((prev) => ({ ...prev, EDU: currentEDU + 1 }));
                    setCharacterData(prev => ({
                        ...prev,
                        awards: [...prev.awards, `${(results.honors) ? "honors " : ""}med school graduate`],
                    }));
                    setWarning(`${characterName} applied to ${friendlyName}, was accepted and graduated.`);
                    // Add commission options from any prior college OTC/NOTC
                    const medCommissionOpts = [];
                    if (characterData.commission === "army") {
                        medCommissionOpts.push({ id: 10, name: "Begin Army career with commission", value: "enlistarmy" });
                    } else if (characterData.commission === "navy") {
                        medCommissionOpts.push({ id: 10, name: "Begin Navy career with commission", value: "enlistnavy" });
                        medCommissionOpts.push({ id: 11, name: "Begin Marines career with commission", value: "enlistmarines" });
                    }
                    setSchoolOptions([
                        { id: 1, name: "Enlist in a career", value: "skip" },
                        { id: 20, name: "Join Scouts (med graduate — guaranteed)", value: "enlistscouts" },
                        ...medCommissionOpts,
                    ])
                }
                if (results.skills.length !== 0) {
                    historyStr = historyStr + ` At school ${characterName} learned the following skills: ${results.skills.join("; ")}`;
                    for (let i = 0; i < results.skills.length; i++) {
                        applySkill(setSkills, setCharacterData, results.skills[i]);
                    }
                }
                handleHistoryAdd(historyStr);
            }
            return;
        }

        if (!results.admission) {
            // Remove the failed option from the dropdown
            if (nextApplication === "college" || nextApplication === "collegeotc" || nextApplication === "collegenotc") {
                setSchoolOptions(prev =>
                    prev.filter(option => option.value !== "college" && option.value !== "collegeotc" && option.value !== "collegenotc")
                );
            } else {
                setSchoolOptions(prev =>
                    prev.filter(option => option.value !== nextApplication)
                );
            }

            const historyStr = results.history;
            handleHistoryAdd(historyStr);
            setWarning(`${results.reason} ${historyStr} Make another selection.`);
            setApplication("");
        } else if (!results.success) {
            const draft = (results.school === "navy" || results.school === "military") ? ` and was immediately drafted into the ${results.school}` : "";
            const historyStr = `${characterName} applied to ${friendlyName} and was accepted but dropped out after 1 year${draft}.`;
            handleHistoryAdd(historyStr);
            setCharacterData((prev) => ({ ...prev, bioAge: 19, chronoAge: 19 }));
            if (results.school === "navy") {
                //setStep("navy")
                setSchoolOptions([
                    { id: 1, name: "Get drafted into the navy", value: "enlistnavy" },
                ])
            }
            if (results.school === "military") {
                //setStep("army")
                setSchoolOptions([
                    { id: 1, name: "Get drafted into the army", value: "enlistarmy" },
                ])
            }
            if (results.school === "college") {
                setSchoolOptions([
                    { id: 1, name: "Enlist in a career", value: "skip" },
                ])
            }
            setWarning(`${characterName} applied to ${friendlyName} and was accepted but dropped out after 1 year${draft}.`)

        } else if (results.success) {
            const currentEDU = characterData.EDU;
            const increaseEDU = results.eduIncrease;
            const honors = (results.honors) ? " with honors granting an opportunity to enter medical school" : "";
            let historyStr = `${characterName} applied to ${friendlyName}, was accepted and graduated${honors}. Their education increased by ${increaseEDU}. `;
            //let historyStr = `${characterName} applied to ${friendlyName}, was accepted and graduated${honors}. `;
            setCharacterData((prev) => ({ ...prev, EDU: currentEDU + increaseEDU }));

            let awardName = friendlyName;
            if (awardName === "the Naval Academy") { awardName = "Naval Academy" }
            if (awardName === "a military academy") { awardName = "military academy" }
            setCharacterData(prev => ({
                ...prev,
                awards: [...prev.awards, `${(results.honors) ? "honors " : ""}${awardName} graduate`],
            }));
            setCharacterData(prev => ({
                ...prev,
                grad: [true, results.honors],
            }));

            if (results.school === "college") {
                setCharacterData((prev) => ({ ...prev, commission: results.commission }));
                if (results.commission !== "denied" && results.commission !== "none") {
                    historyStr = historyStr + ` ${characterName} was also accepted into officer candidate school, granting them the rank of officer in the ${results.commission} and guaranteeing enlistment.`;
                } else if (results.commission === "denied") {
                    historyStr = historyStr + ` ${characterName} was not accepted into Officer Candidate School.`;
                }

                // Build direct-enlist options earned by graduation
                const commissionOpts = [];
                if (results.commission === "army") {
                    commissionOpts.push({ id: 10, name: "Begin Army career with OTC commission", value: "enlistarmy" });
                } else if (results.commission === "navy") {
                    commissionOpts.push({ id: 10, name: "Begin Navy career with NOTC commission", value: "enlistnavy" });
                    commissionOpts.push({ id: 11, name: "Begin Marines career with NOTC commission", value: "enlistmarines" });
                }
                const scoutsOpt = { id: 20, name: "Join Scouts (college graduate — guaranteed)", value: "enlistscouts" };

                if (results.honors) {
                    setWarning(`${characterName} applied to ${friendlyName}, was accepted and graduated with honors. Choose whether or not they go to a post graduate school.`);
                    if (results.commission !== "denied" && results.commission !== "none") {
                        setSchoolOptions([
                            { id: 1, name: "Enlist in a career", value: "skip" },
                            { id: 2, name: "Apply to med school", value: "medical" },
                            { id: 3, name: "Apply to flight school", value: "autoflight" },
                            scoutsOpt,
                            ...commissionOpts,
                        ])
                    } else {
                        setSchoolOptions([
                            { id: 1, name: "Enlist in a career", value: "skip" },
                            { id: 2, name: "Apply to med school", value: "medical" },
                            scoutsOpt,
                        ])
                    }
                } else {
                    setCharacterData((prev) => ({ ...prev, bioAge: 22, chronoAge: 22 }));
                    setSchoolOptions([
                        { id: 1, name: "Enlist in a career", value: "skip" },
                        scoutsOpt,
                        ...commissionOpts,
                    ])
                    setWarning(historyStr)
                }

            } else if (results.school === "navy") {
                //marine or navy commission
                setCharacterData((prev) => ({ ...prev, commission: "navy" }));

                if (results.honors) {
                    setWarning(`${characterName} applied to ${friendlyName}, was accepted and graduated with honors. Choose whether or not they go to a post graduate school.`);
                    setSchoolOptions([
                        { id: 0, name: "Enlist in the Marines", value: "enlistmarines" },
                        { id: 1, name: "Enlist in the Navy", value: "enlistnavy" },
                        { id: 2, name: "Apply to med school", value: "medical" },
                        { id: 3, name: "Apply to flight school", value: "autoflight" },
                    ])
                }

                if (!results.honors) {
                    setWarning(`As a Naval Academy Graduate ${characterName} can apply for flight school.`);
                    setSchoolOptions([
                        { id: 0, name: "Enlist in the Marines", value: "enlistmarines" },
                        { id: 1, name: "Enlist in the Navy", value: "enlistnavy" },
                        { id: 3, name: "Apply to flight school", value: "flight" },
                    ])
                }

            } else if (results.school === "military") {
                setCharacterData((prev) => ({ ...prev, commission: "army" }));
                if (results.honors) {
                    setWarning(`${characterName} applied to ${friendlyName}, was accepted and graduated with honors. Choose whether or not they go to a post graduate school.`);
                    setSchoolOptions([
                        { id: 1, name: "Begin your army career", value: "enlistarmy" },
                        { id: 2, name: "Apply to med school", value: "medical" },
                    ])
                } else {
                    setCharacterData((prev) => ({ ...prev, bioAge: 22, chronoAge: 22 }));
                    //setStep("army");
                    setSchoolOptions([
                        { id: 1, name: "Take a commission in the army", value: "enlistarmy" },
                    ])
                    setWarning(historyStr)
                }

            }
            if (results.skills.length !== 0) {
                historyStr = historyStr + ` At school ${characterName} learned the following skills: ${results.skills.join("; ")}`;
                for (let i = 0; i < results.skills.length; i++) {
                    applySkill(setSkills, setCharacterData, results.skills[i]);
                }
            }
            handleHistoryAdd(historyStr);


        }
    };

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">Pre-career choices</h2>
            <p className="text-xs text-muted-foreground">
                You may apply to college or any other learning institution you are
                eligible to attend. The Naval Academy is available to characters of SOC 8
                or higher. A Military Academy is available to characters of SOC 6 or
                higher. Successfully entering a NOTC or OTC program ensures commission in
                the Navy or Army respectively.
            </p>
            {warning !== "" && (
                <p className="text-xs text-destructive">{warning}</p>
            )}
            <SelectOrButton
                allOps={schoolOptions}
                userChoice={application}
                setUserChoice={setApplication}
                onSubmit={handleSubmission}
            />
        </div>
    );
}
