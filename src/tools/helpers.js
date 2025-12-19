import { names, weapons, playerHexColors, tempStaticPlayers, mapData, weaponsStats } from "../app/data/staticData";
import { combatCycleNew } from "./combatCycle";
import { act } from "react";

export function generateMap(size) {

    const hexCount = size - 6;
    const mapHexes = [{
        id: '000',
        hex: {
            q: 0,
            r: 0,
            s: 0
        },
        biome: 'arena',
        defensemod: 2,
        hidemod: 0,
        defendowner: -1,
        styleName: 'old',
        isValid: true,
        pop: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    }]

    const terrain = mapData.names
    const terrainBiomes = mapData.terrainBiomes
    const reqHexes = mapData.reqHexes
    const opHexes = mapData.opHexes

    function selectFromHat(list) {
        const count = list.length;
        const randomSelection = Math.floor(Math.random() * count);
        const selection = list.splice(randomSelection, 1);
        return selection;
    }
    //create random 'biomes'
    reqHexes.forEach(function (hex, idx) {
        const biome = selectFromHat(terrain).toString();
        const style = terrainBiomes[biome];
        const isValid = (biome !== 'mountain' && biome !== 'ravine');
        const defenseMod = (biome === 'old fort') ? 2 : 0;
        const hideMod = (biome === 'woods') ? 2 : 0;
        mapHexes.push({
            id: hex[0].toString() + hex[1].toString() + hex[2].toString(),
            hex: {
                q: hex[0],
                r: hex[1],
                s: hex[2]
            },
            biome: biome,
            hexname: biome, //todo: biome for class, hexname to display
            defensemod: defenseMod,
            hidemod: hideMod,
            defendowner: -1,
            styleName: style,
            isValid: isValid,
            pop: [],
        });
    });

    for (let i = 0; i < hexCount; i++) {
        const opHex = selectFromHat(opHexes)[0];
        const opBiome = selectFromHat(terrain).toString();
        const style = terrainBiomes[opBiome]
        const isValid = (opBiome !== 'mountain' && opBiome !== 'ravine');

        const defenseMod = (opBiome === 'old fort') ? 2 : 0;
        const hideMod = (opBiome === 'woods') ? 2 : 0;
        mapHexes.push({
            id: opHex[0].toString() + opHex[1].toString() + opHex[2].toString(),
            hex: {
                q: opHex[0],
                r: opHex[1],
                s: opHex[2]
            },
            biome: opBiome,
            styleName: style[0],
            defensemod: defenseMod,
            hidemod: hideMod,
            defendowner: -1,
            styleName: style,
            isValid: isValid,
            pop: [],
        });
    };
    console.log(mapHexes)
    return mapHexes;
}
export function generatePlayers(count) {
    const players = [];
    let district = 1;
    for (let i = 0; i < count; i++) {
        const pDistrict = Math.ceil(district / 2);
        const leadRoll = d10();
        const aggressionRoll = 10 - leadRoll;
        const playerStats = {
            id: i + 1,
            name: selectFromHat(tempStaticPlayers), //selectFromHat(names),
            dex: d8() + 1,
            str: d8() + 1,
            find: d8() + 1,
            hide: d8() + 1,
            lead: leadRoll,
            aggro: aggressionRoll,
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
        }
        const powerIndex = leadRoll + playerStats.dex + playerStats.str + playerStats.int + playerStats.find + playerStats.hide;
        playerStats.powerinx = powerIndex;
        district++;

        players.push(playerStats);
    }
    const teams = generateInitialTeams(players);
    const initialLogContent = writeTeamLog(teams)
    return [players, teams, initialLogContent];
}
export function generateInitialTeams(players) {
    //see who passes leadership, they are avail group.
    //randomly select 1-3 leaders from the group (avail/3 no more than 3)
    const availablePlayers = [];
    const availableLeaders = [];
    const teams = [];
    var numberOfLeaders = 0;
    console.log(players)

    players.forEach(player => {
        const roll = d10();
        const leadership = player.lead;
        if (roll <= leadership) {
            availablePlayers.push({
                id: player.id,
                name: player.name,
                lead: player.lead,
                district: player.district,
            })
        }
    });
    console.log((24 - availablePlayers.length) + ' go solo');
    console.log(availablePlayers.length + ' form groups');

    availablePlayers.sort((a, b) => {
        if (a.lead > b.lead) { return -1 }
        else if (a.lead < b.lead) { return 1 }
        else { return 0 }
    })
    //grab leaders from available players
    numberOfLeaders = Math.floor(Math.random() * ((availablePlayers.length / 2) - 2)) + 2;
    console.log(numberOfLeaders + ' become leaders');

    for (let i = 0; i < numberOfLeaders; i++) {
        const leader = selectFromHat(availablePlayers);
        players[leader.id - 1].teamleader = leader.id;
        availableLeaders.push([leader, []]);
    }
    //randomly assign players to teams, but everyone gets one first
    // if same district, default
    availableLeaders.forEach(leader => {
        var sameDistrict = false;
        var sameDistrictPlayer = null;
        availablePlayers.forEach((player, idx) => {
            if (player.district == leader[0].district) {
                sameDistrictPlayer = player;
                console.log(leader[0].name + ' is same district as ' + player.name)
                //remove him from hat
                availablePlayers.splice(idx, 1)
                sameDistrict = true;
            }
        })

        const player = (sameDistrict) ? sameDistrictPlayer : selectFromHat(availablePlayers);
        players[player.id - 1].teamleader = leader[0].id;
        leader[1].push(player);
        //console.log(player.name + ' joins ' + leader[0].name);
    });
    //now assign the rest, if any
    availablePlayers.forEach(player => {
        const leaderIndex = Math.floor(Math.random() * numberOfLeaders);
        availableLeaders[leaderIndex][1].push(player);
        players[player.id - 1].teamleader = availableLeaders[leaderIndex][0].id;
        //console.log(player.name + ' joins ' + availableLeaders[leaderIndex][0].name);

    })
    return availableLeaders;
}
export function writeTeamLog(teams, logContent = []) {
    teams.forEach(team => {
        const leader = team[0];
        const members = team[1];
        const teamSize = members.length;
        let memberNames = '';
        if (teamSize > 1) {
            members.forEach((member, idx) => {
                memberNames = (teamSize == idx + 1) ? memberNames + 'and ' + member.name : memberNames + member.name + ', ';
            });
            logContent.push(leader.name + ' forms a team with ' + memberNames + '.')
        } else {
            if (leader.district == members[0].district) {
                logContent.push(leader.name + " and " + members[0].name + " show some District " + leader.district + " solidarity.");
            } else {
                logContent.push(leader.name + " forms an alliance with " + members[0].name);
            }

        }
    });
    return logContent;
}
export function firstRound(mapHexes, players, logContent, logArchive, roundCount) {
    //teams are initially created at start
    //next we see who stays and who flees, agression + group size
    //for this first turn, teams stay together
    //list of reachable hexes, 1st round AI picks randomly
    const validHexes = findValidTravelHexes([0, 0, 0], mapHexes);
    //list of leaders and solos
    const soloPlayers = players.filter((player) => player.teamleader == -1);
    const leaders = players.filter((player) => player.teamleader == player.id);
    logContent.push(<b>Round 1</b>)
    soloPlayers.forEach((player) => {
        //agression roll, pass will stay put
        //solo players will tend to leave
        if (d10() > player.aggro + 2) {
            const randomHex = selectRandom(validHexes)[0];
            player = weaponSearch(player, logContent, 2)
            player = updateLocationById(mapHexes, randomHex, player)
            logContent.push('Then, ' + player.name + ' retreats to the ' + player.locationname + '.')
        } else {
            player = weaponSearch(player, logContent, 2)
            //logContent.push('Then, ' + player.name + ' stays to fight in the arena.')

        }
    })
    leaders.forEach((leader) => {
        //agression roll, pass will stay put
        if (d10() > leader.aggro) {
            const randomHex = selectRandom(validHexes)[0];
            leader = updateLocationById(mapHexes, randomHex, leader)
            leader = weaponSearch(leader, logContent, 2)

            players.forEach((player) => {
                if (player.teamleader === leader.id && player.id !== leader.id) {
                    //console.log(player.name + ' follows')
                    player = weaponSearch(player, logContent, 3)
                    player = updateLocationById(mapHexes, randomHex, player)

                }
            })
            logContent.push('Then ' + leader.name + ' retreats to the ' + leader.locationname + '. Their team follows.')
        } else {
            leader = weaponSearch(leader, logContent, 2)
            players.forEach((player) => {
                if (player.teamleader === leader.id && player.id !== leader.id) {
                    //console.log(player.name + ' follows')
                    player = weaponSearch(player, logContent, 3)

                }
            })
            logContent.push('Then ' + leader.name + ' leads their team to fight in the arena.')
        }
    })
    //handle combat
    combatCycleNew(players, mapHexes, logContent, true);


}
export function startNewRound(teamsArray, mapHexes, players, logContent, logArchive, roundCount) {
    //start with loyalty check. Remaining players not in group minus group size is modifier
    //those who fail leadership leave group, if leader leaves group, group disolves
    const livingPlayers = players.filter((player) => player.health > 0);
    const betrayers = []
    //console.log(teamsArray)

    teamsArray.forEach((team, idx) => {
        const leader = team[0];
        const leaderId = leader.id;
        let members = team[1];

        if (players[leaderId - 1].health <= 0) {
            players[leaderId - 1].teamleader = -1;
            teamsArray.splice(idx, 1);
            logContent.push("With " + leader.name + " dead their team disolves.");

            //leader dead, no team
        } else {
            //written out for clarity.
            //example 10 liveing players, 6 in group, 4 out of group, mod is +2
            const modifier = (livingPlayers.length - members.length + 1) - (members.length + 1)
            const roll = d10();
            if ((roll) > leader.lead) {
                //disolve team
                //TODO conditional for 2 member teams
                members.forEach((record) => {
                    players[record.id - 1].teamleader = -1
                })
                players[leaderId - 1].teamleader = -1;
                console.log(leader.name + " leader rolls " + roll + " against a skill of " + leader.lead)

                teamsArray.splice(idx, 1);
                logContent.push(leader.name + "'s team mutinies and the alliance disolves.");
            } else {
                members.forEach((member) => {
                    const roll = d10();
                    const playerRecord = players[member.id - 1]

                    if (roll > playerRecord.lead) {
                        players[member.id - 1].teamleader = -1
                        members = members.filter(record => record.id !== member.id)
                        logContent.push(member.name + " leaves their team.");

                        //save this until we know if they attack
                        //logContent.push(member.name + " has an argument with their team and leaves.");
                    }
                });
                if (members.length === 1) {
                    players[members[0].id - 1].teamleader = -1
                }
            }
        }

    });
    combatCycleNew(livingPlayers, mapHexes, logContent, false, roundCount, betrayers);
    //was that the last player? then end the game
    if (players.filter((player) => player.health > 0).length === 1) {
        crownWinner(players.filter((player) => player.health > 0)[0], logContent)
    }
    shrinkMap(livingPlayers, mapHexes, logContent)


}
export function shrinkMap(players, mapHexes, logContent) {
    const livingPlayers = players.filter((player) => player.health > 0);
    const activeHexes = mapHexes.filter((hex) => hex.isValid);
    if (Math.ceil(livingPlayers.length / 2) < activeHexes.length) {
        const targetHex = activeHexes[activeHexes.length - 1];
        logContent.push(targetHex.biome + ' is being deactivated')

        targetHex.isValid = false;
        targetHex.styleName = "ravine"
    }
}
function crownWinner(winner, logContent) {
    logContent.push(winner.name + ' has won the Hangry Games!')
}
export function findValidTravelHexes(currentHex, mapHexes) {
    //traveling 1 step is aways Q adds 1, subtracts 1, orstays the same
    //if q stays the same, S+1,R-1 or S-1,R+1
    //if q -1, S+1 or R+1
    //if q +1, S-1 or R-1
    //total of 6 possible destinations
    const filteredHexes = mapHexes.filter((hex) => (hex.isValid))
    const Q = currentHex[0];
    const R = currentHex[1];
    const S = currentHex[2];
    const availableDirections = [[Q, R - 1, S + 1], [Q, R + 1, S - 1], [Q - 1, R, S + 1], [Q - 1, R + 1, S], [Q + 1, R, S - 1], [Q + 1, R - 1, S]]
    const validHexes = [];
    filteredHexes.forEach(hex => {
        const hexAddress = [hex.hex.q, hex.hex.r, hex.hex.s]
        let validAddress = availableDirections.filter((address) => address[0] == hexAddress[0] && address[1] == hexAddress[1] && address[2] == hexAddress[2])
        if (validAddress.length) {
            validHexes.push(validAddress)
        }
    });
    return validHexes;
}
export function getValidTravelHexes(currentHex, mapHexes) {
    //traveling 1 step is aways Q adds 1, subtracts 1, orstays the same
    //if q stays the same, S+1,R-1 or S-1,R+1
    //if q -1, S+1 or R+1
    //if q +1, S-1 or R-1
    //total of 6 possible destinations
    const filteredHexes = mapHexes.filter((hex) => (hex.isValid))
    const Q = currentHex[0];
    const R = currentHex[1];
    const S = currentHex[2];
    const availableDirections = [[Q, R - 1, S + 1], [Q, R + 1, S - 1], [Q - 1, R, S + 1], [Q - 1, R + 1, S], [Q + 1, R, S - 1], [Q + 1, R - 1, S]]
    const validHexes = [];
    filteredHexes.forEach(hex => {
        const hexAddress = [hex.hex.q, hex.hex.r, hex.hex.s]
        let validAddress = availableDirections.filter((address) => address[0] == hexAddress[0] && address[1] == hexAddress[1] && address[2] == hexAddress[2])
        if (validAddress.length) {
            const validHex = hexLookup(validAddress[0], mapHexes)[0];
            validHexes.push(validHex)
        }
    });
    return validHexes;
}
export function updateLocationById(mapHexes, location, player) {
    const newLocation = hexLookup(location, mapHexes)[0];
    const oldLocation = hexLookup(player.location, mapHexes)[0];
    newLocation.pop.push(player.id);
    oldLocation.pop = oldLocation.pop.filter((id) => id !== player.id);
    player.location = location;
    player.locationname = newLocation.biome;
    player.oldLocation = oldLocation.id;
    //console.log(player.name + ' moves to ' + player.locationname)
    return player;
}
export function updateHexLocation(mapHexes, newLocation, player) {
    const oldLocation = hexLookup(player.location, mapHexes)[0];
    const newAddress = [newLocation.hex.q,newLocation.hex.r,newLocation.hex.s]
    newLocation.pop.push(player.id);
    oldLocation.pop = oldLocation.pop.filter((id) => id !== player.id);
    player.location = newAddress;
    player.locationname = newLocation.biome;
    player.oldLocation = oldLocation.id;
    //console.log(player.name + ' moves to ' + player.locationname)
    return player;
}
export function weaponSearch(player, logContent, modifier = 0) {
    if (d10() <= player.find + modifier) {
        const weapon = selectRandom(weapons)
        player.weapon = weapon;
        player.speed = weaponsStats[weapon].speed;
        logContent.push(player.name + ' searches for a weapon and finds a ' + weapon + '!')
    } else {
        logContent.push(player.name + ' searches for a weapon and finds nothing!')
    }
    return player;
}
function d100() {
    return Math.floor(Math.random() * 100) + 1;
}
function d10() {
    return Math.floor(Math.random() * 10) + 1;
}
function d8() {
    return Math.floor(Math.random() * 8) + 1;
}
function selectFromHat(selectionList) {
    const count = selectionList.length;
    const randomSelection = Math.floor(Math.random() * count);
    const selection = selectionList.splice(randomSelection, 1);
    return selection[0];
}
function selectRandom(selectionList) {
    const count = selectionList.length;
    const randomSelection = Math.floor(Math.random() * count);
    const selection = selectionList[randomSelection];
    return selection;
}
function hexLookup(address, mapHexes) {
    let returnedHex = mapHexes.filter((hex) => address[0] == hex.hex.q && address[1] == hex.hex.r && address[2] == hex.hex.s)
    return returnedHex;
}
function playerLookup(players, id) {
    return players.filter((player) => player.id === id);
}

