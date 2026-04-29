// Named helpers for styled log entries. Return React elements that can be
// pushed directly to logContent. Adjust className values here to restyle.

export const logRound = (n) => <b className="text-base">Round {n}</b>;
export const logBattle = (text) => <b className="text-teal-400">{text}</b>;
export const logBattleList = (text) => <b className="text-teal-400 text-xs">{text}</b>;
export const logHit = (text) => <span className="text-red-200 font-semibold">{text}</span>;
export const logMiss = (text) => <span className="text-gray-500 font-semibold">{text}</span>;
export const logDeath = (text) => <span className="text-red-400 font-bold">{text}</span>;
export const logAlliance = (text) => <span className="text-yellow-300 font-semibold">{text}</span>;
export const logAllianceCheck = (text) => <span className="text-stone-400 text-xs italic">{text}</span>;
export const logDissolve = (text) => <span className="text-stone-400 italic">{text}</span>;
export const logShrink = (text) => <span className="text-orange-400">{text}</span>;
export const logWinner       = (text) => <span className="text-green-700 font-bold">{text}</span>;
export const logFailedSearch = (text) => <span className="text-gray-500 italic">{text}</span>;
