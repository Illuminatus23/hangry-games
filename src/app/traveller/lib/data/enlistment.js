export const fullEnlistmentOps = {
    "marines": {
        enlist: [9, 'INT', 8, 'STR', 8],
        availability: [['tech', 6]],
        category: "marines",
    },
    "army": {
        enlist: [5, 'DEX', 6, 'END', 5],
        availability: [['tech', 4]],
        category: "army",
    },
    "imperial navy": {
        enlist: [8, 'INT', 8, 'EDU', 9],
        availability: [['tech', 6]],
        category: "navy",
    },
    "reserve fleet navy": {
        enlist: [7, 'INT', 8, 'EDU', 9],
        availability: [['tech', 6]],
        category: "navy",
    },
    "system squadron navy": {
        enlist: [6, 'INT', 8, 'EDU', 9],
        availability: [['tech', 6]],
        category: "navy",
    },
    "scouts": {
        enlist: [7, 'INT', 6, 'STR', 8],
        availability: [['tech', 4]],
        category: "scouts",
    },
    "megacorp trader": {
        enlist: [9, 'STR', 7, 'INT', 6],
        availability: [['starport', 'B']],
        category: "merchants",
    },
    "sector-wide trader": {
        enlist: [8, 'STR', 7, 'INT', 6],
        availability: [['starport', 'C']],
        category: "merchants",
    },
    "subsector-wide trader": {
        enlist: [7, 'STR', 7, 'INT', 6],
        availability: [['starport', 'D']],
        category: "merchants",
    },
    "interface trader": {
        enlist: [7, 'STR', 7, 'INT', 6],
        availability: [['starport', 'E']],
        category: "merchants",
    },
    "fledgling trader": {
        enlist: [7, 'STR', 7, 'INT', 6],
        availability: [['starport', 'E']],
        category: "merchants",
    },
    "free trader": {
        enlist: [7, 'STR', 7, 'INT', 6],
        availability: [['starport', 'E']],
        category: "merchants",
    },
    "flyer": {
        enlist: [6, 'STR', 7, 'DEX', 9],
        availability: [['tech', 2], ['pop', 2], ['atmos', 2]],
        category: "basic",
    },
    "sailor": {
        enlist: [6, 'END', 10, 'STR', 8],
        availability: [['hydro', 4]],
        category: "basic",
    },
    "belter": {
        enlist: [8, 'DEX', 9, 'INT', 6],
        availability: [['tech', 6]],
        category: "basic",
    },
    "pirate": {
        enlist: [7, 'SOC', -7, 'END', 9],
        availability: [['tech', 6]],
        category: "basic",
    },
    "rogue": {
        enlist: [6, 'SOC', -8, 'END', 7],
        availability: [['tech', 2]],
        category: "basic",
    },
    "hunter": {
        enlist: [9, 'DEX', 10, 'END', 9],
        availability: [['atmos', 2]],
        category: "basic",
    },
    "barbarian": {
        enlist: [5, 'END', 9, 'STR', 10],
        availability: [['tech', -1]],
        category: "basic",
    },
    "law enforcement": {
        enlist: [6, 'INT', 7, 'DEX', 10],
        availability: [['tech', 2]],
        category: "basic",
    },
    "diplomat": {
        enlist: [8, 'EDU', 8, 'SOC', 9],
        availability: [['tech', 2], ['law', 1]],
        category: "basic",
    },
    "bureaucrat": {
        enlist: [5, 'EDU', 8, 'STR', -8],
        availability: [['pop', 2], ['law', 1]],
        category: "basic",
    },
    "scientist": {
        enlist: [6, 'INT', 9, 'EDU', 10],
        availability: [['tech', 4]],
        category: "basic",
    },
    "noble": {
        enlist: [0, 'END', 9, 'STR', 10],
        availability: [['SOC', 10], ['tech', 4]],
        category: "basic",
    },
};

export const serviceBranchOptions = {
    "Army": {
        "Infantry": ["Infantry", "Ground troops specializing in rifles, recon, and heavy weapons."],
        "Cavalry": ["Cavalry", "Ground troops specializing in air and land support."],
        "Artillery": ["Artillery", "Support troops specializing in bombardment and artillery."],
        "Support": ["Support", "Support troops providing medical and technical services to regular troops."]
    },
    "Marines": {
        "Marine Infantry": ["Marines", "Zero-G assault troops."],
        "Support": ["Support", "Support troops providing medical and technical services to regular troops."]
    },
    "Navy": {
        "Flight": ["Flight", "Officers who pilot the large vessels of the Navy."],
        "Medical": ["Medical", "Support branch providing medical care during combat and peace."],
        "Engineering": ["Engineering", "Branch responsible for the maintenance of starship drives and engines."],
        "Gunnery": ["Gunnery", "Branch responsible for the firing and maintenance of starship scale weapons."],
        "Ship&#39;s Crew": ["Crew", "General duty branch usually serving on a ship's bridge."],
        "Ship&#39;s Command Line": ["Line", "General officers serving on a ship's bridge."],
        "Technical Services": ["Technical", "Support branch responsible for maintenance of mechanical ship elements."]
    },
    "Scouts": {
        "Detached Duty": ["Detached", "Office of ex-scouts, records, and intelligence."],
        "Operations": ["Operations", "Office of security, maintenance and fleets."],
        "Administration": ["Administration", "The Bureaucracy in charge of finance, procurement and personnel."],
        "Technical Services": ["Technical", "Education, research and development."]
    },
    "Merchants": {
        "Purser": ["Purser", "Support staff, medical staff and liasons serving on a trade vessel."],
        "Sales": ["Sales", "Planet and starpoint stationed branch responsible for the business of trade."],
        "Engineering": ["Engineering", "Branch responsible for the maintenance of starship drives and engines."],
        "Deck": ["Deck", "General duty branch usually serving on a ship's bridge."]
    }
};
