
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
        if (isCombat) {
            const loc = battleName ?? "the engagement";
            return isMarine
                ? `${prefix}${characterName} fell in ${loc}. The Corps does not forget its dead. The story ends here.`
                : `${prefix}${characterName} was killed in action during ${loc}. Another name for the regimental roll. The story ends here.`;
        }
        return isMarine
            ? `${prefix}The service claimed ${characterName} during a ${assignment} assignment. The Corps does not forget. The story ends here.`
            : `${prefix}${characterName} was killed during a ${assignment} assignment. The story ends here.`;
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
        const kiaLines = {
            imperial: `${characterName} was lost during ${battleName ?? "a naval engagement"}. The Imperial Navy records the names of its dead. The story ends here.`,
            reserve: `${characterName} was killed in action. The Reserve Fleet does not forget those it loses. The story ends here.`,
            system: `${characterName} was killed defending the system. The planet they protected will remember. The story ends here.`,
        };
        return isCombat
            ? `${prefix}${base}, and was killed in action.`
            : `${prefix}${kiaLines[ft] ?? kiaLines.imperial}`;
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
        if (isCombat) {
            return `${prefix}${characterName} was killed in action${worldName ? ` in the ${worldName} system` : ""}. The signal never came back. The story ends here.`;
        }
        return `${prefix}${characterName} was lost on a ${assignment} assignment${worldName ? ` in the ${worldName} system` : ""}. The Scout Service filed a missing-persons report. The story ends here.`;
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

// Free Trader flavor — individualism, danger, barely legal
const FT_ROUTE = [
    (n) => `${n} ran a standard route. Legitimate cargo. Verified manifests. Even the customs inspector seemed disappointed.`,
    (n) => `The stars don't care about schedules. ${n} made the run anyway, late and over budget, profit scraped from the margins.`,
    (n) => `${n} flew the old familiar lane again. The ship needed work it wasn't getting. The cargo paid what it paid.`,
];
const FT_CHARTER = [
    (n) => `A charter client with no questions and a sealed cargo bay. ${n} didn't ask. Credits transferred on delivery.`,
    (n) => `The charter paid well. The client preferred not to be on record. ${n} preferred not to know why.`,
];
const FT_SPECULATIVE = [
    (n) => `${n} bought cheap and gambled on selling dear. Sometimes it worked. This time it mostly worked.`,
    (n) => `Speculative cargo and a nose for market gaps. ${n} played the odds and came out ahead, barely.`,
];
const FT_EXPLORATORY = [
    (n) => `${n} jumped toward the edge of known space looking for trade contacts nobody else had found yet. The void offered no guarantees.`,
    (n) => `First contact with an underdeveloped system. ${n} planted a flag, opened a ledger, and started talking price.`,
];
const FT_SMUGGLING = [
    (n) => `The manifest listed machine parts. The crates said otherwise. ${n}'s quick hands and a sealed cargo bay kept the inspector happy.`,
    (n) => `Moving contraband through contested space. ${n} had run the route before. Knew where the patrol windows were. Knew the risk.`,
    (n) => `${n} didn't ask what was in the containers. The client didn't say. The credits cleared and the ship jumped before anyone looked too hard.`,
];
const FT_PIRACY = [
    (n) => `They called it enforcement of salvage rights. The crew of the target ship used a different word for it. ${n} came out ahead.`,
    (n) => `${n} hit a trader two systems out from port. Clean intercept, fast boarding, minimal violence. The cargo was valuable. The moral ledger was not reviewed.`,
    (n) => `Piracy is a business. ${n} ran it like one: target selection, risk assessment, speed. The profit margin was the best it had been all year.`,
];
const FT_NO_BUSINESS = [
    (n) => `Three weeks groundside with no contracts. The credits drained slowly. ${n} took odd jobs and waited for something to come through.`,
    (n) => `No work. ${n} sat in a dockside bar and watched ships that weren't theirs move goods that weren't going their way.`,
    (n) => `The market had dried up. ${n} stayed planetside, did some maintenance, and tried not to count the remaining credit balance too often.`,
];

