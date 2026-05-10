"use client"
import React, { useEffect, useState, useMemo } from "react";
import "./css/MegaTravellerCharacterSheet.css"
import { growUp, toTravellerHex, generateUPP, d6 } from "./lib/helpers";
import CharacterEducationEnlistmentDraft from "./components/CharacterEducationEnlistmentDraft";
import CharacterEnlistment from "./components/CharacterEnlistment";
import BasicTerm from "./components/BasicTerm";
import MusterOut from "./components/MusterOut";
import { datatables } from "./lib/data";

/**
 * Simple labeled input field.
 */
function LabeledInput({ label, id, type = "text", value, onChange, min, max, disabled = false }) {
    return (
        <div className="mt-field">
            <label htmlFor={id} className="mt-label">
                {label}
            </label>
            <input
                id={id}
                className="mt-input mt-cap"
                type={type}
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                disabled={disabled}
            />
        </div>
    );
}

/**
 * Section wrapper for visual grouping.
 */
function Section({ title, children }) {
    return (
        <section className="mt-section">
            <h2 className="mt-section-title">{title}</h2>
            <div className="mt-section-body">{children}</div>
        </section>
    );
}

function InitialCreation({ onKeep }) {
    return (
        <div>
            <p>Instructions and biography will appear on the left. Character stats and attributes generated will appear on the right. Character name has been provided but can be overridden on this step.</p>
            <button className="mt-btn" onClick={onKeep}>Keep Character</button>
        </div>
    );
}

/**
 * Main MegaTraveller character sheet component.
 */
