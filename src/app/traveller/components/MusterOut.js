"use client";

import React, { useMemo, useState } from "react";
import { datatables } from "../lib/data";
import { d6, applySkill } from "../lib/helpers";

export default function MusterOut({ characterData, setCharacterData, skills, setSkills, setGear }) {
    const career = characterData.career.careername
    const terms = characterData.career.terms;
    const rank = characterData.career.rank - 1;

    const cashTable = datatables.Basics?.[career]?.muster?.cash ?? [];
    const benefitTable = datatables.Basics?.[career]?.muster?.benefits ?? [];
    const rollAdds =
        rank === 1 || rank === 2 ? 1 :
            rank === 3 || rank === 4 ? 2 :
                rank === 0 ? 0 : 3;
    //testing
    const initialRolls = (6 * terms) + rollAdds;
    // Cash can be used at most 3 times total
    const CASH_CAP = 3;

    // Mods
    const hasCashSkill = useMemo(() => {
        return skills.some(s => {
            const n = String(s.name).toLowerCase();
            return n === "gambling" || n === "prospecting";
        });
    }, [skills]);

    const cashMod = hasCashSkill ? 1 : 0;
    const benefitMod = terms >= 5 ? 1 : 0;

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
        const gear = ["Low passage", "Mid passage", "High passage", "Traveller Aid Membership", "Forensics kit", "Medical instruments", "Letter of marque"]

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
        <div>
            <p>Mustering out</p>
            <p className="mt-label">
                You get <b>{rollsRemaining}</b> roll(s) remaining on the retirement tables.
                Cash can be used at most <b>{CASH_CAP}</b> time(s) total.
                {cashMod ? " You have +1 to Cash rolls (Gambling/Prospecting)." : ""}
                {benefitMod ? " You have +1 to Benefit rolls (5+ terms)." : ""}
            </p>
            {rollsRemaining > 0 ?
                <div style={{ margin: "0.75rem 0" }}>
                    <div className="mt-label" style={{ marginBottom: "0.35rem" }}>
                        Choose a table:
                    </div>
                    <select
                        className="mt-select mt-cap"
                        value={effectiveChoice}
                        onChange={(e) => setChoice(e.target.value)}
                        disabled={!canRoll}
                        style={{ marginBottom: "0.5rem" }}
                    >
                        <option value="">Select</option>
                        <option value="benefits">Benefits</option>
                        <option value="cash" disabled={!canRollCash}>
                            Cash {canRollCash ? "" : "(maxed out)"}
                        </option>
                    </select>&nbsp;
                    <button
                        className="mt-btn"
                        type="button"
                        onClick={rollOnTable}
                        disabled={!canRoll || (effectiveChoice === "cash" && !canRollCash)}
                    >
                        Roll
                    </button>

                    <div className="mt-label" style={{ marginTop: "0.5rem" }}>
                        Cash rolls used: {cashRollsUsed}/{CASH_CAP} &nbsp;|&nbsp; Cash total:{" "}
                        <b>{cashTotal.toLocaleString()}</b>
                    </div>
                </div>
                :
                <button
                    className="mt-btn"
                    type="button"

                >
                    Complete Character
                </button>
            }
            {resultLog.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                    <h3 className="mt-section-title">Results</h3>
                    <ul className="mt-label">
                        {resultLog.map((r, i) => (
                            <li key={i}>
                                {r.type === "cash" ? (
                                    <>
                                        Cash roll {r.roll} (mod {r.mod >= 0 ? `+${r.mod}` : r.mod}):{" "}
                                        <b>{Number(r.result).toLocaleString()}</b>
                                    </>
                                ) : (
                                    <>
                                        Benefit roll {r.roll} (mod {r.mod >= 0 ? `+${r.mod}` : r.mod}):{" "}
                                        <b className="mt-cap">{String(r.result)}</b>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {rollsRemaining > 0 &&
                <div style={{ marginTop: "1.25rem" }}>
                    <h3 className="mt-section-title">Tables</h3>

                    <p className="mt-label" style={{ marginTop: "0.5rem" }}>Benefit table</p>
                    {benefitTable.map((benefit, inx) => (
                        <p className="mt-label" key={`b-${inx}`}>
                            {inx + 1} - {benefit}
                        </p>
                    ))}

                    <p className="mt-label" style={{ marginTop: "0.75rem" }}>Cash table</p>
                    {cashTable.map((amt, inx) => (
                        <p className="mt-label" key={`c-${inx}`}>
                            {inx + 1} - {(Number(amt) || 0) * 1000}
                        </p>
                    ))}
                </div>
            }
        </div>
    )
}