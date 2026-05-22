
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

// TODO: some skill tables use long-form stat names ("Strength", "Dexterity", etc.)
// instead of abbreviations. Add STAT_NORMALIZE map and update categorizeSkill when addressed.

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
    'Engineering': 'space engineering', 'Navigation': 'navigating through space',
    'Biology': 'biology', 'Chemistry': 'chemistry', 'Genetics': 'genetics',
    'Forensics': 'forensics', 'Medical': 'medicine', 'Physics': 'physics', 'Robotics': 'robotics',
    'Admin': 'administration', 'Administration': 'administration',
    'Interview': 'interviewing techniques',
    'Linguistics': 'linguistics', 'Liaison': 'liaison work', 'Steward': 'the care and feeding of passengers',
    'Communications': 'communications technology', 'Computer': 'computer science',
    'Electronics': 'electronics', 'Gravitics': 'gravitics',
    'Robot Ops': 'robot operations', 'Sensor Ops': 'experience with reading sensor data',
    'Guard/Hunting Beasts': 'handling guard and hunting animals',
    'Equestrian': 'horsemanship', 'Herding': 'herding animals',
    'Hunting': 'hunting', 'Recon': 'reconnaissance', 'Survival': 'wilderness survival',
    'Broker': 'brokerage', 'Legal': 'legal practice', 'Trader': 'trading',
    'Instruction': 'instruction', 'Leadership': 'leadership',
    'Brawling': 'unarmed combat',
    'Tactics': 'tactical operations', 'Gunnery': 'ship gunnery',
    'Forward Observer': 'calling in artillery and directing fire support',
    'Mechanical': 'mechanical systems repair',
    'Battle Dress': 'operating powered battle armor',
    'Zero-G Combat': 'zero-gravity combat',
    'Ship Tactics': 'ship-to-ship tactical maneuvering', 'Fleet Tactics': 'fleet-level tactical operations',
    'Technical': 'technical systems maintenance', 'Academic': 'academic study',
    'Bribery': 'bribery', 'Disguise': 'disguise', 'Forgery': 'forgery',
    'Intrusion': 'lockpicking, picking pockets and other ways to enter restricted areas', 'Streetwise': 'local subcultures',
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

// ─── Year History Builder ────────────────────────────────────────────────────

// ─── Army / Marines flavor text pools ───────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const ARMY_TRAINING = [
    (n, w) => `cycled through field exercises on ${w}'s surface — live-fire drills, combat casualty simulations, and the kind of PT that leaves permanent scars.`,
    (n, w) => `ground through a year of infantry training: weapons qualification, hostile-environment survival, and learning to function on three hours of sleep in a contested zone.`,
    (n, w) => `spent the year at a training depot being broken down and rebuilt — the Imperial Army's method of ensuring its soldiers can endure anything the galaxy throws at them.`,
];
const ARMY_INTERNAL_SEC = [
    (n, w) => `was posted to spaceport security on ${w} — riot shields, tense crowds, and the knowledge that the population being policed would rather they weren't there.`,
    (n, w) => `drew internal security duty on ${w}, patrolling installation perimeters while political tensions simmered in the city beyond the wire.`,
    (n, w) => `stood watch at a contested starport on ${w}, where every civilian was a potential threat and the rules of engagement changed with every shift.`,
];
const ARMY_SHIPS_TROOPS = [
    (n) => `served as ship's troops aboard a military transport — cramped quarters, no viewports, and security sweeps of cargo bays that smelled of recycled air and contained menace.`,
    (n) => `pulled shipboard security duty, spending the year in the sealed-off troop decks of a military vessel, drilling for boarding actions that never quite arrived.`,
    (n) => `was assigned to a ship's company, running internal patrols through corridors that felt a thousand kilometers from any real war.`,
];
const ARMY_COMBAT = {
    "Raid": [
        (n, b, w) => `was deployed into ${b}, leading a ground assault against fortified positions in conditions that no pre-mission briefing had adequately described.`,
        (n, b, w) => `fought in ${b} — house-to-house through rubble, the enemy defending every street and the Army taking losses with every block.`,
        (n, b, w) => `dropped into ${b} under fire, advancing across broken ground with air support running late and the enemy very well prepared.`,
    ],
    "Counter Insurgency": [
        (n, b, w) => `was deployed into ${b} — an insurgency with no front line, no uniforms, and no easy answers. Every face was a question.`,
        (n, b, w) => `spent the year in counter-insurgency operations during ${b}, fighting an enemy that lived among the population and vanished before the shooting stopped.`,
        (n, b, w) => `served in ${b}, a grinding counter-insurgency that measured progress in patrols run and informants lost, rather than ground taken.`,
    ],
    "Police Action": [
        (n, b, w) => `was committed to ${b}, a "police action" that looked and felt exactly like a war, whatever the official designation said.`,
        (n, b, w) => `fought through ${b} — the Imperium called it a stabilization operation; the people dying called it something less diplomatic.`,
        (n, b, w) => `deployed into ${b}: a rapid-response commitment that stretched into months of urban patrols, cordon operations, and hostile contact.`,
    ],
};
const ARMY_GARRISON = [
    (n, w) => `spent the year on garrison duty on ${w} — an occupation posting in a hostile climate, watching the perimeter and waiting for something to happen.`,
    (n, w) => `was stationed as a garrison trooper on ${w}, maintaining a visible presence in a territory that made clear it didn't want visitors.`,
    (n, w) => `rotated through a garrison posting on ${w}: long shifts, short tempers, and the exhaustion of enforced boredom punctuated by sudden violence.`,
];
const ARMY_SPECIAL = [
    (n, loc) => `was pulled for a classified special assignment — operational details sealed, destination undisclosed, and the casualty risk understated in every official document.`,
    (n, loc) => `was seconded to a special operations mission, the kind where the orders are delivered verbally and no unit patch is worn.`,
    (n, loc) => `was assigned to special duty: the sort of work that earns a decoration if it succeeds and a quiet burial if it doesn't.`,
];

const MARINE_TRAINING = [
    (n, w) => `underwent Marine Corps training — an institution that measures itself against centuries of tradition and expects its recruits to either meet that standard or not survive trying.`,
    (n, w) => `completed the Marine Corps' foundational course: zero-G combat, shipboard breaching, and the drilling of formations that date back to the Third Frontier War.`,
    (n, w) => `was forged through Marine boot camp — vacuum operation, close-quarters combat, and the Corps' iron expectation that a Marine gets the job done even after everyone else has stopped.`,
];
const MARINE_INTERNAL_SEC = [
    (n, w) => `served on internal security detail on ${w} — part honor guard, part enforcement, the Marine presence making a political statement as much as a military one.`,
    (n, w) => `drew security duty on ${w}, protecting Imperial installations and demonstrating the kind of visible deterrence that local forces couldn't credibly project.`,
    (n, w) => `was assigned to security operations on ${w}: ceremonial duties in front of the cameras, combat-ready procedures behind them.`,
];
const MARINE_SHIPS_TROOPS = [
    (n) => `trained as ship's troops aboard a Naval vessel, drilling boarding actions in sealed compartments and zero-G corridors until the maneuvers were reflexive.`,
    (n) => `spent the year as ship-borne Marines — the cutting edge held in reserve behind sealed bulkheads, ready to be sent through an airlock that needed opening from the wrong side.`,
    (n) => `served as a Marine attachment on a naval vessel, running vacuum breach drills in full kit while the Navy officers maintained a studied indifference.`,
];
const MARINE_COMBAT = {
    "Raid": [
        (n, b, w) => `was first through the airlock in ${b} — a direct action boarding that cleared a hostile vessel room by room in the dark.`,
        (n, b, w) => `led the assault element in ${b}, breaching a space station through exterior access points and fighting through pressurized corridors against a prepared defense.`,
        (n, b, w) => `fought in ${b}, a combined boarding and assault operation that put Marines on the hull before the Navy had finished its orbital fire.`,
    ],
    "Counter Insurgency": [
        (n, b, w) => `was committed to ${b} — the Corps was called in to do what other forces couldn't, and prosecuted the counter-insurgency with all the subtlety the situation permitted.`,
        (n, b, w) => `served as a rapid-reaction force in ${b}, the Marines taking the losses of the first wave so that the forces behind them had a position to hold.`,
        (n, b, w) => `fought through ${b}, the Marines spearheading operations against an entrenched insurgency in the tradition of every assault that came before.`,
    ],
    "Police Action": [
        (n, b, w) => `was deployed into ${b} — where other forces couldn't hold, the Marines were sent to make holding possible.`,
        (n, b, w) => `served in ${b}, a rapid-response action that the Corps prosecuted with full combat intensity from the first hour.`,
        (n, b, w) => `fought in ${b}: the Imperial Hammer. The threat of the Marines is often enough. When it wasn't, they finished the job.`,
    ],
};
const MARINE_GARRISON = [
    (n, w) => `served in a garrison posting — the Corps maintains its standards, its ceremonies, and the quiet understanding that garrison duty is an assault that hasn't been scheduled yet.`,
    (n, w) => `stood a garrison posting on ${w}: not the sharp end of operations, but Marines who serve there know the call will come eventually.`,
    (n, w) => `was posted to garrison duty, performing the visible presence role and maintaining the Marine Corps' credibility in a region that needed reminding.`,
];
const MARINE_SPECIAL = [
    (n, loc) => `was selected for a special assignment — classified, high-risk, and the kind of mission that gets quietly listed in the Corps' honors alongside the ones that didn't come back.`,
    (n, loc) => `was committed to a classified special operations mission: the details sealed, the objective Imperial-priority, the Marine Corps' reputation on the line.`,
    (n, loc) => `was sent on special duty — the sort of mission the Corps is built for and says little about afterward.`,
];

