"use client"
import React, { useEffect, useState, useMemo } from "react";
import "./css/MegaTravellerCharacterSheet.css"
import { d6, toTravellerHex, generateUPP } from "./lib/helpers";
import { generateBirthText } from "./lib/historyText";
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
                className="mt-input"
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

/**
 * Main MegaTraveller character sheet component.
 */
export default function MegaTravellerCharacterSheet() {
    const [basicInfo, setBasicInfo] = useState({
        characterName: "Gus",
        playerName: "",
        species: "Human",
        gender: "",
        age: "",
        homeworld: "",
        campaign: "",
        career: "",
        rank: "",
    });

    const [characteristics, setCharacteristics] = useState({
        STR: 7,
        DEX: 7,
        END: 7,
        INT: 7,
        EDU: 7,
        SOC: 7,
        PSI: 0,
        homeworld: "",
        history: "",
        birthUWP: "",
        birthDesc: []
    });

    const [skills, setSkills] = useState([
        { id: 1, name: "Gun Combat", specialization: "Slug Rifle", level: 1 },
    ]);

    const [equipment, setEquipment] = useState([
        { id: 1, name: "Cloth Armor", quantity: 1, notes: "" },
    ]);

    const [serviceHistory, setServiceHistory] = useState([
        {
            id: 1,
            term: 1,
            service: "",
            assignment: "",
            events: "",
        },
    ]);

    // Derived UPP string from key characteristics
    const upp = useMemo(() => {
        const order = ["STR", "DEX", "END", "INT", "EDU", "SOC"];
        return order.map((key) => toTravellerHex(characteristics[key])).join("");
    }, [characteristics]);

    // Handlers
    const handleBasicInfoChange = (field) => (e) => {
        const value = e.target.value;
        setBasicInfo((prev) => ({ ...prev, [field]: value }));
    };


    const handleSkillChange = (id, field) => (e) => {
        const value = field === "level" ? Number(e.target.value) : e.target.value;
        setSkills((prev) =>
            prev.map((skill) =>
                skill.id === id ? { ...skill, [field]: value } : skill
            )
        );
    };

    const addSkill = () => {
        setSkills((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                name: "",
                specialization: "",
                level: 0,
            },
        ]);
    };

    const removeSkill = (id) => {
        setSkills((prev) => prev.filter((skill) => skill.id !== id));
    };

    const handleEquipmentChange = (id, field) => (e) => {
        const value =
            field === "quantity" ? Number(e.target.value) || 0 : e.target.value;
        setEquipment((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const addEquipment = () => {
        setEquipment((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                name: "",
                quantity: 1,
                notes: "",
            },
        ]);
    };

    const removeEquipment = (id) => {
        setEquipment((prev) => prev.filter((item) => item.id !== id));
    };

    const handleServiceChange = (id, field) => (e) => {
        const raw = e.target.value;
        const value = field === "term" ? Number(raw) || 0 : raw;
        setServiceHistory((prev) =>
            prev.map((entry) =>
                entry.id === id ? { ...entry, [field]: value } : entry
            )
        );
    };

    const addServiceTerm = () => {
        setServiceHistory((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                term: (prev[prev.length - 1]?.term || 0) + 1,
                service: "",
                assignment: "",
                events: "",
            },
        ]);
    };

    const removeServiceTerm = (id) => {
        setServiceHistory((prev) => prev.filter((entry) => entry.id !== id));
    };
    setCharacteristics(generateUPP(basicInfo.characterName));

    return (
        <div className="mt-sheet">
            <header className="mt-header">
                <h1 className="mt-title">MegaTraveller Character Sheet</h1>
                <div className="mt-upp">
                    <span className="mt-upp-label">UPP</span>
                    <span className="mt-upp-value">{upp}</span>
                </div>
            </header>

            {/* BASIC INFO */}
            <div className="mt-grid mt-grid-3">
                <Section title="Identity">
                    <div className="mt-grid mt-grid-4">
                        <LabeledInput
                            label="Character Name"
                            id="characterName"
                            value={basicInfo.characterName}
                            onChange={handleBasicInfoChange("characterName")}
                        />
                        <LabeledInput
                            label="Player"
                            id="playerName"
                            value={basicInfo.playerName}
                            onChange={handleBasicInfoChange("playerName")}
                        />
                    </div>
                    <div className="mt-grid mt-grid-3">
                        <LabeledInput
                            label="Age"
                            id="age"
                            type="number"
                            value={basicInfo.age}
                            onChange={handleBasicInfoChange("age")}
                            disabled={true}
                        />
                        <LabeledInput
                            label="Discharge World"
                            id="discharge"
                            //value={basicInfo.discharge}
                            onChange={handleBasicInfoChange("discharge")}
                            disabled={true}
                        />
                        <LabeledInput
                            label="Career"
                            id="career"
                            value={basicInfo.career}
                            onChange={handleBasicInfoChange("career")}
                            disabled={true}
                        />
                        <LabeledInput
                            label="Rank"
                            id="rank"
                            value={basicInfo.rank}
                            onChange={handleBasicInfoChange("rank")}
                            disabled={true}
                        />
                    </div>
                </Section>
                <Section title="Homeworld">
                    <div className="mt-label homeworld">
                        <p>{characteristics.homeworld}</p>
                        <p>{characteristics.birthDesc[0]} size</p>
                        <p>{characteristics.birthDesc[1]} atmosphere</p>
                        <p>{characteristics.birthDesc[2]} world</p>
                        <p>{characteristics.birthDesc[3]} population</p>
                        <p>{characteristics.birthDesc[4]} law</p>
                        <p>{characteristics.birthDesc[5]} tech</p>

                    </div>
                </Section>
            </div>
            {/* CHARACTERISTICS */}
            <Section title="Characteristics">
                <div className="mt-grid mt-grid-7">
                    {["STR", "DEX", "END", "INT", "EDU", "SOC", "PSI"].map((key) => (
                        <div key={key} className="mt-char-block">
                            <label className="mt-label" htmlFor={`char-${key}`}>
                                {key}
                            </label>
                            {/*<input
                id={`char-${key}`}
                className="mt-input mt-input-center"
                type="number"
                min={0}
                max={15}
                value={characteristics[key]}
                onChange={handleCharacteristicChange(key)}
              />*/}
                            <div className="mt-char-hex">{toTravellerHex(characteristics[key])}</div>
                        </div>
                    ))}
                </div>
                <p className="mt-help-text">
                    UPP is calculated from STR, DEX, END, INT, EDU, SOC in Traveller
                    hex. PSI is tracked separately.
                </p>
            </Section>

            {/* SKILLS */}
            <Section title="Skills">
                <table className="mt-table">
                    <thead>
                        <tr>
                            <th>Skill</th>
                            <th>Specialization</th>
                            <th>Level</th>
                            <th style={{ width: "3rem" }} />
                        </tr>
                    </thead>
                    <tbody>
                        {skills.map((skill) => (
                            <tr key={skill.id}>
                                <td>
                                    <input
                                        className="mt-input"
                                        value={skill.name}
                                        onChange={handleSkillChange(skill.id, "name")}
                                        placeholder="e.g. Gun Combat"
                                    />
                                </td>
                                <td>
                                    <input
                                        className="mt-input"
                                        value={skill.specialization}
                                        onChange={handleSkillChange(skill.id, "specialization")}
                                        placeholder="e.g. Slug Rifle"
                                    />
                                </td>
                                <td>
                                    <input
                                        className="mt-input mt-input-center"
                                        type="number"
                                        value={skill.level}
                                        onChange={handleSkillChange(skill.id, "level")}
                                    />
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="mt-btn mt-btn-icon"
                                        onClick={() => removeSkill(skill.id)}
                                        aria-label="Remove skill"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" className="mt-btn mt-btn-secondary" onClick={addSkill}>
                    + Add Skill
                </button>
            </Section>

            {/* EQUIPMENT */}
            <Section title="Equipment & Gear">
                <table className="mt-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style={{ width: "6rem" }}>Qty</th>
                            <th>Notes</th>
                            <th style={{ width: "3rem" }} />
                        </tr>
                    </thead>
                    <tbody>
                        {equipment.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <input
                                        className="mt-input"
                                        value={item.name}
                                        onChange={handleEquipmentChange(item.id, "name")}
                                        placeholder="e.g. Cloth Armor"
                                    />
                                </td>
                                <td>
                                    <input
                                        className="mt-input mt-input-center"
                                        type="number"
                                        value={item.quantity}
                                        onChange={handleEquipmentChange(item.id, "quantity")}
                                        min={0}
                                    />
                                </td>
                                <td>
                                    <input
                                        className="mt-input"
                                        value={item.notes}
                                        onChange={handleEquipmentChange(item.id, "notes")}
                                        placeholder="Location, TL, etc."
                                    />
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="mt-btn mt-btn-icon"
                                        onClick={() => removeEquipment(item.id)}
                                        aria-label="Remove equipment row"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" className="mt-btn mt-btn-secondary" onClick={addEquipment}>
                    + Add Equipment
                </button>
            </Section>

            {/* SERVICE HISTORY */}
            <Section title="Service History / Terms">
                <table className="mt-table">
                    <thead>
                        <tr>
                            <th style={{ width: "4rem" }}>Term</th>
                            <th>Service</th>
                            <th>Assignment</th>
                            <th>Events / Decorations</th>
                            <th style={{ width: "3rem" }} />
                        </tr>
                    </thead>
                    <tbody>
                        {serviceHistory.map((entry) => (
                            <tr key={entry.id}>
                                <td>
                                    <input
                                        className="mt-input mt-input-center"
                                        type="number"
                                        value={entry.term}
                                        onChange={handleServiceChange(entry.id, "term")}
                                    />
                                </td>
                                <td>
                                    <input
                                        className="mt-input"
                                        value={entry.service}
                                        onChange={handleServiceChange(entry.id, "service")}
                                        placeholder="e.g. Army, Navy, Scouts"
                                    />
                                </td>
                                <td>
                                    <input
                                        className="mt-input"
                                        value={entry.assignment}
                                        onChange={handleServiceChange(entry.id, "assignment")}
                                        placeholder="e.g. Line, Support"
                                    />
                                </td>
                                <td>
                                    <input
                                        className="mt-input"
                                        value={entry.events}
                                        onChange={handleServiceChange(entry.id, "events")}
                                        placeholder="Notable events, decorations, mishaps..."
                                    />
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="mt-btn mt-btn-icon"
                                        onClick={() => removeServiceTerm(entry.id)}
                                        aria-label="Remove service term"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" className="mt-btn mt-btn-secondary" onClick={addServiceTerm}>
                    + Add Term
                </button>
            </Section>

            {/* NOTES */}
            <Section title="Biography">
                <textarea
                    className="mt-textarea"
                    value={characteristics.history}
                    readOnly={true}
                    placeholder="Background, contacts, enemies, ship shares, debt, etc."
                    rows={6}
                />
            </Section>
        </div>
    );
}
