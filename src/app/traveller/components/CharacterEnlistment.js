"use client";

import SelectOrButton from "./SelectOrButton";
import { generateEnlistmentChoices, careerCheck } from "../lib/helpers";
import { datatables } from "../lib/data";
import { useState } from "react";


export default function CharacterEnlistment({
    upp,
    characterData,
    setCharacterData,
    setStep,
    characterName,
    handleHistoryAdd
}) {
    const enlistmentList = generateEnlistmentChoices(upp, characterData.homeworld);
    const approvedCareers = Object.keys(enlistmentList[0]);
    const [enlistmentChoice, setEnlistmentChoice] = useState("");
    const [enlistOps, setEnlistOps] = useState(
        approvedCareers.map((value, index) => ({
            id: index,
            value,
            name: value.replace(/\b\w/g, c => c.toUpperCase()),
        }))
    )

    const [warning, setWarning] = useState("");

    const grad = (characterData.awards.includes("college graduate") || (characterData.awards.includes("honors college graduate")));
    const honorsgrad = (characterData.awards.includes("honors college graduate"));
    const medgrad = (characterData.awards.includes("med school graduate"));

    const careers = datatables.fullEnlistmentOps;

    const handleSubmission = (val) => {
        setWarning("");
        const nextEnlistmentChoice = val ?? enlistmentChoice;


        //handle automatic options
        if (nextEnlistmentChoice === "draft") {
            setStep("draft");
            return
        }

        if (nextEnlistmentChoice === "year1") {

            if (characterData.career.category === "basic") {
                setStep("year1");
            } else {
                setStep(characterData.career.category)
            }
            return
        }
        const careerCategory = careers[nextEnlistmentChoice].category
        const careerName = (careerCategory === "navy") ? "navy" : (careerCategory === "merchants" ? "merchants" : nextEnlistmentChoice);
        const subCareerName = (careerCategory === "navy" || careerCategory === "merchants") ? nextEnlistmentChoice : "";

        if (
            characterData.commission === careerCategory || //auto officer
            (characterData.commission === "navy" && careerCategory === "marines") || //naval commission covers marines
            (grad && nextEnlistmentChoice === "scouts") || //auto bureau
            (honorsgrad && nextEnlistmentChoice === "megacorp trader") || //auto enlist
            (medgrad && careerCategory !== "basic" && nextEnlistmentChoice !== "marines") || //special
            nextEnlistmentChoice === "noble" //auto enlist
        ) {
            const info = "enlistment cannot fail";
            const historyStr = `${characterName}'s qualifications made enlistment in the ${careerName} automatic.`;

            setCharacterData((prev) => (
                {
                    ...prev, career: {
                        careername: careerName,
                        subcareername: subCareerName,
                        category: careerCategory,
                        branch: "",
                        terms: 0,
                        rank: 0,
                        officer: false,  //comission and branch assgn on next step
                    }
                }
            ));
            setWarning(info);
            handleHistoryAdd(historyStr);
            setEnlistOps([
                { id: 1, name: `Begin your career as a ${careerName}`, value: "year1" },
            ]);
        } else {
            const stats = careers[nextEnlistmentChoice].enlist;
            const enlist = {
                target: stats[0],
                skill1: [stats[1], stats[2]],
                skill2: [stats[3], stats[4]]
            }
            const result = careerCheck(enlist, upp, characterName);
            const descriptor = (result[0]) ? "and was accepted" : "but was rejected";
            const failText = (result[0]) ? "succeeding. Begin your career." : "failing. Make another selection.";
            const MILITARY_CAREERS = new Set(['army', 'marines', 'navy', 'scouts', 'flyer', 'sailor']);
            const NOBLE_CAREERS = new Set(['noble']);
            const historyStr = MILITARY_CAREERS.has(careerCategory)
                ? `${characterName} enlisted in the ${nextEnlistmentChoice} ${descriptor}.`
                : NOBLE_CAREERS.has(careerCategory)
                    ? `${characterName} sought a position among the nobility ${descriptor}.`
                    : `${characterName} applied to be a ${nextEnlistmentChoice} ${descriptor}.`;
            const info = `${result[1]}, ${failText}`
            setWarning(info);
            handleHistoryAdd(historyStr)

            if (!result[0]) {
                setEnlistOps(prev =>
                    prev.filter(option => option.value !== nextEnlistmentChoice)
                );
                setEnlistmentChoice("");
            } else {
                setCharacterData((prev) => (
                    {
                        ...prev, career: {
                            careername: careerName,
                            subcareername: subCareerName,
                            category: careerCategory,
                            branch: "",
                            terms: 0,
                            rank: (careerName === "merchants") ? 0 : 1,
                            officer: false,
                        }

                    }
                ));
                handleHistoryAdd(`${characterName} ${datatables.careerDesc[careerName]}`)
                setEnlistOps([
                    { id: 1, name: `Begin your career as a ${careerName}`, value: "year1" },
                ])
            }
        }
    }
    const commisionStr = (characterData.commission === "navy") ? "navy or marines" : characterData.commission;

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold">Enlistment choices</h2>

            {warning !== "" ?
                <p className="text-xs text-destructive">{warning}</p>
                :
                <div className="space-y-1">
                    {characterData.commission !== "none" && characterData.commission !== "denied" &&
                        <p className="text-xs text-muted-foreground">You have a {commisionStr} commission waiting for you.</p>}
                    {grad &&
                        <p className="text-xs text-muted-foreground">As a college grad enlistment in the Scouts is automatic.</p>}
                    {honorsgrad &&
                        <p className="text-xs text-muted-foreground">As an honors grad you may select your assignment in the Scouts bureaucracy. Enlisting in a Megacorp Trader is automatic.</p>}
                    {medgrad &&
                        <p className="text-xs text-muted-foreground">As a medical grad enlistment in the Navy, Army, Scouts or Traders is automatic and comes with an instant promotion.</p>}
                    {characterData.SOC >= 10 &&
                        <p className="text-xs text-muted-foreground">Your social standing means the Noble career path can be selected and admission is automatic.</p>}
                    <p className="text-xs text-muted-foreground">You are eligible for the following career paths:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {approvedCareers.map((career, index) => (
                            <li className="capitalize" key={index}>{career}</li>
                        ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">You can also submit to the draft — randomly assigned to Army, Navy, Marines, Scouts, Flyers, Sailors.</p>
                </div>
            }
            <div className="pt-2">
                <p className="text-sm mb-2">Submit your application to a career:</p>
                <SelectOrButton
                    allOps={enlistOps}
                    userChoice={enlistmentChoice}
                    setUserChoice={setEnlistmentChoice}
                    onSubmit={handleSubmission}
                />
            </div>
        </div>
    );
}
