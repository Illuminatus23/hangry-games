import { weaponsStats } from "../app/data/staticData";
import { nonCombatCycleDecisions, nonCombatCycle } from "./nonCombatCycle";
import { d10, d100, selectRandom, article } from "./utils";
import { logBattle, logBattleList, logMiss, logHit, logDeath, logAlliance, logAllianceCheck } from "./logStyles";

// Builds the attack sentence; verbFirst weapons (e.g. boomerang) use "throws X at Y" order instead of "attacks Y with X".
function attackPhrase(attackerName, defenderName, weapon) {
    const stats = weaponsStats[weapon];
    if (stats.verbFirst) {
        return attackerName + ' ' + stats.verb + ' ' + article(weapon) + ' ' + weapon + ' at ' + defenderName;
    }
    return attackerName + ' ' + stats.verb + ' ' + defenderName + ' with ' + article(weapon) + ' ' + weapon;
}

// Groups all living players by hex, then runs hexBattle for contested hexes and nonCombatCycle for solo players.
export function combatCycleNew(livingPlayers, mapHexes, logContent, isFirstRound, roundCount = 1, betrayers = [], teamsArray = [], events = []) {
    const availableHexes = mapHexes.map(hex =>
        hex.hex.q.toString() + hex.hex.r.toString() + hex.hex.s.toString()
    );
    const populatedHexes = availableHexes.reduce((r, e) => {
        r[e] = [];
        return r;
    }, {});

    let playersMoving = [];
    let playersNonCombat = [];

    livingPlayers.forEach(player => {
        const locationHex = player.location[0].toString() + player.location[1].toString() + player.location[2].toString();
        populatedHexes[locationHex].push(player);
    });

    for (const key in populatedHexes) {
        if (!Object.prototype.hasOwnProperty.call(populatedHexes, key)) continue;

        const battle = populatedHexes[key];
        battle.sort((a, b) => (a.speed < b.speed) ? -1 : 1);

        if (battle.length >= 2) {
            const currentHex = mapHexes.find(maphex => maphex.id === key);
            if (currentHex) {
                const results = hexBattle(currentHex, currentHex.biome, battle, logContent, isFirstRound, roundCount, teamsArray, events);
                playersMoving = playersMoving.concat(results.playersMoving);
                playersNonCombat = playersNonCombat.concat(results.playersNonCombat);
            }
        } else if (battle.length === 1) {
            const currentHex = mapHexes.find(maphex => maphex.id === key);
            const player = battle[0];
            const forages = nonCombatCycleDecisions(player);
            if (forages && currentHex.isValid) {
                playersNonCombat.push(player);
            } else {
                playersMoving.push(player);
            }
        }
    }

    if (!isFirstRound) {
        nonCombatCycle(playersMoving, playersNonCombat, mapHexes, logContent, events);
    }
}

// Resolves one round of combat for all players sharing a hex: hide rolls, attacks, hex capture, and post-combat alliance checks.
export function hexBattle(currentHex, hexName, battle, logContent, isFirstRound, roundCount, teamsArray = [], events = []) {
    let announced = false;
    const playersNonCombat = [];
    const playersMoving = [];

    battle.forEach(attacker => {
        if (attacker.health <= 0) return;

        const defenders = battle.filter(def =>
            def.health > 0 &&
            (def.teamleader !== attacker.teamleader ||
                (def.teamleader === -1 && def.id !== attacker.id))
        );

        const validHex = currentHex.isValid;

        if (defenders.length === 0 && !isFirstRound && validHex) {
            const leader = (attacker.teamleader === -1) ? attacker.id : attacker.teamleader;
            if (currentHex.defendowner !== leader) {
                const captureMessage = (attacker.teamleader === -1)
                    ? attacker.name + ' captures the ' + currentHex.biome + ' for themself.'
                    : attacker.name + ' captures the ' + currentHex.biome + ' for their team.';
                currentHex.defendowner = leader;
                logContent.push(captureMessage);
            }
        }

        let targets = [];
        if (currentHex.biome === 'arena') {
            targets = defenders;
        } else {
            defenders.forEach(defender => {
                if (d10() > defender.hide) targets.push(defender);
            });
        }

        if (targets.length !== 0) {
            if (!announced) {
                logContent.push(logBattle("Battle in the " + hexName));
                const names = targets.map(target => target.name);
                logContent.push(logBattleList(names.join(', ') + " and " + attacker.name));
                announced = true;
            }

            const attackMessage = attackResults(attacker, targets, currentHex, roundCount, battle, events);
            if (attackMessage) logContent.push(attackMessage);

            const outOfAmmo = ammoCheck(attacker.weapon);
            if (outOfAmmo && attacker.health > 0) {
                attacker.weapon = 'bare fist';
                logContent.push('Out of ammo, ' + attacker.name + ' no longer has a weapon.');
            }

            const enemies = defenders.filter(player => player.health > 0);
            if (enemies.length > 0 && attacker.health > 0) {
                if (d10() > (attacker.aggro - 3 + attacker.health) || !validHex) {
                    playersMoving.push(attacker);
                }
            }
        } else if (attacker.health > 0) {
            const forages = nonCombatCycleDecisions(attacker);
            if (forages && validHex) {
                playersNonCombat.push(attacker);
            } else {
                playersMoving.push(attacker);
            }
        }
    });

    // No fighting this hex — check if solo players want to form a new alliance
    if (!announced && !isFirstRound) {
        checkAllianceFormation(battle, logContent, teamsArray);
    }

    return {
        playersMoving: playersMoving.filter(player => player.health > 0),
        playersNonCombat: playersNonCombat.filter(player => player.health > 0),
    };
}

