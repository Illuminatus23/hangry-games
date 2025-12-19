import { weaponsStats, playerHexColors } from "../app/data/staticData";
import { nonCombatCycleDecisions, nonCombatCycle } from "./nonCombatCycle";

function d10() {
    return Math.floor(Math.random() * 10) + 1;
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
export function combatCycleNew(livingPlayers, mapHexes, logContent, isFirstRound, roundCount = 1, betrayers = []) {
    //if non-allies in area check if they find each other
    //build an obj of each player and who they see, who is NOT a teammate

    //those who are safe or think they are will scavenge, then craft/fortify

    //those who are not safe attack a random target they see

    //those who are hurt this round will move in a random direction

    //those who are unhurt will move if they have a need, no-weapon or injured will move 
    // toward Old Fort  or Old Shed if they exist
    // those who fail agression checks and are safe, move in a random direction, 
    // those who pass, fortify their position
    const availableHexes = mapHexes.map((hex) => {
        return hex.hex.q.toString() + hex.hex.r.toString() + hex.hex.s.toString();
    });
    const populatedHexes = availableHexes.reduce((r, e) => {
        r[e] = [];
        return r;
    }, {});
    let playersMoving = [];
    let playersNonCombat = [];
    livingPlayers.forEach((player) => {
        const locationHex = player.location[0].toString() + player.location[1].toString() + player.location[2].toString();
        populatedHexes[locationHex].push(player)
    });
    for (var key in populatedHexes) {
        if (populatedHexes.hasOwnProperty(key)) {
            const battle = populatedHexes[key];
            battle.sort((a, b) => (a.speed < b.speed) ? -1 : 1);
            //finding 
            if (battle.length >= 2) {

                const currentHex = mapHexes.filter((maphex) => maphex.id === key)[0]
                if (currentHex) {
                    const hexName = currentHex.biome;

                    const results = hexBattle(currentHex, hexName, battle, logContent, isFirstRound, roundCount)
                    playersMoving = playersMoving.concat(results.playersMoving);
                    playersNonCombat = playersNonCombat.concat(results.playersNonCombat);
                } else {
                    //console.warn('whah?', mapHexes, key)
                }
            } else if (battle.length === 1) {
                //solo individuals
                const currentHex = mapHexes.filter((maphex) => maphex.id === key)[0]
                const validHex = (currentHex.isValid)

                const player = battle[0]
                const forages = nonCombatCycleDecisions(player)
                if (forages && validHex) {
                    playersNonCombat.push(player);
                } else {
                    playersMoving.push(player);
                }
            }
        }
    }
    if (!isFirstRound) {
        nonCombatCycle(playersMoving, playersNonCombat, mapHexes, logContent);

    }
}
export function hexBattle(currentHex, hexName, battle, logContent, isFirstRound, roundCount) {
    let announced = false;
    const playersNonCombat = [];
    const playersMoving = [];
    //hex by hex
    battle.forEach((attacker) => {
        const defenders = battle.filter((def) => def.teamleader !== attacker.teamleader || (def.teamleader === -1 && def.id !== attacker.id) && def.health > 0);
        let targets = [];
        const validHex = (currentHex.isValid)

        if (attacker.health > 0) {
            if (defenders.length === 0 && !isFirstRound && validHex) {
                //capture territory
                const leader = (attacker.teamleader === -1) ? attacker.id : attacker.teamleader;
                const owner = currentHex.defendowner;
                //message of change of ownership

                if (owner != leader) {
                    const captureMessage = (attacker.teamleader === -1) ? attacker.name + ' captures the ' + currentHex.biome + ' for themself.' : attacker.name + ' captures the ' + currentHex.biome + ' for their team.'
                    currentHex.defendowner = leader;

                    logContent.push(captureMessage)

                }
            }
            // no hiding in the area. Avoids endless hiding games
            if (currentHex.biome === 'arena') {
                targets = defenders;
            } else {
                defenders.forEach((defender) => {
                    if (d10() > defender.hide) {
                        targets.push(defender)
                    }
                })
            }


            if (targets.length !== 0) {
                if (!announced) {
                    //TODO rewrite log function and strucure
                    logContent.push("Battle in the " + hexName);
                    announced = true;
                }

                let attackMessage = attackResults(attacker, targets, currentHex, roundCount, battle);
                const outOfAmmo = ammoCheck(attacker.weapon);

                if (outOfAmmo && attacker.health > 0) {
                    attackMessage = attackMessage + '  Out of ammo, ' + attacker.name + ' no longer has a weapon.'
                    attacker.weapon = 'bare fist'
                }

                logContent.push(attackMessage)

                //if no targets left, do we run non combat?  Let's check the scene
                const enemies = defenders.filter((player) => player.health !== 0)

                //force move if tile invalid

                if (enemies.length > 0 && attacker.health > 0) {
                    const retreats = ((d10() > (attacker.aggro - 3 + attacker.health) || !validHex))
                    if (retreats) {
                        //console.warn(attacker.name + ' retreating')
                        playersMoving.push(attacker);
                    } else {
                        console.log(attacker.name + ' staying to fight in the ' + currentHex.biome)
                    }
                }
            }
            else if (attacker.health > 0) {
                //TODO if no targets, but there are people, chance for alliance
                //run non-combat options to see if stays or moves
                const forages = nonCombatCycleDecisions(attacker)
                if (forages && validHex) {
                    playersNonCombat.push(attacker);
                } else {
                    playersMoving.push(attacker);
                }
            }

        } else {
            console.log(attacker.name + ' is dead, dummy')
        }
    })
    return {
        playersMoving: playersMoving.filter((player) => player.health > 0),
        playersNonCombat: playersNonCombat.filter((player) => player.health > 0),
    }
}
export function attackResults(attacker, targets, currentHex, roundCount, inBattle) {
    //if unarmed, may not attack
    if (d10() > attacker.aggro && attacker.weapon === 'bare fist') {
        //console.log(attacker.name + ' chooses not to attack with bare hands at ' + key)

    } else {
        const defender = selectRandom(targets)
        const attackSkill = weaponsStats[attacker.weapon].skill;
        const doesHit = (d10() <= attacker[attackSkill]);

        //console.log(attacker.name + ' is attacking ' + defender.name + ' with a ' + attacker.weapon + ' speed of ' + attacker.speed + ' at ' + key)
        if (doesHit && defender.health > 0) {
            const damage = weaponsStats[attacker.weapon].damage;
            defender.health = defender.health - damage;

            if (defender.health <= 0) {
                //currentHex.pop = currentHex.pop.filter((id) => id !== defender.id);
                //defender.location = 'dead';
                defender.death = 'killed by ' + attacker.name + ' with a ' + attacker.weapon + ' in the ' + currentHex.biome + ' on round ' + Number(roundCount + 1);
                return attacker.name + ' ' + weaponsStats[attacker.weapon].verb + ' ' + defender.name + ' with a ' + attacker.weapon + '. ' + defender.name + ' dies.'
            }
            return attacker.name + ' ' + weaponsStats[attacker.weapon].verb + ' ' + defender.name + ' with a ' + attacker.weapon + ' wounding them.';

        } else if (defender.health > 0) {
            if (attacker.weapon === "grenade") {
                //chance to hurt others
                const oopsie = selectRandom(inBattle)

                if (oopsie.health > 0) {
                    oopsie.health = 0;
                    
                    if (attacker.name === oopsie.name) {
                        oopsie.death = 'accidentally killed themsevles with a ' + attacker.weapon + ' in the ' + currentHex.biome + ' on round ' + Number(roundCount + 1);
                        return attacker.name + ' ' + weaponsStats[attacker.weapon].verb + ' ' + defender.name + ' with a ' + attacker.weapon + ' but fumbles, blowing themselves up.';
                    } else {
                        oopsie.death = 'accidentally killed by ' + attacker.name + ' with a ' + attacker.weapon + ' in the ' + currentHex.biome + ' on round ' + Number(roundCount + 1);
                        return attacker.name + ' ' + weaponsStats[attacker.weapon].verb + ' ' + defender.name + ' with a ' + attacker.weapon + ' but misses. An unlucky bounce catches ' + oopsie.name + ' in the blast, killing them.';
                    }
                    
                }
            }
            return attacker.name + ' ' + weaponsStats[attacker.weapon].verb + ' ' + defender.name + ' with a ' + attacker.weapon + ' but misses.';
        }
    }
}
export function ammoCheck(weapon) {
    const ammo = weaponsStats[weapon].ammo;
    const d100 = Math.floor(Math.random() * 100) + 1;
    if (d100 < ammo) { return true }
    return false
}
