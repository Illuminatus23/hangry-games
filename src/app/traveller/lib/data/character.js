export const schools = {
    college: {
        admission: [9, 'EDU', 9, 2],
        success: [7, 'INT', 8, 2],
        otc: [8, 'SOC', 8, 1],
        notc: [9, 'SOC', 10, 1],
        education: ['1d6-2', 'INT', 9, 1],
        honors: [10, 'INT', 10, 1],
        skills: [],
    },
    navy: {
        admission: [10, 'SOC', 10, 2],
        success: [9, 'EDU', 8, 2],
        education: ['1d6-3', 'INT', 9, 1],
        honors: [9, 'INT', 9, 1],
        skills: ['Vacc Suit', 'Navigation', 'Engineering']
    },
    military: {
        admission: [10, 'STR', 10, 2],
        success: [9, 'EDU', 8, 2],
        education: ['1d6-3', 'INT', 9, 1],
        honors: [9, 'INT', 9, 1],
        skills: ['Tactics', 'Leadership', 'Admin', 'Heavy Weapons', 'Forward Observer', 'Computer']
    },
    merchants: {
        admission: [9, 'EDU', 10, 2],
        success: [9, 'EDU', 8, 2],
        education: ['1d6-3', 'INT', 9, 1],
        honors: [9, 'INT', 9, 1],
        skills: [],
    },
    medical: {
        admission: [9, 'EDU', 10, 2],
        success: [8, 'EDU', 8, 2],
        education: ['1', 'AUTO'],
        honors: [11, 'EDU', 11, 1],
        skills: ['Medical', 'Medical', 'Medical', 'Admin'],
        hskills: ['Medical', 'Computer'],
    },
    flight: {
        admission: [9, 'DEX', 9, 1],
        success: [7, 'INT', 8, 1],
        education: [0, 'INT', 8, 1],
        honors: [0, 'INT', 8, 1],
        skills: ['Ships Boat', 'Navigation', 'Pilot'],
    },
    autoflight: {
        admission: [0, 'DEX', 9, 1],
        success: [7, 'INT', 8, 1],
        education: [0, 'INT', 8, 1],
        honors: [0, 'INT', 8, 1],
        skills: ['Ships Boat', 'Navigation', 'Pilot'],
    },
};

export const chanceToDescriptor = ["guaranteed", "guaranteed", "guaranteed", "nearly guaranteed", "very likely", "very high", "high", "average", "below average", "low", "very low", "unlikely", "near impossible", "non-existent", "impossible"];
export const skillToDescriptor = ["average", "trained", "proficient", "adept", "expert", "a master"];

export const decorationDescriptor = {
    'MCUF': 'Meritorious Conduct Under Fire',
    'MCG': 'Medal for Conspicuous Gallantry',
    'SEH': 'Starburst for Extreme Heroism'
};

export const Title = {
    M: ['', ['Knight', 'Sir'], ['Baron', 'Lord'], ['Marquis', 'Marquis'], ['Count', 'Count'], ['Duke', 'Duke']],
    F: ['', ['Knightess', 'Dame'], ['Baroness', 'Lady'], ['Marchioness', 'Marchioness'], ['Countess', 'Countess'], ['Duchess', 'Duchess']]
};

