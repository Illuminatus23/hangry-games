export const Army = {
    Infantry: {
        "Training": [0, 0, 6, 7, false],
        "Internal Security": [4, 12, 6, 0, false],
        "Police Action": [5, 8, 8, 7, true],
        "Counter Insurgency": [5, 10, 9, 8, true],
        "Raid": [6, 6, 6, 5, true],
        "Garrison": [0, 0, 7, 0, false],
        "Survival": ['Skill', 'MOS', 2, 1],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'EDU', 7, 1],
        "Command": {
            "marines": 7,
            "army": 7
        },
        "Assignment": ['Raid', 'Raid', 'Counter Insurgency', 'Counter Insurgency', 'Garrison', 'Garrison', 'Training', 'Police Action', 'Internal Security', 'Special', 'Special'],
        "MOS": ['Gun Combat', 'Special Combat', 'Heavy Weapons', 'Heavy Weapons', 'Vehicle', 'Environ', 'Vacc Suit']
    },
    Marines: {
        "Training": [0, 0, 6, 7, false],
        "Police Action": [5, 8, 8, 7, true],
        "Raid": [6, 5, 6, 5, true],
        "Ship's Troops": [4, 12, 6, 6, false],
        "Garrison": [0, 0, 7, 0, false],
        "Survival": ['Skill', 'MOS', 2, 1],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'EDU', 7, 1],
        "Command": {
            "marines": 7,
            "army": 7
        },
        "Assignment": ['Raid', 'Raid', 'Counter Insurgency', 'Counter Insurgency', 'Garrison', 'Garrison', 'Training', 'Police Action', 'Internal Security', 'Special', 'Special'],
        "MOS": ['Gun Combat', 'Special Combat', 'Zero-G Combat', 'Zero-G Combat', 'Heavy Weapons', 'Forward Observer', 'Battle Dress']
    },
    Support: {
        "Training": [0, 0, 6, 8, false],
        "Internal Security": [4, 0, 6, 0, false],
        "Police Action": [4, 10, 9, 7, true],
        "Counter Insurgency": [5, 11, 10, 7, true],
        "Raid": [6, 7, 7, 6, true],
        "Garrison": [0, 0, 7, 0, false],
        "Survival": ['None'],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'INT', 8, 1],
        "Command": {
            "marines": 10,
            "army": 10
        },
        "Assignment": ['Raid', 'Internal Security', 'Counter Insurgency', 'Garrison', 'Garrison', 'Garrison', 'Training', 'Police Action', 'Internal Security', 'Special', 'Special'],
        "MOS": ['Vehicle', 'Combat Engineering', 'Vehicle', 'Mechanical', 'Electronic', 'Medical', 'Technical']
    },
    Commando: {
        "Training": [3, 0, 8, 6, false],
        "Internal Security": [4, 0, 7, 0, false],
        "Police Action": [4, 9, 8, 7, true],
        "Counter Insurgency": [5, 8, 7, 6, true],
        "Survival": ['Skill', 'MOS', 2, 1],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'END', 8, 1],
        "Command": {
            "marines": 7,
            "army": 6
        },
        "Assignment": ['Raid', 'Raid', 'Counter Insurgency', 'Police Action', 'Police Action', 'Internal Security', 'Training', 'Counter Insurgency', 'Raid', 'Special', 'Special'],
        "MOS": ['Gun Combat', 'Special Combat', 'Heavy Weapons', 'Demolitions', 'Environ', 'Recon', 'Battle Dress']
    },
    Artillery: {
        "Training": [0, 0, 6, 7, false],
        "Internal Security": [4, 12, 6, 0, false],
        "Police Action": [5, 8, 8, 7, true],
        "Counter Insurgency": [5, 10, 9, 8, true],
        "Raid": [6, 6, 6, 5, true],
        "Garrison": [0, 0, 7, 0, false],
        "Survival": ['Skill', 'MOS', 2, 1],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'EDU', 7, 1],
        "Command": {
            "marines": 9,
            "army": 8
        },
        "Assignment": ['Raid', 'Training', 'Counter Insurgency', 'Police Action', 'Garrison', 'Garrison', 'Training', 'Police Action', 'Counter Insurgency', 'Special', 'Special'],
        "MOS": ['Field Artillery Gunner', 'Field Artillery Gunner', 'Vehicle', 'Mechanical', 'Forward Observer', 'Computer', 'Technical']
    },
    Cavalry: {
        "Training": [0, 0, 6, 7, false],
        "Internal Security": [4, 12, 6, 0, false],
        "Police Action": [5, 8, 8, 7, true],
        "Counter Insurgency": [5, 10, 9, 8, true],
        "Raid": [6, 6, 6, 5, true],
        "Garrison": [0, 0, 7, 0, false],
        "Survival": ['Skill', 'MOS', 2, 1],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'EDU', 7, 1],
        "Command": {
            "marines": 7,
            "army": 7
        },
        "Assignment": ['Raid', 'Training', 'Counter Insurgency', 'Police Action', 'Garrison', 'Garrison', 'Training', 'Police Action', 'Internal Security', 'Special', 'Special'],
        "MOS": ['Vehicle', 'Vehicle', 'Vehicle', 'Heavy Weapons', 'Heavy Weapons', 'Mechanical', 'Technical']
    },
    ServiceSkills: {
        "Army Life": ["Brawling", "STR", "Vice", "DEX", "END", "END", "Handgun", "SOC", "SOC"],
        "Marines Life": ["Brawling", "Vice", "STR", "DEX", "END", "Hand Combat", "EDU", "SOC", "SOC"],
        "NCO": ["Heavy Weapons", "Mechanical", "Tactics", "Heavy Weapons", "Mechanical", "Tactics", "Leadership", "Inborn", "Interpersonal"],
        "Command": ["END", "Gun Combat", "Vehicle", "Heavy Weapons", "Leadership", "Tactics", "Tactics", "Inborn"],
        "Staff": ["Mechanical", "Forward Observer", "Computer", "Electronics", "Medical", "Instruction", "Administration", "Academic"],
        "Shipboard Life": ["Forward Observer", "Ships Boat", "Gunnery", "Vacc Suit", "Gunnery", "Vacc Suit", "Ship Tactics", "Fleet Tactics"]
    },
    Special: {
        "E": ["Cross-Training", "Specialist School", "Commando School", "Protected Forces", "Recruiting", "Recruiting", "OCS", "OCS"],
        "O": ["Intelligence School", "Command College", "Staff College", "Commando School", "Recruiting", "Military Aide"],
        "Schools": ['Mechanical', 'Electronic', 'Gravitics', 'Comm', 'Vehicle', 'Ships Boat'],
        "SmartSchools": ['Academic', 'Medical', 'Space', 'Environ', 'Computer', 'Liaison']
    },
    SchoolSkills: {
        Commando: [5, ["Brawling", "Gun Combat", "Demolitions", "Intrusion", "Stealth", "Survival", "Recon", "Vacc Suit", "Blade Combat", "Instruction"]],
        Protected: [3, ["High-G Environ", "Zero-G Combat", "Vacc Suit"]],
        Intelligence: [4, ["Forgery", "Bribery", "Streetwise", "Interrogation", "Vice"]],
        Staff: [4, ["Admin", "Combat Engineering", "Computer", "Robot Ops"]],
        Command: [4, ["Tactics", "Leadership", "Recon"]],
        Engineering: [4, ["Mechanical", "Electronic", "Engineering", "Vacc Suit", "Computer", "Gravitics"]],
    },
    Muster: {
        army: {
            cash: [2, 5, 10, 10, 10, 20, 30],
            benefits: ['Low passage', 'INT', 'EDU+2', 'Weapon', 'High passage', 'Mid passage', 'SOC'],
        },
        marines: {
            cash: [2, 5, 5, 10, 20, 30, 40],
            benefits: ['Low passage', 'INT+2', 'EDU', 'Weapon', 'Traveller Aid Membership', 'High Passage', 'SOC+2'],
        },
    },
};
