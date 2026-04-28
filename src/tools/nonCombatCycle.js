import { craftableWeapons, weapons } from "../app/data/staticData";
import { getValidTravelHexes, updateHexLocation } from "./helpers";
import { d10, hexLookup, selectRandom } from "./utils";

export function nonCombatCycleDecisions(player) {
    const hasWeaponMod = (player.weapon !== 'bare fist') ? 2 : 0;
    // Armed/confident players stay to forage; unarmed/scared players move
    const playerForages = d10() < player.aggro + hasWeaponMod;
    return playerForages;
}

export function nonCombatCycle(playersMoving, playersNonCombat, mapHexes, logContent) {
    playersNonCombat.forEach(player => {
        const currentHex = hexLookup(player.location, mapHexes)[0];
        const intPassCheck = d10() <= player.int;
        const findPassCheck = d10() <= player.find;

        if (player.health < 3 && intPassCheck) {
            logContent.push(player.name + ' successfuly crafts a balm and heals themself.');
            player.health = player.health + 1;
        } else if (player.weapon === 'bare fist') {
            if (
                (player.locationname === 'arena' ||
                 player.locationname === 'old fort' ||
                 player.locationname === 'old shed') &&
                findPassCheck
            ) {
                const newWeapon = selectRandom(weapons);
                logContent.push(player.name + ' finds a ' + newWeapon + ' in the ' + player.locationname + '.');
                player.weapon = newWeapon;
            } else if (intPassCheck) {
                const newWeapon = selectRandom(craftableWeapons);
                logContent.push(player.name + ' successfuly crafts a ' + newWeapon + '.');
                player.weapon = newWeapon;
            }
        } else if (currentHex.defendowner === player.id || currentHex.defendowner === player.teamleader) {
            logContent.push(player.name + ' fortifies their position.');
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

        let reason = ' wandering';
        if (player.weapon === 'bare fist' && weaponCaches.length > 0) {
            reason = ' looking for a weapon';
            randomHex = selectRandom(weaponCaches);
        } else if (isAggressive && busyHexes.length > 0) {
            reason = ' looking for a fight';
            randomHex = busyHexes[0];
        } else if (!isAggressive && emptyHexes.length > 0) {
            reason = ' looking for a place to lay low';
            randomHex = selectRandom(emptyHexes);
        }

        if (randomHex) {
            player = updateHexLocation(mapHexes, randomHex, player);
            logContent.push(player.name + ' moves from the ' + currentHex.biome + ' to the ' + player.locationname + reason);
        } else {
            currentHex.pop = currentHex.pop.filter(id => id !== player.id);
            player.health = 0;
            player.location = 'dead';
            player.death = 'killed by a shrinking map.';
            logContent.push(player.name + ', cut off from escape in the ' + player.locationname + ', is killed by a shrinking map.');
        }
    });
}