function buildArmyAssignmentText(assignment, characterName, worldName, battleName, career) {
    const n = characterName;
    const w = worldName ?? "an occupied world";
    const b = battleName ?? "the engagement";
    const isMarine = career === "marines";

    if (isMarine) {
        if (assignment === "Training") return pick(MARINE_TRAINING)(n, w);
        if (assignment === "Internal Security") return pick(MARINE_INTERNAL_SEC)(n, w);
        if (assignment === "Ship's Troops") return pick(MARINE_SHIPS_TROOPS)(n);
        if (MARINE_COMBAT[assignment]) return pick(MARINE_COMBAT[assignment])(n, b, w);
        return pick(MARINE_GARRISON)(n, w);
    } else {
        if (assignment === "Training") return pick(ARMY_TRAINING)(n, w);
        if (assignment === "Internal Security") return pick(ARMY_INTERNAL_SEC)(n, w);
        if (assignment === "Ship's Troops") return pick(ARMY_SHIPS_TROOPS)(n);
        if (ARMY_COMBAT[assignment]) return pick(ARMY_COMBAT[assignment])(n, b, w);
        return pick(ARMY_GARRISON)(n, w);
    }
}

export function buildYearHistoryArmy(flags, characterName, career) {
    const {
        term, year, assignment, worldName, battleName, isCombat, kia,
        decoration, special, specialCommission,
        commissionedAuto, commissionedRolled, commissionedRankName,
        promoted, promotedToRankName,
    } = flags;

    const prefix = `Term ${term}, Year ${year}: `;
    const isMarine = career === "marines";

    if (kia) {
        let pool;
        if (!isCombat) {
            if (assignment === "Internal Security") {
                pool = isMarine ? DEATH_HAZARDOUS_MARINES : DEATH_HAZARDOUS_ARMY;
            } else {
                pool = isMarine ? DEATH_ACCIDENT_GENERIC : DEATH_ACCIDENT_ARMY;
            }
        } else if (isMarine && assignment === "Raid") {
            pool = DEATH_INTENSE_ARMY;
        } else {
            pool = DEATH_COMBAT_ARMY;
        }
        return `${prefix}${pick(pool)(characterName)} The story ends here.`;
    }

    let text;
    if (special) {
        const pool = isMarine ? MARINE_SPECIAL : ARMY_SPECIAL;
        text = pick(pool)(characterName, special.name);
        if (specialCommission) text += ` ${characterName} was commissioned as ${specialCommission}.`;
    } else {
        const base = buildArmyAssignmentText(assignment, characterName, worldName, battleName, career);
        if (isCombat) {
            text = decoration
                ? `${base} ${characterName} performed with distinction under fire and was awarded the ${decoration.full}.`
                : base;
        } else {
            text = base;
            if (decoration) text += ` ${characterName} was decorated for their conduct.`;
        }
    }

    if (commissionedAuto) text += ` ${characterName}'s commission was confirmed as ${commissionedRankName}.`;
    else if (commissionedRolled) text += ` ${characterName} received a commission as ${commissionedRankName}.`;
    if (promoted) text += ` ${characterName} was promoted to ${promotedToRankName}.`;

    return `${prefix}${text}`;
}

// ─── Navy flavor text pools ──────────────────────────────────────────────────

const NAVY_TRAINING = {
    imperial: [
        (n) => `completed naval training at an Imperial facility where many graduates come from noble families and the curriculum has not changed significantly since the Interstellar Wars.`,
        (n) => `was processed through Imperial Navy training — a regime designed to forge officers of an institution that considers itself the backbone of interstellar civilization, and is not wrong.`,
        (n) => `drilled through naval training, learning the protocols of an organization that has kept the jump lanes safe for six centuries and intends to keep doing so.`,
    ],
    reserve: [
        (n) => `completed Reserve Fleet training, absorbing naval doctrine and recognizing that the gap between a Reserve commission and an Imperial one is measured in birthplace as much as performance.`,
        (n) => `trained with the Reserve Fleet — the traditions are the same as the Imperial Navy, the prestige somewhat less direct, the competence just as real.`,
    ],
    system: [
        (n) => `completed training with the System Squadron — an institution whose prestige is local, whose purpose is essential, and whose officers are heroes to exactly one planet.`,
        (n) => `drilled with the System Squadron, learning to defend the one piece of sky that matters: the one above home.`,
    ],
};
const NAVY_SHORE_DUTY = {
    imperial: [
        (n, w) => `was posted to shore duty on ${w} — orbital stations, flag briefings, and the particular social machinery of the Imperial Navy where the admiralty and the aristocracy overlap considerably.`,
        (n, w) => `served ashore on ${w}, moving in the kind of circles where uniforms carry the weight of three generations of naval service and the invitations arrive addressed to the rank first.`,
        (n, w) => `drew a shore posting on ${w}, where fleet command, noble patronage, and Imperial policy intersect in ways that make or break careers.`,
    ],
    reserve: [
        (n, w) => `was posted shore-side on ${w}, coordinating Reserve Fleet logistics and readiness in the kind of administrative role that keeps ships in the black without anyone noticing.`,
        (n, w) => `served on shore duty on ${w} — the Reserve exists to be ready, and shore billets are where that readiness is built, maintained, and occasionally questioned by visiting inspectors.`,
    ],
    system: [
        (n, w) => `was posted ashore on ${w}, embedded in the local defense establishment — a face the population knew, a uniform they trusted, a posting that meant something here even if it meant less elsewhere.`,
        (n, w) => `served on shore duty on ${w}, working with planetary defense forces and attending the kind of civic ceremonies where Squadron officers are treated as local heroes rather than distant authority.`,
    ],
};
const NAVY_PATROL = {
    imperial: [
        (n, w) => `served aboard a patrol vessel in the ${w} system — the Imperial Navy's constant, quiet presence on the lanes that hold interstellar civilization together.`,
        (n, w) => `spent the year on patrol in the ${w} system, the long routine of jump-point monitoring, transit logging, and the kind of vigilance that means nothing happens and everything is therefore fine.`,
        (n, w) => `patrolled the ${w} system aboard an Imperial vessel, representing the force that makes commerce, communication, and civilization across the stars possible.`,
    ],
    reserve: [
        (n, w) => `served a patrol rotation in the ${w} system with the Reserve Fleet — second-line ships, first-rate crews, and the unglamorous work of keeping the lanes monitored.`,
        (n, w) => `ran patrols in the ${w} system, the Reserve Fleet doing the routine work that the Imperial Navy is too prestigious to find interesting.`,
    ],
    system: [
        (n, w) => `patrolled the ${w} system aboard a Squadron vessel — not a deep-space commission, but to every freighter captain and shuttle pilot in that system, the sight of the Squadron's markings means they are safe.`,
        (n, w) => `served on patrol in the ${w} system, the Squadron's presence the most visible proof to the planet below that it has not been forgotten by the Imperium.`,
    ],
};
const NAVY_SIEGE = [
    (n, w) => `participated in the siege of ${w} — orbital bombardment, interdiction, and the slow application of naval power until a world's will to resist broke under the weight of it.`,
    (n, w) => `served in the fleet elements besieging ${w}, running blockade rotations and fire support missions for the ground forces fighting their way up from the surface.`,
    (n, w) => `took part in naval operations against ${w}, the fleet holding the high ground while the ground forces held everything else — or tried to.`,
];
const NAVY_STRIKE = [
    (n, op, w) => `was part of ${op} at ${w} — a coordinated naval strike that combined jump-point interdiction with precision orbital fire, executed to schedule and classified immediately after.`,
    (n, op, w) => `served in ${op}, a high-tempo strike operation at ${w} that demonstrated the kind of power projection only the Navy can deliver.`,
    (n, op, w) => `took part in ${op} at ${w}, a strike mission that required exact timing, fleet coordination, and a willingness to be in the wrong part of space at the right moment.`,
];
const NAVY_BATTLE = {
    imperial: [
        (n, b) => `served in ${b} — a fleet engagement where the fate of a system was decided in the dark between stars, and the Imperial Navy was the reason the right side won.`,
        (n, b) => `fought in ${b}, a major fleet action that the Imperium will enter in its records alongside the battles that have always defined what the Navy is for.`,
        (n, b) => `was committed to ${b}, a full fleet engagement of the kind that naval officers train their whole careers to survive, and some do.`,
    ],
    reserve: [
        (n, b) => `served in ${b}, the Reserve Fleet called up to line strength and proving that the ships kept in readiness are every bit as capable as the ones on permanent commission.`,
        (n, b) => `fought in ${b} — when the Reserve Fleet is mobilized for a fleet action, it means things have gone seriously wrong, or are about to go seriously right.`,
    ],
    system: [
        (n, b) => `fought in ${b} alongside Fleet and Squadron vessels — a battle for the system that is home, the only one that matters, against a threat that made the Squadron's existence entirely justified.`,
        (n, b) => `served in ${b}, a system defense action that the Squadron fought to protect the one world it exists to keep safe.`,
    ],
};

