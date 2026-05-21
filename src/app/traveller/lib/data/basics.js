export const Basics = {
    flyer: {
        survival: [5, 'DEX', 8, 2],
        position: [5, 'EDU', 6, 1],
        promotion: [8, 'EDU', 8, 1],
        specduty: [6],
        reenlist: [6],
        skills: {
            personal: ['', 'Physical', 'DEX', 'END', 'Vice', 'Brawling', 'Inborn'],
            service: ['', 'Hand Combat', 'Vacc Suit', 'Gun Combat', 'Vehicle', 'Vehicle', 'Vehicle'],
            advanced: ['', 'Aircraft', 'Mechanical', 'Electronics', 'Gravitics', 'Gun Combat', 'Survival'],
            education: ['', 'Medical', 'Inborn', 'Space', 'Technical', 'Inborn', 'Interpersonal'],
        },
        specDutyDesc: 'saw some air combat during the battle name',
        muster: {
            cash: [2, 5, 10, 10, 10, 20, 30],
            benefits: ['Low passage', 'EDU', 'Weapon', 'Weapon', 'High passage', 'Mid passage', 'SOC']
        }
    },
    sailor: {
        survival: [5, 'END', 8, 2],
        position: [5, 'INT', 9, 1],
        promotion: [6, 'EDU', 8, 1],
        specduty: [6],
        reenlist: [6],
        skills: {
            personal: ['', 'Physical', 'DEX', 'END', 'Vice', 'Brawling', 'Inborn'],
            service: ['', 'Gun Combat', 'Communications', 'Forward Observer', 'Vehicle', 'Small Watercraft', 'Special Combat'],
            advanced: ['', 'Large Watercraft', 'Mechanical', 'Electronics', 'Gravitics', 'Navigation', 'Demolition'],
            education: ['', 'Medical', 'Vehicle', 'Vice', 'Technical', 'Inborn', 'Interpersonal'],
        },
        specDutyDesc: 'saw some sea combat during the battle name',
        muster: {
            cash: [2, 5, 10, 10, 10, 20, 30],
            benefits: ['Low passage', 'INT', 'EDU', 'Weapon', 'SOC', 'High passage', 'Traveller Aid Membership']
        }
    },
    "law enforcement": {
        survival: [6, 'INT', 7, 2],
        position: [6, 'EDU', 7, 1],
        promotion: [8, 'EDU', 8, 1],
        specduty: [4],
        reenlist: [6],
        skills: {
            personal: ['', 'Physical', 'DEX', 'Mental', 'Hand Combat', 'Vice', 'Gambling'],
            service: ['', 'Streetwise', 'Vehicle', 'Inborn', 'Hand Combat', 'Blade Combat', 'Gun Combat'],
            advanced: ['', 'Vice', 'Forensic', 'Environ', 'Tactics', 'Technical', 'Interrogation'],
            education: ['', 'Legal', 'Inborn', 'Economic', 'Interview', 'Forensic', 'Interpersonal'],
        },
        specDutyDesc: ['solved a high profile murder of a noble', 'cracked a cold case and put a predator behind bars', 'took on the local organized crime ring, and won', 'put a corrupt politician behind bars', 'shut down a smuggling operation'],
        muster: {
            cash: [1, 2, 5, 7.5, 10, 25, 50],
            benefits: ['Low passage', 'INT', 'Forensics kit', 'Weapon', 'High passage', 'SOC', 'Traveller Aid Membership']
        }
    },
    doctor: {
        survival: [4, 'INT', 8, 2],
        position: [99],
        promotion: [99],
        specduty: [6],
        reenlist: [4],
        skills: {
            personal: ['', 'STR', 'DEX', 'END', 'Mental', 'EDU', 'SOC'],
            service: ['', 'DEX', 'Technical', 'Medical', 'Vice', 'Medical', 'Blade Combat'],
            advanced: ['', 'Medical', 'Medical', 'Mechanical', 'Electronics', 'Technical', 'Academic'],
            education: ['', 'Medical', 'Science', 'Interpersonal', 'Technical', 'Mental', 'Academic'],
        },
        specDutyDesc: ['served as a medic in a war torn system', 'was mentored by a well-known surgeon', 'began their own private practice', 'did break through research on a deadly disease', 'studied alien physiology'],
        muster: {
            cash: [20, 20, 20, 30, 40, 60, 100],
            benefits: ['Low passage', 'EDU', 'EDU', 'Weapon', 'Medical instruments', 'Mid passage', '']
        }
    },
    diplomat: {
        survival: [4, 'EDU', 9, 2],
        position: [5, 'INT', 8, 1],
        promotion: [10, 'SOC', 10, 1],
        specduty: [5],
        reenlist: [5],
        skills: {
            personal: ['', 'Physical', 'EDU', 'Mental', 'Blade Combat', 'Gun Combat', 'Inborn'],
            service: ['', 'Mental', 'Vacc Suit', 'Vehicle', 'Vehicle', 'Vice', 'Computer'],
            advanced: ['', 'Vice', 'Streetwise', 'Interrogation', 'Recruiting', 'Inborn', 'Economic'],
            education: ['', 'Liaison', 'Interpersonal', 'Academic', 'Technical', 'Inborn', 'SOC'],
        },
        specDutyDesc: ['was part of a delegation that brokered an important peace treaty', 'was elected for a term as a local official', 'was mentored by a renowned politician', 'helped draft major planetary reforms', 'served as an ambassador in a foreign system'],
        muster: {
            cash: [2, 5, 10, 10, 10, 20, 30],
            benefits: ['Low passage', 'INT', 'EDU+2', 'Weapon', 'SOC', 'High passage', 'Travellers Aid membership']
        }
    },
    bureaucrat: {
        survival: [4, 'EDU', 10, 2],
        position: [6, 'SOC', 9, 1],
        promotion: [7, 'INT', 9, 1],
        specduty: [6],
        reenlist: [5],
        skills: {
            personal: ['', 'END', 'EDU', 'Mental', 'Brawling', 'DEX', 'Inborn'],
            service: ['', 'Gun Combat', 'Vehicle', 'Hand Combat', 'Inborn', 'Vehicle', 'EDU'],
            advanced: ['', 'Recruiting', 'Vehicle', 'Liaison', 'Interrogation', 'Interpersonal', 'Economic'],
            education: ['', 'Economic', 'Academic', 'Computer', 'Admin', 'Inborn', 'Leadership'],
        },
        specDutyDesc: ['brokered a major trade deal', 'served the board of directors of a megacorporation', 'served on a multi-system trade commission', 'was mentored by a highly successful investor', 'met all their KPIs and exceeded expectations'],
        muster: {
            cash: [0, 0, 10, 10, 40, 40, 80],
            benefits: ['Low passage', 'Mid passage', '', 'Watch', '', 'High passage', 'SOC']
        }
    },
    scientist: {
        survival: [5, 'EDU', 9, 2],
        position: [99],
        promotion: [99],
        specduty: [5],
        reenlist: [5],
        skills: {
            personal: ['', 'STR', 'DEX', 'END', 'Mental', 'Interpersonal', 'Inborn'],
            service: ['', 'Gun Combat', 'Hand Combat', 'Inborn', 'Vehicle', 'Space Tech', 'Environ'],
            advanced: ['', 'Mechanical', 'Electronics', 'Technical', 'Technical', 'Academic', 'Academic'],
            education: ['', 'Science', 'Science', 'Academic', 'Academic', 'Inborn', 'Mental'],
        },
        specDutyDesc: ['worked on cutting edge technology for a local government', 'was mentored by one of the top researchers in the galaxy', 'created many household inventions', 'completed some defense contracts to develop new weaponry', 'founded a think tank to study fringe fields of science'],
        muster: {
            cash: [1, 2, 5, 10, 20, 30, 40],
            benefits: ['Low passage', 'Mid passage', 'High passage', 'SOC', 'Weapon', 'Lab ship']
        }
    },
    belter: {
        survival: [9, 'TERMS'],
        position: [99],
        promotion: [99],
        specduty: [6],
        reenlist: [6],
        skills: {
            personal: ['', 'Physical', 'DEX', 'END', 'Vice', 'Hand Combat', 'Vacc Suit'],
            service: ['', 'Space', 'Zero-G Environ', 'Gun Combat', 'Prospect', 'Prospect', 'Space'],
            advanced: ['', 'Ships Boat', 'Mechanical', 'Electronics', 'Prospect', 'Explore', 'Space'],
            education: ['', 'Medical', 'Space', 'Space Tech', 'Technical', 'Inborn', 'Space Tech'],
        },
        specDutyDesc: ['discovered a forgotten belt rich in minerals', 'successfully fought off a gang of claim jumpers', 'was mentored by the grittiest, most ornery prospector in the galaxy', 'developed a new efficient mining technique', 'stumbled on some interesting ruins'],
        muster: {
            cash: [0, 0, 1, 10, 100, 100, 100],
            benefits: ['Low passage', 'INT', 'Weapon', 'High passage', 'Traveller Aid membership', 'Seeker']
        }
    },
    pirate: {
        survival: [6, 'INT', 8, 2],
        position: [9, 'STR', 10, 1],
        promotion: [8, 'INT', 9, 1],
        specduty: [5],
        reenlist: [7],
        skills: {
            personal: ['', 'Physical', 'DEX', 'END', 'Vice', 'Hand Combat', 'Blade Combat'],
            service: ['', 'Space', 'Zero-G Environ', 'Gun Combat', 'Special Combat', 'Blade Combat', 'Gun Combat'],
            advanced: ['', 'Vice', 'Mechanical', 'Gunnery', 'Ship Tactics', 'Tactics', 'Space'],
            education: ['', 'Pilot', 'Space', 'Vice', 'Technical', 'Inborn', 'Electronics'],
        },
        specDutyDesc: ['helped take a cruise liner without a single casualty', 'ransomed a noble family and escaped', 'helped defeat a rival crew in deep space', 'was captured, but was freed in a daring escape', 'captured a government transport of high quality goods'],
        muster: {
            cash: [0, 0, 1, 10, 50, 50, 50],
            benefits: ['Low passage', 'INT', 'Weapon', 'Letter of marque', 'SOC+-1', 'Mid passage', 'Corsair']
        }
    },
    rogue: {
        survival: [7, 'INT', 9, 2],
        position: [99],
        promotion: [99],
        specduty: [6],
        reenlist: [6],
        skills: {
            personal: ['', 'Physical', 'DEX', 'END', 'Vice', 'Hand Combat', 'Carousing'],
            service: ['', 'Hand Combat', 'Gun Combat', 'Demolition', 'Vehicle', 'EDU', 'Vehicle'],
            advanced: ['', 'Vice', 'Vice', 'Streetwise', 'Inborn', 'Interpersonal', 'Tactics'],
            education: ['', 'Medical', 'Vice', 'Vice', 'Technical', 'Inborn', 'Inborn'],
        },
        specDutyDesc: ['started a minor crime syndicate planetside', 'robbed a high security bank and got away', 'was arrested, but escaped', 'conned a noble out of some valuables', 'smuggled valuables into the local system'],
        muster: {
            cash: [0, 0, 10, 10, 50, 100, 100],
            benefits: ['Low passage', 'SOC', 'Weapon', 'Weapon', 'High passage', 'Traveller Aid membership']
        }
    },
    hunter: {
        survival: [6, 'STR', 10, 2],
        position: [99],
        promotion: [99],
        specduty: [6],
        reenlist: [6],
        skills: {
            personal: ['', 'Physical', 'DEX', 'END', 'Mental', 'Gun Combat', 'Blade Combat'],
            service: ['', 'Hand Combat', 'Gun Combat', 'Environ', 'Environ', 'Hunting', 'Vehicle'],
            advanced: ['', 'Electronics', 'Mechanical', 'Technical', 'Computer', 'Environ', 'Economic'],
            education: ['', 'Pilot', 'Space', 'Vice', 'Technical', 'Inborn', 'Electronics'],
        },
        specDutyDesc: ['discovered an unknown species', 'took down a predator of record breaking size', 'spent a full year in the wilderness', 'was mentored by a famous hunter', 'saved a species of exotic mammals through a capture and release program'],
        muster: {
            cash: [1, 1, 5, 5, 10, 100, 100],
            benefits: ['Low passage', 'High passage', 'Weapon', 'Weapon', 'Weapon', 'Safari ship']
        }
    },
    barbarian: {
        survival: [6, 'STR', 8, 2],
        position: [6, 'STR', 10, 1],
        promotion: [9, 'INT', 6, 1],
        specduty: [7],
        reenlist: [6],
        skills: {
            personal: ['', 'Physical', 'DEX', 'Physical', 'Vice', 'Physical', 'Hand Combat'],
            service: ['', 'Hand Combat', 'Hand Combat', 'Blade Combat', 'Environ', 'Archaic Weapons', 'Gun Combat'],
            advanced: ['', 'Hand Combat', 'Mechanical', 'Environ', 'Environ', 'Vice', 'Archaic Weapons'],
            education: ['', 'Medical', 'Interrogation', 'Tactics', 'Environ', 'Inborn', 'Inborn'],
        },
        specDutyDesc: ['helped conquer a neighboring tribe', 'fought off technologically advanced invaders', 'killed a giant predator plaguing their village', 'went on a vision quest in the wilderness for several years', 'was mentored by a great warrior'],
        muster: {
            cash: [0, 0, 1, 2, 3, 4, 5],
            benefits: ['Low passage', 'Weapon', 'Weapon', 'Weapon', '', 'High passage', 'High passage']
        }
    },
    noble: {
        survival: [4, 'STR', 99, 2],
        position: [5, 'EDU', 9, 1],
        promotion: [12, 'INT', 10, 1],
        specduty: [6],
        reenlist: [4],
        skills: {
            personal: ['', 'Physical', 'DEX', 'END', 'Mental', 'Vice', 'Hand Combat'],
            service: ['', 'Gun Combat', 'Hand Combat', 'Environ', 'Vehicle', 'Vice', 'DEX'],
            advanced: ['', 'Space', 'Ships Boat', 'Vehicle', 'Navigation', 'Space Tech', 'Leadership'],
            education: ['', 'Science', 'Technical', 'Academic', 'Interpersonal', 'Inborn', 'Inborn'],
        },
        specDutyDesc: ['joined the imperial entourage for a year', 'began a charitable foundation', 'led house troops on the field of battle', 'hosted two delegations on neutral ground to broker a peace deal', 'was mentored by a close relative'],
        muster: {
            cash: [10, 10, 50, 50, 100, 100, 200],
            benefits: ['Low passage', 'High passage', 'Weapon', 'Weapon', 'Traveller Aid membership', 'Yacht']
        }
    },
};
