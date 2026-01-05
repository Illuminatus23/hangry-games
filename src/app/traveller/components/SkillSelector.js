"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactModal from "react-modal";
import { datatables } from "../lib/data";
import { d6 } from "../lib/helpers";

// Avoid react-modal warning (Next.js-safe)
if (typeof window !== "undefined") {
    ReactModal.setAppElement("body");
}

const modalStyles = {
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
    },
    content: {
        maxWidth: "420px",
        margin: "auto",
        inset: "50% auto auto 50%",
        transform: "translate(-50%, -50%)",
        padding: "1.25rem 1.5rem",
        borderRadius: "10px",
        border: "1px solid #444",
        background: "#f6f6f6",
        color: "#111",
        boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
    },
};

export default function SkillSelector({
    skillTables,          // object: { personal: [...], service: [...], ... }
    characterData,        // needed for EDU>=8 gating
    setWarning,           // (msg:string)=>void
    skillIncrease,        // (finalSkill:string)=>void   <-- APPLY FINAL SKILL ONLY
    onResolved,           // (finalSkill:string)=>void   <-- tells parent “this pick is done”
    presetSkill,          // optional string: when set, skip dropdown and resolve this skill
}) {
    const [category, setCategory] = useState("");

    // cascade modal state
    const [pendingSkill, setPendingSkill] = useState("");
    const [cascadeOptions, setCascadeOptions] = useState([]);
    const [cascadeChoice, setCascadeChoice] = useState("");
    const [isCascadeOpen, setIsCascadeOpen] = useState(false);

    // once resolved, hide dropdown + button and show result
    const [resolvedSkill, setResolvedSkill] = useState("");

    // StrictMode guard so preset doesn’t run twice in dev
    const didPreset = useRef(false);

    const isCascadeSkill = (skill) =>
        Object.prototype.hasOwnProperty.call(datatables.Skills, skill);

    const skillOps = useMemo(() => {
        const ops = [
            { id: 0, name: "Select a skill category", value: "" },
            { id: 1, name: "Personal Development Skills", value: "personal" },
            { id: 2, name: "Service Skills", value: "service" },
            { id: 3, name: "Advanced Skills", value: "advanced" },
        ];
        if (characterData.EDU >= 8) {
            ops.push({ id: 4, name: "Advanced Education Skills", value: "education" });
        }
        return ops;
    }, [characterData.EDU]);

    // ---------- PRESET MODE (rookie skill resolution) ----------
    useEffect(() => {
        if (!presetSkill) return;
        if (didPreset.current) return;
        didPreset.current = true;

        setPendingSkill(presetSkill);

        if (isCascadeSkill(presetSkill)) {
            const opts = datatables.Skills[presetSkill] ?? [];
            setCascadeOptions(opts);
            setCascadeChoice("");
            setIsCascadeOpen(true);
            setWarning?.(`${presetSkill} is a cascade skill. Choose a specialization.`);
            return;
        }

        // Not cascade: resolve immediately
        skillIncrease(presetSkill);
        setResolvedSkill(presetSkill);
        setWarning?.(`Gained ${presetSkill}.`);
        onResolved?.(presetSkill);
    }, [presetSkill, skillIncrease, onResolved, setWarning]);

    // ---------- CATEGORY MODE ----------
    const onSubmitCategory = () => {
        if (!category) {
            setWarning?.("Select a skill category before continuing.");
            return;
        }

        const list = skillTables?.[category] ?? [];

        // You said d6 is fine + validation handled elsewhere
        const roll = d6(1, 0);
        const rolled = list[roll];

        if (!rolled) {
            setWarning?.("No skill found for that roll/category.");
            return;
        }

        setPendingSkill(rolled);

        if (isCascadeSkill(rolled)) {
            const opts = datatables.Skills[rolled] ?? [];
            setCascadeOptions(opts);
            setCascadeChoice("");
            setIsCascadeOpen(true);
            setWarning?.(`${rolled} is a cascade skill. Choose a specialization.`);
            return;
        }

        // Not cascade: resolve
        skillIncrease(rolled);
        setResolvedSkill(rolled);
        setWarning?.(`Gained ${rolled}.`);
        onResolved?.(rolled);
        setCategory("");
    };

    const onConfirmCascade = () => {
        if (!cascadeChoice) {
            setWarning?.("Select a cascade specialization.");
            return;
        }

        // Apply the user’s final selection
        skillIncrease(cascadeChoice);
        setResolvedSkill(cascadeChoice);
        setWarning?.(`Gained ${cascadeChoice} (from ${pendingSkill}).`);
        onResolved?.(cascadeChoice);

        // reset modal state
        setIsCascadeOpen(false);
        setCascadeOptions([]);
        setCascadeChoice("");
        setPendingSkill("");
        setCategory("");
    };

    // If resolved, hide inputs and show result
    if (resolvedSkill) {
        return (
            <div style={{ marginTop: "0.75rem" }}>
                <p className="mt-label">
                    Selected skill: <span className="mt-cap">{resolvedSkill}</span>
                </p>
            </div>
        );
    }

    const showCategoryUI = !presetSkill;

    return (
        <div style={{ marginTop: "0.75rem" }}>
            {showCategoryUI && (
                <>
                    <select
                        style={{ marginBottom: "0.5rem" }}
                        className="mt-select mt-cap"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isCascadeOpen}
                    >
                        {skillOps.map((op) => (
                            <option key={op.id} value={op.value}>
                                {op.name}
                            </option>
                        ))}
                    </select>
                    &nbsp;
                    <button
                        className="mt-btn"
                        type="button"
                        onClick={onSubmitCategory}
                        disabled={isCascadeOpen}
                    >
                        Submit Category
                    </button>
                </>
            )}

            <ReactModal
                isOpen={isCascadeOpen}
                style={modalStyles}
                shouldCloseOnOverlayClick={false}
                shouldCloseOnEsc={false}
                contentLabel="Cascade Skill Choice"
            >
                <div className="mt-modal">
                    <h3 className="mt-modal-title">Cascade Skill</h3>

                    <p className="mt-label mt-rolled-skill">
                        You gained a cascade skill. Make a selection: <span className="mt-cap">{pendingSkill}</span>
                    </p>

                    <p className="mt-label">Choose a specialization:</p>

                    <select
                        style={{ marginBottom: "0.5rem" }}
                        className="mt-select mt-cap"
                        value={cascadeChoice}
                        onChange={(e) => setCascadeChoice(e.target.value)}
                    >
                        <option value="">--Select--</option>
                        {cascadeOptions.map((s, i) => (
                            <option key={i} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                    <div className="mt-modal-actions">
                        <button
                            className="mt-btn"
                            type="button"
                            onClick={onConfirmCascade}
                            disabled={!cascadeChoice}
                        >
                            Confirm Skill
                        </button>
                    </div>
                </div>
            </ReactModal>
        </div>
    );
}
