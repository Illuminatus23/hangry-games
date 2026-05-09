"use client"
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import HexMapAnimated from "../components/hexMapAnimated";
import PlayerList from "../components/playerList";
import PublicLog from "../components/publicLog";
import { generatePlayers, writeTeamLog, generateMap, firstRound, startNewRound } from "@/tools/helpers";
import { logRound } from "@/tools/logStyles";

export default function Game() {
  const router = useRouter();
  const deathCounterRef = useRef(0);
  const [mapHexes, setMapHexes] = useState(null);
  const [players, setPlayers] = useState(null);
  const [teamsArray, setTeamsArray] = useState(null);
  const [buttonText, setButtonText] = useState('Begin');
  const [roundCount, setRoundCount] = useState(0);
  const [logArchive, setLogArchive] = useState([]);
  const [woundEvents, setWoundEvents] = useState([]);

  function advanceRound() {
    const newLog = [];
    const woundEvts = [];
    if (roundCount === 0) {
      setButtonText('Advance Round');
      newLog.push(logRound(1));
      firstRound(mapHexes, players, newLog, roundCount, woundEvts);
    } else {
      newLog.push(logRound(roundCount + 1));
      startNewRound(teamsArray, mapHexes, players, newLog, roundCount, woundEvts);
      if (players.filter(p => p.health > 0).length === 1) setButtonText('End');
    }
    players.forEach(p => {
      if (p.health <= 0 && p.deathOrder === null) {
        p.deathOrder = ++deathCounterRef.current;
      }
    });
    setWoundEvents(woundEvts);
    setLogArchive(prev => [...prev, newLog]);
    setRoundCount(r => r + 1);
    setPlayers([...players]);
    setMapHexes([...mapHexes]);
    setTeamsArray([...teamsArray]);
  }

  function goToResults() {
    sessionStorage.setItem('gameResults', JSON.stringify(players));
    router.push('/results');
  }

  useEffect(() => {
    const generatedMap = generateMap(14);
    setMapHexes(generatedMap);
    const storedSetup = sessionStorage.getItem('gameSetup');
    if (storedSetup) {
      const { players: savedPlayers, teams: savedTeams } = JSON.parse(storedSetup);
      setPlayers(savedPlayers);
      setTeamsArray(savedTeams);
      setLogArchive([writeTeamLog(savedTeams)]);
    } else {
      const stored = sessionStorage.getItem('customPlayers');
      const customPlayers = stored ? JSON.parse(stored) : [];
      const [generatedPlayers, generatedTeams, generatedLogContent] = generatePlayers({ count: 24, customPlayers });
      setPlayers(generatedPlayers);
      setTeamsArray(generatedTeams);
      setLogArchive([generatedLogContent]);
    }
  }, []);

  return (
    <div className="grid p-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header>
        <p className="text-4xl">The Hangry Games</p>
        <p className="text-2xl text-gray-600">Round {roundCount.toString()}</p>
        <p className="text-2xl text-gray-600">{players?.filter(p => p.health > 0).length.toString()} Players</p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-4 2xl:grid-cols-5 gap-3">
        {mapHexes &&
          <div className="md:col-span-3 2xl:col-span-4">
            <HexMapAnimated mapHexes={mapHexes} players={players} round={roundCount} woundEvents={woundEvents} />
          </div>
        }
        {teamsArray &&
          <div className="p-5 bg-stone-900 rounded-lg relative logColumn">
            <PublicLog logArchive={logArchive} />
            <div className="text-center inset-x-0 bottom-0 absolute mb-5">
              {buttonText !== "End" ? (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={advanceRound}
                >
                  {buttonText}
                </button>
              ) : (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={goToResults}
                >
                  The End
                </button>
              )}
            </div>
          </div>
        }
      </main>
      <footer className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-6 my-10">
        {players && <PlayerList players={players} />}
      </footer>
    </div>
  );
}
