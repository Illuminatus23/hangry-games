"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { occupations } from "@/app/data/staticData";

const professions = Object.keys(occupations).sort();

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState('landing');
  const [playerCount, setPlayerCount] = useState(24);
  const [customPlayers, setCustomPlayers] = useState([]);

  function initCustomForm() {
    setCustomPlayers(
      Array.from({ length: playerCount }, () => ({ name: '', district: '', profession: '' }))
    );
    setView('customize-form');
  }

  function updatePlayer(idx, field, value) {
    setCustomPlayers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  const districtCounts = customPlayers.reduce((acc, p) => {
    if (p.district) acc[p.district] = (acc[p.district] || 0) + 1;
    return acc;
  }, {});

  const isFormView = view === 'customize-form';

  return (
    <div className={`min-h-screen flex flex-col p-4 sm:p-20 font-[family-name:var(--font-geist-sans)] ${isFormView ? '' : 'items-center justify-center'}`}>
      <header className="text-center mb-10">
        <p className="text-3xl sm:text-6xl font-bold tracking-tight">The Hangry Games</p>
        <p className="text-stone-400 mt-3 text-lg">May the Hanger be ever in your favor.</p>
      </header>

      {view === 'landing' && (
        <main className="flex flex-col items-center gap-8 max-w-xl text-center">
          <p className="text-stone-300 leading-relaxed">
            Welcome to the Hangry Games where up to twenty-four players are drafted from twelve districts in a hex-grid battle to the death.
            Alliances form and fracture. Weapons are found, crafted, and fumbled.
            Player-bots make choices and have different skillsets.
            Each round plays out automatically — you only watch and advance.
            Only one player lives to be declared the winner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              onClick={() => router.push('/intro')}
            >
              Run Hangry Games
            </button>
            <button
              className="w-full sm:w-auto bg-stone-700 hover:bg-stone-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              onClick={() => setView('customize-count')}
            >
              Customize Hangry Games
            </button>
          </div>
        </main>
      )}

      {view === 'customize-count' && (
        <main className="flex flex-col items-center gap-6 max-w-sm w-full">
          <p className="text-stone-300 text-lg">How many custom players?</p>
          <input
            type="number"
            min={2}
            max={24}
            value={playerCount}
            onChange={e => setPlayerCount(Math.min(24, Math.max(2, Number(e.target.value))))}
            className="w-32 text-center text-2xl font-bold bg-stone-800 border border-stone-600 rounded-lg py-2 px-4 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-4">
            <button
              className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              onClick={() => setView('landing')}
            >
              Back
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              onClick={initCustomForm}
            >
              Continue
            </button>
          </div>
        </main>
      )}

      {view === 'customize-form' && (
        <main className="w-full">
          <p className="text-stone-400 text-sm uppercase tracking-widest text-center mb-6">
            Player Customization — {playerCount} Players
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {customPlayers.map((player, idx) => (
              <div key={idx} className="bg-stone-800 border border-stone-700 rounded-lg p-4 flex flex-col gap-3">
                <p className="text-stone-400 text-xs uppercase tracking-wider font-semibold">
                  Player {idx + 1}
                </p>

                <input
                  type="text"
                  placeholder="Name"
                  value={player.name}
                  onChange={e => updatePlayer(idx, 'name', e.target.value)}
                  className="bg-stone-900 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full"
                />

                <select
                  value={player.district}
                  onChange={e => updatePlayer(idx, 'district', e.target.value)}
                  className="bg-stone-900 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full"
                >
                  <option value="">District...</option>
                  {Array.from({ length: 12 }, (_, d) => {
                    const distNum = String(d + 1);
                    const isFull = (districtCounts[distNum] || 0) >= 2 && player.district !== distNum;
                    return (
                      <option key={distNum} value={distNum} disabled={isFull}>
                        District {distNum}{isFull ? ' (full)' : ''}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={player.profession}
                  onChange={e => updatePlayer(idx, 'profession', e.target.value)}
                  className="bg-stone-900 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full"
                >
                  <option value="">Profession...</option>
                  {professions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              onClick={() => setView('customize-count')}
            >
              Back
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              onClick={() => {
                const filled = customPlayers.filter(p => p.name && p.district && p.profession);
                sessionStorage.setItem('customPlayers', JSON.stringify(filled));
                router.push('/intro');
              }}
            >
              Start Game
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