function buildNavyAssignmentText(assignment, characterName, worldName, battleName, operationName, fleetType) {
    const ft = fleetType ?? 'imperial';
    const n = characterName;
    const w = worldName ?? "the patrol system";
    const b = battleName ?? "a major fleet engagement";
    const op = operationName ?? "a naval strike operation";

    const pool = (map) => map[ft] ?? map.imperial;

    switch (assignment) {
        case "Training":   return pick(pool(NAVY_TRAINING))(n);
        case "Shore Duty": return pick(pool(NAVY_SHORE_DUTY))(n, w);
        case "Patrol":     return pick(pool(NAVY_PATROL))(n, w);
        case "Siege":      return pick(NAVY_SIEGE)(n, w);
        case "Strike":     return pick(NAVY_STRIKE)(n, op, w);
        case "Battle":     return pick(pool(NAVY_BATTLE))(n, b);
        default:           return `${characterName} spent the year on assignment`;
    }
}

export function buildYearHistoryNavy(flags, characterName) {
    const {
        term, year, assignment, worldName, battleName, operationName, isCombat, kia,
        special, specialOCS, frozenWatch, routineDuty, fleetType,
        decoration, combatCluster, courtMartialHistory,
        commissionedAuto, commissionedRolled, commissionedRankName,
        promoted, promotedToRankName,
    } = flags;

    const prefix = `Term ${term}, Year ${year}: `;
    const ft = fleetType ?? 'imperial';

    if (frozenWatch) return `${prefix}Frozen Watch. ${characterName} was catalogued, sedated, and stowed — a replacement body held in reserve for casualties that hadn't happened yet. When they woke, a year had been spent on their behalf by people who hoped they'd never need to.`;
    if (routineDuty) return `${prefix}${characterName} spent the year on routine duty.`;

    if (special) {
        const specialLines = {
            imperial: [
                `${characterName} was selected for special duty${special.result ? ` — ${special.result}` : ""}, the kind of assignment that only reaches officers the Imperial Navy trusts completely.`,
                `${characterName} was assigned to special duties${special.result ? ` involving ${special.result}` : ""}, operating at the intersection of fleet command and Imperial policy.`,
            ],
            reserve: [
                `${characterName} was assigned to special duty${special.result ? ` — ${special.result}` : ""}, a reminder that the Reserve Fleet's capabilities are sometimes exactly what is required.`,
            ],
            system: [
                `${characterName} was assigned to special duty${special.result ? ` — ${special.result}` : ""}, operating beyond the Squadron's usual remit but not beyond the trust placed in its officers.`,
            ],
        };
        const pool = specialLines[ft] ?? specialLines.imperial;
        let text = pick(pool);
        if (specialOCS) text += ` ${characterName} completed OCS and was commissioned.`;
        if (courtMartialHistory) text += ` ${courtMartialHistory}`;
        if (commissionedAuto) text += ` ${characterName}'s commission came through as ${commissionedRankName}.`;
        else if (commissionedRolled) text += ` ${characterName} received a commission as ${commissionedRankName}.`;
        if (promoted) text += ` ${characterName} was promoted to ${promotedToRankName}.`;
        return `${prefix}${text}`;
    }

    const base = buildNavyAssignmentText(assignment, characterName, worldName, battleName, operationName, ft);

    if (kia) {
        let pool;
        if (!isCombat) {
            if (assignment === "Patrol" || assignment === "Shore Duty") pool = DEATH_HAZARDOUS_NAVY;
            else pool = DEATH_ACCIDENT_NAVY;
        } else if (assignment === "Battle") {
            pool = DEATH_INTENSE_NAVY;
        } else {
            pool = DEATH_COMBAT_NAVY;
        }
        return `${prefix}${pick(pool)(characterName)} The story ends here.`;
    }

    let text = `${base}.`;
    if (decoration) text += ` ${characterName} was decorated for their service.`;
    if (courtMartialHistory) text += ` ${courtMartialHistory}`;
    if (combatCluster) text += ` ${characterName} received a Combat Cluster for their conduct.`;
    if (commissionedAuto) text += ` ${characterName}'s commission came through as ${commissionedRankName}.`;
    else if (commissionedRolled) text += ` ${characterName} received a commission as ${commissionedRankName}.`;
    if (promoted) text += ` ${characterName} was promoted to ${promotedToRankName}.`;

    return `${prefix}${text}`;
}

// ─── Term Event Builders ─────────────────────────────────────────────────────

export function buildBranchAssignmentArmy(characterName, arm, career) {
    return `${characterName} selected the ${arm} arm of the ${career}.`;
}

export function buildInitialTrainingArmy(characterName, branch, career, skill1, skill2) {
    const skills = [skill1, skill2].filter(Boolean);
    const gains = describeSkillGains(skills, career);
    return `${characterName} completed initial training in the ${branch ?? career}, ${gains}.`;
}

export function buildBranchAssignmentNavy(characterName, branchName, fleetDisplay) {
    return `${characterName} was assigned to the ${branchName} branch of the ${fleetDisplay}.`;
}

export function buildBootCampNavy(characterName, branch, skill1, skill2) {
    const skills = [skill1, skill2].filter(Boolean);
    const gains = describeSkillGains(skills, 'navy');
    return `${characterName} completed boot camp in the ${branch} branch, ${gains}.`;
}

export function buildSkillGainHistory(term, year, characterName, skill, tableName, career) {
    const gains = describeSkillGains([skill], career);
    switch (tableName) {
        case "Navy Life":
            tableName = "in their off time";
            break;
        case "Army":
            tableName = "in their off time";
            break;
        case "Marine Life":
            tableName = "in their off time";
            break;
        case "Shipboard Life":
            tableName = "in their off time between worlds";
            break;
        case "Shore Duty":
            tableName = "in their off time while stuck planet-side";
            break;
        case "Petty Officer":
            tableName = "as a petty officer";
            break;
        case "NCO":
            tableName = "as an NCO";
            break;
        case "Command":
            tableName = "as a commanding officer";
            break;
        case "Staff":
            tableName = "as a staff officer";
            break;
        default:
            tableName = `During ${tableName} training,`;
            break;
    }
    return `Term ${term}, Year ${year}: ${tableName} ${characterName} ${gains}.`;
}

export function buildEndOfTermArmy(characterName, term, career, branch, bonusSkill, agingHist) {
    let text = `${characterName} completed Term ${term} as ${career} (${branch}). `;
    if (bonusSkill) {
        const gains = describeSkillGains([bonusSkill], career);
        text += `On special assignment, ${characterName} ${gains}. `;
    }
    text += agingHist;
    return text;
}

export function buildEndOfTermNavy(characterName, term, fleetDisplay, branch, agingHist) {
    return `${characterName} completed Term ${term} with the ${fleetDisplay} (${branch}).${agingHist}`;
}

export function buildOfficeAssignmentScout(characterName, office, section) {
    return `${characterName} was assigned to the ${office} office of the Scout Service (${section} section).`;
}

export function buildInitialTrainingScout(characterName, office, skill) {
    return `${characterName} completed initial Scout training in the ${office} office, gaining proficiency in ${skill}.`;
}

const FIELD_OFFICES_SET = new Set(['Survey', 'Communications', 'Exploration']);

