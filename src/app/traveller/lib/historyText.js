
import { datatables } from "./data";
import { convertUPPtoArray } from "./helpers";

export function generateBirthText(uppArray, birthworld, name, homeworldName, skills) {
    const desc = datatables.historyDescriptors;
    const upp = {
        STR: uppArray[0],
        DEX: uppArray[1],
        END: uppArray[2],
        INT: uppArray[3],
        EDU: uppArray[4],
        SOC: uppArray[5],
    }
    const uwp = convertUPPtoArray(birthworld.uwp);

    //homeworld text

    const homeworldDesc = homeworldDescription(uwp, birthworld.government, homeworldName, birthworld.tradeClasses, birthworld.starport);

    const bGravity = uwp[0] > 10 ? "crushing" : "low";
    const bEdu = (Math.abs(upp.INT - upp.EDU) > 4) ? "despite" : "perhaps due to";
    let bPhys = ""

    const birthText = `${name} was born ${desc.social[upp.SOC - 2]} on the planet ${homeworldName}. ${homeworldDesc}.`;

    //strength text
    let bioText = `By age 18 ${name} had developed ${desc.stat[upp.STR]} strength `
    if (upp.STR >= 10) {
        const hGravDesc = (Math.abs(upp.STR - uwp[0]) >= 4) ? "despite" : "due to"
        bioText = bioText + `${hGravDesc} their world's ${bGravity} gravity `
    }
    //endurance and dex
    if (upp.END >= 9) {
        if (upp.DEX < 8) {
            bPhys = "the all-star endurance of a competitive triathlete";
        } else {
            bPhys = "the outstanding athleticism of a GravBall champion";
        }
    } else {
        if (upp.DEX > 7) {
            bPhys = "the accuracy of a medal-winning marksman";
        } else {
            if (upp.END <= 6) {
                bPhys = "no athletic skill whatsoever showing below average stamina and agility";
            } else {
                bPhys = "average but healthy athleticism";
            }
        }
    }

    //Education and intelligence
    bioText = (Math.abs(upp.EDU - upp.INT) > 4) ?
        bioText + `and exhibited ${bPhys}. ${name}${desc.education[upp.EDU - 2]} ${bEdu} their${desc.intelligence[upp.INT - 2]}` :
        bioText + `and exhibited ${bPhys}. ${name}${desc.education[upp.EDU - 2]} and had an${desc.intelligence[upp.INT - 2]}`;


    const techLevel = datatables.planetDescriptors.tech[uwp[5]].toLowerCase();
    //TODO clean this display up
    const skillStr = `From daily living in their homeworld's ${techLevel} tech, ${name} gained the following skills: ${skills.map(s => s.name ?? s).join("; ")}`;


    return [birthText, bioText, skillStr];
}
// ─── Skill Gain Narrative ────────────────────────────────────────────────────

const PHYSICAL_STATS = ['STR', 'DEX', 'END'];
const MENTAL_STATS = ['INT', 'EDU'];
const STAT_NAMES = { STR: 'strength', DEX: 'dexterity', END: 'endurance', INT: 'intelligence', EDU: 'education' };

const EXPERIENTIAL_CAREERS = new Set(['hunter', 'rogue', 'pirate', 'barbarian']);

// Natural phrase for each weapon — handles singular/plural and articles correctly
const WEAPON_PHRASE = {
    'Axe': 'an axe', 'Cudgel': 'a cudgel', 'Foil': 'a foil',
    'Large Blade': 'a large blade', 'Polearm': 'a polearm', 'Small Blade': 'a small blade',
    'Blade Combat': 'blade weapons',
    'Rifleman': 'a rifle', 'Laser Weapons': 'laser weapons', 'Neural Weapons': 'neural weapons',
    'Energy Weapons': 'energy weapons', 'Submachineguns': 'a submachine gun',
    'Handguns': 'handguns', 'Body Pistol': 'a body pistol', 'Pistol': 'a pistol',
    'Revolver': 'a revolver', 'Snub Pistol': 'a snub pistol',
    'Blowgun': 'a blowgun', 'Bola': 'a bola', 'Boomerang': 'a boomerang',
    'Bow': 'a bow', 'Crossbow': 'a crossbow', 'Early Firearms': 'early firearms', 'Sling': 'a sling',
    'Grenade Launcher': 'a grenade launcher', 'Light Assault Gun': 'a light assault gun',
    'Machine Gun': 'a machine gun', 'Autocannon': 'an autocannon', 'VRF Gauss Gun': 'a VRF gauss gun',
    'High-Energy Weapons': 'high-energy weapons', 'Mass Drivers': 'mass drivers',
    'Meson Guns': 'meson guns', 'Mortars and Howitzers': 'mortars and howitzers',
    'Screens': 'defensive screens', 'Spinal Weapons': 'spinal weapons', 'Turret Weapons': 'turret weapons',
};

