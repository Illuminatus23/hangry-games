"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayerIntros from "../components/playerIntros";
import { generatePlayers, writeTeamLog } from "@/tools/helpers";

export default function Intro() {
  const router = useRouter();
  const [players, setPlayers] = useState(null);
  const [teams, setTeams] = useState(null);
  const [district, setDistrict] = useState(1);

  useEffect(() => {
    const stored = sessionStorage.getItem('customPlayers');
    const customPlayers = stored ? JSON.parse(stored) : [];
    const [generatedPlayers, generatedTeams] = generatePlayers({ count: 24, customPlayers });
    setPlayers(generatedPlayers);
    setTeams(generatedTeams);
  }, []);

  function startGame() {
    sessionStorage.setItem('gameSetup', JSON.stringify({ players, teams }));
    router.push('/game');
  }

  if (!players) return null;

  return (
    <div className="min-h-screen flex flex-col items-center sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center mb-8">
        <p className="text-6xl font-bold tracking-tight">The Hangry Games</p>
        <p className="text-stone-400 mt-3 text-4xl">Introducing District {district}</p>
      </header>

      <main className="w-full">
        <PlayerIntros players={players} district={district} />
      </main>

      <div className="flex gap-4 mt-10">
        <button
          className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setDistrict(d => d - 1)}
          disabled={district === 1}
        >
          Previous District
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-8 rounded-lg transition-colors"
          onClick={startGame}
        >
          Start Game
        </button>
        <button
          className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setDistrict(d => d + 1)}
          disabled={district === 12}
        >
          Next District
        </button>
      </div>
    </div>
  );
}