const FIELD_TRAINING_LINES = [
    `spent months in survival drills and deep-space navigation exercises, living out of a Scout ship with no one to talk to but the nav computer.`,
    `cycled through field refresher courses: emergency protocols, first-contact procedures, and how to stay alive when the only help is months away.`,
    `drilled alone in empty star systems, running survey simulations until the routines were second nature.`,
];
const FIELD_BASE_LINES = [
    `rotated through base duty, filing reports no one would read and waiting for the next mission order that was always two weeks late.`,
    `spent a year at a remote Scout base — three other scouts, a temperamental communications relay, and the slow grind of cataloguing approach vectors.`,
    `was posted to a forward base on the frontier, far from any population center worth naming.`,
];
const FIELD_ROUTINE_LINES = [
    `spent the year in routine survey work, jumping between uninhabited systems and mapping stellar bodies that may never see another visitor.`,
    `conducted standard stellar surveys — long weeks of silence broken only by sensor pings and the hum of jump drives spooling up.`,
    `patrolled the frontier lanes, logging navigational hazards and updating charts for ships that would never know who made them safer.`,
];
const FIELD_MISSION_LINES = [
    `was dispatched on a survey mission to ${null}, operating alone for months in an uncharted system with no backup and unreliable comms.`,
    `undertook a contact mission to the ${null} system — first-in work, where a wrong move could spark an incident or end a career.`,
    `pushed deep into unexplored space on assignment to ${null}, relying entirely on skill and luck to make it back.`,
];

const BURO_TRAINING_LINES = [
    `attended mandatory training seminars, learning the finer points of Scout Service regulations, procurement procedures, and interdepartmental communication protocols.`,
    `completed a certification course in administrative operations — three weeks of paperwork simulations and interminable group briefings.`,
    `cycled through a training rotation, absorbing bureaucratic processes with the enthusiasm of someone who had applied for the Field.`,
];
const BURO_BASE_LINES = [
    `spent the year processing mission reports, cross-referencing survey data, and submitting budget requests that came back with half the line items denied.`,
    `worked through a mountain of routine administration — logistical coordination, resource allocation, and the slow institutional grind of the Scout Service's back office.`,
    `managed base operations, which meant meetings, memos, and careful navigation of the chain of command.`,
];
const BURO_ROUTINE_LINES = [
    `handled routine administrative duties: personnel scheduling, equipment inventory, and a seemingly endless queue of survey data awaiting classification.`,
    `spent the year pushing files through the bureaucracy, signing off on requests and writing the kind of reports that were read by no one and archived forever.`,
    `carried out standard administrative work — the kind that kept the Scout Service running and that nobody outside the office ever thought about.`,
];
const BURO_MISSION_LINES = [
    `was assigned to a special administrative project, coordinating between multiple departments on something that sounded important in the briefing and proved impenetrable in practice.`,
    `oversaw a logistics operation: managing the resupply of a distant Scout base through three layers of requisition forms and two committee reviews.`,
    `led an administrative mission, shepherding a policy initiative through channels that seemed designed to resist all forward motion.`,
];

function pickLine(arr, worldName) {
    const line = arr[Math.floor(Math.random() * arr.length)];
    return line.includes('${null}') ? line.replace('${null}', worldName ?? 'an unknown system') : line;
}

export function buildYearHistoryScout(flags, characterName) {
    const {
        term, year, office, assignment, worldName, isCombat, kia,
        special, warMission, transferred, transferDeclined,
        promoted, promotedToRankName, adminSchool,
    } = flags;

    const prefix = `Term ${term}, Year ${year}: `;
    const isField = FIELD_OFFICES_SET.has(office);

    if (kia) {
        let pool;
        if (office === "Detached") {
            pool = DEATH_BLACK_OPS;
        } else if (warMission && isCombat) {
            pool = DEATH_INTENSE_SCOUT;
        } else if (warMission || isCombat) {
            pool = DEATH_COMBAT_SCOUT;
        } else if (isField) {
            pool = DEATH_ACCIDENT_SCOUT;
        } else {
            pool = DEATH_ACCIDENT_GENERIC;
        }
        return `${prefix}${pick(pool)(characterName)} The story ends here.`;
    }

    if (transferred) {
        return `${prefix}Orders came through: ${characterName} was transferred out of the Field and into the Bureaucracy, assigned to the ${office} office. Whether this was a reward or a punishment depended on who you asked.`;
    }
    if (transferDeclined) {
        return `${prefix}${characterName} requested to stay in the Field. The request was denied. The transfer to ${office} (Bureaucracy) was mandatory.`;
    }

    if (adminSchool) {
        return `${prefix}${characterName} was selected for Administrator School — an intensive course in Scout Service leadership, policy, and institutional management. They emerged as IS-10, transferred to Bureaucracy Administration. The Field was behind them.`;
    }

    let text = "";
    if (special || warMission) {
        const missionType = warMission ? "war mission" : "special assignment";
        if (isField) {
            text = `${characterName} was pulled from routine duty and sent on a ${missionType}${worldName ? ` into the ${worldName} system` : ""}. The details were classified. The risks were not.`;
        } else {
            text = `${characterName} was seconded to an urgent ${missionType}${worldName ? ` involving the ${worldName} system` : ""}. The work was sensitive, the timeline compressed, and the interdepartmental politics considerable.`;
        }
    } else if (isField) {
        switch (assignment) {
            case "Training":
                text = `${characterName} ${pickLine(FIELD_TRAINING_LINES, worldName)}`;
                break;
            case "Base":
                text = `${characterName} ${pickLine(FIELD_BASE_LINES, worldName)}`;
                break;
            case "Routine":
                text = `${characterName} ${pickLine(FIELD_ROUTINE_LINES, worldName)}`;
                break;
            case "Mission":
                text = `${characterName} ${pickLine(FIELD_MISSION_LINES, worldName)}`;
                break;
            default:
                text = `${characterName} spent the year on field duty — remote, unglamorous, and alone.`;
        }
    } else {
        // Bureaucracy
        switch (assignment) {
            case "Training":
                text = `${characterName} ${pickLine(BURO_TRAINING_LINES, worldName)}`;
                break;
            case "Base":
                text = `${characterName} ${pickLine(BURO_BASE_LINES, worldName)}`;
                break;
            case "Routine":
                text = `${characterName} ${pickLine(BURO_ROUTINE_LINES, worldName)}`;
                break;
            case "Mission":
                text = `${characterName} ${pickLine(BURO_MISSION_LINES, worldName)}`;
                break;
            default:
                text = `${characterName} spent the year on administrative duty — the kind that leaves no mark except in the filing system.`;
        }
    }

    if (promoted) text += ` ${characterName} was promoted to ${promotedToRankName}.`;

    return `${prefix}${text}`;
}

export function buildEndOfTermScout(characterName, term, office, section, agingHist) {
    return `${characterName} completed Term ${term} with the Scout Service (${office}, ${section} section).${agingHist}`;
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
    const { career, pension, cash, ship, shipshares, gear, chronoAge } = characterData;
    const { careername, terms } = career;

    const careerDisplay = CAREER_DISPLAY_BIO[careername] ?? careername;
    const yearsServed = terms * 4;

    let para1 = `After ${terms} term${terms !== 1 ? 's' : ''} and ${yearsServed} years as a ${careerDisplay}, ${characterName} mustered out at age ${chronoAge}.`;

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
        tradeDesc = tradeDesc + datatables.historyDescriptors.planet.trade[tradeClasses[i]];
    }
    const planet = (uwp[0] === 0) ? "an asteroid" : `a ${uwpDescriptors[0]}-sized, ${tradeDesc} planet`;
    const govtDesc = (uwp[4] === 0) ? "living in total anarchy" : `ruled by ${datatables.government[government]}`;

    const worldDescriptionString = `${name} is ${planet} with a ${uwpDescriptors[1]} atmosphere located ${datatables.historyDescriptors.planet.starport[starport]}. ${name} has a ${uwpDescriptors[5]} civilization ${govtDesc.toLowerCase()}`;
    return worldDescriptionString;
}

// ── Merchant history ─────────────────────────────────────────────────────────