// Genuinely recreational — always framed as spare-time activities
const PERSONAL_SKILLS = new Set(['Gambling', 'Artisan', 'Carousing', 'Jack-of-all-Trades']);

// Natural training phrase per specialty/cascade skill
const SKILL_PHRASE = {
    'Pilot': 'piloting a starship', 'Ships Boat': "piloting a ship's boat",
    'Helicopter': 'piloting a helicopter', 'Jet Aircraft': 'piloting a jet aircraft',
    'Lighter-than-Air Craft': 'piloting a lighter-than-air craft',
    'Propeller Aircraft': 'piloting a propeller aircraft', 'Grav Vehicle': 'piloting a grav vehicle',
    'Small Watercraft': 'operating a small watercraft', 'Large Watercraft': 'operating a large watercraft',
    'Hovercraft': 'operating a hovercraft',
    'Tracked Vehicles': 'operating tracked vehicles', 'Wheeled Vehicles': 'operating wheeled vehicles',
    'ACV': 'operating an air-cushion vehicle',
    'Vacc Suit': 'operating in a vacuum',
    'Engineering': 'space engineering', 'Navigation': 'space navigation',
    'Biology': 'biology', 'Chemistry': 'chemistry', 'Genetics': 'genetics',
    'Forensics': 'forensics', 'Medical': 'medicine', 'Physics': 'physics', 'Robotics': 'robotics',
    'Admin': 'administration', 'Interview': 'interviewing techniques',
    'Linguistics': 'linguistics', 'Liasan': 'liaison work', 'Steward': 'stewardship',
    'Communications': 'communications technology', 'Computer': 'computer science',
    'Electronics': 'electronics', 'Gravitics': 'gravitics',
    'Robot Ops': 'robot operations', 'Sensor Ops': 'sensor operations',
    'Guard/Hunting Beasts': 'handling guard and hunting animals',
    'Equestrian': 'horsemanship', 'Herding': 'herding animals',
    'Hunting': 'hunting', 'Recon': 'reconnaissance', 'Survival': 'wilderness survival',
    'Broker': 'brokerage', 'Legal': 'legal practice', 'Trader': 'trading',
    'Instruction': 'instruction', 'Leader': 'leadership',
    'Brawling': 'unarmed combat',
    'Bribery': 'bribery', 'Disguise': 'disguise', 'Forgery': 'forgery',
    'Intrusion': 'intrusion', 'Streetwise': 'streetwise',
};

function categorizeSkill(skill) {
    if (PHYSICAL_STATS.includes(skill)) return { cat: 'stat_physical', phrase: STAT_NAMES[skill] };
    if (MENTAL_STATS.includes(skill)) return { cat: 'stat_mental', phrase: STAT_NAMES[skill] };
    if (skill === 'SOC') return { cat: 'stat_soc', phrase: null };
    if (skill in WEAPON_PHRASE) return { cat: 'weapon', phrase: WEAPON_PHRASE[skill] };
    if (PERSONAL_SKILLS.has(skill)) return { cat: 'personal', phrase: skill.toLowerCase() };
    return { cat: 'training', phrase: SKILL_PHRASE[skill] ?? skill.toLowerCase() };
}

