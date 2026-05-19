"use client";
import { useState } from "react";
import { datatables } from "./data";

export function useCascade(normalize) {
    const [pendingCascade, setPendingCascade] = useState(null);
    const [cascadeChoice, setCascadeChoice] = useState("");

    const triggerCascade = (parentSkill, options, onConfirm) => {
        setPendingCascade({ parentSkill, options, onConfirm });
        setCascadeChoice("");
    };

    const handleCascadeConfirm = () => {
        if (!cascadeChoice || !pendingCascade) return;
        const callback = pendingCascade.onConfirm;
        const nestedRaw = datatables.Skills?.[cascadeChoice];
        if (Array.isArray(nestedRaw) && nestedRaw.length > 0) {
            setPendingCascade({
                parentSkill: cascadeChoice,
                options: nestedRaw.map(s => normalize(s)),
                onConfirm: callback,
            });
            setCascadeChoice("");
        } else {
            setPendingCascade(null);
            setCascadeChoice("");
            callback(cascadeChoice);
        }
    };

    return { pendingCascade, cascadeChoice, setCascadeChoice, triggerCascade, handleCascadeConfirm };
}
