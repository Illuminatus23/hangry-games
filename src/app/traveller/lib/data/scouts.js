export const Scouts = {
    Survey: {
        "Training": [3, 0, 0, 0, false],
        "Base": [3, 0, 0, 8, false],
        "Routine": [3, 0, 0, 7, false],
        "Mission": [4, 0, 0, 6, false],
        "Special": [5, 0, 0, 6, true],
        "Wartime": [6, 0, 0, 7, true],
        "Survival": ['UUP', 'END', 9, 1],
        "Skill": ['Terms', 'Terms', 3, 1],
        "Decoration": ['None'],
        "Promotion": ['None'],
        "MOS": ['Jack-of-All-Trades', 'Pilot', 'Vacc Suit', 'Vacc Suit', 'Survey', 'Space', 'Survival', 'Navigation', 'Engineering', 'Survey'],
        "School": ['Specialist', 'Specialist', 'Specialist', 'Field Training', 'Field Training', 'Field Training']
    },
    Communications: {
        "Training": [3, 0, 0, 0, false],
        "Base": [4, 0, 0, 14, false],
        "Routine": [4, 0, 0, 7, false],
        "Mission": [5, 0, 0, 7, false],
        "Special": [6, 0, 0, 6, true],
        "Wartime": [6, 0, 0, 6, true],
        "Survival": ['UUP', 'END', 9, 1],
        "Skill": ['Skill', 'Pilot', 3, 1],
        "Decoration": ['None'],
        "Promotion": ['None'],
        "MOS": ['Zero-G Combat', 'Pilot', 'Ships Boat', 'Vacc Suit', 'Communications', 'Space', 'Survival', 'Pilot', 'Navigation', 'Navigation'],
        "School": ['Specialist', 'Specialist', 'Ship', 'Ship', 'Field Training', 'Field Training']
    },
    Exploration: {
        "Training": [3, 0, 0, 0, false],
        "Base": [3, 0, 0, 14, false],
        "Routine": [4, 0, 0, 8, false],
        "Mission": [5, 0, 0, 7, false],
        "Special": [5, 0, 0, 7, true],
        "Wartime": [6, 0, 0, 6, true],
        "Survival": ['UUP', 'END', 9, 1],
        "Skill": ['UUP', 'INT', 9, 1],
        "Decoration": ['None'],
        "Promotion": ['None'],
        "MOS": ['Air Raft', 'Vehicle', 'Gun Combat', 'Vacc Suit', 'Recon', 'Space', 'Survival', 'Jack-of-All-Trades', 'Vehicle', 'Gun Combat'],
        "School": ['Specialist', 'Intelligence', 'Contact', 'Contact', 'Field Training', 'Field Training']
    },
    Administration: {
        "Training": [0, 0, 0, 0, false],
        "Base": [0, 0, 7, 7, false],
        "Routine": [0, 0, 7, 7, false],
        "Mission": [3, 0, 7, 7, false],
        "Special": [3, 0, 6, 7, true],
        "Wartime": [5, 0, 5, 7, true],
        "Survival": ['UUP', 'INT', 9, 1],
        "Skill": ['None'],
        "Decoration": ['None'],
        "Promotion": ['None'],
        "MOS": ['Electronic', 'Admin', 'Communications', 'Computer', 'Computer', 'Broker', 'INT', 'EDU', 'Liaison', 'Admin'],
        "School": ['Specialist', 'Specialist', 'Specialist', 'Ship', 'Field Training', 'Administrator']
    },
    Operations: {
        "Training": [0, 0, 8, 0, false],
        "Base": [0, 0, 9, 8, false],
        "Routine": [0, 0, 8, 8, false],
        "Mission": [3, 0, 7, 6, false],
        "Special": [4, 0, 6, 5, true],
        "Wartime": [5, 0, 4, 4, true],
        "Survival": ['Skill', 'Pilot', 2, 1],
        "Skill": ['None'],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'INT', 9, 1],
        "MOS": ['Mechanical', 'Gun Combat', 'Vehicle', 'Engineering', 'Computer', 'Navigation', 'Pilot', 'Ships Boat', 'Gunnery', 'Ship Tactics'],
        "School": ['Specialist', 'Specialist', 'Ship', 'Ship', 'Field Training', 'Administrator']
    },
    Technical: {
        "Training": [0, 0, 10, 0, false],
        "Base": [0, 0, 9, 7, false],
        "Routine": [0, 0, 9, 7, false],
        "Mission": [3, 0, 8, 6, false],
        "Special": [5, 0, 7, 7, true],
        "Wartime": [6, 0, 6, 6, true],
        "Survival": ['None'],
        "Skill": ['None'],
        "Decoration": ['None'],
        "Promotion": ['UUP', 'EDU', 10, 1],
        "MOS": ['STR', 'Mechanical', 'Vehicle', 'Vacc Suit', 'Electronic', 'Gravitics', 'Engineering', 'EDU', 'Computer', 'Medic'],
        "School": ['Specialist', 'Specialist', 'Technical', 'Technical', 'Technical', 'Administrator']
    },
    Detached: {
        "Training": [0, 0, 0, 0, false],
        "Base": [0, 0, 14, 14, false],
        "Routine": [0, 0, 8, 7, false],
        "Mission": [4, 0, 7, 6, false],
        "Special": [6, 0, 5, 6, true],
        "Wartime": [7, 0, 5, 4, true],
        "Survival": ['Officer', 'O', 1, 1],
        "Skill": ['None'],
        "Decoration": ['None'],
        "Promotion": ['None'],
        "MOS": ['Electronic', 'Admin', 'Communications', 'Computer', 'Computer', 'Gun Combat', 'Forgery', 'Brawling', 'Streetwise', 'Brawling'],
        "School": ['Specialist', 'Specialist', 'Specialist', 'Intelligence', 'Intelligence', 'Administrator']
    },
    BranchSelect: {
        "E": ['Survey', 'Survey', 'Survey', 'Survey', 'Communications', 'Communications', 'Communications', 'Communications', 'Exploration', 'Exploration', 'Exploration', 'Exploration'],
        "O": ['Detached', 'Detached', 'Technical', 'Technical', 'Operations', 'Operations', 'Operations', 'Administration', 'Administration', 'Administration', 'Administration']
    },
    ServiceSkills: {
        "Scouts Life": ['STR', 'Gambling', 'Gun Combat', 'Carousing', 'Gun Combat', 'Brawling', 'EDU', 'STR', 'END', 'DEX'],
        "Wartime": ['Hunting', 'Bribery', 'Equestrian', 'Forgery', 'Streetwise', 'Liaison', 'Survival', 'Gun Combat', 'Space', 'SOC'],
        "Field": ['Jack-of-All-Trades', 'EDU', 'Gun Combat', 'Carousing', 'Gun Combat', 'Gambling', 'EDU', 'Jack-of-All-Trades', 'Streetwise'],
        "Bureaucracy": ['INT', 'Gambling', 'Carousing', 'EDU', 'Computer', 'Vehicle', 'INT', 'EDU', 'Streetwise', 'INT'],
        "Administrator": ['Admin', 'Admin', 'Computer', 'Vacc Suit', 'Gun Combat', 'Space', 'Liaison', 'EDU', 'Leadership', 'SOC'],
    },
    ServiceSchools: {
        "Ship": [2, ['Pilot', 'Navigation', 'Engineering', 'Gunnery', 'Space', 'Space']],
        "Intelligence": [2, ['Forgery', 'Streetwise', 'Brawling', 'Bribery', 'Gun Combat', 'Survival']],
        "Technical": [1, ['Computer', 'Electronics', 'Gravitics', 'Mechanical', 'Naval Architecture', 'EDU']],
        "Specialist": [1, ['Medical', 'Mechanical', 'Computer', 'Admin', 'STR', 'Gunnery']],
        "Field Training": [1, ['Vehicle', 'Air Raft', 'Recon', 'Survival', 'Navigation', 'Survey']],
        "Contact": [2, ['Survey', 'Liaison', 'Streetwise', 'Survival', 'Pilot', 'Gun Combat']],
        "Administrator": [0, []]
    },
    Assignments: {
        "Field": ['Wartime', 'Training', 'Training', 'Base', 'Routine', 'Routine', 'Mission', 'Mission', 'Special', 'Special', 'Transfer'],
        "Bureaucracy": ['Wartime', 'Training', 'Base', 'Training', 'Routine', 'Routine', 'Base', 'Mission', 'Mission', 'Mission', 'Special']
    },
    InitialSkill: {
        Survey: "Pilot",
        Exploration: "Pilot",
        Communications: "Pilot",
        Detached: "Administration",
        Technical: "Computer",
        Operations: "Leadership",
        Administration: "Administration"
    },
    Muster: {
        cash: [20, 20, 30, 30, 50, 50, 50],
        benefits: ['Low passage', 'INT+2', 'EDU+2', 'Weapon', 'Weapon', 'Scout Ship', 'SOC']
    }
};