// Death flavor
const CORP_DEATH_ROUTE = [
    (n, co) => `${n} was listed as a casualty in ${co}'s internal incident report under category 7: "personnel loss." Next of kin were notified via automated correspondence.`,
    (n, co) => `${co}'s quarterly safety review noted the incident involving ${n}. A process review was scheduled. No changes were made.`,
];
const CORP_DEATH_HAZARD = [
    (n, co) => `${co}'s liability waiver covered the circumstances of ${n}'s death. The legal team was satisfied. ${n} was not available for comment.`,
    (n) => `${n} died doing the work. The corporation logged it as an acceptable operational loss and moved on.`,
];
const FT_DEATH = [
    (n) => `${n} didn't make it back from this one. The ship was recovered. The cargo was not. No one filed a report.`,
    (n) => `The job went wrong. ${n} knew the risks when they took it. Doesn't make it any less final.`,
    (n) => `${n} died in the void between stars. No fanfare. No pension. Just silence.`,
];

export function buildMerchantYearHistory(
    characterName, assignment, _dept, _year, _term,
    isLarge, isFT, _lineName, companyName, flags
) {
    const { skillGained, bonusAmount, posAvail } = flags;
    const n = characterName;
    const co = companyName;
    let line = '';

    if (isFT) {
        switch (assignment) {
            case 'Route': line = pick(FT_ROUTE)(n); break;
            case 'Charter': line = pick(FT_CHARTER)(n); break;
            case 'Speculative': line = pick(FT_SPECULATIVE)(n); break;
            case 'Exploratory': line = pick(FT_EXPLORATORY)(n); break;
            case 'Smuggling': line = pick(FT_SMUGGLING)(n); break;
            case 'Piracy': line = pick(FT_PIRACY)(n); break;
            case 'No Business': line = pick(FT_NO_BUSINESS)(n); break;
            default: line = `${n} completed the assignment.`;
        }
    } else if (isLarge) {
        switch (assignment) {
            case 'Route': line = pick(CORP_ROUTE)(n, co); break;
            case 'Charter': line = pick(CORP_CHARTER)(n, co); break;
            case 'Speculative': line = pick(CORP_SPECULATIVE)(n, co); break;
            case 'Exploratory': line = pick(CORP_EXPLORATORY)(n, co); break;
            default: line = pick(CORP_ROUTE)(n, co);
        }
    } else {
        switch (assignment) {
            case 'Route': line = pick(SMALL_ROUTE)(n, co); break;
            case 'Charter': line = pick(CORP_CHARTER)(n, co); break;
            case 'Speculative': line = pick(SMALL_SPECULATIVE)(n, co); break;
            case 'Exploratory': line = pick(SMALL_EXPLORATORY)(n, co); break;
            default: line = pick(SMALL_ROUTE)(n, co);
        }
    }

    if (!posAvail) line += ' ' + pick(CORP_NO_POS)(n);
    if (skillGained) line += ` ${n} picked up something useful along the way.`;
    if (bonusAmount > 0) line += ` A profit-sharing bonus of Cr${bonusAmount.toLocaleString()} was deposited.`;

    return line;
}

export function buildMerchantDeathHistory(characterName, assignment, _dept, _isLarge, isFT) {
    const co = 'the company';
    if (isFT) return pick(FT_DEATH)(characterName);
    if (['Exploratory', 'Speculative'].includes(assignment)) return pick(CORP_DEATH_HAZARD)(characterName, co);
    return pick(CORP_DEATH_ROUTE)(characterName, co);
}

export function buildMerchantEndOfTermHistory(characterName, termNumber, dept, lineName, agingHist) {
    const lines = [
        `${characterName} completed term ${termNumber} in the ${dept} Department with ${lineName}.`,
        `Four years logged with ${lineName}. ${characterName}'s file was updated. Performance was noted.`,
        `Term ${termNumber} closed. ${characterName} continued to move cargo, manage accounts, and be compensated accordingly by ${lineName}.`,
    ];
    return pick(lines) + agingHist;
}