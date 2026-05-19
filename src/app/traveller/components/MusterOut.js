"use client";

import React, { useMemo, useState } from "react";
import { datatables } from "../lib/data";
import { d6 } from "../lib/helpers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WEAPON_SKILL_TO_WEAPONS = {
    'Pistol': ['Body Pistol', 'Gauss Pistol', 'Pistol', 'Neural Pistol', 'Laser Pistol'],
    'Revolver': ['Revolver'],
    'Snub Pistol': ['Snub Pistol'],
    'Body Pistol': ['Body Pistol'],
    'Gauss Pistol': ['Gauss Pistol'],
    'Handguns': ['Body Pistol', 'Gauss Pistol', 'Pistol', 'Revolver', 'Snub Pistol', 'Neural Pistol', 'Laser Pistol'],
    'Rifleman': ['Advanced Combat Rifle', 'Assault Rifle', 'Carbine', 'Gauss Rifle', 'Laser Rifle', 'Neural Rifle', 'Rifle', 'Shotgun', 'Autoshotgun'],
    'Submachineguns': ['Submachinegun'],
    'Laser Weapons': ['Laser Pistol', 'Laser Rifle'],
    'Energy Weapons': ['Plasma Gun', 'Fusion Gun'],
    'Neural Weapons': ['Neural Pistol', 'Neural Rifle'],
    'Foil': ['Foil'],
    'Cudgel': ['Cudgel'],
    'Small Blade': ['Dagger', 'Blade', 'Bayonet'],
    'Large Blade': ['Broadsword', 'Halberd', 'Pike', 'Spear'],
    'Axe': ['Hand Axe', 'Battle Axe'],
    'Polearm': ['Halberd', 'Pike', 'Spear'],
    'Blade Combat': ['Axe', 'Blade', 'Bayonet', 'Broadsword', 'Cutlass', 'Cudgel', 'Dagger', 'Foil', 'Hand Axe', 'Battle Axe', 'Halberd', 'Pike', 'Spear', 'Sword'],
    'Grenade Launcher': ['Grenade Launcher'],
    'Light Assault Gun': ['Light Assault Gun'],
    'Machine Gun': ['Machine Gun', 'Autoshotgun'],
    'Autocannon': ['Autocannon'],
    'VRF Gauss Gun': ['VRF Gauss Gun'],
    'Heavy Weapons': ['Grenade Launcher', 'Light Assault Gun', 'Machine Gun', 'Autocannon', 'VRF Gauss Gun', 'Flamethrower'],
    'Bow': ['Bow', 'Crossbow'],
    'Blowgun': ['Blowgun'],
    'Bola': ['Bola'],
    'Boomerang': ['Boomerang'],
    'Sling': ['Sling'],
    'Early Firearms': ['Archaic Firearm'],
    'Archaic Weapons': ['Blowgun', 'Bola', 'Boomerang', 'Bow', 'Crossbow', 'Archaic Firearm', 'Sling'],
    'Brawling': ['Cudgel'],
    'Hand Combat': ['Cudgel'],
    'Turret Weapons': ['Pistol'],
    'Screens': ['Pistol'],
    'Spinal Weapons': ['Pistol'],
};

const STAT_LABEL = {
    STR: 'strength', DEX: 'dexterity', END: 'endurance',
    INT: 'intelligence', EDU: 'education', SOC: 'social standing',
};

function getEligibleWeapons(skills) {
    const eligible = new Set();
    for (const s of skills) {
        const weapons = WEAPON_SKILL_TO_WEAPONS[s.name];
        if (weapons) weapons.forEach(w => eligible.add(w));
    }
    if (eligible.size === 0) return datatables.Weapons ?? [];
    return [...eligible].sort();
}

