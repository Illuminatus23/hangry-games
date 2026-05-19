"use client";

import React, { useMemo, useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill } from "../lib/helpers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MusterOut({ characterData, setCharacterData, skills, setSkills, setGear, setStep }) {
    const career = characterData.career.careername
    const terms = characterData.career.terms;
    const rank = characterData.career.rank - 1;

    const musterData = datatables.Basics?.[career]?.muster ?? datatables.Army?.Muster?.[career] ?? {};
    const cashTable = musterData.cash ?? [];
    const benefitTable = musterData.benefits ?? [];
    const rollAdds =
        rank === 1 || rank === 2 ? 1 :
            rank === 3 || rank === 4 ? 2 :
                rank === 0 ? 0 : 3;
    const musterPenalty = characterData.career?.musterPenalty ?? 0;
    const initialRolls = Math.max(0, (2 * terms) + rollAdds + musterPenalty);
    // Cash can be used at most 3 times total
    const CASH_CAP = 3;

    const PENSION_CAREERS = ['navy', 'marines', 'army', 'scouts', 'flyer', 'sailor'];
    const pension = characterData.pension ?? 0;

    // Mods
    const hasGamblingSkill = useMemo(() => {
        return skills.some(s => String(s.name).toLowerCase() === "gambling" && s.level >= 1);
    }, [skills]);

    const hasProspectingSkill = useMemo(() => {
        return skills.some(s => String(s.name).toLowerCase() === "prospecting" && s.level >= 1);
    }, [skills]);

    const cashMod = (hasGamblingSkill || hasProspectingSkill) ? 1 : 0;
    const benefitMod = rank >= 4 ? 1 : 0;

    // State
    const [rollsRemaining, setRollsRemaining] = useState(initialRolls);
    const [cashRollsUsed, setCashRollsUsed] = useState(0);
    const [choice, setChoice] = useState("benefits"); // "cash" | "benefits"
    const [resultLog, setResultLog] = useState([]);   // history of rolls shown to user
    const [cashTotal, setCashTotal] = useState(0);


    const canRollCash = cashRollsUsed < CASH_CAP;
    const canRoll = rollsRemaining > 0;

    const normalizedChoice = choice === "cash" ? "cash" : "benefits";

    const rollOnTable = () => {
        const ships = ["Lab ship", "Seeker", "Corsair", "Safari ship", "Yacht"];
        const gear = ["Low passage", "Mid passage", "High passage", "Traveller Aid Membership", "Forensics kit", "Medical instruments", "Letter of marque", "Watch"]

        //Weapn, SOC-1, EDU+2, Watch
        if (!canRoll) return;

        if (normalizedChoice === "cash" && !canRollCash) {
            // Hard block: can’t exceed 3 cash rolls
            return;
        }

        // Roll 1d6 with mod; clamp between 1..6 (safe even if your d6 already clamps)
        const mod = normalizedChoice === "cash" ? cashMod : benefitMod;
        let roll = d6(1, mod);
        if (roll < 1) roll = 1;
        if (roll > 6) roll = 6;

        if (normalizedChoice === "cash") {
            // cash table is stored as "x" meaning x * 1000 in your UI
            const raw = cashTable[roll - 1]; // table display is 1..6, arrays are 0..5
            const amount = (Number(raw) || 0) * 1000;

            setCashTotal(prev => prev + amount);
            setCashRollsUsed(prev => prev + 1);
            setRollsRemaining(prev => prev - 1);

            setResultLog(prev => [
                ...prev,
                { type: "cash", roll, mod, result: amount },
            ]);

            setCharacterData(prev => ({ ...prev, cash: (prev.cash ?? 0) + amount }));

            return;
        }

        // benefits
        const benefit = benefitTable[roll - 1];
        setGear(prev => [
            ...prev,
            benefit,
        ]);
        setRollsRemaining(prev => prev - 1);
        setResultLog(prev => [
            ...prev,
            { type: "benefit", roll, mod, result: benefit },
        ]);

        if (gear.includes(benefit)) {
            setCharacterData(prev => ({ ...prev, gear: [...(prev.gear ?? []), benefit] }));
        } else if (ships.includes(benefit)) {
            setCharacterData(prev => ({ ...prev, ship: benefit, shipshares: (prev.shipshares ?? 0) + 1 }));
        } else if (benefit === "EDU+2") {
            applySkill(setSkills, setCharacterData, "EDU");
            applySkill(setSkills, setCharacterData, "EDU");
        } else if (benefit === "SOC-1") {
            setCharacterData(prev => ({ ...prev, SOC: (prev.SOC ?? 0) - 1 }));
        } else if (benefit) {
            applySkill(setSkills, setCharacterData, benefit);
        }
    };

    const effectiveChoice =
        normalizedChoice === "cash" && !canRollCash ? "benefits" : normalizedChoice;

    return (
        <div className="space-y-3">
            <p className="text-lg font-semibold">Mustering out</p>
            <p className="text-xs text-muted-foreground">
                You get <span className="font-semibold text-foreground">{rollsRemaining}</span> roll(s) remaining on the retirement tables.
                Cash can be used at most <span className="font-semibold text-foreground">{CASH_CAP}</span> time(s) total.
                {cashMod ? " You have +1 to Cash rolls (Gambling-1+ or Prospecting-1+)." : ""}
                {benefitMod ? " You have +1 to Benefit rolls (rank 5+)." : ""}
            </p>
            {pension > 0 && (
                <p className="text-xs text-muted-foreground">
                    Retirement pension: <span className="font-semibold text-foreground">Cr{pension.toLocaleString()}/year</span>
                    {PENSION_CAREERS.includes(career) ? "" : " (career not pension-eligible)"}
                </p>
            )}
            {rollsRemaining > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Choose a table:</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={effectiveChoice}
                            onValueChange={setChoice}
                            disabled={!canRoll}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select">
                                    {effectiveChoice === "benefits" ? "Benefits"
                                        : effectiveChoice === "cash" ? (canRollCash ? "Cash" : "Cash (maxed out)")
                                        : undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="benefits">Benefits</SelectItem>
                                <SelectItem value="cash" disabled={!canRollCash}>
                                    Cash {canRollCash ? "" : "(maxed out)"}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            onClick={rollOnTable}
                            disabled={!canRoll || (effectiveChoice === "cash" && !canRollCash)}
                        >
                            Roll
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Cash rolls used: {cashRollsUsed}/{CASH_CAP} &nbsp;|&nbsp; Cash total:{" "}
                        <span className="font-semibold text-foreground">{cashTotal.toLocaleString()}</span>
                    </p>
                </div>
            ) : (
                <Button type="button" onClick={() => setStep?.("complete")}>
                    Complete Character
                </Button>
            )}
            {resultLog.length > 0 && (
                <div className="mt-4 space-y-1">
                    <h3 className="text-sm font-semibold">Results</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                        {resultLog.map((r, i) => (
                            <li key={i}>
                                {r.type === "cash" ? (
                                    <>
                                        Cash roll {r.roll} (mod {r.mod >= 0 ? `+${r.mod}` : r.mod}):{" "}
                                        <span className="font-semibold text-foreground">{Number(r.result).toLocaleString()}</span>
                                    </>
                                ) : (
                                    <>
                                        Benefit roll {r.roll} (mod {r.mod >= 0 ? `+${r.mod}` : r.mod}):{" "}
                                        <span className="capitalize font-semibold text-foreground">{String(r.result)}</span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {rollsRemaining > 0 && (
                <div className="mt-5 space-y-2">
                    <h3 className="text-sm font-semibold">Tables</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-2">Benefit table</p>
                    {benefitTable.map((benefit, inx) => (
                        <p className="text-xs text-muted-foreground" key={`b-${inx}`}>
                            {inx + 1} — {benefit}
                        </p>
                    ))}
                    <p className="text-xs text-muted-foreground font-medium mt-3">Cash table</p>
                    {cashTable.map((amt, inx) => (
                        <p className="text-xs text-muted-foreground" key={`c-${inx}`}>
                            {inx + 1} — {(Number(amt) || 0) * 1000}
                        </p>
                    ))}
                </div>
            )}
        </div>
    )
}