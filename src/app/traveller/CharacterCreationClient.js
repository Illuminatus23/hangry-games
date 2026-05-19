"use client";
import React, { useEffect, useState, useMemo } from "react";
import { growUp, toTravellerHex, generateUPP, d6 } from "./lib/helpers";
import CharacterEducationEnlistmentDraft from "./components/CharacterEducationEnlistmentDraft";
import CharacterEnlistment from "./components/CharacterEnlistment";
import BasicTerm from "./components/BasicTerm";
import MusterOut from "./components/MusterOut";
import ArmyTerm from "./components/ArmyTerm";
import NavyTerm from "./components/NavyTerm";
import { datatables } from "./lib/data"
import { generateBiography } from "./lib/historyText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon } from "lucide-react";

function LabeledInput({ label, id, type = "text", value, onChange, min, max, disabled = false }) {
    return (
        <div className="flex flex-col gap-1">
            <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
            </Label>
            <Input
                id={id}
                className="capitalize"
                type={type}
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                disabled={disabled}
                autoComplete="off"
            />
        </div>
    );
}

function Section({ title, children }) {
    return (
        <Card>
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
                {children}
            </CardContent>
        </Card>
    );
}

function InitialCreation({ onKeep }) {
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                Instructions and biography will appear on the left. Character stats and attributes generated will appear on the right. Character name has been provided but can be overridden on this step.
            </p>
            <Button type="button" onClick={onKeep}>Keep Character</Button>
        </div>
    );
}

