"use client"
import { useState, useEffect } from "react";
import HexMapAnimated from "./components/hexMapAnimated";
import PlayerList from "./components/playerList";
import PublicLog from "./components/publicLog";
import { generatePlayers, generateMap, firstRound, startNewRound } from "@/tools/helpers";

export default function Home() {
  const [mapHexes, setMapHexes] = useState(null);
  const [players, setPlayers] = useState(null);
  const [teamsArray, setTeamsArray] = useState(null);
  const [buttonText, setButtonText] = useState('Begin');
  const [roundCount, setRoundCount] = useState(0);
  const [logArchive, setLogArchive] = useState([]);

  function advanceRound() {
    const newLog = [];
    if (roundCount === 0) {
      setButtonText('Advance Round');
      newLog.push(<b>Round 1</b>);
      firstRound(mapHexes, players, newLog, roundCount);
    } else {
      newLog.push(<b>Round {roundCount + 1}</b>);
      startNewRound(teamsArray, mapHexes, players, newLog, roundCount);
      if (players.filter(p => p.health > 0).length === 1) setButtonText('End');
    }
    setLogArchive(prev => [...prev, newLog]);
    setRoundCount(r => r + 1);
    setPlayers([...players]);
    setMapHexes([...mapHexes]);
    setTeamsArray([...teamsArray]);
  }

  useEffect(() => {
    const [generatedPlayers, generatedTeams, generatedLogContent] = generatePlayers(24);
    const generatedMap = generateMap(14);
    setMapHexes(generatedMap);
    setPlayers(generatedPlayers);
    setTeamsArray(generatedTeams);
    setLogArchive([generatedLogContent]);
  }, []);

  return (
    <div className="grid grid sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header>
        <p className="text-4xl">The Hangry Games</p>
        <p className="text-2xl text-gray-600">Round {roundCount.toString()}</p>
        <p className="text-2xl text-gray-600">{players?.filter(p => p.health > 0).length.toString()} Players</p>
      </header>
      <main className="grid grid-cols-4 2xl:grid-cols-5 gap-3">
        {mapHexes &&
          <div className="col-span-3 2xl:col-span-4">
            <HexMapAnimated mapHexes={mapHexes} players={players} round={roundCount} />
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
                <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed">
                  The End
                </button>
              )}
            </div>
          </div>
        }
      </main>
      <footer className="grid grid-cols-4 2xl:grid-cols-6 my-10">
        {players && <PlayerList players={players} />}
      </footer>
    </div>
  );
}
