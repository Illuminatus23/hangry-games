
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
    //const banedCareers = Object.keys(enlistmentList[1]);
    const [enlistmentChoice, setEnlistmentChoice] = useState("");
    const [enlistOps, setEnlistOps] = useState(
        approvedCareers.map((value, index) => (
            { id: index, value: value, name: value }
        ))
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
            (grad && nextEnlistmentChoice === "scouts") || //auto bureau
            (honorsgrad && nextEnlistmentChoice === "megacorp trader") || //auto enlist
            (medgrad && careerCategory !== "basic" && nextEnlistmentChoice !== "marines") || //special
            nextEnlistmentChoice === "noble" //auto enlist
        ) {
            const info = "auto enlist";
            const historyStr = "auto enlist";

            setCharacterData((prev) => (
                {
                    ...prev, ["career"]: {
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
            handleHistoryAdd(historyStr)
        } else {
            const stats = careers[nextEnlistmentChoice].enlist;
            const enlist = {
                target: stats[0],
                skill1: [stats[1], stats[2]],
                skill2: [stats[3], stats[4]]
            }
            const result = careerCheck(enlist, upp, characterName);
            const descriptor = (result[0]) ? "and was admmitted" : "but was rejected";
            const failText = (result[0]) ? "succeeding. Begin your career." : "failing. Make another selection.";
            const historyStr = `${characterName} applied for position with the ${nextEnlistmentChoice} ${descriptor}.`;
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
                        ...prev, ["career"]: {
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
        <div>
            <h2>Enlistment choices</h2>

            {warning !== "" ?
                <p className="mt-label" style={{ marginBottom: "0.5rem", color: "red" }}>{warning}</p>
                :
                <div>
                    {characterData.commission !== "none" && characterData.commission !== "denied" ?
                        <p className="mt-label">You have a {commisionStr} commision waiting for you</p> : null}
                    {grad ?
                        <p className="mt-label">As a college grad enlistment in the Scouts is automatic.</p> : null}
                    {honorsgrad ?
                        <p className="mt-label">As a honors grad you may select your assignment in the Scouts bureaucracy. Enlisting in a Megacorp Trader is automatic.</p> : null}
                    {medgrad ?
                        <p className="mt-label">As a medical grad enlistment in the Navy, Army, Scouts or Traders is automatic and comes with an instant promotion.</p> : null}
                    {characterData.SOC >= 10 ?
                        <p className="mt-label">Your social standing means the Noble career path can be selected and admission is automatic.</p> : null}
                    <p>You are eligible for the following career paths:</p>
                    <ul className="mt-label">

                        {approvedCareers.map((career, index) => (
                            <li className="mt-cap" key={index}>{career}</li>
                        ))}
                    </ul>
                    <p className="mt-label">You can also submit to the draft - randomly assigned to Army, Navy, Marines, Scouts, Flyers, Sailors.</p>
                    {/* <p>You are excluded from the following career paths:</p>
                    <ul className="mt-label">
                        {banedCareers.map((career, index) => (
                            <li className="mt-cap" key={index}>{career}</li>
                        ))}
                    </ul> */}
                </div>
            }
            <div>
                <p style={{ margin: "1rem 0 0.5rem" }}>Submit your application to a career:</p>
                <SelectOrButton
                    allOps={enlistOps}
                    userChoice={enlistmentChoice}
                    setUserChoice={setEnlistmentChoice}
                    onSubmit={handleSubmission}
                />
                {/* <select
                    style={{ marginBottom: "0.5rem" }}
                    className="mt-select mt-cap"
                    value={enlistmentChoice}
                    onChange={(e) => setEnlistmentChoice(e.target.value)}
                >
                    <option value="" disabled>--Select--</option>
                    <option value="draft">Submit to the draft</option>
                    {enlistOps.length !== 0 ?

                        enlistOps.map((career) => (
                            <option key={career.id} value={career.value}>
                                {career.value}
                            </option>
                        )) : null
                    }
                </select> */}
            </div>

            {/* <button className="mt-btn" onClick={handleSubmission}>
                Continue
            </button> */}
        </div>
    );
}
