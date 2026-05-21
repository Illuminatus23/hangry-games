export const Navy = {
    Line: {
        "Training": [0, 0, 6, 7, false],
        "Shore Duty": [4, 12, 7, 7, false],
        "Patrol": [5, 8, 8, 7, false],
        "Siege": [5, 10, 9, 8, true],
        "Strike": [6, 6, 6, 5, true],
        "Battle": [0, 0, 7, 0, true],
        "Survival": ['Skill', 'MOS', 2, 1],
        "Decoration": ['None'],
        "Promotion": ['UUP', ['EDU', 'SOC'], [8, 9], 1],
        "MOS": ['Mechanical', 'Electronic', 'Gun Combat', 'Navigation', 'Computer', 'Interpersonal', 'Zero-G Combat', 'Vacc Suit'],
        "Command": 7
    },
    Crew: {
        "Training": [0, 0, 6, 7, false],
        "Shore Duty": [4, 12, 7, 7, false],
        "Patrol": [5, 8, 8, 7, false],
        "Siege": [5, 10, 9, 8, true],
        "Strike": [6, 6, 6, 5, true],
        "Battle": [0, 0, 7, 0, true],
        "Survival": ['Skill', 'MOS', 2, 1],
        "Decoration": ['None'],
        "Promotion": ['UUP', ['EDU', 'SOC'], [8, 9], 1],
        "MOS": ['Mechanical', 'Electronic', 'Gun Combat', 'Navigation', 'Computer', 'Interpersonal', 'Zero-G Combat', 'Vacc Suit'],
        "Command": 0
    },
    Flight: {
        "Training": [3, 0, 0, 7, false],
        "Shore Duty": [3, 0, 11, 0, false],
        "Patrol": [3, 10, 11, 7, false],
        "Siege": [3, 9, 10, 7, true],
        "Strike": [3, 9, 9, 6, true],
        "Battle": [4, 8, 9, 6, true],
        "Survival": ['Skill', 'Pilot', 2, 1],
        "Decoration": ['Rank', 'Traveller'],
        "Promotion": ['None'],
        "MOS": ['Vacc Suit', 'Admin', 'Gun Combat', 'Communications', 'Ships Boat', 'Space', 'Pilot', 'Pilot'],
        "Command": 8
    },
    Engineering: {
        "Training": [0, 0, 7, 7, false],
        "Shore Duty": [0, 0, 7, 8, false],
        "Patrol": [3, 12, 5, 6, false],
        "Siege": [4, 11, 8, 7, true],
        "Strike": [5, 7, 6, 6, true],
        "Battle": [5, 7, 6, 5, true],
        "Survival": ['Skill', 'Engineering', 4, 1],
        "Decoration": ['None'],
        "Promotion": ['None'],
        "MOS": ['Mechanical', 'Electronic', 'Engineering', 'Mechanical', 'Vacc Suit', 'Space Tech', 'Engineering', 'Engineering'],
        "Command": 10
    },
    Medical: {
        "Training": [0, 0, 7, 8, false],
        "Shore Duty": [0, 0, 6, 6, false],
        "Patrol": [3, 0, 7, 7, false],
        "Siege": [3, 0, 8, 7, true],
        "Strike": [3, 11, 6, 7, true],
        "Battle": [4, 10, 6, 6, true],
        "Survival": ['None'],
        "Decoration": ['None'],
        "Promotion": ['Skill', 'Medical', 5, 1],
        "MOS": ['Administration', 'Technical', 'Electronic', 'Administration', 'Medical', 'Computer', 'Medical', 'Medical'],
        "Command": 11
    },
    Gunnery: {
        "Training": [0, 0, 6, 8, false],
        "Shore Duty": [3, 12, 6, 0, false],
        "Patrol": [4, 11, 8, 7, false],
        "Siege": [5, 10, 8, 5, true],
        "Strike": [5, 9, 7, 6, true],
        "Battle": [6, 7, 6, 6, true],
        "Survival": ['None'],
        "Decoration": ['UUP', 'DEX', 10, 1],
        "Promotion": ['UUP', 'DEX', 9, 1],
        "MOS": ['Forward Observer', 'Gun Combat', 'Communications', 'Computer', 'Sensor Ops', 'Special Combat', 'Gunnery', 'Gunnery'],
        "Command": 9
    },
    Technical: {
        "Training": [0, 0, 7, 7, false],
        "Shore Duty": [3, 0, 8, 8, false],
        "Patrol": [3, 0, 9, 9, false],
        "Siege": [3, 0, 8, 7, true],
        "Strike": [3, 9, 7, 7, true],
        "Battle": [3, 8, 7, 7, true],
        "Survival": ['None'],
        "Decoration": ['None'],
        "Promotion": ['Skill', 'MOS', 3, 1],
        "MOS": ['Mechanical', 'Mechanical', 'Electronic', 'Electronic', 'Computer', 'Computer', 'Gravitics', 'Technical'],
        "Command": 12
    },
    BranchSelect: {
        "E": ['Technical Services', 'Crew', 'Crew', 'Engineering', 'Engineering', 'Gunnery', 'Gunnery', 'Medical'],
        "O": ['Technical Services', 'Line', 'Line', 'Engineering', 'Gunnery', 'Line', 'Flight', 'Medical']
    },
    ServiceSkills: {
        "Navy Life": ['Brawling', 'STR', 'Carousing', 'Gambling', 'END', 'DEX', 'END', 'EDU', 'Inborn', 'Vacc Suit'],
        "Shipboard Life": ['Gambling', 'DEX', 'Hand Combat', 'Mechanical', 'Ships Boat', 'Vacc Suit', 'Zero-G Environ', 'Communications', 'Administration', 'Inborn'],
        "Shore Duty Life": ['Vice', 'Vehicle', 'Forward Observer', 'Vacc Suit', 'Liaison', 'Vacc Suit', 'Forward Observer', 'Environ', 'Vacc Suit', 'Battle Dress'],
        "Petty Officer": ['Vacc Suit', 'Blade Combat', 'Gun Combat', 'Mechanical', 'Medical', 'Vehicle', 'Zero-G Environ', 'EDU', 'Instruction', 'Interpersonal'],
        "Command": ['Vehicle', 'END', 'Gun Combat', 'Ships Boat', 'Pilot', 'Leadership', 'Leadership', 'SOC', 'Inborn', 'Ship Tactics'],
        "Staff": ['Computer', 'Electronics', 'Gun Combat', 'Academic', 'Bribery', 'Ship Tactics', 'Fleet Tactics', 'INT', 'Ship Tactics', 'Fleet Tactics']
    },
    Assignments: ['Battle', 'Frozen Watch', 'Siege', 'Strike', 'Patrol', 'Training', 'Patrol', 'Strike', 'Shore Duty', 'Special', 'Special', 'Special'],
    Special: {
        "E": ['', 'Cross-Training', 'Specialist', 'Recruiting', 'Gunnery', 'Engineering', 'OCS', 'OCS'],
        "O": ['', 'Cross-Training', 'Intelligence', 'Recruiting', 'Aide', 'Command College', 'Staff College', 'Staff College']
    },
    Training: ['', 'Mechanical', 'Electronic', 'Gravitics', 'Communications', 'Engineering', 'Ships Boat'],
    Schooling: ['', 'Academic', 'Medical', 'Space', 'Space Tech', 'Computer', 'Liaison'],
    SchoolSkills: {
        Engineering: [5, ["Mechanical", "Electronics", "Gravitics", "Engineering"]],
    },
    Muster: {
        cash: [1, 5, 5, 10, 20, 50, 50],
        benefits: ['Low passage', 'INT', 'EDU+2', 'Weapon', 'Traveller Aid Membership', 'High passage', 'SOC+2'],
    },
};
