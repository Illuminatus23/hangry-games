"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { datatables } from "../lib/data";

export default function MusterOut({ career, terms, rank, skills, setSkills }) {
    const pay = datatables.Basics[career].muster.cash;
    const items = datatables.Basics[career].muster.benefits;
    const rollAdds = (rank === 1 || rank === 2) ? 1 : (rank === 3 || rank === 4) ? 2 : (rank === 0) ? 0 : 3;
    const [rolls, setRolls] = useState((2 * terms) + rollAdds);

    const modifier = ();
    function addSkill(newSkill) {

        if (['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'].includes(newSkill)) {
            const currentVal = characterData[newSkill]
            setCharacterData((prev) => ({ ...prev, [newSkill]: currentVal + 1 }));
        } else {
            setSkills(prev => {
                // Find if skill already exists
                const index = prev.findIndex(([name]) => name === newSkill);

                if (index === -1) {
                    if (termStep === "init" && newSkill === "Vacc Suit") {
                        return [...prev, [newSkill, 0]];
                    }
                    // No match → add as new skill at level 1
                    return [...prev, [newSkill, 1]];
                }

                // Exists → increment level

                return prev.map((skill, i) =>
                    i === index ? [skill[0], skill[1] + 1] : skill
                );
            });
        }
    }
    return (
        <div>
            <p>Mustering out</p>
            <p className="mt-label">You get ${rolls} on the cash and benefit retirement tables</p>
        </div>
    )
}