// Large-line (corporate) flavor pools — late-stage capitalism / worker dehumanization
const CORP_ROUTE = [
    (n, co) => `${n} completed the assigned cargo rotation for ${co} without incident. Performance metrics: acceptable.`,
    (n, co) => `Another quarter, another Route 7-Sigma run for ${co}. ${n}'s efficiency rating held steady in the lower acceptable band.`,
    (n, co) => `${co}'s logistics division assigned ${n} to standard freight duty. The manifest was verified. The cargo was uninteresting. The pay was deposited on schedule.`,
    (n, co) => `${n} spent the year moving bulk goods between waypoints designated by ${co}'s automated routing system. Human oversight was not considered a variable.`,
];
const CORP_CHARTER = [
    (n, co) => `${co} loaned ${n}'s vessel to a subsidiary client. The client's discretion was noted. The cargo specifications were not shared with crew.`,
    (n, co) => `A charter contract from ${co}'s special accounts division. ${n} asked no questions. The bonus column on the quarterly report was pleasant.`,
    (n, co) => `${n} ferried a corporate delegation for ${co}. The passengers did not speak to the crew. The crew did not look at the passengers. This was understood to be correct.`,
];
const CORP_SPECULATIVE = [
    (n, co) => `${co}'s speculative trade division sent ${n} chasing market differentials across three systems. Margins were thin. They always are, until they aren't.`,
    (n, co) => `${n} spent the year buying low and selling high on behalf of ${co}'s commodities arm. The profits were impressive. ${n}'s share of them was not.`,
    (n, co) => `${co} ran a speculative venture through ${n}'s posting. The numbers worked out. ${co}'s shareholders were pleased. ${n} received a performance note.`,
];
const CORP_EXPLORATORY = [
    (n, co) => `${co}'s expansion division tasked ${n} with opening new market contacts at the frontier. The company called it opportunity. The crew called it being lost.`,
    (n, co) => `${n} spent the year blazing trade routes for ${co} into under-served systems. The corporation's flag followed. The pay did not improve.`,
    (n, co) => `Exploratory trade under ${co}'s auspices meant long jumps, minimal support, and thin margins. ${n} did the work. The quarterly report got the credit.`,
];
const CORP_NO_POS = [
    (n) => `${n} found no position matching their rank and was forced to serve one grade below for the year.`,
    (n) => `The posting board had no openings at ${n}'s level. They filled a junior slot and drew junior pay. This was noted in their file under "flexibility."`,
];

// Small-line flavor — grinding, precarious, dreaming of the big leagues
const SMALL_ROUTE = [
    (n, co) => `${n} ran the same route again for ${co}. The ship smelled like recycled air and old credit slips.`,
    (n, co) => `Another run, another paycheck that barely covered the fuel and the docking fees at ${co}'s designated ports.`,
    (n, co) => `${co} moved goods, ${n} moved ${co}'s goods. This was the arrangement. It was not glamorous.`,
];
const SMALL_SPECULATIVE = [
    (n, co) => `${co} bet big on commodity futures. ${n} made the runs. The margins were razor thin and mostly in ${co}'s favor.`,
    (n) => `${n} spent the year chasing price differentials on behalf of a line operating perpetually one bad deal from insolvency.`,
];
const SMALL_EXPLORATORY = [
    (n, co) => `${co} sent ${n} out to find new markets. The routes were unmapped and the company's insurance coverage was unclear.`,
    (n) => `${n} opened new trade contacts for the line. Whether those contacts would still be there next quarter was not guaranteed.`,
];

// Free Trader flavor — independent operators, no company, no safety net
const FT_ROUTE = [
    (n) => `${n} ran a standard route. Legitimate cargo. Verified manifests. Even the customs inspector seemed disappointed.`,
    (n) => `The stars don't care about schedules. ${n} made the run anyway, late and over budget, profit scraped from the margins.`,
    (n) => `${n} flew the old familiar lane again. The ship needed work it wasn't getting. The cargo paid what it paid.`,
    (n) => `Nothing exciting. ${n} moved freight, collected payment, and kept the drives running. Some years are like that.`,
    (n) => `Three jumps, two clients, one near-miss with a customs scanner. ${n} cleared port with a profit and no awkward questions.`,
];
const FT_CHARTER = [
    (n) => `A charter client with no questions and a sealed cargo bay. ${n} didn't ask. Credits transferred on delivery.`,
    (n) => `The charter paid well. The client preferred not to be on record. ${n} preferred not to know why.`,
    (n) => `Exclusive transport contract. The passenger list was short, the non-disclosure clause was long, and the pay was excellent.`,
    (n) => `${n} flew a private charter to a system not on the standard lanes. The client asked for silence. ${n} kept it.`,
];
const FT_SPECULATIVE = [
    (n) => `${n} bought cheap and gambled on selling dear. Sometimes it worked. This time it mostly worked.`,
    (n) => `Speculative cargo and a nose for market gaps. ${n} played the odds and came out ahead, barely.`,
    (n) => `The market intelligence was good. The hold was full of something a destination world needed badly. ${n} made the call and it paid.`,
    (n) => `Commodity trading at jump range. Ore bought on a mining world, luxury goods on the return leg. ${n} called it a living.`,
    (n) => `${n} read the market, placed the bet, and sat in jump space hoping the price held. It mostly held.`,
];
const FT_EXPLORATORY = [
    (n) => `${n} jumped toward the edge of known space looking for trade contacts nobody else had found yet. The void offered no guarantees.`,
    (n) => `First contact with an underdeveloped system. ${n} planted a flag, opened a ledger, and started talking price.`,
    (n) => `Deep frontier work. No charts worth trusting, no backup, no rescue if the drives failed. ${n} found a market worth coming back to.`,
    (n) => `${n} spent the year opening new lanes — the kind that don't appear on corporate maps because no one else survived long enough to file them.`,
    (n) => `Underdeveloped world, no established trade contact, no guaranteed buyer. ${n} improvised. It worked better than expected.`,
];
const FT_SMUGGLING = [
    (n) => `The manifest listed machine parts. The crates said otherwise. ${n}'s quick hands and a sealed cargo bay kept the inspector satisfied.`,
    (n) => `Moving contraband through contested space. ${n} had run the route before. Knew where the patrol windows were. Knew the risk.`,
    (n) => `${n} didn't ask what was in the containers. The client didn't say. The credits cleared and the ship jumped before anyone looked too closely.`,
    (n) => `Restricted goods, a nervous broker, and an orbital checkpoint with a shift change at 0400. ${n} timed it right.`,
    (n) => `The item was illegal on five worlds and taxed prohibitively on three more. ${n} found the sixth.`,
];
const FT_PIRACY = [
    (n) => `They called it enforcement of salvage rights. The crew of the target ship used a different word. ${n} came out ahead.`,
    (n) => `${n} hit a trader two systems out from port. Clean intercept, fast boarding, minimal violence. The cargo was valuable. The moral ledger was not reviewed.`,
    (n) => `Piracy is a business. ${n} ran it like one: target selection, risk assessment, speed. The profit margin was the best it had been all year.`,
    (n) => `The target's transponder said courier. The hold said something else. ${n}'s crew left them with a working drive and nothing worth flying.`,
    (n) => `Two ships, one ambush. ${n}'s crew knew which side of the intercept to be on. The math was simple.`,
];
const FT_NO_BUSINESS = [
    (n) => `Three weeks groundside with no contracts. The credits drained slowly. ${n} took odd jobs and waited for something to come through.`,
    (n) => `No work. ${n} sat in a dockside bar and watched ships that weren't theirs move goods that weren't going their way.`,
    (n) => `The market had dried up. ${n} stayed planetside, did some maintenance, and tried not to count the remaining credit balance too often.`,
    (n) => `A year of false leads and missed connections. ${n}'s broker took a cut of nothing. The portmaster charged a docking fee for the privilege.`,
    (n) => `Sometimes the galaxy just doesn't have anything for you. ${n} waited it out, kept the ship ready, and kept the crew fed. Barely.`,
];
const FT_END_OF_TERM = [
    (n) => `Four years flying independent. ${n}'s ship held together. So did ${n}.`,
    (n) => `No quarterly reviews. No performance ratings. Just the ledger and the drives, and ${n} kept both out of the red.`,
    (n) => `${n} filed no reports to anyone, answered to no corporate board, and survived to fly another term. That was the whole deal.`,
    (n) => `The ship needed a new motivator and the hold had seen better days. ${n} had too — but they were still out here.`,
    (n) => `Four years of runs, deals, close calls, and marginal profits. Free trading is less a career and more a condition. ${n} had it bad.`,
    (n) => `Same ship. Roughly the same debts. Different systems, different faces, same question at the end of every run: was it worth it. ${n} kept saying yes.`,
];

// ─── Death flavor pools ───────────────────────────────────────────────────────
// ACCIDENT (non-combat, low survival target): field mishaps, equipment failure, exposure

