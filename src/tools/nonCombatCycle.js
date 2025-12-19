import { craftableWeapons, weapons } from "../app/data/staticData";
import { findValidTravelHexes, getValidTravelHexes, updateLocation, updateHexLocation } from "./helpers";

function hexLookup(address, mapHexes) {
    let returnedHex = mapHexes.filter((hex) => address[0] == hex.hex.q && address[1] == hex.hex.r && address[2] == hex.hex.s)
    return returnedHex;
}
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

export function nonCombatCycleDecisions(player) {

    //those who are safe or think they are will scavenge, then craft/fortify

    //those who are hurt this round will move in a random direction

    //those who are unhurt will move if they have a need, no-weapon or injured will move 
    // toward Old Fort  or Old Shed if they exist
    // those who fail agression checks and are safe, move in a random direction, 
    // those who pass, fortify their position
    const hasWeaponMod = (player.weapon !== 'bare fist') ? 2 : 0;
    const playerMoves = (d10() < player.aggro + hasWeaponMod);
    return playerMoves

}

export function nonCombatCycle(playersMoving, playersNonCombat, mapHexes, logContent) {

    console.log('playersMoving', playersMoving)
    console.log('playersNonCombat', playersNonCombat)

    playersNonCombat.forEach((player) => {
        const currentHex = hexLookup(player.location, mapHexes)[0];
        console.log(player.name, currentHex.biome, 'foraging')
        const intPassCheck = (d10() <= player.int);
        const findPassCheck = (d10() <= player.find);
        //if hurt, craft meds
        //if no weapon, craft weapon
        if (player.health < 3 && intPassCheck) {
            logContent.push(player.name + ' successfuly crafts a balm and heals themself.');
            player.health = player.health + 1;
        } else if (player.weapon === 'bare fist') {
            if ((player.locationname === 'arena' ||
                player.locationname === 'old fort' ||
                player.locationname === 'old shed' &&
                findPassCheck)
            ) {
                const newWeapon = selectRandom(weapons);
                logContent.push(player.name + ' finds a ' + newWeapon + ' in the ' + player.locationname + '.');
                player.weapon = newWeapon
            } else if (intPassCheck) {
                const newWeapon = selectRandom(craftableWeapons);
                logContent.push(player.name + ' successfuly crafts a ' + newWeapon + '.');
                player.weapon = newWeapon
            }

        } else if (currentHex.defendowner === player.id || currentHex.defendowner === player.teamleader) {
            logContent.push(player.name + ' fortifies their position.');
            currentHex.defensemod = currentHex.defensemod + 1;
        }
        //otherwise fortify position (or TBD trap)
    })
    playersMoving.forEach((player) => {

        const currentHex = hexLookup(player.location, mapHexes)[0];
        const currentHexGrid = [currentHex.hex.q, currentHex.hex.r, currentHex.hex.s]
        //console.log(player.name, currentHex, 'moving')
        //if no weapon, move toward 'old' area
        //if hurt, move to empty(emptiest) location
        //otherwise random

        //let's start with just random
        const validHexes = getValidTravelHexes(currentHexGrid, mapHexes);
        let randomHex = selectRandom(validHexes);

        //flag certain hexes, old/arena if weaponless
        //empty areas if non aggro / "least populated" populated hexes if agro
        
        const emptyHexes = validHexes.filter((hex) => hex.pop.length === 0)
        const busyHexes = validHexes.filter((hex) => hex.pop.length === 0).sort((a, b) => {
            if (a.pop.length > b.pop.length) { return -1 }
            else if (a.pop.length < b.pop.length) { return 1 }
            else { return 0 }
        })
        const weaponCaches = validHexes.filter((hex) => hex.styleName === 'old')
        const isAggressive = (d10() <= player.aggro);
        let reason = ' wandering'
        if (player.weapon === 'bare fist' && weaponCaches.length >0) {
            reason = ' looking for a weapon'
            randomHex = selectRandom(weaponCaches);
        } else if (isAggressive && busyHexes.length > 0) {
            reason = ' looking for a fight'
            randomHex = busyHexes[0];
        } else if (!isAggressive && emptyHexes.length > 0) {
            reason = ' looking for a place to lay low'
            randomHex = selectRandom(emptyHexes);
        }
        console.log('randomHex',player.name, randomHex, reason)

        if (randomHex) {
            player = updateHexLocation(mapHexes, randomHex, player)
            logContent.push(player.name + ' moves from the '+currentHex.biome+' to the ' + player.locationname + reason)

        } else {
            console.log(player.name + ' gets the shaft')
            currentHex.pop = currentHex.pop.filter((id) => id !== player.id);

            player.health = 0;
            player.location = 'dead';
            player.death = 'killed by a shrinking map.'
            logContent.push(player.name + ', cut off from escape in the ' + player.locationname + ', is killed by a shrinking map.')

        }




    })
}