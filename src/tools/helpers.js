import { names, weapons, playerHexColors, tempStaticPlayers, mapData, weaponsStats } from "../app/data/staticData";
import { combatCycleNew } from "./combatCycle";
import { d8, d10, selectFromHat, selectRandom, hexLookup } from "./utils";
import { logDissolve, logShrink, logWinner } from "./logStyles";

export function generateMap(size) {
    const hexCount = size - 6;
    const mapHexes = [{
        id: '000',
        hex: { q: 0, r: 0, s: 0 },
        biome: 'arena',
        defensemod: 2,
        hidemod: 0,
        defendowner: -1,
        styleName: 'old',
        isValid: true,
        pop: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    }];

    // Spread to avoid mutating the module-level exports
    const terrain = [...mapData.names];
    const reqHexes = [...mapData.reqHexes];
    const opHexes = [...mapData.opHexes];
    const terrainBiomes = mapData.terrainBiomes;

    reqHexes.forEach(hex => {
        const biome = selectFromHat(terrain);
        const style = terrainBiomes[biome];
        const isValid = biome !== 'mountain' && biome !== 'ravine';
        const defensemod = biome === 'old fort' ? 2 : 0;
        const hidemod = biome === 'woods' ? 2 : 0;
        mapHexes.push({
            id: hex[0].toString() + hex[1].toString() + hex[2].toString(),
            hex: { q: hex[0], r: hex[1], s: hex[2] },
            biome,
            defensemod,
            hidemod,
            defendowner: -1,
            styleName: style,
            isValid,
            pop: [],
        });
    });

    for (let i = 0; i < hexCount; i++) {
        const opHex = selectFromHat(opHexes);
        const opBiome = selectFromHat(terrain);
        const style = terrainBiomes[opBiome];
        const isValid = opBiome !== 'mountain' && opBiome !== 'ravine';
        const defensemod = opBiome === 'old fort' ? 2 : 0;
        const hidemod = opBiome === 'woods' ? 2 : 0;
        mapHexes.push({
            id: opHex[0].toString() + opHex[1].toString() + opHex[2].toString(),
            hex: { q: opHex[0], r: opHex[1], s: opHex[2] },
            biome: opBiome,
            defensemod,
            hidemod,
            defendowner: -1,
            styleName: style,
            isValid,
            pop: [],
        });
    }
    return mapHexes;
}

export function generatePlayers(count) {
    const players = [];
    let district = 1;
    const namePool = [...tempStaticPlayers];
    for (let i = 0; i < count; i++) {
        const pDistrict = Math.ceil(district / 2);
        const leadRoll = d10();
        const playerStats = {
            id: i + 1,
            name: selectFromHat(namePool),
            dex: d8() + 1,
            str: d8() + 1,
            find: d8() + 1,
            hide: d8() + 1,
            lead: leadRoll,
            aggro: 10 - leadRoll,
            int: d8() + 1,
            district: pDistrict,
            weapon: 'bare fist',
            speed: 9,
            location: [0, 0, 0],
            oldLocation: "000",
            oldAddress: [0, 0],
            locationname: 'arena',
            health: 3,
            teamleader: -1,
            color: playerHexColors[i],
            death: null,
        };
        playerStats.powerinx = leadRoll + playerStats.dex + playerStats.str + playerStats.int + playerStats.find + playerStats.hide;
        district++;
        players.push(playerStats);
    }
    const teams = generateInitialTeams(players);
    const initialLogContent = writeTeamLog(teams);
    return [players, teams, initialLogContent];
}

