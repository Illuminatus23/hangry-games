import { historyDescriptors, planetDescriptors, government } from "./data/world";
import { fullEnlistmentOps, serviceBranchOptions } from "./data/enlistment";
import { schools, chanceToDescriptor, skillToDescriptor, decorationDescriptor, Title, rank, careerDesc, Skills, Weapons } from "./data/character";
import { Basics } from "./data/basics";
import { Army } from "./data/army";
import { Navy } from "./data/navy";
import { Scouts } from "./data/scouts";
import { Merchants } from "./data/merchants";
import { Specops, Battles, Names, CourtMartial } from "./data/narrative";

export const datatables = {
    historyDescriptors, planetDescriptors, government,
    fullEnlistmentOps, serviceBranchOptions,
    schools, chanceToDescriptor, skillToDescriptor, decorationDescriptor, Title,
    rank, careerDesc, Skills, Weapons,
    Basics, Army, Navy, Scouts, Merchants,
    Specops, Battles, Names, CourtMartial,
};
