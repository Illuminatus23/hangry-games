"use client"
import Image from "next/image";
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
  const [logContent, setLogContent] = useState(['Generating map', 'Generating players']);
  const [logArchive, setLogArchive] = useState([['Generating map', 'Generating players']]);


  function advanceRound(e) {
    if (roundCount === 0) {
      setButtonText('Advance Round');
      setRoundCount(roundCount + 1);
      //logContent.push(<b>Round {roundCount}</b>)
      logArchive.push(logContent);
      setLogContent([]);
      firstRound(mapHexes, players, logContent, logArchive, roundCount);
    } else {
      setRoundCount(roundCount + 1);
      logArchive.push(logContent);
      setLogContent([]);
      logContent.push(<b>Round {roundCount + 1}</b>)
      startNewRound(teamsArray, mapHexes, players, logContent, logArchive, roundCount);
      if (players.filter((player) => player.health > 0).length === 1) {
        setButtonText('End');
      }

    }
  }

  useEffect(() => {
    const [generatedplayers, generatedteams, generatedLogContent] = generatePlayers(24)
    setMapHexes(generateMap(14));
    setPlayers(generatedplayers);
    setTeamsArray(generatedteams);
    setLogContent(generatedLogContent)
  }, []);

  return (

    <div className="grid grid sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header>
        <p className="text-4xl">The Hangry Games</p>
        <p className="text-2xl text-gray-600">Round {roundCount.toString()}</p>
        <p className="text-2xl text-gray-600">{players?.filter((player) => player.health > 0).length.toString()} Players</p>
      </header>
      <main className="grid grid-cols-4 2xl:grid-cols-5 gap-3">
        {
          mapHexes ?
            <div className="col-span-3 2xl:col-span-4"><HexMapAnimated mapHexes={mapHexes} players={players} round={roundCount} /></div>
            : null
        }
        {
          teamsArray ?
            <div className="p-5 bg-stone-900 rounded-lg relative logColumn">
              <PublicLog logContent={logContent} round={roundCount} logArchive={logArchive}/>
              <div className="text-center inset-x-0 bottom-0 absolute mb-5">
                {
                  buttonText !== "End" ?
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={(e) => { advanceRound(e) }}
                    >
                      {buttonText}
                    </button>
                    : <button
                      className="bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed"
                    >
                      The End
                    </button>
                }

              </div>
            </div>
            : null
        }

      </main>
      <footer className="grid grid-cols-4 2xl:grid-cols-6 my-10">
        {
          players ?
            <PlayerList players={players} />
            : null
        }
      </footer>
    </div>
  );
}