export default function CharacterCreation() {

    const [characterName, setCharacterName] = useState("Gus");
    const [characterData, setCharacterData] = useState({
        STR: 7,
        DEX: 7,
        END: 7,
        INT: 7,
        EDU: 7,
        SOC: 7,
        PSI: 0,
        age: 0,
        negAge: 0,
        homeworld: "",
        homeworldString: "",
        history: [],
        commission: "none",
        titlename: "",
        rankname: "",
        career: {
            careername: "",
            subcareername: "",
            branch: "",
            rank: 0,
            terms: 0,
            officer: false,  //comission and branch assgn on next step
        },
        awards: [],
        grad: [false, false],
        medgrad: [false, false],
        cash: 0,
        ship: "",
        shipshares: 0,
    });
    const [skills, setSkills] = useState([]); //[skillname, value]
    const [gear, setGear] = useState([]); //[skillname, value]
    const [step, setStep] = useState("initial")
    const [warning, setWarning] = useState("");

    // Derived UPP string from key characterData
    const upp = useMemo(() => {
        const order = ["STR", "DEX", "END", "INT", "EDU", "SOC"];
        return order.map((key) => toTravellerHex(characterData[key])).join("");
    }, [characterData]);

    const handleBasicInfoChange = (field, value) => {
        setCharacterData((prev) => ({ ...prev, [field]: value }));
    };
    const handleHistoryAdd = (entry) => {
        setCharacterData(prev => ({
            ...prev,
            history: [...prev.history, entry],
        }));
    };

    const handleBulkInfoChange = (updates) => {
        setCharacterData(prev => ({ ...prev, ...updates }));
    };

    const keepCharacter = () => {
        const growedUp = growUp(upp, characterName);
        handleBulkInfoChange(growedUp.character);
        setSkills(growedUp.skills);
        setStep("education")
    }
    useEffect(() => {
        const uppObj = generateUPP()
        handleBulkInfoChange(uppObj)
    }, []);

    const generateFullName = () => {
        const peerage = (characterData.SOC >= 10) ? `${datatables.Title.M[characterData.SOC - 9][1]} ` : "";
        const medgrad = (characterData.awards.includes("med school graduate")) ? " MD" : "";
        let rankName = "";
        if (characterData.career.careername !== "" && characterData.career.careername !== "noble") {
            const ranktable = datatables.rank[characterData.career.careername];
            //console.log(characterData)
            //console.log(ranktable)
            const rank = (characterData.career.officer) ? ranktable["O"] : ranktable["E"];
            rankName = `${rank[characterData.career.rank][1]} `
        }

        const fullName = `${peerage}${rankName}${characterName}${medgrad}`;

        return fullName;
    }
    const generateRankLong = () => {
        const ranktable = datatables.rank[characterData.career.careername];
        const rank = (characterData.career.officer) ? ranktable["O"] : ranktable["E"];
        const rankText = rank[characterData.career.rank][0];
        const fullRank = `${(characterData.career.officer) ? "O" : (characterData.career.careername === "scouts") ? "IS-" : "E"}${characterData.career.rank}`
        const fullRankText = (rankText !== "") ? `${fullRank}: ${rankText}` : "No Rank"
        if (["belter", "hunter", "rogue", "doctor", "scientist"].includes(characterData.career.careername)) {
            return "n/a";
        }

        return fullRankText;
    }

    const performDraft = () => {

        if (characterData.career.subcareername !== "") {

            if (characterData.career.subcareername === "flyer" || characterData.career.subcareername === "sailor") {
                setStep("year1")
            } else {
                setStep(characterData.career.subcareername)
            }
            return
        }

        const draftRoll = d6(1, 0)
        let draftBranch = "";

        switch (draftRoll) {
            case 1:
                draftBranch = "navy";
                break;
            case 2:
                draftBranch = "marines";
                break;
            case 3:
                draftBranch = "army";
                break;
            case 4:
                draftBranch = "scouts";
                break;
            case 5:
                draftBranch = "flyer";
                break;
            case 6:
                draftBranch = "sailor";
                break;
            default:
                draftBranch = "Something went wrong";
        }
        setCharacterData((prev) => ({
            ...prev,
            career: {
                careername: draftBranch,
                subcareername: (draftBranch === "navy") ? "imperial navy" : draftBranch,
                branch: "",
                terms: 0,
                rank: 0,
                officer: false,
            },
        }));

        handleHistoryAdd(`Politics and war being what they are, the galaxy is ever changing conflict. ${characterName} was drafted into the ${draftBranch}`);
        setWarning(`Draft roll was ${draftRoll} placing ${characterName} in the ${draftBranch}.`)
    }

    const stepContent = {
        initial: <InitialCreation onKeep={keepCharacter} />,
        education: <CharacterEducationEnlistmentDraft setStep={setStep} setSkills={setSkills} characterData={characterData} setCharacterData={setCharacterData} upp={upp} characterName={characterName} handleHistoryAdd={handleHistoryAdd} />,
        enlistment: <CharacterEnlistment upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} />,
        draft: (
            <div>
                <h2>The Draft</h2>
                <p className="mt-label" style={{ marginBottom: "0.5rem" }}>
                    Volunteering for the draft randomly assigns you to one of the 6 military careers: army, navy, marines, scouts, sailors or flyers.
                </p>
                {warning !== "" && <p className="mt-label" style={{ marginBottom: "0.5rem", color: "red" }}>{warning}</p>}
                <button className="mt-btn" onClick={performDraft}>{(characterData.career.subcareername === "") ? "Get drafted" : `Begin your career in the ${characterData.career.subcareername}`}</button>
            </div>
        ),
        year1: <BasicTerm upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} setSkills={setSkills} />,
        army: <p>Army career</p>,
        navy: <p>Navy career</p>,
        marines: <p>Marines career</p>,
        scouts: <p>Scouts career</p>,
        merchants: <p>Merchants career</p>,
        retire: <MusterOut characterData={characterData} setCharacterData={setCharacterData} setSkills={setSkills} skills={skills} setGear={setGear} />,
    };

    return (
        <div className="mt-sheet" id="modallyModal">
            <header className="mt-header">
                <h1 className="mt-title">MegaTraveller Character Creation</h1>
                <div className="mt-upp">
                    <span className="mt-upp-label">UPP</span>
                    <span className="mt-upp-value">{upp}</span>
                </div>
            </header>
            <div style={{ display: "flex", gap: "25px" }}>
                {/* BIO */}
                <div style={{ width: "50%" }}>
                    <Section title="Character Path Choices">
                        {stepContent[step] ?? null}
                    </Section>
                    {characterData.history.length !== 0 ?
                        <Section title="Biography">
                            {characterData.history.map((p, index) => (
                                <p key={index} className="mt-label">{p}</p>
                            ))}
                        </Section> : null
                    }
                </div>
                <div style={{ width: "50%" }}>
                    <Section title="General">
                        <LabeledInput
                            label="Character Name"
                            id="characterName"
                            value={(characterData.age > 0) ? generateFullName(characterData, characterName) : characterName}
                            onChange={(e) => {
                                setCharacterName(e.target.value);
                            }}
                            disabled={characterData.age > 0}
                        />
                        {characterData.age > 0 ?
                            <div>
                                <div className="mt-grid mt-grid-4">
                                    <LabeledInput
                                        label="Age (actual)"
                                        id="age"
                                        value={characterData.age + characterData.negAge}
                                        disabled={true}
                                    />
                                    <LabeledInput
                                        label="Age (apparent)"
                                        id="aAge"
                                        disabled={true}
                                        value={characterData.age}
                                    />
                                </div>
                                <div style={{ marginTop: "0.5rem" }}>
                                    <LabeledInput
                                        label="Homeworld"
                                        id="hName"
                                        value={characterData.homeworldString}
                                        disabled={true}
                                    />
                                </div>
                                {characterData.career.careername !== "" ?
                                    <div className="mt-grid mt-grid-4" style={{ marginTop: "0.5rem" }}>
                                        <LabeledInput
                                            label="Career"
                                            id="career"
                                            value={`${characterData.career.careername} ${(characterData.career.subcareername !== "") ? `(${characterData.career.subcareername})` : ""}`}
                                            disabled={true}
                                        />
                                        <LabeledInput
                                            label="Branch"
                                            id="branch"
                                            disabled={true}
                                            value={characterData.career.branch}
                                        />
                                        <LabeledInput
                                            label="Rank"
                                            id="rank"
                                            value={generateRankLong()}
                                            disabled={true}
                                        />
                                        <LabeledInput
                                            label="Terms"
                                            id="terms"
                                            value={characterData.career.terms}
                                            disabled={true}
                                        />
                                    </div> : null}
                                {characterData.awards.length > 0 ?
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <LabeledInput
                                            label="awards"
                                            id="awards"
                                            value={characterData.awards.join(', ')}
                                            disabled={true}
                                        />
                                    </div> : null
                                }
                            </div> :
                            <p className="mt-help-text">
                                Gender has no impact on character creation, so it does not appear in creation.
                            </p>}

                    </Section>
                    <Section title="Characteristics">
                        <div className="mt-grid mt-grid-3">
                            {["STR", "DEX", "END", "INT", "EDU", "SOC"].map((key) => (
                                <div key={key} className="mt-char-block">
                                    <p className="mt-label" htmlFor={`char-${key}`}>
                                        {key}
                                    </p>
                                    <div id={`char-${key}`} className="mt-char-hex">{toTravellerHex(characterData[key])}</div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-help-text">
                            UPP is calculated from STR, DEX, END, INT, EDU, SOC in Traveller
                            hex. PSI is tracked separately.
                        </p>
                    </Section>
                    {/* SKILLS */}
                    {skills.length !== 0 ?
                        <Section title="Skills">
                            <table className="mt-table">
                                <thead>
                                    <tr>
                                        <th>Skill</th>
                                        <th style={{ width: "3rem" }}>Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skills.map((skill, index) => (
                                        <tr key={index}>
                                            <td>{skill.name}</td>
                                            <td>{skill.level}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section> : null}

                    <Section title="Gear">
                        <table className="mt-table">
                            <tbody>
                                <tr>
                                    <td>
                                        Credits: {characterData.cash}
                                    </td>
                                </tr>
                                {gear.map((gear, index) => (
                                    <tr key={index}>
                                        <td>
                                            {gear}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>
                </div>
            </div>
        </div>
    );
}

