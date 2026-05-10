import { craftableWeapons, weapons } from "../app/data/staticData";
import { getValidTravelHexes, updateHexLocation } from "./helpers";
import { d10, hexLookup, selectRandom, article } from "./utils";
import { logDeath, logMove, logCraft } from "./logStyles";

// Decides whether a solo player forages (stays) or moves; armed players get a +2 bonus making them more likely to forage.
export function nonCombatCycleDecisions(player) {
    const hasWeaponMod = (player.weapon !== 'bare fist') ? 2 : 0;
    // Armed/confident players stay to forage; unarmed/scared players move
    const playerForages = d10() < player.aggro + hasWeaponMod;
    return playerForages;
}

// Runs foraging actions (heal, find weapon, craft, fortify) for stationary players, then moves roaming players toward goals based on aggro.
export function nonCombatCycle(playersMoving, playersNonCombat, mapHexes, logContent, events = []) {
    playersNonCombat.forEach(player => {
        const currentHex = hexLookup(player.location, mapHexes)[0];
        const intPassCheck = d10() <= player.int;
        const findPassCheck = d10() <= player.find;

        if (player.health < 3 && intPassCheck) {
            logContent.push(logCraft(player.name + ' successfuly crafts a balm and heals themself.'));
            player.health = player.health + 1;
        } else if (player.weapon === 'bare fist') {
            if (
                (player.locationname === 'arena' ||
                    player.locationname === 'old fort' ||
                    player.locationname === 'old shed') &&
                findPassCheck
            ) {
                const newWeapon = selectRandom(weapons);
                logContent.push(logCraft(player.name + ' finds ' + article(newWeapon) + ' ' + newWeapon + ' in the ' + player.locationname + '.'));
                player.weapon = newWeapon;
            } else if (intPassCheck) {
                const newWeapon = selectRandom(craftableWeapons);
                logContent.push(logCraft(player.name + ' successfuly crafts ' + article(newWeapon) + ' ' + newWeapon + '.'));
                player.weapon = newWeapon;
            }
        } else if (currentHex.defendowner === player.id || currentHex.defendowner === player.teamleader) {
            logContent.push(logCraft(player.name + ' fortifies their position.'));
            currentHex.defensemod = currentHex.defensemod + 1;
        }
    });

    playersMoving.forEach(player => {
        const currentHex = hexLookup(player.location, mapHexes)[0];
        const currentHexGrid = [currentHex.hex.q, currentHex.hex.r, currentHex.hex.s];
        const validHexes = getValidTravelHexes(currentHexGrid, mapHexes);
        let randomHex = selectRandom(validHexes);

        const emptyHexes = validHexes.filter(hex => hex.pop.length === 0);
        // Fix: busyHexes should be populated hexes, not empty ones
        const busyHexes = validHexes.filter(hex => hex.pop.length > 0).sort((a, b) => b.pop.length - a.pop.length);
        const weaponCaches = validHexes.filter(hex => hex.styleName === 'old');
        const isAggressive = d10() <= player.aggro;
        const currentHexBusy = currentHex.pop.length > 0;

        let reason = ' wandering';
        if (player.weapon === 'bare fist' && weaponCaches.length > 0) {
            reason = ' looking for a weapon';
            randomHex = selectRandom(weaponCaches);
        } else if (isAggressive && busyHexes.length > 0 && !currentHexBusy) {
            reason = ' looking for a fight';
            randomHex = busyHexes[0];
        } else if (emptyHexes.length > 0 && player.health < 2) {
            reason = ' looking for a place to heal';
            randomHex = selectRandom(emptyHexes);
        } else if (!isAggressive && emptyHexes.length > 0) {
            reason = ' trying to escape';
            randomHex = selectRandom(emptyHexes);
        }

        if (randomHex) {
            const fromHexId = currentHex.id;
            player = updateHexLocation(mapHexes, randomHex, player);
            events.push({ type: 'move', seq: events.length, playerId: player.id, fromHexId, toHexId: randomHex.id });
            logContent.push(logMove(player.name + ' moves from the ' + currentHex.biome + ' to the ' + player.locationname + reason));
        } else {
            currentHex.pop = currentHex.pop.filter(id => id !== player.id);
            player.health = 0;
            player.location = 'dead';
            player.death = 'killed by a shrinking map.';
            logContent.push(logDeath(player.name + ', cut off from escape in the ' + player.locationname + ', is killed by a shrinking map.'));
        }
    });
}