export const rank = {
    army: {
        E: ['', ['Private', 'Pvt'], ['Lance Corporal', 'LCpl'], ['Corporal', 'Cpl'], ['Lance Sergeant', 'Sgt'],
            ['Sergeant', 'Sgt'], ['Gunnery Sergeant', 'Sgt'], ['Leading Sergeant', 'LdSgt'], ['First Sergeant', 'Sgt'], ['Sergeant Major', 'Sgt Maj']],
        O: ['', ['Second Lieutenant', 'Lt'], ['First Lieutenant', 'Lt'], ['Captain', 'Cpt'], ['Major', 'Maj'], ['Lieutenant Colonel', 'Lt Col'],
            ['Colonel', 'Col'], ['Brigadier General', 'Brg Gen'], ['Major General', 'Maj Gen'], ['Lieutenant General', 'Lt Gen'], ['General', 'Gen']]
    },
    marines: {
        E: ['', ['Private', 'Pvt'], ['Lance Corporal', 'LCpl'], ['Corporal', 'Cpl'], ['Lance Sergeant', 'Sgt'],
            ['Sergeant', 'Sgt'], ['Gunnery Sergeant', 'Sgt'], ['Leading Sergeant', 'Sgt'], ['First Sergeant', 'Sgt'], ['Sergeant Major', 'Sgt Maj']],
        O: ['', ['Second Lieutenant', 'Lt'], ['First Lieutenant', 'Lt'], ['Captain', 'Cpt'], ['Force Commander', 'Com'], ['Lieutenant Colonel', 'Lt Col'],
            ['Colonel', 'Col'], ['Brigadier General', 'Brg Gen'], ['Major General', 'Maj Gen'], ['Lieutenant General', 'Lt Gen'], ['General', 'Gen']]
    },
    navy: {
        E: ['', ['Spacehand Recruit', ''], ['Spacehand Apprentice', ''], ['Able Spacehand', ''], ['Petty Officer 3rd Class', ''],
            ['Petty Officer 2nd Class', ''], ['Petty Officer 1st Class', ''], ['Chief Petty Officer', ''], ['Senior Chief Petty Officer', ''], ['Master Chief Petty Officer', '']],
        O: ['', ['Ensign', 'Ens'], ['Sublieutenant', 'Sub Lt'], ['Lieutenant', 'Lt'], ['Lieutenant Commander', 'Lt Com'], ['Commander', 'Com'], ['Captain', 'Capt'],
            ['Commodore', 'Comm'], ['Fleet Admiral', 'Admr'], ['Sector Admiral', 'Admr'], ['Grand Admiral', 'Admr']]
    },
    scouts: {
        E: ['Field Operative', ['Recruit', ''], ['Apprentice', ''], ['Journeyman', ''], ['Skilled Worker', ''], ['Assistant Team Leader', ''], ['Team Leader', ''], ['Assistant Supervisor', ''], ['Supervisor', ''], ['Senior Supervisor', '']],
        O: ['', ['Administrative Trainee', ''], ['Junior Administrator', ''], ['Administrator', ''], ['Group Administrator', ''], ['Senior Administrator', ''], ['Scout Commander', ''], ['Scout Leader', ''],
            ['Senior Scout Leader', ''], ['Sector Scout Leader', '']]
    },
    merchants: {
        E: [['Employee', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', ''], ['Crewman', '']],
        O: {
            Deck: [['Apprentice', ''], ['4th Officer', ''], ['3rd Officer', ''], ['2nd Officer', ''], ['1st Officer', ''], ['Captain', 'Capt'], ['Senior Captain', 'Capt'], ['Line Commodore', 'Cmdr']],
            Engineering: [['Assistant Drive Hand', ''], ['Drive Hand', ''], ['Assistant Engineer', ''], ['Engineer', ''], ['Chief Engineer', '']],
            Purser: [['Steward', ''], ['Junior Purser', ''], ['Assistant Purser', ''], ['Purser', ''], ['Chief Purser', '']],
            Medical: [['Steward', ''], ['Junior Purser', ''], ['Assistant Medic', ''], ['Medic', 'Dr'], ['Chief Purser', 'Dr']],
            Administration: [['Clerk', ''], ['Assistant Manager', ''], ['Manager', ''], ['Assistant Station Head', ''], ['Station Head', '']],
            Sales: [['Apprentice', ''], ['Clerk', ''], ['Assistant Broker', ''], ['Broker', ''], ['Senior Broker', '']],
            Freetraders: ['', ['4th Officer', ''], ['3rd Officer', ''], ['2nd Officer', ''], ['1st Officer', ''], ['Captain', 'Capt'], ['Owner', 'Capt']]
        }
    },
    flyer: {
        E: [['', ''], ['', '']],
        O: ['', ['Pilot', ''], ['Flight Leader', ''], ['Squadron Leader', ''], ['Staff Major', ''], ['Group Leader', ''], ['Air Marshall', ''],],
        skills: {
            'E1': ['Vacc Suit', 'Aircraft']
        }
    },
    sailor: {
        E: [['', ''], ['', '']],
        O: [['', ''], ['Ensign', 'Ens'], ['Lieutenant', 'Lt'], ['Lieutenant Commander', 'Lt Cdr'], ['Commander', 'Cdr'], ['Captain', 'Cpt'], ['Admiral', 'Adm'],],
        skills: {
            'E1': ['Small Watercraft'],
            'O2': ['Large Watercraft']
        }
    },
    "law enforcement": {
        E: [['', ''], ['', '']],
        O: [['', ''], ['Corporal', 'Cpl'], ['Sergeant', 'Sgt'], ['Lieutenant', 'Lt'], ['Detective', 'Det'], ['Chief', 'Chf'], ['Commissioner', 'Commr']],
        skills: {
            'E1': ['Streetwise'],
            'O4': ['Interrogation'],
            'O5': ['Admin'],
            'O6': ['Liaison'],
        }
    },
    doctor: {
        E: [['', ''], ['', '']],
        O: [['', '']],
        skills: {
            'E1': ['Medical'],
        }
    },
    diplomat: {
        E: [['', ''], ['', '']],
        O: [['', ''], ['3rd Secretary', 'Sec'], ['2nd Secretary', 'Sec'], ['1st Secretary', 'Sec'], ['Councilor', 'Councilor'], ['Minister', 'Minister'], ['Ambassador', 'Ambassador']],
        skills: {
            'E1': ['Liaison'],
        }
    },
    bureaucrat: {
        E: [['', ''], ['', '']],
        O: [['', ''], ['Clerk', ''], ['Supervisor', 'Supvr'], ['Assistant Manager', 'Asst Mgr'], ['Manager', 'Mgr'], ['Executive', 'Exec'], ['Director', 'Dir']],
        skills: {}
    },
    scientist: {
        E: [['', ''], ['', '']],
        O: [['', '']],
        skills: {
            'E1': ['Technical'],
        }
    },
    belter: {
        E: [['', ''], ['', '']],
        O: [['', '']],
        skills: {
            'Term1': ['Vacc Suit'],
            'Term3': ['Zero-G'],
        }
    },
    pirate: {
        E: [['', ''], ['', '']],
        O: [['', ''], ['Henchman', ''], ['Corporal', ''], ['Sergeant', ''], ['Lieutenant', ''], ['Leader', ''], ['Leader', '']],
        skills: {
            'E1': ['Brawling'],
            'O4': ['Pilot'],
        }
    },
    rogue: {
        E: [['', ''], ['', '']],
        O: [['', '']],
        skills: {
            'E1': ['Streetwise'],
        }
    },
    hunter: {
        E: [['', ''], ['', '']],
        O: [['', '']],
        skills: {
            'E1': ['Hunting'],
        }
    },
    barbarian: {
        E: [['', ''], ['', '']],
        O: [['', ''], ['Brave', ''], ['Warrior', ''], ['Leader', ''], ['Chieftain', ''], ['Chief', 'Chief'], ['Elder', 'Elder'],],
        skills: {
            'E1': ['Large Blade'],
            'O2': ['Blade Combat'],
            'O4': ['Leadership'],
        }
    },
};

export const careerDesc = {
    army: "enlisted in the army, a ground-based military force. Soldiers serve on worlds throughout the Imperium, defending against external threats and maintaining order in times of conflict.",
    marines: "enlisted in the marines, a combined-arms force trained for shipboard combat and planetary assault. Marines are among the most elite fighters in the Imperium, equally at home in a vacuum or on the ground.",
    navy: "enlisted in the navy, the interstellar military arm responsible for patrolling space lanes and engaging hostile vessels. Naval personnel operate the great warships of the Imperium.",
    scouts: "joined the Scout Service, an organization responsible for exploration, survey, and communications across the Imperium. Scouts are self-reliant individuals who often operate alone in uncharted territory.",
    merchants: "signed on with a merchant line, working aboard commercial vessels that carry trade goods between star systems. Merchants develop broad practical skills from life aboard ship and on diverse worlds.",
    flyer: "began a career in the air force flyers. Flyers are members of the Close Orbit and Airspace Control (the Air Force) of a world. Flyers patrol the world from the air and from orbit, monitor traffic to and from the world, and protect the world from hostile spacecraft.",
    sailor: "began a military career in the Nautical Force Command (the wet navy) of a world. Sailors patrol a world's hydrosphere, monitor traffic upon it, and protect those travelling the seaways from being preyed upon by lawless elements",
    "law enforcement": "became a law enforcement officer, serving in the security and police services of a world. Law enforcers typically have good investigative skills and tend to be familiar with the unsavory aspects of society.",
    doctor: "started a career as a medical doctor, a trained individual conducting a medical practice. Doctors know and understand well the art and science of medical diagnosis and treatment.",
    diplomat: "began a career as a diplomat, a member of the foreign service of a government. Diplomats may gain valuable interpersonal abilities and academic knowledge during their careers.",
    bureaucrat: "began a career as a bureaucrat, an individual in a government or organization in a management or executive capacity. Bureaucrats are often well-versed in the administrative and economic aspects of commerce.",
    scientist: "began a career as a scientist, trained in the technological or research sciences. Scientists conduct scientific investigations into materials, situations, and phenomena.",
    belter: "became a belter, an individual who prospects and mines asteroid belts in search of mineral deposits, artifacts, or salvageable materials. Being a belter is a difficult and often dangerous career, calling for individuals who are highly self-reliant, competent, and determined.",
    pirate: "became a pirate and joined the crew of an interplanetary or interstellar vessel making a living by attacking, hijacking, or plundering commerce. Pirates tend to be rugged individuals who depend heavily on cunning and skill, as well as a measure of luck.",
    rogue: "began a life of crime, familiar with the rougher and more illegal methods of accomplishing tasks. Rogues tend to be good at circumventing the law, which, unfortunately, also makes them somewhat likely to be wanted criminals on one or more worlds.",
    hunter: "became a hunter who tracks and hunts animals for sport or profit. Hunters often become quite knowledgeable about the less urban aspects of visiting alien worlds.",
    barbarian: "became a barbarian, a rugged individual from a primitive world. Barbarians are accustomed to hardship and are well versed in wilderness and survival situations.",
    noble: "took up the mantle of the nobility, entering a life of privilege and political influence. Nobles move in the highest social circles and often wield considerable power over the worlds beneath their station.",
};

export const Skills = {
    'Mental': ['INT', 'EDU'],
    'Physical': ['STR', 'END', 'DEX'],
    'Academic': ['Admin', 'History', 'Linguistics', 'Persuasion', 'Science', 'EDU'],
    'Aircraft': ['Helicopter', 'Jet Aircraft', 'Lighter-than-Air Craft', 'Propeller Aircraft'],
    'Animal Handling': ['Guard/Hunting Beasts', 'Equestrian', 'Herding'],
    'Archaic Weapons': ['Blowgun', 'Bola', 'Boomerang', 'Bow', 'Crossbow', 'Early Firearms', 'Sling'],
    'Blade Combat': ['Axe', 'Cudgel', 'Foil', 'Large Blade', 'Polearm', 'Small Blade'],
    'Economic': ['Admin', 'Broker', 'Legal', 'Trader'],
    'Environ': ['Animal Handling', 'Archaic Weapons', 'Hunting', 'Recon', 'Stealth', 'Survival'],
    'Exploratory': ['Pilot', 'Sensor Ops', 'Survey', 'Survival', 'Vacc Suit', 'Vehicle'],
    'FA Gunnery': ['High-Energy Weapons', 'Mass Drivers', 'Meson Guns', 'Mortars and Howitzers'],
    'Gun Combat': ['Rifleman', 'Handguns', 'Laser Weapons', 'Neural Weapons', 'Energy Weapons', 'Submachineguns'],
    'Gunnery': ['Screens', 'Spinal Weapons', 'Turret Weapons'],
    'Hand Combat': ['Blade Combat', 'Brawling', 'END', 'STR'],
    'Handguns': ['Body Pistol', 'Gauss Pistol', 'Pistol', 'Revolver', 'Snub Pistol'],
    'Heavy Weapons': ['Grenade Launcher', 'Light Assault Gun', 'Machine Gun', 'Autocannon', 'Flamethrower', 'VRF Gauss Gun'],
    'Inborn': ['Artisan', 'Carousing', 'Instruction', 'Jack-of-all-Trades', 'Leadership'],
    'Interpersonal': ['Admin', 'Interview', 'Linguistics', 'Liaison', 'Recruiting', 'Steward'],
    'Science': ['Biology', 'Chemistry', 'Genetics', 'Forensics', 'Medical', 'Physics', 'Robotics'],
    'Space': ['Engineering', 'Sensor Ops', 'Navigation', 'Pilot', 'Ships Boat', 'Vacc Suit'],
    'Space Combat': ['Gunnery', 'Sensor Ops', 'Ship Tactics', 'Tactics'],
    'Space Tech': ['Communications', 'Computer', 'Engineering', 'Gravitics', 'Naval Architect', 'Vacc Suit'],
    'Special Combat': ['Battle Dress', 'Combat Engineering', 'Combat Rifleman', 'Demolition', 'FA Gunnery', 'Forward Observer', 'Grav Belt', 'Heavy Weapons', 'High-Energy Weapons', 'High-G Environ', 'Stealth', 'Low-G Environ'],
    'Technical': ['Communications', 'Computer', 'Electronics', 'Gravitics', 'Robot Ops', 'Sensor Ops'],
    'Vehicle': ['Helicopter', 'Jet Aircraft', 'Lighter-than-Air Craft', 'Propeller Aircraft', 'Small Watercraft', 'Large Watercraft', 'Grav Vehicle', 'Ships Boat', 'Tracked Vehicles', 'Wheeled Vehicles', 'Hovercraft'],
    'Vice': ['Bribery', 'Disguise', 'Forgery', 'Gambling', 'Intrusion', 'Streetwise'],
};

export const Weapons = ["Advanced Combat Rifle", "Assault Rifle", "Autocannon", "Autoshotgun", "Battle Axe", "Bayonet", "Blade", "Blowgun", "Body Pistol", "Bola", "Boomerang", "Bow", "Broadsword", "Carbine", "Crossbow", "Cudgel", "Cutlass", "Dagger", "Archaic Firearm", "Flamethrower", "Foil", "Fusion Gun", "Gauss Pistol", "Gauss Rifle", "Grenade Launcher", "Halberd", "Hand Axe", "Laser Pistol", "Laser Rifle", "Light Assault Gun", "Machine Gun", "Neural Pistol", "Neural Rifle", "Pike", "Pistol", "Plasma Gun", "Revolver", "Rifle", "Shotgun", "Sling", "Snub Pistol", "Spear", "Submachinegun", "Sword", "VRF Gauss Gun"];
