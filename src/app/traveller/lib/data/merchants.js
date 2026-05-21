export const Merchants = {
    Companies: {
        0: ['Thyo Supud', 'Jamison Factors', 'Bee Kriirr Uung', 'Theriani', 'Talisman'],
        1: ['Tyeyo Fteahrao Yolr', 'Dhoylezhokka', 'Oberlindes Lines', 'Rrlkrmiixk', 'Rraegnaell Oukh', 'Frendi Marshikin', 'Chaperons Blancs'],
        2: ['UTP', 'Enksoe Aloz'],
        3: ['Hkal Eakh', 'Sinzarmes', 'Crown Lines', 'Tharnitia Denus', 'Gramstaatsbedrif', 'Ewm Shao Gwi'],
        4: ['Khu Su\'ikh', 'Al Morai', 'Solar Shipping', 'Solomani Shipping', 'Saxe Transport', 'Gvaeknoks', 'ladria Vlovl'],
        5: ['Tlasayerlahel', 'Reastirlao', 'Reastirlao', 'Star Patterns Trading', 'Ling Standard Products', 'Makhidkarun', 'Naasirka', 'Sharurshid', 'Tukera Lines', 'Priantqlovr Drafr']
    },
    Lines: ['Free Traders', 'Interface Line', 'Fledgling Line', 'Subsector Wide Line', 'Sector Wide Line', 'MegaCorporation'],
    Assignments: {
        "Large": ['', '', 'Down', 'Route', 'Route', 'Route', 'Route', 'Route', 'Route', 'Charter', 'Speculative', 'Exploratory', 'Special', 'Special'],
        "Small": ['', '', 'Down', 'Route', 'Route', 'Route', 'Route', 'Charter', 'Speculative', 'Speculative', 'Exploratory', 'Exploratory', 'Special', 'Up'],
        "Freetraders": ['', '', 'Up', 'Route', 'Exploratory', 'Route', 'No Business', 'Route', 'No Business', 'Charter', 'Speculative', 'Exploratory', 'Smuggling', 'Piracy']
    },
    AssignmentsName: {
        'Route': 'a standard trade route',
        'Charter': 'a chartered ship',
        'Speculative': 'a speculative trade vessel',
        'Exploratory': 'an exploratory trade vessel',
        'Smuggling': 'a smuggling operation',
        'Piracy': 'a pirate ship'
    },
    Availability: {
        Deck: [9, 10],
        Engineering: [8, 8],
        Purser: [7, 6],
        Admin: [8, 9],
        Sales: [6, 6],
        Freetraders: [8]
    },
    SpecialDuty: {
        "O": ['Trade Station', 'Command School', 'Deck School', 'Engineering School', 'Purser School', 'Business School', 'Department Test'],
        "E": ['Security Training', 'Trade Station', 'Helm Training', 'Drive Training', 'Steward Training', 'Commission', 'Commission']
    },
    // SpecialDutySchools: [threshold, [skills_to_try], transferDept | null, flags]
    // threshold: roll 1d6 >= threshold per skill to gain it
    // transferDept: 'Deck' | 'Engineering' | 'Sales' | 'Purser' | 'Admin' | null
    // flags.autoSkill: skill granted automatically before the threshold rolls
    // flags.examDMO6: DM+1 on department exam for characters rank O6+
    // flags.commission: special commission handling (see MerchantTerm)
    // flags.deptTest: character may take a Department Test for promotion without skill requirements
    SpecialDutySchools: {
        "Business School": [5, ['Admin', 'Computer', 'Legal', 'Liaison'], 'Sales', { examDMO6: true }],
        "Command School": [5, ['Admin', 'Leadership', 'Legal', 'Ship Tactics'], 'Deck', {}],
        "Commission": [0, [], null, { commission: true }],
        "Deck School": [5, ['Communications', 'Computer', 'Gunnery'], 'Deck', {}],
        "Department Test": [0, [], null, { deptTest: true }],
        "Drive Training": [5, ['Electronics', 'Engineering', 'Gravitics', 'Mechanical'], 'Engineering', {}],
        "Engineering School": [5, ['Admin', 'Computer', 'Electronics', 'Engineering', 'Gravitics', 'Mechanical'], 'Engineering', {}],
        "Helm Training": [5, ['Navigation', 'Pilot', 'Sensor Ops', "Ship's Boat"], 'Deck', {}],
        "Purser School": [4, ['Admin', 'Computer', 'Liaison'], 'Purser', {}],
        "Security Training": [4, ['Zero-G Environ', 'Vacc Suit', 'Brawling', 'Computer'], null, {}],
        "Steward Training": [4, ['Admin', 'Liaison', 'Steward'], 'Purser', {}],
        "Trade Station": [4, ['Broker', 'Liaison'], 'Admin', { autoSkill: 'Trader' }],
    },
    MusterCash: [1, 5, 10, 10, 10, 20, 50],
    MusterBenefits: ['Low passage', 'INT', 'EDU+2', 'Weapon', 'Weapon', 'Low passage', 'Trader'],
    Admin: {
        "Route": [0, 6, 16],
        "Charter": [0, 5, 16],
        "Exploratory": [3, 8, 12],
        "Speculative": [3, 7, 11],
        "SurvivalSkills": ['Admin', 'Liaison', 'Bribery', 'Admin', 'Admin', 'Streetwise'],
        "Exam": [
            ['Route'],
            ['Admin-1'],
            ['Admin-2+Liaison-1'],
            ['Admin-3'],
            ['Liaison-2']
        ],
        "ExamScore": [5, 6, 7, 6, 7]
    },
    Purser: {
        "Route": [0, 6, 16],
        "Charter": [0, 5, 16],
        "Exploratory": [3, 8, 12],
        "Speculative": [0, 7, 11],
        "SurvivalSkills": '',
        "Exam": [
            ['Route'],
            ['Steward-1', 'Gunnery-1'],
            ['Steward-2', 'Medical-1'],
            ['Steward-2+Liaison-1', 'Medical-2'],
            ['Admin-1']
        ],
        "ExamScore": [5, 5, 5, 6, 6, 6, 7]
    },
    Sales: {
        "Route": [0, 7, 13],
        "Charter": [0, 7, 14],
        "Exploratory": [4, 5, 10],
        "Speculative": [3, 5, 19],
        "SurvivalSkills": ['Broker', 'Trader'],
        "Exam": [
            ['Route'],
            ['Trader-1'],
            ['Broker-1', 'Trader-2'],
            ['Broker-2', 'Trader-3'],
            ['Broker-3']
        ],
        "ExamScore": [4, 5, 6, 7, 8]
    },
    Engineering: {
        "Route": [0, 7, 16],
        "Charter": [0, 6, 16],
        "Exploratory": [4, 5, 12],
        "Speculative": [3, 6, 11],
        "SurvivalSkills": ['Mechanical', 'Electronics', 'Engineering', 'Admin', 'Engineering', 'Gravitics'],
        "Exam": [
            ['Route'],
            ['Mechanical-1', 'Electronics-1', 'Gravitics-1'],
            ['Engineering-1', 'Gravitics-2'],
            ['Engineering-2'],
            ['Engineering-3+Admin-1']
        ],
        "ExamScore": [5, 8, 7, 7, 9]
    },
    Deck: {
        "Route": [0, 7, 16],
        "Charter": [3, 7, 16],
        "Exploratory": [4, 5, 11],
        "Speculative": [3, 6, 12],
        "SurvivalSkills": ['Navigation', 'Admin', 'Pilot', 'Legal', "Ship's Boat", 'Leadership'],
        "Exam": [
            ['Route'],
            ['Navigation-1'],
            ['Admin-1'],
            ["Ship's Boat-1", 'Pilot-1'],
            ['Pilot-1'],
            ['Legal-1'],
            [],
            []
        ],
        "ExamScore": [6, 6, 6, 7, 7, 9, 8, 8]
    },
    Freetraders: {
        "Route": [3, 7, 11],
        "Charter": [4, 6, 10],
        "Exploratory": [5, 5, 8],
        "Speculative": [5, 5, 7],
        "Smuggling": [6, 5, 6],
        "Piracy": [7, 4, 5],
        "No Business": [3, 3, 15],
        "SurvivalSkills": ['Pilot'],
        "Exam": [
            ['Route'],
            ['Steward-1+Engineering-1'],
            ['Navigation-1'],
            ['Pilot-1'],
            ['Legal-1'],
            []
        ],
        "ExamScore": [4, 6, 7, 7, 8, 8]
    },
    ServiceSkills: {
        "Merchants Life": ['', 'Brawling', 'Carousing', 'Gambling', 'Trader', 'EDU', 'Carousing'],
        "Shipboard Life": ['', 'Gambling', 'Blade Combat', 'Vacc Suit', 'Zero-G Combat', 'Communications', 'Jack-of-All-Trades'],
        "Officer Skills": ['', 'Brawling', 'Vehicle', "Ship's Boat", 'Gun Combat', 'Liaison', 'Liaison'],
        "Mercantile Skills": ['', 'Streetwise', 'Broker', 'Trader', 'Liaison', 'Admin', 'Legal'],
        "Master Skills": ['', 'Admin', 'Computer', 'Navigation', 'Pilot', 'Leadership', 'Bribery'],
        "Deck": ['', 'Navigation', 'Admin', 'Pilot', 'Legal', "Ship's Boat", 'Leadership'],
        "Engineering": ['', 'Mechanical', 'Electronics', 'Engineering', 'Admin', 'Engineering', 'Gravitics'],
        "Purser": ['', 'Steward', 'Medical', 'Liaison', 'Gunnery', 'Steward', 'Liaison'],
        "Medic": ['', 'Steward', 'Medical', 'Medical', 'Medical', 'Computer', 'Medical'],
        "Admin": ['', 'Admin', 'Liaison', 'Bribery', 'Admin', 'Admin', 'Streetwise'],
        "Sales": ['', 'Trader', 'Broker', 'Computer', 'Liaison', 'Trader', 'Broker'],
        "Planet Bound Life": ['', 'Gun Combat', 'Streetwise', 'Vacc Suit', 'Vacc Suit', 'Gun Combat', 'Brawling'],
        "Free Trader Life": ['', 'DEX', 'Brawling', 'Streetwise', 'Forgery', 'Bribery', 'Legal'],
        "Free Trader Service": ['', 'Steward', 'Trader', 'Broker', 'Admin', 'Gunnery', 'Leadership'],
        "Free Trader Business": ['', 'Engineering', 'Navigation', 'Steward', 'Legal', 'Steward', 'Broker']
    },
    BranchSelect: {
        "Large": ['Purser', 'Purser', 'Purser', 'Sales', 'Engineering', 'Engineering', 'Engineering'],
        "Small": ['Purser', 'Purser', 'Purser', 'Engineering', 'Engineering', 'Engineering', 'Deck']
    },
    ExamsRanks: {
        "Deck": [
            ['Apprentice', 6],
            ['4th Officer', 6, ['Navigation', 1]],
            ['3rd Officer', 6, ['Admin', 1]],
            ['2nd Officer', 7, ["Ship's Boat", 1]],
            ['1st Officer', 7, ['Pilot', 1]],
            ['Captain', 9, ['Legal', 1]],
            ['Senior Captain', 8],
            ['Line Commodore', 8],
        ],
        "Purser": [
            ['Steward', 5],
            ['Junior Purser', 5, ['Steward', 1]],
            ['Assistant Purser', 5, ['Steward', 2]],
            ['Purser', 6, ['Liaison', 1]],
            ['Chief Purser', 7, ['Admin', 1]],
        ],
        "Purser Medic": [
            [],
            [],
            ['Assistant Medic', 6, ['Medical', 1]],
            ['Medic', 6, ['Medical', 2]],
        ],
        "Sales": [
            ['Apprentice', 4],
            ['Clerk', 5, ['Trader', 1]],
            ['Assistant Broker', 6, ['Broker', 1]],
            ['Broker', 7, ['Broker', 2]],
            ['Senior Broker', 8, ['Broker', 3]],
        ],
        "Engineering": [
            ['Assistant Drive Hand', 5],
            ['Drive Hand', 8, ['Electronics', 1]],
            ['Assistant Engineer', 7, ['Engineering', 1]],
            ['Engineer', 7, ['Engineering', 2]],
            ['Chief Engineer', 9, ['Engineering', 3]],
        ],
        "Admin": [
            ['Apprentice', 5],
            ['Assistant Manager', 6, ['Admin', 1]],
            ['Manager', 7, ['Admin', 2]],
            ['Assistant Station Head', 6, ['Admin', 3]],
            ['Station Head', 7, ['Liaison', 2]],
        ],
        "Free Trader": [
            [],
            ['4th Officer', 6],
            ['3rd Officer', 6, ['Engineering', 1]],
            ['2nd Officer', 7, ['Navigation', 1]],
            ['1st Officer', 7, ['Pilot', 1]],
            ['Captain', 9, ['Legal', 1]],
            ['Senior Captain', 8],
        ],
    }
};
