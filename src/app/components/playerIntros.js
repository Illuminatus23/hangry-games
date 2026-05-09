import { motion } from "motion/react";
import { GiPerson } from "react-icons/gi";
import { weaponsStats } from "@/app/data/staticData";
import { IconContext } from "react-icons";
import { HealthStatus } from "./playerList";
import { getTemp, getTraining, getHideAndSeek } from "@/tools/helpers";

export default function PlayerIntros({ players, district }) {
  const districtPlayers = players.filter(p => p.district === Number(district));

  return (
    <div className="flex flex-col sm:flex-row gap-8 w-full overflow-hidden">
      {districtPlayers.map((player, idx) => (
        <motion.div
          key={`${district}-${player.id}`}
          className="flex-1 flex flex-col items-center bg-stone-900 border border-stone-700 rounded-xl p-6"
          initial={{ x: idx === 0 ? -400 : 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 16, delay: idx * 0.1 }}
        >
          <GiPerson style={{ fontSize: 'min(50vh, 40vw)' }} fill={player.color} />
          <h2 className="text-2xl sm:text-4xl font-bold mt-4">{player.name}</h2>
          <p className="text-stone-400 text-sm uppercase tracking-widest mt-1">District {player.district}</p>
          <hr className="border-stone-600 my-3 w-full" />
          <p className="text-xl font-semibold">{player.job}</p>
          <p className="text-stone-400 mt-1">
            {getTraining(player.dex, player.str)}, {getHideAndSeek(player.find, player.hide)}, {getTemp(player.lead, player.int)}
          </p>
          {/*  <hr className="border-stone-600 my-3 w-full" />
          <div className="flex items-center gap-3 text-lg">
            <HealthStatus health={player.health} />
            <IconContext.Provider value={{ attr: { className: 'inline' } }}>
              {weaponsStats[player.weapon].icon}
            </IconContext.Provider>
            <span className="text-stone-400 capitalize">{player.weapon}</span>
          </div> */}
        </motion.div>
      ))}
    </div>
  );
}
