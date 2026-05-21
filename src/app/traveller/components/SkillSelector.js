"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { datatables } from "../lib/data";
import { d6 } from "../lib/helpers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SkillSelector({
    skillTables,
    characterData,
    setWarning,
    skillIncrease,
    onResolved,
    presetSkill,
}) {
    const [category, setCategory] = useState("");
    const [pendingSkill, setPendingSkill] = useState("");
    const [cascadeOptions, setCascadeOptions] = useState([]);
    const [cascadeChoice, setCascadeChoice] = useState("");
    const [isCascadeOpen, setIsCascadeOpen] = useState(false);
    const [resolvedSkill, setResolvedSkill] = useState("");
    const didPreset = useRef(false);

    const isCascadeSkill = (skill) =>
        Object.prototype.hasOwnProperty.call(datatables.Skills, skill);

    const skillOps = useMemo(() => {
        const standardKeys = new Set(['personal', 'service', 'advanced', 'education']);
        const keys = Object.keys(skillTables ?? {});
        // Named tables (e.g. merchants) — show the table names directly
        if (keys.length > 0 && keys.some(k => !standardKeys.has(k))) {
            return keys.map((name, i) => ({ id: i + 1, name, value: name }));
        }
        // Standard generic format
        const ops = [
            { id: 1, name: "Personal Development Skills", value: "personal" },
            { id: 2, name: "Service Skills", value: "service" },
            { id: 3, name: "Advanced Skills", value: "advanced" },
        ];
        if (characterData.EDU >= 8) {
            ops.push({ id: 4, name: "Advanced Education Skills", value: "education" });
        }
        return ops;
    }, [characterData.EDU, skillTables]);

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

        skillIncrease(presetSkill);
        setResolvedSkill(presetSkill);
        setWarning?.(`Gained ${presetSkill}.`);
        onResolved?.(presetSkill);
    }, [presetSkill, skillIncrease, onResolved, setWarning]);

    const onSubmitCategory = () => {
        if (!category) {
            setWarning?.("Select a skill category before continuing.");
            return;
        }

        const list = skillTables?.[category] ?? [];
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

        const nestedOpts = datatables.Skills?.[cascadeChoice];
        if (Array.isArray(nestedOpts) && nestedOpts.length > 0) {
            // Chosen option is itself a cascade — drill in, keep dialog open
            setPendingSkill(cascadeChoice);
            setCascadeOptions(nestedOpts);
            setCascadeChoice("");
            setWarning?.(`${cascadeChoice} is a cascade skill. Choose a specialization.`);
            return;
        }

        skillIncrease(cascadeChoice);
        setResolvedSkill(cascadeChoice);
        setWarning?.(`Gained ${cascadeChoice} (from ${pendingSkill}).`);
        onResolved?.(cascadeChoice);

        setIsCascadeOpen(false);
        setCascadeOptions([]);
        setCascadeChoice("");
        setPendingSkill("");
        setCategory("");
    };

    if (resolvedSkill) {
        return (
            <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                    Selected skill: <span className="capitalize font-medium">{resolvedSkill}</span>
                </p>
            </div>
        );
    }

    const showCategoryUI = !presetSkill;

    return (
        <div className="mt-3 space-y-2">
            {showCategoryUI && (
                <>
                    <Select value={category} onValueChange={setCategory} disabled={isCascadeOpen}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select a skill category">
                                {skillOps.find(op => op.value === category)?.name}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {skillOps.map((op) => (
                                <SelectItem key={op.id} value={op.value}>
                                    {op.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="button" onClick={onSubmitCategory} disabled={isCascadeOpen || !category}>
                        Submit Category
                    </Button>
                </>
            )}

            <Dialog open={isCascadeOpen} onOpenChange={() => {}}>
                <DialogContent
                    className="max-w-md"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Cascade Skill</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground bg-muted border-l-4 border-primary px-3 py-2 rounded-md">
                            You rolled a cascade skill — choose a specialization:{" "}
                            <span className="capitalize font-medium text-foreground">{pendingSkill}</span>
                        </p>
                        <Select value={cascadeChoice} onValueChange={setCascadeChoice}>
                            <SelectTrigger className="capitalize">
                                <SelectValue placeholder="--Select--">
                                    {cascadeChoice || undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {cascadeOptions.map((s, i) => (
                                    <SelectItem key={i} value={s} className="capitalize">{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button onClick={onConfirmCascade} disabled={!cascadeChoice}>
                            Confirm Skill
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