export function generateInitialTeams(players) {
    const availablePlayers = [];
    const availableLeaders = [];
    let numberOfLeaders = 0;

    players.forEach(player => {
        if (d10() <= player.lead) {
            availablePlayers.push({
                id: player.id,
                name: player.name,
                lead: player.lead,
                district: player.district,
            });
        }
    });

    availablePlayers.sort((a, b) => b.lead - a.lead);

    numberOfLeaders = Math.floor(Math.random() * ((availablePlayers.length / 2) - 2)) + 2;

    for (let i = 0; i < numberOfLeaders; i++) {
        const leader = selectFromHat(availablePlayers);
        players[leader.id - 1].teamleader = leader.id;
        availableLeaders.push([leader, []]);
    }

    // Each leader recruits one member, preferring same district
    availableLeaders.forEach(leader => {
        const sameDistrictIdx = availablePlayers.findIndex(p => p.district === leader[0].district);
        let player;
        if (sameDistrictIdx !== -1) {
            [player] = availablePlayers.splice(sameDistrictIdx, 1);
        } else {
            player = selectFromHat(availablePlayers);
        }
        players[player.id - 1].teamleader = leader[0].id;
        leader[1].push(player);
    });

    // Assign remaining available players to random teams
    availablePlayers.forEach(player => {
        const leaderIndex = Math.floor(Math.random() * numberOfLeaders);
        availableLeaders[leaderIndex][1].push(player);
        players[player.id - 1].teamleader = availableLeaders[leaderIndex][0].id;
    });

    return availableLeaders;
}

export function writeTeamLog(teams, logContent = []) {
    teams.forEach(team => {
        const leader = team[0];
        const members = team[1];
        const teamSize = members.length;
        if (teamSize > 1) {
            let memberNames = '';
            members.forEach((member, idx) => {
                memberNames = (teamSize === idx + 1)
                    ? memberNames + 'and ' + member.name
                    : memberNames + member.name + ', ';
            });
            logContent.push(leader.name + ' forms a team with ' + memberNames + '.');
        } else {
            if (leader.district === members[0].district) {
                logContent.push(leader.name + " and " + members[0].name + " show some District " + leader.district + " solidarity.");
            } else {
                logContent.push(leader.name + " forms an alliance with " + members[0].name);
            }
        }
    });
    return logContent;
}

export function firstRound(mapHexes, players, logContent, roundCount) {
    const validHexes = getValidTravelHexes([0, 0, 0], mapHexes);
    const soloPlayers = players.filter(player => player.teamleader === -1);
    const leaders = players.filter(player => player.teamleader === player.id);

    soloPlayers.forEach(player => {
        if (d10() > player.aggro - 2) {
            const randomHex = selectRandom(validHexes);
            player = weaponSearch(player, logContent, 2);
            player = updateHexLocation(mapHexes, randomHex, player);
            logContent.push('Then, ' + player.name + ' retreats to the ' + player.locationname + '.');
        } else {
            player = weaponSearch(player, logContent, 2);
        }
    });

    leaders.forEach(leader => {
        if (d10() > leader.aggro) {
            const randomHex = selectRandom(validHexes);
            leader = updateHexLocation(mapHexes, randomHex, leader);
            leader = weaponSearch(leader, logContent, 2);
            players.forEach(player => {
                if (player.teamleader === leader.id && player.id !== leader.id) {
                    player = weaponSearch(player, logContent, 3);
                    player = updateHexLocation(mapHexes, randomHex, player);
                }
            });
            logContent.push('Then ' + leader.name + ' retreats to the ' + leader.locationname + '. Their team follows.');
        } else {
            leader = weaponSearch(leader, logContent, 2);
            players.forEach(player => {
                if (player.teamleader === leader.id && player.id !== leader.id) {
                    player = weaponSearch(player, logContent, 3);
                }
            });
            logContent.push('Then ' + leader.name + ' leads their team to fight in the arena.');
        }
    });

    combatCycleNew(players, mapHexes, logContent, true);
}