const DEATH_ACCIDENT_ARMY = [
    (n) => `A fault in the training equipment went undetected through three inspection cycles before it claimed ${n}'s life during a live-fire exercise — the kind of death that generates a safety memo and nothing else.`,
    (n) => `In the low-visibility conditions of a nighttime sweep, ${n} was caught in friendly fire from a unit that couldn't see the markings; the investigation that followed was thorough and arrived at the expected conclusion.`,
    (n) => `${n} sustained a field injury that should have been manageable, but medical response was delayed by terrain and communication failure, and what began as a treatable wound became something it shouldn't have been.`,
    (n) => `Extended exposure to the heat, radiation, and atmospheric conditions of the deployment zone left ${n} with injuries the forward aid station couldn't reverse, despite the fact that every protocol had been followed exactly as written.`,
    (n) => `A section of building collapsed without warning during what had been a routine garrison sweep, burying ${n} under debris in a structure that engineering had cleared two days prior.`,
];

const DEATH_ACCIDENT_NAVY = [
    (n) => `A reactor coolant leak on ${n}'s deck went undetected for six hours, and by the time the alarm triggered the exposure had already reached a level the ship's medical bay was not equipped to treat.`,
    (n) => `${n} was conducting a routine external inspection when the EVA tether failed at its fastening point; recovery was launched within four minutes and reached the coordinates, but ${n} was not there.`,
    (n) => `A pressure failure in an unmanned maintenance corridor turned out to be manned — ${n} had gone in to run a diagnostic ahead of schedule, a fact that wasn't logged and wasn't known until it was too late.`,
    (n) => `During what was logged as a standard systems drill, a cascade malfunction in the power coupling injured three crew members and killed ${n}; the incident review board completed its report, filed recommendations, and moved on.`,
    (n) => `${n} suffered an acute medical episode three jumps from the nearest facility capable of treating it, and the ship's doctor did everything that could be done in the time that was available, which turned out to be insufficient.`,
];

const DEATH_ACCIDENT_SCOUT = [
    (n) => `A microfracture in the environmental suit's collar seal went undetected by pre-mission checks, and ${n} was two kilometers into a survey traverse before the alarm sounded, too far from the ship for the situation to resolve in their favor.`,
    (n) => `The ground in the survey zone was geologically unstable in ways the preliminary scans hadn't captured, and ${n} was lost in a collapse during what was logged as a standard surface reconnaissance.`,
    (n) => `The equipment failed in deep field in a way that ${n}'s training hadn't covered, not because the training was inadequate but because the failure mode was one that hadn't been documented before — it is now.`,
    (n) => `${n} contracted a pathogen that the ship's medical systems couldn't identify, and by the time a sample reached a facility capable of analysis, the question had already answered itself; the report classifies the cause as environmental exposure.`,
    (n) => `The atmospheric sensor readings in the survey zone were within acceptable parameters until they weren't, and ${n} had already committed to the sample site before the discrepancy became apparent.`,
];

const DEATH_ACCIDENT_GENERIC = [
    (n) => `${n} died in the course of routine duty, not through any failure of skill or preparation but simply because the work carries risks that documentation and protocols can reduce but never eliminate.`,
    (n) => `The frontier doesn't require malice to be lethal — it only requires the right combination of accumulated small variables arriving at the wrong moment, which is what happened to ${n}.`,
    (n) => `Every career in service to the Imperium carries a line of actuarial fine print that most people never have to read; ${n} was one of the ones for whom it turned out to apply.`,
];

// HAZARDOUS_DUTY (borderline, security work, patrol incidents, boardings gone wrong)

const DEATH_HAZARDOUS_ARMY = [
    (n) => `A civil disturbance that command had assessed as low-risk escalated within forty minutes into something that left three soldiers dead and ${n} among them, the after-action report noting that threat assessment procedures would be reviewed.`,
    (n) => `A civilian in the crowd that ${n}'s unit was managing turned out to be carrying a concealed weapon and used it before anyone could respond; the incident report describes the situation as having been handled correctly up to that point.`,
    (n) => `During a counter-riot deployment in an unstable district, ${n} was separated from the unit during the dispersal and didn't survive the separation — the report classifies it as a civil unrest response fatality.`,
    (n) => `${n} was leading the extraction team during a hostage situation when the situation changed in the final thirty seconds; the hostages came out alive, and ${n} did not.`,
    (n) => `An ambush during a security sweep indicated that the patrol schedule had been compromised; ${n} was in the lead element, and the attackers had clearly prepared for exactly that configuration.`,
];

const DEATH_HAZARDOUS_MARINES = [
    (n) => `The boarding operation went according to plan until the point where the target vessel's actual crew manifest diverged significantly from the one on record, and ${n} was in the section of the ship where that divergence became apparent first.`,
    (n) => `What began as a standard shipboard security response to a disturbance in the cargo hold escalated well beyond the initial assessment, and by the time reinforcements arrived ${n} had already been lost.`,
    (n) => `The hold was supposed to be empty and the inspection was supposed to be a formality; ${n} was the first one through the hatch when both of those assumptions turned out to be incorrect.`,
    (n) => `A weapons transfer aboard a troop transport resulted in an accidental discharge during handling — a preventable accident by every metric, which makes it exactly as final as any other kind.`,
];

const DEATH_HAZARDOUS_NAVY = [
    (n) => `${n}'s patrol encountered a vessel that refused to respond to repeated hailing attempts and, when intercepted, turned out to have good reasons for that refusal and the means to act on them.`,
    (n) => `The interdiction of a suspected smuggling vessel became a boarding action when the crew chose to resist rather than comply, and ${n} was part of the team that went aboard into a situation where resistance had already been established.`,
    (n) => `The patrol found what it had been sent to look for, which is not always the straightforward success it sounds like — the finding cost ${n}'s life and confirmed the intelligence that had originally sent the patrol out.`,
    (n) => `The contact the patrol was tracking appeared on sensors as a single small vessel and turned out to be bait; ${n}'s ship survived the ambush that followed, though ${n} did not.`,
    (n) => `A live-ordnance targeting exercise ended in a fatality that the investigating board attributed to human error in the loading sequence, though the crew who were present have always maintained that the conclusion was simpler than the evidence warranted.`,
    (n) => `${n} was running maintenance on an active weapon system when it discharged, a failure mode that the safety manual addresses in four separate sections and that happened anyway, because safety manuals describe what should occur rather than what does.`,
];

// COMBAT (isCombat, standard engagements)

const DEATH_COMBAT_ARMY = [
    (n) => `${n} was killed during a counter-insurgency sweep when an improvised device detonated on a route that had been cleared the previous day, the kind of death that generates an intelligence report and a name on a list.`,
    (n) => `The firefight in the built-up district lasted most of the afternoon, and ${n} held the position that needed holding long enough for the rest of the unit to consolidate, which is the kind of outcome that reads well in citations and costs everything.`,
    (n) => `During a police action that command had projected as low-intensity, ${n} encountered opposition that the projection hadn't accounted for, and the engagement that followed went into the report under a category that requires no further explanation.`,
    (n) => `${n} was killed in the opening phase of the assault before the objective had been reached, and the posthumous commendation that was filed captures the facts of the action without quite capturing what it cost.`,
    (n) => `The objective was secured by the time the unit reached the extraction point, but ${n} had been left behind in the consolidation phase — not abandoned, simply unable to be reached in the time available.`,
    (n) => `${n} established the suppressing position in the corridor and held it long enough for the rest of the squad to get to safety, which is a description that sounds like the beginning of a story and is actually the end of one.`,
];

const DEATH_COMBAT_NAVY = [
    (n) => `${n} was stationed in the section of the ship that absorbed the direct hit during the siege, and while the vessel survived the engagement and completed its mission, ${n} was not among the crew that brought it back to port.`,
    (n) => `The fleet engagement was recorded as a tactical success, and ${n}'s name appears in the battle report under the station that was destroyed, listed with the notation "destroyed with honors" as though that phrase contains more than it does.`,
    (n) => `The siege ran considerably longer than the initial projections suggested it would, and ${n} was there for most of it before not being there anymore, which is a distinction the record notes without elaboration.`,
    (n) => `${n} was at the gun turret during the strike run when it took a direct hit; the ship completed its mission and returned to base, and the after-action report notes the strike as successful.`,
    (n) => `The boarding party that ${n} was leading encountered armed resistance from the moment the hatch opened, and while the breach was ultimately successful and the objective achieved, ${n} was not among those who emerged.`,
];

const DEATH_COMBAT_SCOUT = [
    (n) => `${n}'s mission was classified as a standard special assignment, but the operational zone had been reclassified as active wartime territory between the briefing and the deployment, a discrepancy that the mission planning process had not accounted for.`,
    (n) => `The assignment required ${n} to be armed for the first time in several years of field work, which was itself a signal about the nature of what they were being sent into; the weapon was used, and it wasn't sufficient.`,
    (n) => `The Scout Service classifies the operation in which ${n} died as active survey, and the file that describes it is sealed at a clearance level that most people who knew ${n} will never hold.`,
    (n) => `The wartime assignment briefing described the role as observational, and ${n} proceeded on that basis until the situation on the ground made the original framing impossible to maintain, at which point adaptation became survival became neither.`,
];

