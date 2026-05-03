export function d100() {
    return Math.floor(Math.random() * 100) + 1;
}
export function d10() {
    return Math.floor(Math.random() * 10) + 1;
}
export function d8() {
    return Math.floor(Math.random() * 8) + 1;
}
export function d4() {
    return Math.floor(Math.random() * 4) + 1;
}
export function selectFromHat(list) {
    return list.splice(Math.floor(Math.random() * list.length), 1)[0];
}
export function selectRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}
export function article(word) {
    return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
export function hexLookup(address, mapHexes) {
    return mapHexes.filter(hex =>
        address[0] === hex.hex.q && address[1] === hex.hex.r && address[2] === hex.hex.s
    );
}
