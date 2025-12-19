
import { datatables } from "./data";
import { convertUPPtoArray } from "./helpers";

export function generateBirthText(uppArray, birthworld, name, homeworldName, skills) {
    const desc = datatables.historyDescriptors;
    const upp = {
        STR: uppArray[0],
        DEX: uppArray[1],
        END: uppArray[2],
        INT: uppArray[3],
        EDU: uppArray[4],
        SOC: uppArray[5],
    }
    const uwp = convertUPPtoArray(birthworld.uwp);

    //homeworld text

    const homeworldDesc = homeworldDescription(uwp, birthworld.government, homeworldName, birthworld.tradeClasses, birthworld.starport);

    const bGravity = uwp[0] > 10 ? "crushing" : "low";
    const bEdu = (Math.abs(upp.INT - upp.EDU) > 4) ? "despite" : "perhaps due to";
    let bPhys = ""

    const birthText = `${name} was born ${desc.social[upp.SOC - 2]} on the planet ${homeworldName}. ${homeworldDesc}.`;

    //strength text
    let bioText = `By age 18 ${name} had developed ${desc.stat[upp.STR]} strength `
    if (upp.STR >= 10) {
        const hGravDesc = (Math.abs(upp.STR - uwp[0]) >= 4) ? "despite" : "due to"
        bioText = bioText + `${hGravDesc} their world's ${bGravity} gravity `
    }
    //endurance and dex
    if (upp.END >= 9) {
        if (upp.DEX < 8) {
            bPhys = "the all-star endurance of a competitive triathelete";
        } else {
            bPhys = "the outstanding athleticism of a GravBall champion";
        }
    } else {
        if (upp.DEX > 7) {
            bPhys = "the accuracy of a medal-winning marksman";
        } else {
            if (upp.END <= 6) {
                bPhys = "no athletic skill whatsoever showing below average stamina and agility";
            } else {
                bPhys = "average but healthy athleticism";
            }
        }
    }

    //Education and intelligence
    bioText = (Math.abs(upp.EDU - upp.INT) > 4) ?
        bioText + `and exhibited ${bPhys}. ${name}${desc.education[upp.EDU - 2]} ${bEdu} their${desc.intelligence[upp.INT - 2]}` :
        bioText + `and exhibited ${bPhys}. ${name}${desc.education[upp.EDU - 2]} and had an${desc.intelligence[upp.INT - 2]}`;

        
    const techLevel=datatables.planetDescriptors.tech[uwp[5]].toLowerCase();
    const skillStr = `From daily living in their homeworld's ${techLevel} tech, ${name} gained the following skills: ${skills.join("; ")}`;
    

    return [birthText,bioText,skillStr];
}
function homeworldDescription(uwp, government, name, tradeClasses, starport) {
    const uwpDescriptors = [
        datatables.planetDescriptors.size[uwp[0]].toLowerCase(),
        datatables.planetDescriptors.atmos[uwp[1]].toLowerCase(),
        datatables.planetDescriptors.hydro[uwp[2]].toLowerCase(),
        datatables.planetDescriptors.pop[uwp[3]].toLowerCase(),
        datatables.planetDescriptors.law[government].toLowerCase(),
        datatables.planetDescriptors.tech[uwp[5]].toLowerCase(),
    ];
    let tradeDesc = "";
    for (let i = 0; i < tradeClasses.length; i++) {
        if (i !==0) {
            tradeDesc=tradeDesc+", ";
        }
        tradeDesc=tradeDesc+datatables.tradeFlags[tradeClasses[i]];
    }
    const planet = (uwp[0]===0) ? "an asteroid":`a ${uwpDescriptors[0]}-sized, ${tradeDesc} planet`;
    const govtDesc = (uwp[4]===0)? "living in total anarchy": `ruled by ${datatables.government[government]}`;

    const worldDescriptionString = `${name} is ${planet} with a ${uwpDescriptors[1]} atmosphere located ${datatables.starport[starport]}. ${name} has a ${uwpDescriptors[5]} civilization ${govtDesc.toLowerCase()}`;
    return worldDescriptionString;
}