function joinInline(items) {
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function joinClauses(clauses) {
    if (clauses.length === 1) return clauses[0];
    if (clauses.length === 2) return `${clauses[0]}, and ${clauses[1]}`;
    return `${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}`;
}

export function describeSkillGains(skills, career) {
    const experiential = EXPERIENTIAL_CAREERS.has(career);
    const training = [], weapons = [], personal = [], physStats = [], mentStats = [];
    let socUp = false;

    for (const skill of skills) {
        const { cat, phrase } = categorizeSkill(skill);
        if (cat === 'training') training.push(phrase);
        else if (cat === 'weapon') weapons.push(phrase);
        else if (cat === 'personal') personal.push(phrase);
        else if (cat === 'stat_physical') physStats.push(phrase);
        else if (cat === 'stat_mental') mentStats.push(phrase);
        else if (cat === 'stat_soc') socUp = true;
    }

    const clauses = [];
    if (training.length > 0) {
        const verb = experiential ? 'gained experience in' : 'trained in';
        clauses.push(`${verb} ${joinInline(training)}`);
    }
    if (weapons.length > 0) clauses.push(`learned to handle ${joinInline(weapons)}`);
    if (physStats.length > 0) clauses.push(`focused on physical fitness, increasing their ${joinInline(physStats)}`);
    if (mentStats.length > 0) clauses.push(`sharpened their mind, improving their ${joinInline(mentStats)}`);
    if (socUp) clauses.push('found themselves moving in more elevated social circles');

    if (personal.length === 0) return joinClauses(clauses);
    const pickUp = `picking up ${joinInline(personal)} along the way`;
    return clauses.length > 0 ? `${joinClauses(clauses)}, ${pickUp}` : `picked up ${joinInline(personal)} in their spare time`;
}

// ─── Biography Generator ────────────────────────────────────────────────────
// Each phase function receives (characterData, skills, characterName) and
// returns an array of paragraph strings. These functions are the canonical
// home for narrative prose — they replace what handleHistoryAdd captures
// inline across the components. generateBiography assembles all phases;
// falls back to the raw history array until each phase is implemented.

// Origins: handled by generateBirthText (called from growUp in helpers.js).
// characterData.history[0..2] are those three paragraphs — homeworld,
// physical description, and base skills from tech level.
export function generateBiographyOrigins(characterData, _skills, _characterName) {
    return characterData.history.slice(0, 3);
}

export function generateBiographyEducation(_characterData, _skills, _characterName) {
    // Handles what CharacterEducationEnlistmentDraft and CharacterEnlistment
    // currently log via handleHistoryAdd:
    //   - Applied to university/med school/military academy/OTC — rejected
    //   - Accepted but washed out / dropped out after 1 year
    //   - Graduated (with or without honors), degree awarded
    //   - Commissioned via academy / drafted via navy/military college
    //   - Enlisted in a career, or failed enlistment and was drafted
    //   - Drafted into a random military branch (page.js performDraft)
    // Key data to derive from:
    //   characterData.grad        — [universityAdmitted, honorsSuccess]
    //   characterData.medgrad     — [medAdmitted, honorsSuccess]
    //   characterData.awards      — contains "graduate" / "med school graduate"
    //   characterData.commission  — career name if commissioned via academy
    //   characterData.career.drafted — true if entered service via draft
    //   characterData.career.careername / subcareername
    //   characterData.age         — reflects years spent in school
    return [];
}

export function generateBiographyCareer(_characterData, _skills, _characterName) {
    // Handles what BasicTerm and ArmyTerm log via handleHistoryAdd each term:
    //   - Starting career, initial skills gained (BasicTerm init)
    //   - Survived / killed in action (survival roll outcome)
    //   - Commissioned as officer (first term position roll)
    //   - Promoted to new rank
    //   - Special assignment / special duty description
    //   - Forced to stay in / forced out / chose to reinlist
    //   - Aging reductions (STR/DEX/END)
    //   - Army/Marines: branch assignment, annual assignments, decorations (ArmyTerm)
    // Key data to derive from:
    //   characterData.career.{careername, branch, rank, terms, officer, drafted}
    //   characterData.awards      — decorations (MCUF, MCG, SEH) and commendations
    //   characterData.age         — current age after all terms
    //   skills                    — [{name, level}] full skill list
    return [];
}

const CAREER_DISPLAY_BIO = { law: 'law enforcement officer' };

export function generateBiographyMusterOut(characterData, _skills, characterName) {
    const { career, pension, cash, ship, shipshares, gear, age } = characterData;
    const { careername, terms } = career;

    const careerDisplay = CAREER_DISPLAY_BIO[careername] ?? careername;
    const yearsServed = terms * 4;

    let para1 = `After ${terms} term${terms !== 1 ? 's' : ''} and ${yearsServed} years as a ${careerDisplay}, ${characterName} mustered out at age ${age}.`;

    if (pension > 0) {
        para1 += ` Having served long enough to earn a pension, they will receive Cr${pension.toLocaleString()} per year for the rest of their life.`;
    }

    para1 += ` With their service behind them, ${characterName} stepped into civilian life ready to chart their own course among the stars.`;

    // Para 2: what they walked away with
    const parts = [];

    if (ship) {
        parts.push(`a ${ship.toLowerCase()}`);
    } else if (shipshares > 0) {
        parts.push(`${shipshares} ship share${shipshares !== 1 ? 's' : ''} toward a future vessel`);
    }

    if (cash > 0) {
        parts.push(`Cr${cash.toLocaleString()} in savings`);
    }

    const passageTypes = new Set(['Low passage', 'Mid passage', 'High passage']);
    const passages = (gear ?? []).filter(g => passageTypes.has(g));
    const otherGear = (gear ?? []).filter(g => !passageTypes.has(g));

    for (const item of otherGear) {
        parts.push(`a ${item.toLowerCase()}`);
    }

    if (passages.length > 0) {
        const counts = {};
        for (const p of passages) counts[p] = (counts[p] ?? 0) + 1;
        const passageStr = Object.entries(counts)
            .map(([type, n]) => n > 1 ? `${n} ${type.toLowerCase()}s` : `a ${type.toLowerCase()}`)
            .join(' and ');
        parts.push(passageStr);
    }

    const para2 = parts.length === 0
        ? `${characterName} left service with little beyond their experience and a lifetime of memories.`
        : `${characterName} walked away from service with ${joinInline(parts)}.`;

    return [para1, para2];
}

export function generateBiography(characterData, skills, characterName, step) {
    const origins = generateBiographyOrigins(characterData, skills, characterName);
    const education = generateBiographyEducation(characterData, skills, characterName);
    const career = generateBiographyCareer(characterData, skills, characterName);
    const musterOut = step === 'complete'
        ? generateBiographyMusterOut(characterData, skills, characterName)
        : [];

    // While education and career stubs return [], bridge with the raw history
    // entries beyond the 3 origin paragraphs generateBiographyOrigins covers.
    const rawMiddle = (education.length === 0 && career.length === 0)
        ? characterData.history.slice(3)
        : [];

    return [...origins, ...education, ...rawMiddle, ...career, ...musterOut];
}

// ────────────────────────────────────────────────────────────────────────────

function homeworldDescription(uwp, government, name, tradeClasses, starport) {
    const uwpDescriptors = [
        datatables.planetDescriptors.size[uwp[0]].toLowerCase(),
        datatables.planetDescriptors.atmos[uwp[1]].toLowerCase(),
        datatables.planetDescriptors.hydro[uwp[2]].toLowerCase(),
        datatables.planetDescriptors.pop[uwp[3]].toLowerCase(),
        datatables.planetDescriptors.law[government].toLowerCase(),
        datatables.planetDescriptors.tech[uwp[5]].toLowerCase(),
    ];
    let tradeDesc = "";
    for (let i = 0; i < tradeClasses.length; i++) {
        if (i !== 0) {
            tradeDesc = tradeDesc + ", ";
        }
        tradeDesc = tradeDesc + datatables.tradeFlags[tradeClasses[i]];
    }
    const planet = (uwp[0] === 0) ? "an asteroid" : `a ${uwpDescriptors[0]}-sized, ${tradeDesc} planet`;
    const govtDesc = (uwp[4] === 0) ? "living in total anarchy" : `ruled by ${datatables.government[government]}`;

    const worldDescriptionString = `${name} is ${planet} with a ${uwpDescriptors[1]} atmosphere located ${datatables.starport[starport]}. ${name} has a ${uwpDescriptors[5]} civilization ${govtDesc.toLowerCase()}`;
    return worldDescriptionString;
}