export default function MusterOut({ characterData, setCharacterData, skills, setGear, setStep, handleHistoryAdd, characterName }) {
    const career = characterData.career.careername;
    const terms = characterData.career.terms;
    const rank = characterData.career.rank - 1;

    const musterData =
        datatables.Basics?.[career]?.muster
        ?? datatables.Army?.Muster?.[career]
        ?? (career === 'navy' ? datatables.Navy?.Muster : undefined)
        ?? {};
    const cashTable = musterData.cash ?? [];
    const benefitTable = musterData.benefits ?? [];

    const rollAdds =
        rank === 1 || rank === 2 ? 1 :
            rank === 3 || rank === 4 ? 2 :
                rank === 0 ? 0 : 3;
    const musterPenalty = characterData.career?.musterPenalty ?? 0;
    const initialRolls = Math.max(0, (2 * terms) + rollAdds + musterPenalty);
    const CASH_CAP = 3;

    const PENSION_CAREERS = ['navy', 'marines', 'army', 'scouts', 'flyer', 'sailor'];
    const pension = characterData.pension ?? 0;
    const isFull = terms >= 5;

    const hasGamblingSkill = useMemo(() => {
        return skills.some(s => String(s.name).toLowerCase() === "gambling" && s.level >= 1);
    }, [skills]);

    const hasProspectingSkill = useMemo(() => {
        return skills.some(s => String(s.name).toLowerCase() === "prospecting" && s.level >= 1);
    }, [skills]);

    const cashMod = (hasGamblingSkill || hasProspectingSkill) ? 1 : 0;
    const benefitMod = rank >= 4 ? 1 : 0;

    const [rollsRemaining, setRollsRemaining] = useState(initialRolls);
    const [cashRollsUsed, setCashRollsUsed] = useState(0);
    const [choice, setChoice] = useState("benefits");
    const [resultLog, setResultLog] = useState([]);
    const [cashTotal, setCashTotal] = useState(0);
    const [pendingWeapon, setPendingWeapon] = useState(false);
    const [weaponChoice, setWeaponChoice] = useState("");

    const canRollCash = cashRollsUsed < CASH_CAP;
    const canRoll = rollsRemaining > 0;
    const normalizedChoice = choice === "cash" ? "cash" : "benefits";
    const effectiveChoice = normalizedChoice === "cash" && !canRollCash ? "benefits" : normalizedChoice;

    const ships = ["Lab ship", "Seeker", "Corsair", "Safari ship", "Yacht"];
    const gear = ["Low passage", "Mid passage", "High passage", "Traveller Aid Membership", "Travellers Aid membership", "Forensics kit", "Medical instruments", "Letter of marque", "Watch"];

    const confirmWeapon = () => {
        if (!weaponChoice) return;
        setGear(prev => [...prev, weaponChoice]);
        setCharacterData(prev => ({ ...prev, gear: [...(prev.gear ?? []), weaponChoice] }));
        handleHistoryAdd?.(`${characterName} selected a ${weaponChoice} as part of their muster-out benefits.`);
        setPendingWeapon(false);
        setWeaponChoice("");
    };

    const rollOnTable = () => {
        if (!canRoll || pendingWeapon) return;
        if (normalizedChoice === "cash" && !canRollCash) return;

        const mod = normalizedChoice === "cash" ? cashMod : benefitMod;
        let roll = d6(1, mod);
        if (roll < 1) roll = 1;
        if (roll > 6) roll = 6;

        if (normalizedChoice === "cash") {
            const raw = cashTable[roll - 1];
            const amount = (Number(raw) || 0) * 1000;
            setCashTotal(prev => prev + amount);
            setCashRollsUsed(prev => prev + 1);
            setRollsRemaining(prev => prev - 1);
            setResultLog(prev => [...prev, { type: "cash", roll, mod, result: amount }]);
            setCharacterData(prev => ({ ...prev, cash: (prev.cash ?? 0) + amount }));
            return;
        }

        const benefit = benefitTable[roll - 1];
        setRollsRemaining(prev => prev - 1);
        setResultLog(prev => [...prev, { type: "benefit", roll, mod, result: benefit }]);

        // Stat benefits: STR, DEX, END, INT, EDU, SOC with optional +N / -N
        const statMatch = benefit?.match(/^(STR|DEX|END|INT|EDU|SOC)([+-]\d+)?$/);
        if (statMatch) {
            const stat = statMatch[1];
            const delta = statMatch[2] ? parseInt(statMatch[2], 10) : 1;
            setCharacterData(prev => ({ ...prev, [stat]: Math.max(1, (prev[stat] ?? 0) + delta) }));
            const direction = delta >= 0 ? 'improved' : 'decreased';
            handleHistoryAdd?.(`${characterName}'s ${STAT_LABEL[stat]} ${direction} as a result of their service.`);
            return;
        }

        if (benefit === "Weapon") {
            setPendingWeapon(true);
            return;
        }

        if (gear.includes(benefit)) {
            setGear(prev => [...prev, benefit]);
            setCharacterData(prev => ({ ...prev, gear: [...(prev.gear ?? []), benefit] }));
        } else if (ships.includes(benefit)) {
            setCharacterData(prev => ({ ...prev, ship: benefit, shipshares: (prev.shipshares ?? 0) + 1 }));
        } else if (benefit) {
            setGear(prev => [...prev, benefit]);
            setCharacterData(prev => ({ ...prev, gear: [...(prev.gear ?? []), benefit] }));
        }
    };

    return (
        <div className="space-y-3">
            <p className="text-lg font-semibold">{isFull ? "Retiring" : "Mustering Out"}</p>
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

            {pendingWeapon && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Choose a weapon you have a skill for:</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={weaponChoice} onValueChange={setWeaponChoice}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select weapon">
                                    {weaponChoice || undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {getEligibleWeapons(skills).map(w => (
                                    <SelectItem key={w} value={w}>{w}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" onClick={confirmWeapon} disabled={!weaponChoice}>
                            Confirm
                        </Button>
                    </div>
                </div>
            )}

            {rollsRemaining > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Choose a table:</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={effectiveChoice}
                            onValueChange={setChoice}
                            disabled={!canRoll || pendingWeapon}
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
                            disabled={!canRoll || pendingWeapon || (effectiveChoice === "cash" && !canRollCash)}
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
                                        <span className="font-semibold text-foreground">Cr{Number(r.result).toLocaleString()}</span>
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
    );
}
