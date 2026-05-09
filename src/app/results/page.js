"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { GiPerson, GiTrophy, GiLaurelCrown, GiMedal } from "react-icons/gi";
import { weaponsStats } from "@/app/data/staticData";
import { IconContext } from "react-icons";
import { HealthStatus } from "../components/playerList";
import { getTemp, getTraining, getHideAndSeek } from "@/tools/helpers";
import { article } from "@/tools/utils";

const PLACE_CONFIG = {
  1: {
    label: '1st Place',
    banner: 'bg-yellow-500/20 border-yellow-500',
    text: 'text-yellow-400',
    icon: <GiTrophy className="inline mr-2" />,
  },
  2: {
    label: '2nd Place',
    banner: 'bg-stone-400/20 border-stone-400',
    text: 'text-stone-300',
    icon: <GiLaurelCrown className="inline mr-2" />,
  },
  3: {
    label: '3rd Place',
    banner: 'bg-amber-700/20 border-amber-700',
    text: 'text-amber-600',
    icon: <GiMedal className="inline mr-2" />,
  },
};

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function Results() {
  const router = useRouter();
  const [sorted, setSorted] = useState(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem('gameResults');
    if (!stored) { router.push('/'); return; }
    const players = JSON.parse(stored);
    const order = [...players].sort((a, b) => {
      if (a.deathOrder === null && b.deathOrder === null) return 0;
      if (a.deathOrder === null) return 1;
      if (b.deathOrder === null) return -1;
      return a.deathOrder - b.deathOrder;
    });
    setSorted(order);
  }, [router]);

  if (!sorted) return null;

  const total = sorted.length;
  const player = sorted[idx];
  const place = total - idx;
  const placeConfig = PLACE_CONFIG[place];
  const isTopThree = place <= 3;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center mb-8">
        <p className="text-3xl sm:text-6xl font-bold tracking-tight">The Hangry Games</p>
        <p className="text-stone-400 mt-3 text-lg sm:text-2xl">Final Results</p>
      </header>

      <main className="flex flex-col md:flex-row gap-8 w-full flex-1">
        {/* Left: player card */}
        <motion.div
          key={`card-${player.id}`}
          className="flex-1 flex flex-col items-center bg-stone-900 border border-stone-700 rounded-xl p-6"
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
        >
          <GiPerson style={{ fontSize: 'min(50vh, 40vw)' }} fill={player.color} />
          <h2 className="text-2xl sm:text-4xl font-bold mt-4">{player.name}</h2>
          <p className="text-stone-400 text-sm uppercase tracking-widest mt-1">District {player.district}</p>
          <hr className="border-stone-600 my-3 w-full" />
          <p className="text-xl font-semibold">{player.job}</p>
          <p className="text-stone-400 mt-1">
            {getTraining(player.dex, player.str)}, {getHideAndSeek(player.find, player.hide)}, {getTemp(player.lead, player.int)}
          </p>
        </motion.div>

        {/* Right: results */}
        <motion.div
          key={`stats-${player.id}`}
          className="flex-1 flex flex-col justify-center gap-6"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.08 }}
        >
          {isTopThree ? (
            <div className={`border-2 rounded-xl p-6 ${placeConfig.banner}`}>
              <p className={`text-3xl sm:text-5xl font-bold ${placeConfig.text}`}>
                {placeConfig.icon}{placeConfig.label}
              </p>
            </div>
          ) : (
            <p className="text-2xl sm:text-4xl font-bold text-stone-400">{ordinal(place)}</p>
          )}

          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Kills: {player.kills || 0}</p>
              {player.killLog?.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1">
                  {player.killLog.map((entry, i) => (
                    <li key={i} className="text-stone-300 text-sm">
                      Killed {entry.victim} with {article(entry.weapon)} {entry.weapon} on round {entry.round}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <hr className="border-stone-700" />
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Fate</p>
              <p className="text-lg text-stone-300">
                {player.death
                  ? player.death.charAt(0).toUpperCase() + player.death.slice(1)
                  : `${player.name} survived to claim victory.`}
              </p>
            </div>
            <hr className="border-stone-700" />
            <div className="flex items-center gap-3">
              <HealthStatus health={player.health} />
              <IconContext.Provider value={{ attr: { className: 'inline' } }}>
                {weaponsStats[player.weapon]?.icon}
              </IconContext.Provider>
              <span className="text-stone-400 capitalize">{player.weapon}</span>
            </div>
          </div>
        </motion.div>
      </main>

      <div className="flex flex-wrap gap-4 mt-10 justify-center">
        <button
          className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setIdx(i => i - 1)}
          disabled={idx === 0}
        >
          Previous Player
        </button>
        <button
          className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-8 rounded-lg transition-colors"
          onClick={() => { sessionStorage.clear(); router.push('/'); }}
        >
          Reset the Games
        </button>
        <button
          className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setIdx(i => i + 1)}
          disabled={idx === total - 1}
        >
          Next Player
        </button>
      </div>
    </div>
  );
}