export function startNewRound(teamsArray, mapHexes, players, logContent, roundCount) {
    const livingPlayers = players.filter(player => player.health > 0);

    // Iterate backwards so splice doesn't skip elements
    for (let idx = teamsArray.length - 1; idx >= 0; idx--) {
        const team = teamsArray[idx];
        const leader = team[0];
        const leaderId = leader.id;

        if (players[leaderId - 1].health <= 0) {
            team[1].forEach(record => { players[record.id - 1].teamleader = -1; });
            players[leaderId - 1].teamleader = -1;
            teamsArray.splice(idx, 1);
            logContent.push(logDissolve("With " + leader.name + " dead their team dissolves."));
        } else {
            const roll = d10();
            if (roll > leader.lead) {
                team[1].forEach(record => { players[record.id - 1].teamleader = -1; });
                players[leaderId - 1].teamleader = -1;
                teamsArray.splice(idx, 1);
                logContent.push(logDissolve(leader.name + "'s team mutinies and the alliance dissolves."));
            } else {
                // Remove dead members before loyalty checks so they don't count toward team size
                const liveMembers = team[1].filter(m => players[m.id - 1].health > 0);
                const survivors = liveMembers.filter(member => {
                    if (d10() > players[member.id - 1].lead) {
                        players[member.id - 1].teamleader = -1;
                        logContent.push(logDissolve(member.name + " leaves their team."));
                        return false;
                    }
                    return true;
                });
                team[1] = survivors;
                if (survivors.length === 0) {
                    players[leaderId - 1].teamleader = -1;
                    teamsArray.splice(idx, 1);
                    logContent.push(logDissolve(leader.name + " is left without a team."));
                }
            }
        }
    }

    combatCycleNew(livingPlayers, mapHexes, logContent, false, roundCount, [], teamsArray);

    if (players.filter(player => player.health > 0).length === 1) {
        crownWinner(players.filter(player => player.health > 0)[0], logContent);
    }
    shrinkMap(livingPlayers, mapHexes, logContent);
}

export function shrinkMap(players, mapHexes, logContent) {
    const livingPlayers = players.filter(player => player.health > 0);
    const activeHexes = mapHexes.filter(hex => hex.isValid);
    if (Math.ceil(livingPlayers.length / 2) < activeHexes.length) {
        const targetHex = activeHexes[activeHexes.length - 1];
        logContent.push(logShrink(targetHex.biome + ' is being deactivated'));
        targetHex.isValid = false;
        targetHex.styleName = "ravine";
    }
}

function crownWinner(winner, logContent) {
    logContent.push(logWinner(winner.name + ' has won the Hangry Games!'));
}

export function getValidTravelHexes(currentHex, mapHexes) {
    const Q = currentHex[0];
    const R = currentHex[1];
    const S = currentHex[2];
    const availableDirections = [
        [Q, R - 1, S + 1], [Q, R + 1, S - 1],
        [Q - 1, R, S + 1], [Q - 1, R + 1, S],
        [Q + 1, R, S - 1], [Q + 1, R - 1, S],
    ];
    const validHexes = [];
    mapHexes.forEach(hex => {
        if (!hex.isValid) return;
        const addr = [hex.hex.q, hex.hex.r, hex.hex.s];
        if (availableDirections.some(d => d[0] === addr[0] && d[1] === addr[1] && d[2] === addr[2])) {
            validHexes.push(hex);
        }
    });
    return validHexes;
}

export function updateHexLocation(mapHexes, newLocation, player) {
    const oldLocation = hexLookup(player.location, mapHexes)[0];
    const newAddress = [newLocation.hex.q, newLocation.hex.r, newLocation.hex.s];
    newLocation.pop.push(player.id);
    oldLocation.pop = oldLocation.pop.filter(id => id !== player.id);
    player.location = newAddress;
    player.locationname = newLocation.biome;
    player.oldLocation = oldLocation.id;
    return player;
}

export function weaponSearch(player, logContent, modifier = 0) {
    if (d10() <= player.find + modifier) {
        const weapon = selectRandom(weapons);
        player.weapon = weapon;
        player.speed = weaponsStats[weapon].speed;
        logContent.push(player.name + ' searches for a weapon and finds a ' + weapon + '!');
    } else {
        logContent.push(player.name + ' searches for a weapon and finds nothing!');
    }
    return player;
}
