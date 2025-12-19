import { useEffect, useRef, useState } from "react";
import { datatables } from "../lib/data";
import { careerCheckSimple } from "../lib/helpers";
import { d6 } from "../lib/helpers";

export default function BasicTerm({
    upp,
    setCharacterData,
    setStep,
    characterData,
    characterName,
    handleHistoryAdd,
    skills,
    setSkills,
}) {
    const [termStep, setTermStep] = useState("init");
    const [warning, setWarning] = useState("");

    function addSkill(newSkill) {
        setSkills(prev => {
            // Find if skill already exists
            const index = prev.findIndex(([name]) => name === newSkill);

            if (index === -1) {
                // No match → add as new skill at level 1
                return [...prev, [newSkill, 1]];
            }

            // Exists → increment level
            return prev.map((skill, i) =>
                i === index ? [skill[0], skill[1] + 1] : skill
            );
        });
    }
    const career = characterData.career.careername;
    const careerData = datatables.Basics[career];
    const skillTables = careerData.skills;

    const handleYear = (val) => {

        const termResults = {
            charSurvival: careerCheckSimple(careerData.survival, upp, characterName),
            charPosition: (careerData.position[0] !== 99) ? careerCheckSimple(careerData.position, upp, characterName) : [false, ""],
            charPromo: (careerData.promotion[0] !== 99) ? careerCheckSimple(careerData.promotion, upp, characterName) : [false, ""],
            charSpec: careerCheckSimple(careerData.specduty, upp, characterName),
            charReenlist: careerCheckSimple(careerData.reenlist, upp, characterName)
        }
        setWarning(`Survival: ${termResults.charSurvival[0]}`)
        console.log(termResults)
        if (!termResults.charSurvival) {

        }
    }
    const rookieSkills = () => {
        const skillData = datatables.rank[career].skills;
        let skillsGained = (skillData["E1"]) ? skillData["E1"] : [];
        if (career === "belter") {
            skillsGained = ['Vacc Suit'];
        }
        if (skillsGained.length !== 0) {
            setWarning(`Being a ${career} comes with experience in ${skillsGained.join(", ")}.`);
            handleHistoryAdd(`Starting a career as a ${career}, ${characterName} gained experience with ${skillsGained.join(" and ")}.`);
            for (let i = 0; i < skillsGained.length; i++) {
                addSkill(skillsGained[i])
            }
        }
    }
    const skillIncrease = function (skill) {
        const cascadeArray = Object.keys(datatables.Skills);
        const upps = ['STR', 'END', 'DEX', 'EDU', 'INT', 'SOC'];
        if (upps.includes(skill)) {
            const currentSkill = characterData[skill];
            setCharacterData((prev) => ({ ...prev, [skill]: currentSkill + 1 }));
            setWarning(prevWarning => `${prevWarning} ${skill} increased.`)
            return []
        }
        if (cascadeArray.includes(skill)) {
            const cascadeSkills = datatables.Skills[skill];
            setWarning(prevWarning => `${prevWarning} ${skill} is a cascade skill.`)
            //handle it as a normal skill for now
            return cascadeSkills
        }
        setWarning(prevWarning => `${prevWarning} ${skill} skilll gain.`)

        addSkill(skill)
        return [];
    }
    function SkillSelector({ }) {

        const [skillChoice, setSkillChoice] = useState("");
        const [skillChoice2, setSkillChoice2] = useState("");
        const skillOps = [
            { id: 0, name: "Select a skill category", value: "" },
            { id: 1, name: "Personal Development Skills", value: "personal" },
            { id: 2, name: "Service Skills", value: "service" },
            { id: 3, name: "Advanced Skills", value: "advanced" },
        ];
        if (characterData.EDU >= 8) {
            skillOps.push({ id: 4, name: "Advanced Education Skills", value: "education" })
        }
        const onSubmitSkill = (skillChoice1, skillChoice2) => {
            if (!skillChoice1 || (termStep === "init" && !skillChoice2)) {
                setWarning("Select skill categories before continuing.");
                return;
            }
            const roll1 = d6(1, 0);
            const skill1 = skillTables[skillChoice1][roll1];
            const isCascade = skillIncrease(skill1)

            if (isCascade.length > 0) {
                const cascadeOps = isCascade.map((skill, index) => {
                    return {
                        id: index,
                        name: skill,
                        value: skill
                    }
                })
                return (
                    <div>
                        <p>will this work?</p>
                        <div>
                            <select
                                style={{ marginBottom: "0.5rem" }}
                                className="mt-select mt-cap"
                                value={""}
                                onChange={(e) => setSkillChoice(e.target.value)}
                            >
                                <option value="">pick</option>
                                {cascadeOps.length !== 0 &&
                                    cascadeOps.map((op) => (
                                        <option key={op.id} value={op.value}>
                                            {op.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                )
            }
            if (termStep === "init") {
                const roll2 = d6(1, 0);
                const skill2 = skillTables[skillChoice2][roll2];
                const isCascade2 = skillIncrease(skill2)
            }
            //setTermStep("afterInit")
        }
        return (
            <div>
                <div>
                    <p>Personal Skills</p>
                    <ul className="mt-label">
                        {skillTables.personal.map((skill, index) => (
                            <li className="mt-cap" key={index}>{skill}</li>
                        ))}
                    </ul>
                    <p>Service Skills</p>
                    <ul className="mt-label">
                        {skillTables.service.map((skill, index) => (
                            <li className="mt-cap" key={index}>{skill}</li>
                        ))}
                    </ul>
                    <p>Advanced Skills</p>
                    <ul className="mt-label">
                        {skillTables.advanced.map((skill, index) => (
                            <li className="mt-cap" key={index}>{skill}</li>
                        ))}
                    </ul>
                    {characterData.EDU >= 8 ?
                        <div>
                            <p>Advanced Education Skills</p>
                            <ul className="mt-label">
                                {skillTables.education.map((skill, index) => (
                                    <li className="mt-cap" key={index}>{skill}</li>
                                ))}
                            </ul>
                        </div> : null}
                </div>
                <div>
                    <div>
                        <select
                            style={{ marginBottom: "0.5rem" }}
                            className="mt-select mt-cap"
                            value={skillChoice}
                            onChange={(e) => setSkillChoice(e.target.value)}
                        >
                            {skillOps.length !== 0 &&
                                skillOps.map((op) => (
                                    <option key={op.id} value={op.value}>
                                        {op.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <select
                            style={{ marginBottom: "0.5rem" }}
                            className="mt-select mt-cap"
                            value={skillChoice2}
                            onChange={(e) => setSkillChoice2(e.target.value)}
                        >
                            {skillOps.length !== 0 &&
                                skillOps.map((op) => (
                                    <option key={op.id} value={op.value}>
                                        {op.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <button
                        className="mt-btn"
                        type="button"
                        disabled={!skillChoice || (termStep === "init" && !skillChoice2)}
                        onClick={() => onSubmitSkill(skillChoice, skillChoice2)}
                    >
                        Continue
                    </button>
                </div>
            </div>
        )
    }

    const didInit = useRef(false)
    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;

        setWarning("");
        rookieSkills()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <div>
            <h2>Career Term {characterData.career.terms + 1}</h2>
            <h3>Step {termStep}</h3>
            {termStep === "init" ?
                <div>
                    <p className="mt-label" style={{ marginBottom: "0.5rem" }}>
                        Begining your career as a {characterData.career.careername}.  You may select 2 skills for your initial training and experience.  Select the skill category and a skill will be randomly assigned from the list.
                    </p>
                </div> : null}
            {warning !== "" ?
                <p className="mt-label" style={{ marginBottom: "0.5rem", color: "red" }}>{warning}</p>
                : null
            }
            {/* <button className="mt-btn" onClick={handleYear}>Continue</button> */}
            {termStep === "init" ?
                <div>
                    <SkillSelector />
                </div> : null}
        </div>
    )
}
