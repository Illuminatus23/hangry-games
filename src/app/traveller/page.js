"use client"
import React, { useEffect, useState, useMemo } from "react";
import "./css/MegaTravellerCharacterSheet.css"
import { growUp, toTravellerHex, generateUPP, d6 } from "./lib/helpers";
import CharacterEducationEnlistmentDraft from "./components/CharacterEducationEnlistmentDraft";
import CharacterEnlistment from "./components/CharacterEnlistment";
import BasicTerm from "./components/BasicTerm";
import MusterOut from "./components/MusterOut";
import ArmyTerm from "./components/ArmyTerm";
import { datatables } from "./lib/data"
import { generateBiography } from "./lib/historyText";

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
        pension: 0,
        ship: "",
        shipshares: 0,
    });
    const [skills, setSkills] = useState([]);
    const [gear, setGear] = useState([]);
    const [step, setStep] = useState("initial");
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
        const ranktable = datatables.rank[characterData.career.careername];
        if (characterData.career.careername !== "" && ranktable) {
            const rank = (characterData.career.officer) ? ranktable["O"] : ranktable["E"];
            rankName = `${rank[characterData.career.rank][1]} `
        }

        const fullName = `${peerage}${rankName}${characterName}${medgrad}`;

        return fullName;
    }
    const generateRankLong = () => {
        if (characterData.career.careername === 'noble') {
            const title = datatables.Title.M[characterData.SOC - 9]?.[0];
            return title ?? "n/a";
        }
        const ranktable = datatables.rank[characterData.career.careername];
        if (!ranktable) return "n/a";
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
                drafted: true,
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
        year1: <BasicTerm upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} setSkills={setSkills} setPageWarning={setWarning} />,
        army: <ArmyTerm upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} setSkills={setSkills} skills={skills} setPageWarning={setWarning} />,
        marines: <ArmyTerm upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} setSkills={setSkills} skills={skills} setPageWarning={setWarning} />,
        navy: <BasicTerm upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} setSkills={setSkills} setPageWarning={setWarning} />,
        scouts: <BasicTerm upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} setSkills={setSkills} setPageWarning={setWarning} />,
        merchants: <BasicTerm upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} setSkills={setSkills} setPageWarning={setWarning} />,
        End: (
            <div>
                <h2>The story ends here.</h2>
                {warning !== "" && (
                    <p className="mt-label" style={{ marginBottom: "0.5rem", color: "red" }}>{warning}</p>
                )}
            </div>
        ),
        retire: <MusterOut characterData={characterData} setCharacterData={setCharacterData} setSkills={setSkills} skills={skills} setGear={setGear} setStep={setStep} />,
        complete: (
            <div>
                <p className="mt-label" style={{ marginBottom: "0.5rem" }}>
                    Character creation complete. Your character sheet is finalized on the right.
                </p>
                <p className="mt-label">You can continue writing the biography sections below.</p>
            </div>
        ),
    };

    const hasCareer = characterData.career.careername !== "";

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

                {/* ── LEFT: Character Creation + Biography ── */}
                <div style={{ width: "50%" }}>

                    {/* 1. CHARACTER CREATION — the active wizard step */}
                    <Section title="Character Creation">
                        {stepContent[step] ?? null}
                    </Section>

                    {/* 2. BIOGRAPHY — programmatically generated narrative */}
                    {characterData.history.length > 0 && (
                        <Section title="Biography">
                            {generateBiography(characterData, skills, characterName, step).map((entry, index) => (
                                <p key={index} style={{ fontSize: "0.78rem", color: "#999", fontStyle: "italic", marginBottom: "0.2rem" }}>
                                    {entry}
                                </p>
                            ))}
                        </Section>
                    )}
                </div>

                {/* ── RIGHT: Character Sheet ── */}
                <div style={{ width: "50%" }}>

                    {/* IDENTITY */}
                    <Section title="Identity">
                        <LabeledInput
                            label="Full Name"
                            id="characterName"
                            value={characterData.age > 0 ? generateFullName() : characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            disabled={characterData.age > 0}
                        />
                        {characterData.age > 0 ? (
                            <div>
                                <div className="mt-grid mt-grid-4" style={{ marginTop: "0.5rem" }}>
                                    <LabeledInput label="Age" id="age" value={characterData.age + characterData.negAge} disabled />
                                    <LabeledInput label="Apparent Age" id="aAge" value={characterData.age} disabled />
                                </div>
                                <div style={{ marginTop: "0.5rem" }}>
                                    <LabeledInput label="Homeworld" id="hName" value={characterData.homeworldString} disabled />
                                </div>
                            </div>
                        ) : (
                            <p className="mt-help-text">Gender has no impact on character creation and does not appear here.</p>
                        )}
                    </Section>

                    {/* CAREER */}
                    {hasCareer && (
                        <Section title="Career">
                            <div className="mt-grid mt-grid-4">
                                <LabeledInput label="Career" id="career"
                                    value={`${characterData.career.careername}${characterData.career.subcareername ? ` (${characterData.career.subcareername})` : ""}`}
                                    disabled />
                                <LabeledInput label="Branch" id="branch" value={characterData.career.branch} disabled />
                                <LabeledInput label="Rank" id="rank" value={generateRankLong()} disabled />
                                <LabeledInput label="Terms" id="terms" value={characterData.career.terms} disabled />
                            </div>
                            {characterData.awards.length > 0 && (
                                <div style={{ marginTop: "0.5rem" }}>
                                    <p className="mt-label">Awards &amp; Decorations</p>
                                    <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
                                        {characterData.awards.map((award, i) => (
                                            <li key={i} className="mt-label mt-cap" style={{ marginBottom: "0.15rem" }}>{award}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* ATTRIBUTES */}
                    <Section title="Attributes">
                        <div className="mt-grid mt-grid-3">
                            {["STR", "DEX", "END", "INT", "EDU", "SOC"].map((key) => (
                                <div key={key} className="mt-char-block">
                                    <p className="mt-label">{key}</p>
                                    <div className="mt-char-hex">{toTravellerHex(characterData[key])}</div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-help-text">STR DEX END INT EDU SOC in Traveller hex. PSI tracked separately.</p>
                    </Section>

                    {/* SKILLS */}
                    {skills.length > 0 && (
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
                        </Section>
                    )}

                    {/* RESOURCES */}
                    <Section title="Resources">
                        <table className="mt-table">
                            <tbody>
                                {characterData.pension > 0 && (
                                    <tr>
                                        <td className="mt-label">Annual Pension</td>
                                        <td>Cr{characterData.pension.toLocaleString()}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="mt-label">Cash on Hand</td>
                                    <td>Cr{characterData.cash.toLocaleString()}</td>
                                </tr>
                                {characterData.ship && (
                                    <tr>
                                        <td className="mt-label">Ship</td>
                                        <td className="mt-cap">{characterData.ship}</td>
                                    </tr>
                                )}
                                {characterData.shipshares > 0 && (
                                    <tr>
                                        <td className="mt-label">Ship Shares</td>
                                        <td>{characterData.shipshares}</td>
                                    </tr>
                                )}
                                {gear.map((item, index) => (
                                    <tr key={index}>
                                        <td className="mt-label">Equipment</td>
                                        <td className="mt-cap">{item}</td>
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