const DEATH_COMBAT_GENERIC = [
    (n) => `${n} was killed in a combat engagement during active service — the engagement was recorded in detail, the death was noted in the appropriate registers, and the conflict that produced both continued without pause.`,
    (n) => `Every soldier who signs understands that combat is part of the terms; ${n} understood this, served within those terms, and died within them, which is as much as anyone who signs can ask for and as little as it sounds.`,
    (n) => `The mission was accomplished according to the after-action assessment, and ${n}'s name appears in the cost column of that assessment, which is the column that doesn't get read at the debriefing.`,
];

// INTENSE_COMBAT (major assaults, fleet battles, high casualty expected)

const DEATH_INTENSE_ARMY = [
    (n) => `The raid went in with full knowledge that casualties were expected, and ${n} was part of the assault element that made the initial contact with the target's defenses, which is the part of a raid where the expected casualties tend to occur.`,
    (n) => `The assault on the fortified position was the kind of operation that command describes as strategically necessary and soldiers describe in other terms; ${n} was among the casualties that the strategic necessity produced.`,
    (n) => `${n} died in the first wave of an assault whose objective was described in terms that made the cost seem abstract until the cost arrived, at which point it became very concrete.`,
    (n) => `By the time ${n} was killed, the counter-insurgency had quietly become a war in everything but name, a reclassification that the official reports still decline to make even in retrospect.`,
    (n) => `${n}'s unit reached the target and accomplished what they were sent to do, but the extraction didn't include everyone, and the tally of who made it back lists ${n} in the column that doesn't get celebrated.`,
    (n) => `The raid was successful by every operational metric, which is the kind of sentence that can be written about an action that also kills people, and which is exactly the kind of sentence that was written about the action that killed ${n}.`,
];

const DEATH_INTENSE_NAVY = [
    (n) => `${n} was serving aboard a vessel that absorbed catastrophic damage during the fleet engagement — the ship was not designed to survive what it encountered, the crew was not expected to survive it, and very few of them did.`,
    (n) => `The battle that killed ${n} was described as decisive in the operational summary, a word that belongs to the side that won it, and ${n}'s section of the fleet was on the side for whom it was decisive in a different sense.`,
    (n) => `${n} was aboard a strike vessel that neutralized its target before being destroyed on the return vector — the mission was classified as accomplished, and ${n}'s death was logged under the category that means the same thing as accomplished.`,
    (n) => `The void gives nothing back, and ${n}'s ship was destroyed with all hands during the engagement; the record says "all hands" and means it, and ${n} is one of the names that phrase contains.`,
    (n) => `A gun crew in a direct fleet engagement operates without meaningful cover, a fact that ${n} understood and accepted by virtue of being at the gun when the exchange began and remaining there until it ended.`,
    (n) => `The gunnery exchange lasted eleven minutes from first contact to cessation, and ${n} was recorded as active at their station for the first ten of those minutes, which is as long as the station remained active.`,
];

const DEATH_INTENSE_SCOUT = [
    (n) => `${n}'s wartime posting was active in the field when the conflict reached the operational zone, and the gap between "active wartime posting" and "direct combat fatality" turned out to be narrower than the mission brief had suggested.`,
    (n) => `${n}'s survey ship was conducting observations in a system that became an engagement zone during the operation, and a vessel configured for survey work is not configured for what ${n} encountered there.`,
    (n) => `The wartime zone was designated as low-intensity at the time ${n} was assigned to it, a designation that the zone's subsequent behavior did not support, and ${n} died as a result of the discrepancy between the designation and the reality.`,
    (n) => `${n} was killed while conducting scientific work in a system that the military had reclassified as an active engagement zone without that reclassification propagating to the Scout Service's operational calendar in time for it to matter.`,
];

// BLACK_OPS (Scout Detached office — intelligence work, deep cover, deniable operations)

const DEATH_BLACK_OPS = [
    (n) => `${n}'s file in the Scout Service is marked classified at a level that most people who knew ${n} will never hold, and the cause of death listed in the accessible portion of the record is "mission-related incident," a phrase that has been chosen to describe the situation accurately while describing it as little as possible.`,
    (n) => `Every deep cover operation has a duration beyond which the probability of continuation begins to work against the operative, and ${n}'s assignment exceeded that duration in a system where extraction was not a realistic option.`,
    (n) => `${n} was operating under a documented false identity in a hostile system when contact was lost; no body has been recovered, no public inquiry has been opened, and the Scout Service's position is that no comment is appropriate.`,
    (n) => `The intelligence work required ${n} to be present in locations from which, by the nature of the work, they could not be extracted if the situation changed — and ${n} understood this requirement and accepted it when the assignment was offered.`,
    (n) => `${n} died performing work that is not officially acknowledged to have occurred, conducted on behalf of an organization that is not officially acknowledged to have directed it; the pension was disbursed to the listed next of kin without explanation, which is the standard procedure.`,
    (n) => `${n}'s cover was compromised at a point in the operation when breaking cover would have cost the mission and maintaining it would cost ${n}, and the choice that was made reflects everything that Detached duty asks of the people who volunteer for it.`,
    (n) => `The final data burst ${n} transmitted before going dark contained intelligence that proved operationally valuable, and ${n} would have understood the economics of that transaction even if it's unlikely they would have described it in those terms.`,
    (n) => `${n}'s final operational log entry is a timestamp with no accompanying notation, which is itself a notation of a kind — Detached operatives who have time to write something usually do.`,
    (n) => `The cover held across three years of embedded operation in a system that had every reason to look closely, and then it didn't hold anymore, and the difference between those two states is where ${n} is now.`,
    (n) => `There is a memorial maintained by the Scout Service at an undisclosed location where the names of operatives lost in deniable operations are recorded; ${n}'s name is there, though no one outside the Service will confirm this.`,
];

// CRIMINAL — SMUGGLING (Merchant FT, caught by authorities or cargo hazard)

const DEATH_CRIMINAL_SMUGGLING = [
    (n) => `The checkpoint that ${n} passed through had been designated routine in every prior transit, and the additional personnel and scanning equipment that were present on this occasion turned out to be the result of intelligence that ${n} didn't have access to.`,
    (n) => `The client represented the cargo as safe to transport and the route as clear, and both of those representations turned out to be incorrect in ways that became apparent to ${n} in the wrong order — the route first, then the cargo.`,
    (n) => `${n} had run contraband through this corridor a number of times without incident, which is the kind of track record that produces confidence in a route right up until the patrol cutter assigned to that corridor is upgraded to something faster.`,
    (n) => `The transaction was structured so that ${n} would meet the buyer at the destination and receive payment on delivery, which is why ${n} didn't know until arrival that the buyer was conducting the transaction in a professional law enforcement capacity.`,
    (n) => `The information that someone in the network had talked reached ${n} approximately forty minutes after it would have been useful, and in the interval between those two points the situation had already resolved itself.`,
    (n) => `The item that ${n} agreed to transport was restricted across six systems for reasons that weren't entirely clear from the contract, and attempting delivery to the seventh system was how ${n} found out what those reasons were.`,
    (n) => `A tip was filed with port authority that described ${n}'s vessel, cargo, and scheduled departure with a level of specificity that indicated someone with direct operational knowledge, and by the time ${n} received any indication that something was wrong the berth was already surrounded.`,
    (n) => `The scanner that ${n}'s vessel passed through had been upgraded since the last transit of this route, and the upgraded version detected what the previous version had missed, and the officers at the terminal were prepared for exactly that result.`,
];

// CRIMINAL — PIRACY (Merchant FT, target fought back or naval interdiction)

