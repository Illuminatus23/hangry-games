import { datatables } from "./data";
import { generateBirthText } from "./historyText";

export function d6(die, mod = 0) {
    let total = mod;
    for (; die > 0; die--) {
        const roll = Math.floor((Math.random() * 6) + 1);
        total = total + roll;
    }
    return total;
}
export function diceCheck(targetValue, mod = 0) {
    const roll = d6(2, mod);
    return (roll >= targetValue)
}
export function toTravellerHex(value) {
    const n = Number.isNaN(Number(value)) ? 0 : Number(value);
    const clamped = Math.max(0, Math.min(15, n));
    const digits = "0123456789ABCDEF";
    return digits[clamped];
}
function convertUPPtoObject(uppArray) {
    return {
        STR: fromTravellerHex(uppArray[0]),
        DEX: fromTravellerHex(uppArray[1]),
        END: fromTravellerHex(uppArray[2]),
        INT: fromTravellerHex(uppArray[3]),
        EDU: fromTravellerHex(uppArray[4]),
        SOC: fromTravellerHex(uppArray[5]),
    };
}
export function fromTravellerHex(value) {
    let num = 0;
    const hex = {
        A: 10,
        B: 11,
        C: 12,
        D: 13,
        E: 14,
        F: 15,
    }
    if (!Number.isNaN(Number(value))) {
        num = Number(value)
    } else {
        num = hex[value];
    }
    return num;
}
export function convertUPPtoArray(upp) {
    const uppArray = [];
    for (const value of upp) {
        uppArray.push(fromTravellerHex(value))
    }
    return uppArray;
}
export function generateUPP() {

    const rolls = [d6(2, 0), d6(2, 0), d6(2, 0), d6(2, 0), d6(2, 0), d6(2, 0),]

    return {
        STR: rolls[0],
        DEX: rolls[1],
        END: rolls[2],
        INT: rolls[3],
        EDU: rolls[4],
        SOC: rolls[5],
        PSI: 0,
    };
}
export function growUp(upp, characterName) {
    const birthworld = generateWorld();
    const rolls = convertUPPtoArray(upp);
    const homeworldName = generateSystemName();
    const techLevel = fromTravellerHex(birthworld.tech)
    const skills = getBaseSkills(techLevel)
    const historyBirth = generateBirthText(rolls, birthworld, characterName, homeworldName, skills);

    return {
        character: {
            homeworldString: `${homeworldName} (${birthworld.uwp}-${birthworld.starport} ${birthworld.bases})`,
            homeworld: birthworld,
            history: historyBirth,
            age: 18,
        },
        skills: skills,

    }
}
function getBaseSkills(tech) {
    const skills = [];
    if (tech > 2) skills.push({ name: "Gun Combat", level: 0 });
    if (tech > 4 && tech < 9) skills.push({ name: "Wheeled Vehicle", level: 0 });
    if (tech > 6) skills.push({ name: "Computer", level: 0 });
    if (tech > 8) skills.push({ name: "Grav Vehicle", level: 0 });
    return skills;
}
export function generateWorld() {
    const starportRoll = d6(2, 0);
    const subStarportRoll = d6(1, 0);
    const starPortResults = ['', '', 'A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'SUB'],
        subStarPortResults = ['', 'D', 'D', 'D', 'E', 'E', 'X'],
        techDMValues = { 'A': 6, 'B': 4, 'C': 2, 'D': 0, 'X': -4 },
        starBase = (starPortResults[starportRoll] === 'SUB') ? subStarPortResults[subStarportRoll] : starPortResults[starportRoll],
        navyBaseRoll = (starportRoll >= 10) ? 0 : d6(2, 0),
        navyBaseResults = (navyBaseRoll >= 8) ? 'N' : '',
        scoutBaseRoll = (starBase === "E" || starBase === "X") ? 0 : d6(2, 0),
        scoutBaseResults = (scoutBaseRoll >= 7) ? 'S' : '',
        gasGiantRoll = d6(2, 0),
        gasGiantResults = (gasGiantRoll <= 7) ? 'G' : '',
        bases = navyBaseResults + scoutBaseResults + gasGiantResults;

    let uwp = "", population = d6(2, -2), techlevel = "";
    const size = d6(2, -2),
        atmosphereMod = size - 7,
        atmosphere = (size == 0) ? 0 : d6(2, atmosphereMod),
        hydroMod = atmosphere - 7,
        govtMod = population - 7,
        governmentRoll = (population == 0) ? 0 : d6(2, govtMod),
        government = (governmentRoll < 0) ? 0 : governmentRoll,
        lawMod = government - 7,
        lawRoll = (government == 0) ? 0 : d6(2, lawMod),
        lawlevel = (lawRoll < 0) ? 0 : lawRoll;

    let hydrosphere = (size <= 1) ? 0 : d6(2, hydroMod),
        techDM = techDMValues[starBase]; //Adjusted for new starport method


    if (atmosphere <= 1 || atmosphere >= 11) {
        hydrosphere = hydrosphere - 4;

    }
    hydrosphere = (hydrosphere < 0) ? 0 : hydrosphere;
    hydrosphere = (hydrosphere > 10) ? 10 : hydrosphere;

    //techDM modifiers
    if (size <= 4) { techDM++; }
    if (size <= 1) { techDM++; }
    if (atmosphere <= 3 || atmosphere >= 11) { techDM++; }
    if (hydrosphere >= 9) { techDM++; }
    if (hydrosphere == 10) { techDM++; }
    if (population == 0) { population = 1; } //for a character to live there, must have a pop
    if (population > 0 && population < 6) { techDM++; }
    if (population == 9) { techDM = techDM + 2; }
    if (population == 10) { techDM = techDM + 4; }
    if (government == 0 || government == 5) { techDM++; }
    if (government == 13) { techDM = techDM - 2; }

    techlevel = d6(1, techDM);
    techlevel = (techlevel > 15) ? 15 : techlevel;
    techlevel = (techlevel < 0) ? 0 : techlevel;

    uwp = `${toTravellerHex(size)}${toTravellerHex(atmosphere)}${toTravellerHex(hydrosphere)}${toTravellerHex(population)}${toTravellerHex(lawlevel)}${toTravellerHex(techlevel)}`;
    const uwpDescriptors = [
        datatables.planetDescriptors.size[size],
        datatables.planetDescriptors.atmos[atmosphere],
        datatables.planetDescriptors.hydro[hydrosphere],
        datatables.planetDescriptors.pop[population],
        datatables.planetDescriptors.law[government],
        datatables.planetDescriptors.tech[techlevel],
    ];
    const tradeClasses = generateTradeClasses(uwp)
    return {
        uwp: uwp,
        government: government,
        tech: techlevel,
        starport: starBase,
        bases: bases,
        desc: uwpDescriptors,
        tradeClasses: tradeClasses
    }
}
function generateTradeClasses(uwpString) {
    const uwpArray = convertUPPtoArray(uwpString);
    const uwp = {
        size: uwpArray[0],
        atmosphere: uwpArray[1],
        hydrosphere: uwpArray[2],
        population: uwpArray[3],
        law: uwpArray[4],
        tech: uwpArray[5],
    }
    let tradeClasses = [];
    if (uwp.size === 0) tradeClasses.push('Ast');
    if (uwp.hydrosphere === 10) tradeClasses.push('Wat');
    if (uwp.atmosphere === 0) tradeClasses.push('Vac');
    if (uwp.population >= 6) tradeClasses.push('NIn');

    if (uwp.atmosphere >= 10 && uwp.hydrosphere >= 1) {
        tradeClasses.push('Fl')
    }
    if (uwp.atmosphere <= 1 && uwp.hydrosphere >= 1) {
        tradeClasses.push('Ice')
    } else if (uwp.atmosphere >= 2 && uwp.hydrosphere == 0) {
        tradeClasses.push('Des')
    }
    if (uwp.hydrosphere <= 3) {
        if (uwp.atmosphere >= 2 && uwp.atmosphere <= 5) {
            tradeClasses.push('Po')
        }
        if (uwp.atmosphere <= 3 && uwp.population > 3) {
            tradeClasses.push('NAg')
        } else {
            if (uwp.atmosphere <= 9 && uwp.hydrosphere <= 8 && uwp.population <= 7) {
                if (uwp.hydrosphere >= 4 && uwp.population >= 5) {
                    tradeClasses.push('Ag')
                }
            }
        }
    }
    if (uwp.population >= 6 && uwp.population <= 8) {
        if (uwp.law >= 4 && uwp.law <= 9) {
            if (uwp.atmosphere == 6 || uwp.atmosphere == 8) {
                tradeClasses.push('Ri')
            }
        }
    } else if (uwp.population >= 9) {
        tradeClasses.push('Hi')
        if (uwp.atmosphere <= 2 || uwp.atmosphere == 4 ||
            uwp.atmosphere == 7 || uwp.atmosphere == 9) {
            tradeClasses.push('In')
        }
    } else if (uwp.population <= 3) {
        tradeClasses.push('Lo')
    }
    return tradeClasses;
};

export function generateSystemName() {
    const names = datatables.Names;
    const length = Math.round(Math.random()) + Math.round(Math.random());
    const firstRow = Math.floor(Math.random() * 1015);
    let name = names[firstRow][0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    for (let i = 0; i < length; i++) {
        var randomSuffix = Math.floor(Math.random() * 422);
        var sylable = names[randomSuffix][1];
        name = name + sylable;
    }
    if (name.length > 12) {
        name = name.substring(0, 12);
    } else if (name.length === 1) {
        var letterArray = ['a', 'e', 'i', 'o', 'u', 'y'];
        var letter = Math.floor(Math.random() * 5);
        name = name + letterArray[letter];
    }
    return name;
}
export function generateOperationName() {
    var adjRoll = Math.floor((Math.random() * 26));
    var nounRoll = Math.floor((Math.random() * 26));
    var animal = Math.round(Math.random());
    var adjective = datatables.Specops.adjectives[adjRoll];
    var nounBase = (animal) ? datatables.Specops.animals : datatables.Specops.nouns;
    var noun = nounBase[nounRoll];
    var battleName = 'Operation ' + adjective + ' ' + noun;
    return battleName;
}

export function generateBattlename(place) {
    var data = datatables.Battles;
    var battleType = data.type[Math.floor((Math.random() * data.type.length))];
    var nounChance = Math.floor((Math.random() * 18));
    var noun = '';
    var battleStarName = generateSystemName();
    var battleName = '';
    var position = Math.round(Math.random());
    if (nounChance <= 6) {
        var randoSelect = Math.floor((Math.random() * 7));
        if (randoSelect === 7) {
            noun = ' the ' + data.theplace[Math.floor((Math.random() * data.theplace.length))];
        } else if (place === 'space') {
            noun = ' ' + data.spaceplace[Math.floor((Math.random() * data.spaceplace.length))];
        } else {
            noun = ' ' + data.planetplace[Math.floor((Math.random() * data.planetplace.length))];
        }
        if (nounChance === 0 || nounChance === 2) {
            var numberText = ' ' + Math.floor((Math.random() * 9)) + Math.floor((Math.random() * 9)) + Math.floor((Math.random() * 9));
            noun = noun + numberText;
        } else if (nounChance === 2 || nounChance === 3) {
            noun = '\'s' + noun;
        }
    }
    if (position === 1) {
        battleName = battleType + ' of ' + battleStarName + noun;
    } else {
        battleName = battleStarName + noun + ' ' + battleType;
    }
    return battleName;
}

export function handleSchoolApp(upp, school, characterName) {

    const testing = false;
    const schoolName =
        (school === "college" || school === "collegeotc" || school === "collegenotc")
            ? "college"
            : school;
    const data = datatables.schools[schoolName];
    const stats = convertUPPtoObject(upp);

    let otc = school === "collegeotc";
    let notc = school === "collegenotc";
    let commission = "none";
    let skillsGained = [];
    let friendlyName = "college";
    switch (school) {
        case "military":
            friendlyName = "a military academy";
            break;
        case "navy":
            friendlyName = "the Naval Academy";
            break;
        case "medical":
            friendlyName = "medical school";
            break;
        case "flight":
            friendlyName = "flight school";
            break;
        case "autoflight":
            friendlyName = "flight school";
            break;
        default:
            friendlyName = "college"
    }
    // ===============================
    //   🎓 OFFICER CANDIDATE BRANCHES
    // ===============================
    if (otc) {
        const roll = d6(2, stats.SOC >= 8 ? 1 : 0);
        commission = (roll >= 8) ? "army" : "denied";
    }

    if (notc) {
        const roll = d6(2, stats.SOC >= 10 ? 1 : 0);
        commission = (roll >= 9) ? "navy" : "denied";
    }

    // ===============================
    //   🏫 ADMISSION CHECK
    // ===============================
    const baseAdmissionTN = data.admission[0];
    const admissionMod = (stats[data.admission[1]] >= data.admission[2])
        ? data.admission[3]
        : 0;
    const admitRoll = d6(2, admissionMod);
    const admission = (testing) ? true : admitRoll >= baseAdmissionTN;

    if (!admission) {
        const modStr = (admissionMod !== 0) ? `modified by their ${data.admission[1]}` : "";
        const logStr = `${characterName} needed a ${baseAdmissionTN} to succeed and rolled a ${admitRoll} (${admitRoll - admissionMod}+${admissionMod}) ${modStr} `;
        let historyTxt = `${characterName} applied to ${friendlyName} but was rejected.`
        if (admissionMod == 0 && admitRoll + data.admission[3] >= data.admission[0]) {
            historyTxt = `${characterName} applied to ${friendlyName} but was rejected, probably due to their poor ${data.admission[1]}.`
        }
        else if ((admitRoll - baseAdmissionTN) <= -4) {
            historyTxt = `${characterName} applied to ${friendlyName} but was rejected due to a disasterous interview.`
        } else {
            historyTxt = `${characterName} applied to ${friendlyName} but was rejected after a difficult decision by the school.`
        }
        console.log(historyTxt)
        return {
            school: schoolName,
            admission: false,
            success: false,
            reason: logStr,
            history: historyTxt,
        };
    }

    // ===============================
    //   🎓 COURSE SUCCESS CHECK
    // ===============================
    const successTN = data.success[0];
    const successMod = (stats[data.success[1]] >= data.success[2])
        ? data.success[3]
        : 0;

    const successRoll = d6(2, successMod);
    const success = (testing) ? true : successRoll >= successTN;

    if (!success) {
        const modStr = (successMod !== 0) ? `modified by their ${data.success[1]}` : "";
        const logStr = `${characterName} needed a ${successTN} to succeed and rolled a ${successRoll} (${successRoll - successMod}+${successMod}) ${modStr} `;

        return {
            school: schoolName,
            admission: true,
            success: false,
            reason: logStr
        };
    }

    // ===============================
    //   🎉 HONORS
    // ===============================
    const honorsTN = data.honors[0];
    const honorsMod = (stats[data.honors[1]] >= data.honors[2])
        ? data.honors[3]
        : 0;

    const honors = d6(2, honorsMod) >= honorsTN;
    //const honors = true;

    // ===============================
    //   📚 EDUCATION INCREASE
    // ===============================
    let eduIncrease = 0;

    if (schoolName === "college" && honors) {
        eduIncrease = Math.max(1, 10 - stats.EDU);
    } else if (schoolName === "medical") {
        eduIncrease = 1;
    } else if (schoolName === "flight") {
        eduIncrease = 0;
    } else {
        const roll = Math.max(1, d6(1, schoolName === "college" ? -2 : -3));
        eduIncrease = roll;
    }

    // ===============================
    //   🧠 SKILL GAINS
    // ===============================
    const skillTable = data.skills ?? [];

    // FIXED: Loops now run correctly
    for (let i = 0; i < skillTable.length; i++) {
        const gained = d6(1) >= 4;
        if (gained) skillsGained.push(skillTable[i]);
    }

    if (schoolName === "military") {
        skillsGained.push("Combat Rifleman");
    }

    // Honors specialties
    if (schoolName === "medical" && honors && data.hskills) {
        skillsGained.push(...data.hskills);
    }

    if (schoolName === "flight") {
        let flightCount = Math.max(1, d6(1, -3));
        for (let i = 0; i < flightCount; i++) skillsGained.push("Pilot");
    }

    return {
        school: schoolName,
        admission: true,
        success: true,
        honors,
        eduIncrease,
        commission,
        skills: skillsGained
    };
}
export function generateCheckChances(Throw, Skill, SkillModCheck, DM, SkillTwo, SkillModCheckTwo, DMTwo) {
    var targetRoll = Throw;
    targetRoll = (Skill < SkillModCheck) ? targetRoll : targetRoll - DM;
    targetRoll = (SkillTwo < SkillModCheckTwo) ? targetRoll : targetRoll - DMTwo;
    return datatables.chanceToDescriptor[targetRoll];
}
export function generateEnlistmentChoices(upp, homeworld) {
    const enlistmentPassList = { draft: ["draft"] };
    const enlistmentFailList = {};
    const stats = convertUPPtoObject(upp);
    const enlistData = datatables.fullEnlistmentOps;
    const uwpArray = convertUPPtoArray(homeworld.uwp);

    const player = {
        tech: fromTravellerHex(homeworld.tech),
        starport: starportValue(homeworld.starport),
        atmos: uwpArray[1],
        hydro: uwpArray[2],
        pop: uwpArray[3],
        law: uwpArray[4],
        SOC: fromTravellerHex(stats.SOC),
    }
    Object.entries(enlistData).forEach((entry) => {
        const checks = entry[1].availability;
        const career = entry[0];

        let pass = true;
        for (let i = 0; i < checks.length; i++) {
            const stat = checks[i][0];
            const target = (stat === "starport") ? starportValue(checks[i][1]) : checks[i][1];
            const value = player[stat];
            if (target < 0) {
                pass = (value <= (target) * -1);
            } else {
                pass = (value >= target);
            }
            //console.log(`checking ${career}: stat ${stat} needs ${target} and is ${value} and so ${pass}`)
            if (!pass) break
        }
        if (pass) {
            //enlistmentPassList.push(`${career} (${category})`);
            enlistmentPassList[career] = entry;
        } else {
            enlistmentFailList[career] = entry;
        }
    })
    return [enlistmentPassList, enlistmentFailList]
}
function starportValue(starport) {
    let starportVal = 0;
    switch (starport) {
        case 'X':
            starportVal = 0;
            break;
        case 'E':
            starportVal = 1;
            break;
        case 'D':
            starportVal = 2;
            break;
        case 'C':
            starportVal = 3;
            break;
        case 'B':
            starportVal = 4;
            break;
        case 'A':
            starportVal = 5;
            break;
    }
    return starportVal;
}

export function careerCheck(check, upp, characterName) {
    const uppObj = convertUPPtoObject(upp)
    const req = check.target;
    const pSkill1 = uppObj[check.skill1[0]];
    const pSkill2 = uppObj[check.skill2[0]];
    const target1 = check.skill1[1];
    const target2 = check.skill2[1];
    let mod = (pSkill1 >= target1) ? 1 : 0;
    if (pSkill2 >= target2) { mod = mod + 2 }
    const roll = d6(2, mod);
    //console.log(check)

    const result = (roll >= req);
    const modStr = (mod !== 0) ? `modified by their ${[check.skill1[0]]} and ${[check.skill2[0]]}` : "";
    const logStr = `${characterName} needed a ${req} to succeed and rolled a ${roll} (${roll - mod}+${mod}) ${modStr} `;
    return [result, logStr]
}

export function careerCheckSimple(check, upp, characterName) {
    //check [5, 'EDU', 9, 2]
    const uppObj = convertUPPtoObject(upp)
    const req = check[0];
    const pSkill1 = uppObj[check[1]];
    const target1 = check[2];
    let mod = (pSkill1 >= target1) ? check[3] : 0;
    const roll = d6(2, mod);

    const result = (roll >= req);
    const crit = (roll >= req + 4);
    const modStr = (mod !== 0) ? `modified by their ${[check[1]]}` : "";
    const logStr = `${characterName} needed a ${req} to succeed and rolled a ${roll} (${roll - mod}+${mod}) ${modStr} `;
    return [result, logStr, crit]
}

export function careerCheckSpecReinlist(check, characterName) {
    //check [5, 'EDU', 9, 2]
    const req = check[0];
    const roll = d6(2, 0);
    const result = (roll >= req);
    const crit = (roll >= req + 4);
    const logStr = `${characterName} needed a ${req} to succeed and rolled a ${roll} `;
    return [result, logStr, crit, (roll === 12)]
}

function careerCouncilor(upp) {
    //todo
    //idea is to suggest careers, first on survival, then on promo/position, finally on enlistent
}

export function applySkill(setSkills, setCharacterData, skill, opts = {}) {
    const STATS = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];
    if (STATS.includes(skill)) {
        setCharacterData(prev => ({ ...prev, [skill]: (prev[skill] ?? 0) + 1 }));
        return;
    }
    setSkills(prev => {
        if (opts.maxSkills !== undefined) {
            const total = prev.reduce((sum, s) => sum + s.level, 0);
            if (total >= opts.maxSkills) return prev;
        }
        const index = prev.findIndex(s => s.name === skill);
        if (index === -1) {
            return [...prev, { name: skill, level: opts.zeroIfNew ? 0 : 1 }];
        }
        return prev.map((s, i) => i === index ? { ...s, level: s.level + 1 } : s);
    });
}

export function getAgingRolls(age) {
    let strTarget, dexTarget, endTarget;
    if (age < 38) {
        strTarget = 8; dexTarget = 7; endTarget = 8;
    } else if (age < 46) {
        strTarget = 9; dexTarget = 8; endTarget = 9;
    } else {
        strTarget = 9; dexTarget = 9; endTarget = 9;
    }
    const rolls = [
        { stat: 'STR', roll: d6(2, 0), target: strTarget },
        { stat: 'DEX', roll: d6(2, 0), target: dexTarget },
        { stat: 'END', roll: d6(2, 0), target: endTarget },
    ];
    const decreases = rolls.filter(r => r.roll < r.target).map(r => r.stat);
    return { rolls, decreases };
}