export default function CharacterCreation() {
    const [isDark, setIsDark] = useState(true);

    const toggleDark = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const [characterName, setCharacterName] = useState("Gus");
    const [characterData, setCharacterData] = useState({
        STR: 7,
        DEX: 7,
        END: 7,
        INT: 7,
        EDU: 7,
        SOC: 7,
        PSI: 0,
        bioAge: 0,
        chronoAge: 0,
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
            officer: false,
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
        setStep("education");
    };

    useEffect(() => {
        const uppObj = generateUPP();
        handleBulkInfoChange(uppObj);
    }, []);

    const generateFullName = () => {
        const peerage = (characterData.SOC >= 10) ? `${datatables.Title.M[characterData.SOC - 9][1]} ` : "";
        const medgrad = (characterData.awards.includes("med school graduate")) ? " MD" : "";
        let rankName = "";
        const ranktable = datatables.rank[characterData.career.careername];
        if (characterData.career.careername !== "" && ranktable) {
            const rank = (characterData.career.officer) ? ranktable["O"] : ranktable["E"];
            rankName = `${rank[characterData.career.rank][1]} `;
        }
        return `${peerage}${rankName}${characterName}${medgrad}`;
    };

    const generateRankLong = () => {
        if (characterData.career.careername === 'noble') {
            const title = datatables.Title.M[characterData.SOC - 9]?.[0];
            return title ?? "n/a";
        }
        const ranktable = datatables.rank[characterData.career.careername];
        if (!ranktable) return "n/a";
        const rank = (characterData.career.officer) ? ranktable["O"] : ranktable["E"];
        const rankText = rank[characterData.career.rank][0];
        const fullRank = `${(characterData.career.officer) ? "O" : (characterData.career.careername === "scouts") ? "IS-" : "E"}${characterData.career.rank}`;
        const fullRankText = (rankText !== "") ? `${fullRank}: ${rankText}` : "No Rank";
        if (["belter", "hunter", "rogue", "doctor", "scientist"].includes(characterData.career.careername)) {
            return "n/a";
        }
        return fullRankText;
    };

    const performDraft = () => {
        if (characterData.career.subcareername !== "") {
            if (characterData.career.subcareername === "flyer" || characterData.career.subcareername === "sailor") {
                setStep("year1");
            } else {
                setStep(characterData.career.subcareername);
            }
            return;
        }

        const draftRoll = d6(1, 0);
        let draftBranch = "";
        switch (draftRoll) {
            case 1: draftBranch = "navy"; break;
            case 2: draftBranch = "marines"; break;
            case 3: draftBranch = "army"; break;
            case 4: draftBranch = "scouts"; break;
            case 5: draftBranch = "flyer"; break;
            case 6: draftBranch = "sailor"; break;
            default: draftBranch = "Something went wrong";
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
        setWarning(`Draft roll was ${draftRoll} placing ${characterName} in the ${draftBranch}.`);
    };

    const sharedTermProps = { upp, characterData, setCharacterData, setStep, characterName, handleHistoryAdd, setSkills, setPageWarning: setWarning };

    const stepContent = {
        initial: <InitialCreation onKeep={keepCharacter} />,
        education: <CharacterEducationEnlistmentDraft setStep={setStep} setSkills={setSkills} characterData={characterData} setCharacterData={setCharacterData} upp={upp} characterName={characterName} handleHistoryAdd={handleHistoryAdd} />,
        enlistment: <CharacterEnlistment upp={upp} characterData={characterData} setCharacterData={setCharacterData} setStep={setStep} characterName={characterName} handleHistoryAdd={handleHistoryAdd} />,
        draft: (
            <div className="space-y-3">
                <h2 className="text-lg font-semibold">The Draft</h2>
                <p className="text-xs text-muted-foreground">
                    Volunteering for the draft randomly assigns you to one of the 6 military careers: army, navy, marines, scouts, sailors or flyers.
                </p>
                {warning !== "" && <p className="text-xs text-destructive">{warning}</p>}
                <Button type="button" onClick={performDraft}>
                    {characterData.career.subcareername === "" ? "Get drafted" : `Begin your career in the ${characterData.career.subcareername}`}
                </Button>
            </div>
        ),
        year1: <BasicTerm {...sharedTermProps} />,
        army: <ArmyTerm {...sharedTermProps} skills={skills} />,
        marines: <ArmyTerm {...sharedTermProps} skills={skills} />,
        navy: <NavyTerm {...sharedTermProps} skills={skills} />,
        scouts: <BasicTerm {...sharedTermProps} />,
        merchants: <BasicTerm {...sharedTermProps} />,
        End: (
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">The story ends here.</h2>
                {warning !== "" && <p className="text-xs text-destructive">{warning}</p>}
            </div>
        ),
        retire: <MusterOut characterData={characterData} setCharacterData={setCharacterData} setSkills={setSkills} skills={skills} setGear={setGear} setStep={setStep} />,
        complete: (
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Character creation complete. Your character sheet is finalized on the right.</p>
                <p className="text-xs text-muted-foreground">You can continue writing the biography sections below.</p>
            </div>
        ),
    };

    const hasCareer = characterData.career.careername !== "";

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">

            {/* Header */}
            <header className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">MegaTraveller Character Creation</h1>
                <div className="flex items-center gap-3">
                    {/* UPP badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">UPP</span>
                        <span className="font-mono font-bold">{upp}</span>
                    </div>
                    {/* Dark/light toggle */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={toggleDark}
                        aria-label="Toggle light/dark mode"
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                </div>
            </header>

            {/* Two-column body */}
            <div className="flex gap-6">

                {/* LEFT: Character Creation + Biography */}
                <div className="w-1/2 space-y-4">
                    <Section title="Character Creation">
                        {stepContent[step] ?? null}
                    </Section>

                    {characterData.history.length > 0 && (
                        <Section title="Biography">
                            {generateBiography(characterData, skills, characterName, step).map((entry, index) => (
                                <p key={index} className="text-xs text-muted-foreground italic">
                                    {entry}
                                </p>
                            ))}
                        </Section>
                    )}
                </div>

                {/* RIGHT: Character Sheet */}
                <div className="w-1/2 space-y-4">

                    {/* IDENTITY */}
                    <Section title="Identity">
                        <LabeledInput
                            label="Full Name"
                            id="characterName"
                            value={characterData.bioAge > 0 ? generateFullName() : characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            disabled={characterData.bioAge > 0}
                        />
                        {characterData.bioAge > 0 ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <LabeledInput label="Chronological Age" id="chronoAge" value={characterData.chronoAge} disabled />
                                    <LabeledInput label="Biological Age" id="bioAge" value={characterData.bioAge} disabled />
                                </div>
                                <LabeledInput label="Homeworld" id="hName" value={characterData.homeworldString} disabled />
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">Gender has no impact on character creation and does not appear here.</p>
                        )}
                    </Section>

                    {/* CAREER */}
                    {hasCareer && (
                        <Section title="Career">
                            <div className="grid grid-cols-2 gap-3">
                                <LabeledInput label="Career" id="career"
                                    value={`${characterData.career.careername}${characterData.career.subcareername ? ` (${characterData.career.subcareername})` : ""}`}
                                    disabled />
                                <LabeledInput label="Branch" id="branch" value={characterData.career.branch} disabled />
                                <LabeledInput label="Rank" id="rank" value={generateRankLong()} disabled />
                                <LabeledInput label="Terms" id="terms" value={characterData.career.terms} disabled />
                            </div>
                            {characterData.awards.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Awards &amp; Decorations</p>
                                    <ul className="space-y-0.5 ml-4 list-disc">
                                        {characterData.awards.map((award, i) => (
                                            <li key={i} className="text-xs text-muted-foreground capitalize">{award}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* ATTRIBUTES */}
                    <Section title="Attributes">
                        <div className="grid grid-cols-3 gap-3">
                            {["STR", "DEX", "END", "INT", "EDU", "SOC"].map((key) => (
                                <div key={key} className="text-center p-2 rounded-lg border border-border bg-muted/40">
                                    <p className="text-xs text-muted-foreground">{key}</p>
                                    <div className="mt-0.5 text-sm font-mono font-semibold">{toTravellerHex(characterData[key])}</div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">STR DEX END INT EDU SOC in Traveller hex. PSI tracked separately.</p>
                    </Section>

                    {/* SKILLS */}
                    {skills.length > 0 && (
                        <Section title="Skills">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border border-border px-2 py-1 text-left text-xs text-muted-foreground uppercase tracking-wide bg-muted/40">Skill</th>
                                        <th className="border border-border px-2 py-1 text-left text-xs text-muted-foreground uppercase tracking-wide bg-muted/40 w-12">Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skills.map((skill, index) => (
                                        <tr key={index}>
                                            <td className="border border-border px-2 py-1">{skill.name}</td>
                                            <td className="border border-border px-2 py-1">{skill.level}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>
                    )}

                    {/* RESOURCES */}
                    <Section title="Resources">
                        <table className="w-full text-sm border-collapse">
                            <tbody>
                                {characterData.pension > 0 && (
                                    <tr>
                                        <td className="border border-border px-2 py-1 text-xs text-muted-foreground">Annual Pension</td>
                                        <td className="border border-border px-2 py-1">Cr{characterData.pension.toLocaleString()}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="border border-border px-2 py-1 text-xs text-muted-foreground">Cash on Hand</td>
                                    <td className="border border-border px-2 py-1">Cr{characterData.cash.toLocaleString()}</td>
                                </tr>
                                {characterData.ship && (
                                    <tr>
                                        <td className="border border-border px-2 py-1 text-xs text-muted-foreground">Ship</td>
                                        <td className="border border-border px-2 py-1 capitalize">{characterData.ship}</td>
                                    </tr>
                                )}
                                {characterData.shipshares > 0 && (
                                    <tr>
                                        <td className="border border-border px-2 py-1 text-xs text-muted-foreground">Ship Shares</td>
                                        <td className="border border-border px-2 py-1">{characterData.shipshares}</td>
                                    </tr>
                                )}
                                {gear.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border border-border px-2 py-1 text-xs text-muted-foreground">Equipment</td>
                                        <td className="border border-border px-2 py-1 capitalize">{item}</td>
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