const DEATH_CRIMINAL_PIRACY = [
    (n) => `The target vessel's defensive capacity was significantly higher than the intelligence assessment had indicated, and ${n}'s approach profile was optimized for an intercept against a much less capable ship, a mismatch that resolved itself quickly and badly.`,
    (n) => `A naval escort appeared in the system approximately thirty seconds after ${n}'s intercept was committed, operating under a transponder code that appeared on no chart ${n} had access to, and the engagement that followed was not the one ${n} had planned for.`,
    (n) => `The split of the proceeds became a source of conflict among the crew at a point in the operation when conflict among the crew was the worst possible variable to introduce, and ${n} was on the side of the argument that lost.`,
    (n) => `${n} selected a target that turned out to be carrying personnel who were not the kind that file incident reports or request assistance — they were the kind that communicate through consequences, and the consequence they chose to send was ${n}.`,
    (n) => `Piracy as a business model depends on accurate target selection, and the operation that killed ${n} failed at that stage in a way that didn't become apparent until the intercept was already committed and the boarding was already in progress.`,
    (n) => `The target identified ${n}'s vessel through a registration cross-reference and filed a bounty with three separate recovery organizations; ${n} evaded collection for six months before one of those organizations located the ship.`,
    (n) => `${n} ran the intercept correctly and the boarding cleanly, and the naval response that arrived while ${n} was still aboard the target was not the result of any error in the operation — it was simply already in the system, waiting for exactly this kind of signal.`,
    (n) => `${n} was in the target vessel's cargo bay when the crew made the decision to jump rather than continue resisting the boarding, a decision that solved the crew's problem while creating a considerably more serious one for ${n}.`,
];

// FREE TRADER — non-criminal deaths by assignment type

const DEATH_FT_ROUTE = [
    (n) => `${n}'s ship departed on a standard cargo run and failed to arrive at the destination on the projected schedule, and when a search was dispatched to the intermediate waypoints, the vessel was found adrift with no distress signal logged and no final entry in the ship's record.`,
    (n) => `The run was the same route ${n} had completed dozens of times before, which is perhaps why the drive anomaly that appeared on day two of transit didn't register as the emergency it turned out to be until it was well past the point where anything could be done about it.`,
    (n) => `${n} died moving cargo between stars, which is what ${n} did, and the risk that came with doing it caught up with them on a run that was in every other way unremarkable.`,
    (n) => `${n}'s transponder went silent somewhere in the second jump corridor, and the cargo manifest that was eventually recovered with the hull lists goods that never reached their destination, which is the administrative summary of a death that deserves more than an administrative summary.`,
];

const DEATH_FT_CHARTER = [
    (n) => `The charter client provided accurate information about the destination, the timeline, and the payment terms, and declined to provide any information about the parties who had reason to intercept the delivery, a gap in the briefing that proved fatal.`,
    (n) => `${n} took the charter because the pay was better than anything else on the board and the client seemed credible, and both of those assessments were accurate — the client was credible and the pay was good, and neither fact was sufficient protection against what followed.`,
    (n) => `The cargo bay had been sealed per the client's instructions and ${n} had agreed not to open it, which was a reasonable term until the nature of what was inside became relevant to ${n}'s survival, at which point reasonable terms were no longer the governing consideration.`,
    (n) => `The client's enemies moved faster than the client's warnings, and ${n} received the information that would have changed the route about twelve hours after the route was no longer changeable.`,
];

const DEATH_FT_SPECULATIVE = [
    (n) => `${n} read the market correctly and made a well-reasoned speculative bet on a commodity that turned out to have undisclosed complications attached to it, the kind that don't appear in the trade listings and don't become apparent until the transaction is too far along to exit.`,
    (n) => `The seller's representation of the goods did not include any mention of the outstanding debt that was attached to them, and the parties responsible for collecting that debt were not interested in ${n}'s explanation that the purchase had been made in good faith.`,
    (n) => `${n} acquired cargo that another party considered their property regardless of the transaction ${n} had completed to obtain it, and the resolution of that disagreement did not go in ${n}'s favor.`,
];

const DEATH_FT_EXPLORATORY = [
    (n) => `${n} jumped into an uncharted system on an exploratory trade mission and failed to transmit the navigation data that would have allowed anyone to follow — whether that was because the situation prevented transmission or because there was nothing left to transmit from is a question the record cannot answer.`,
    (n) => `First contact with a previously uncharted inhabited system is one of the most significant events a free trader can experience, and it doesn't always proceed in a direction that allows the trader to file a report afterward; ${n}'s experience was of that kind.`,
    (n) => `The frontier doesn't discriminate between experienced operators and inexperienced ones, and ${n} had enough experience to know this while also having exactly as much as every other trader who has found a new system and not come back from it.`,
    (n) => `The drive gave out at a point in the exploratory route that was three jumps from the nearest port and one jump past the point where ${n}'s repair supplies were adequate to the task — ${n} worked the problem for as long as there was a problem to work.`,
];

// Corporate merchant death flavor (non-FT)
const CORP_DEATH_ROUTE = [
    (n, co) => `${n} was listed as a casualty in ${co}'s internal incident report under category 7: "personnel loss." Next of kin were notified via automated correspondence.`,
    (n, co) => `${co}'s quarterly safety review noted the incident involving ${n}. A process review was scheduled. No changes were made.`,
];
const CORP_DEATH_HAZARD = [
    (n, co) => `${co}'s liability waiver covered the circumstances of ${n}'s death. The legal team was satisfied. ${n} was not available for comment.`,
    (n) => `${n} died doing the work. The corporation logged it as an acceptable operational loss and moved on.`,
];

export function buildMerchantYearHistory(
    characterName, assignment, _dept, year, _term,
    isLarge, isFT, _lineName, companyName, flags
) {
    const { bonusAmount, posAvail } = flags;
    const n = characterName;
    const co = companyName;
    let flavor = '';

    if (isFT) {
        switch (assignment) {
            case 'Route': flavor = pick(FT_ROUTE)(n); break;
            case 'Charter': flavor = pick(FT_CHARTER)(n); break;
            case 'Speculative': flavor = pick(FT_SPECULATIVE)(n); break;
            case 'Exploratory': flavor = pick(FT_EXPLORATORY)(n); break;
            case 'Smuggling': flavor = pick(FT_SMUGGLING)(n); break;
            case 'Piracy': flavor = pick(FT_PIRACY)(n); break;
            case 'No Business': flavor = pick(FT_NO_BUSINESS)(n); break;
            default: flavor = `${n} completed the assignment.`;
        }
    } else if (isLarge) {
        switch (assignment) {
            case 'Route': flavor = pick(CORP_ROUTE)(n, co); break;
            case 'Charter': flavor = pick(CORP_CHARTER)(n, co); break;
            case 'Speculative': flavor = pick(CORP_SPECULATIVE)(n, co); break;
            case 'Exploratory': flavor = pick(CORP_EXPLORATORY)(n, co); break;
            default: flavor = pick(CORP_ROUTE)(n, co);
        }
    } else {
        switch (assignment) {
            case 'Route': flavor = pick(SMALL_ROUTE)(n, co); break;
            case 'Charter': flavor = pick(CORP_CHARTER)(n, co); break;
            case 'Speculative': flavor = pick(SMALL_SPECULATIVE)(n, co); break;
            case 'Exploratory': flavor = pick(SMALL_EXPLORATORY)(n, co); break;
            default: flavor = pick(SMALL_ROUTE)(n, co);
        }
    }

    let line = `[Year ${year} — ${assignment}] ${flavor}`;
    if (!posAvail) line += ' ' + pick(CORP_NO_POS)(n);
    if (bonusAmount > 0) line += ` A profit-sharing bonus of Cr${bonusAmount.toLocaleString()} was deposited.`;

    return line;
}

export function buildMerchantDeathHistory(characterName, assignment, _dept, _isLarge, isFT) {
    const n = characterName;
    if (isFT) {
        let pool;
        switch (assignment) {
            case 'Smuggling':    pool = DEATH_CRIMINAL_SMUGGLING; break;
            case 'Piracy':      pool = DEATH_CRIMINAL_PIRACY; break;
            case 'Charter':     pool = DEATH_FT_CHARTER; break;
            case 'Speculative': pool = DEATH_FT_SPECULATIVE; break;
            case 'Exploratory': pool = DEATH_FT_EXPLORATORY; break;
            default:            pool = DEATH_FT_ROUTE;
        }
        return `${pick(pool)(n)} The story ends here.`;
    }
    const co = 'the company';
    if (['Exploratory', 'Speculative'].includes(assignment)) return `${pick(CORP_DEATH_HAZARD)(n, co)} The story ends here.`;
    return `${pick(CORP_DEATH_ROUTE)(n, co)} The story ends here.`;
}

export function buildMerchantEndOfTermHistory(characterName, termNumber, dept, lineName, agingHist, isFT = false) {
    if (isFT) {
        return pick(FT_END_OF_TERM)(characterName) + agingHist;
    }
    const lines = [
        `${characterName} completed term ${termNumber} in the ${dept} Department with ${lineName}.`,
        `Four years logged with ${lineName}. ${characterName}'s file was updated. Performance was noted.`,
        `Term ${termNumber} closed. ${characterName} continued to move cargo, manage accounts, and be compensated accordingly by ${lineName}.`,
    ];
    return pick(lines) + agingHist;
}