// After a peaceful hex (no combat announced), rolls for spontaneous alliance between solo players who both pass a lead check.
function checkAllianceFormation(battle, logContent, teamsArray) {
    const solos = battle.filter(p => p.health > 0 && p.teamleader === -1);
    if (solos.length < 2) return;

    const interested = solos.filter(p => d10() <= p.lead);

    /*  logContent.push(logAllianceCheck(
         '[Alliance check] ' + solos.length + ' solo(s) present. ' +
         interested.length + '/' + solos.length + ' rolled under their lead.'
     )); */

    if (interested.length < 2) return;

    const leaderIdx = Math.floor(Math.random() * interested.length);
    const newLeader = interested[leaderIdx];
    const newMembers = interested.filter((_, i) => i !== leaderIdx);

    newLeader.teamleader = newLeader.id;
    newMembers.forEach(m => { m.teamleader = newLeader.id; });

    const leaderCompact = { id: newLeader.id, name: newLeader.name, lead: newLeader.lead, district: newLeader.district };
    const memberCompacts = newMembers.map(m => ({ id: m.id, name: m.name, lead: m.lead, district: m.district }));
    teamsArray.push([leaderCompact, memberCompacts]);

    const memberNames = newMembers.map(m => m.name).join(', ');
    logContent.push(logAlliance(
        '[New alliance!] ' + newLeader.name + ' forms a new team with ' + memberNames + '.'
    ));
}

// Resolves one attack: hit/miss roll, damage, grenade fumble chance. Updates kills, killLog, and death fields on the player objects in place.
export function attackResults(attacker, targets, currentHex, roundCount, inBattle, events = null) {
    if (d10() > attacker.aggro && attacker.weapon === 'bare fist') {
        return null;
    }

    const defender = selectRandom(targets);
    const attackSkill = weaponsStats[attacker.weapon].skill;
    const doesHit = d10() <= attacker[attackSkill];

    if (doesHit && defender.health > 0) {
        const damage = weaponsStats[attacker.weapon].damage();
        defender.health = defender.health - damage;

        if (defender.health <= 0) {
            attacker.kills = (attacker.kills || 0) + 1;
            attacker.killLog = [...(attacker.killLog || []), { victim: defender.name, weapon: attacker.weapon, round: roundCount + 1 }];
            defender.death = 'killed by ' + attacker.name + ' with ' + article(attacker.weapon) + ' ' + attacker.weapon + ' in the ' + currentHex.biome + ' on round ' + (roundCount + 1);
            if (events) events.push({ type: 'attack', seq: events.length, attackerId: attacker.id, defenderId: defender.id, hexId: currentHex.id, result: 'death' });
            return logDeath(attackPhrase(attacker.name, defender.name, attacker.weapon) + ' and kills ' + defender.name + '.');
        }
        if (events) events.push({ type: 'attack', seq: events.length, attackerId: attacker.id, defenderId: defender.id, hexId: currentHex.id, result: 'hit' });
        return logHit(attackPhrase(attacker.name, defender.name, attacker.weapon) + ' wounding them.');

    } else if (defender.health > 0) {
        if (attacker.weapon === "grenade") {
            const oopsie = selectRandom(inBattle);
            if (oopsie.health > 0) {
                oopsie.health = 0;
                if (attacker.name === oopsie.name) {
                    oopsie.death = 'accidentally killed themselves with ' + article(attacker.weapon) + ' ' + attacker.weapon + ' in the ' + currentHex.biome + ' on round ' + (roundCount + 1);
                    if (events) events.push({ type: 'attack', seq: events.length, attackerId: attacker.id, defenderId: attacker.id, hexId: currentHex.id, result: 'death' });
                    return logDeath(attackPhrase(attacker.name, defender.name, attacker.weapon) + ' but fumbles, blowing themselves up.');
                } else {
                    attacker.kills = (attacker.kills || 0) + 1;
                    attacker.killLog = [...(attacker.killLog || []), { victim: oopsie.name, weapon: attacker.weapon, round: roundCount + 1 }];
                    oopsie.death = 'accidentally killed by ' + attacker.name + ' with ' + article(attacker.weapon) + ' ' + attacker.weapon + ' in the ' + currentHex.biome + ' on round ' + (roundCount + 1);
                    if (events) events.push({ type: 'attack', seq: events.length, attackerId: attacker.id, defenderId: oopsie.id, hexId: currentHex.id, result: 'death' });
                    return logDeath(attackPhrase(attacker.name, defender.name, attacker.weapon) + ' but misses. An unlucky bounce catches ' + oopsie.name + ' in the blast, killing them.');
                }
            }
        }
        if (events) events.push({ type: 'attack', seq: events.length, attackerId: attacker.id, defenderId: defender.id, hexId: currentHex.id, result: 'miss' });
        return logMiss(attackPhrase(attacker.name, defender.name, attacker.weapon) + ' but misses.');
    }

    return null;
}

// Returns true if the weapon should be depleted this turn; ammo value in weaponsStats is the percent chance of running out.
export function ammoCheck(weapon) {
    const ammo = weaponsStats[weapon].ammo;
    return ammo > 0 && d100() < ammo;
}
