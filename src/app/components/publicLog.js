import { motion } from "motion/react"
import { useState, useEffect } from "react"

export default function PublicLog({ logArchive }) {
  const [selectedRound, setSelectedRound] = useState(0);

  useEffect(() => {
    setSelectedRound(logArchive.length - 1);
  }, [logArchive.length]);

  const selectedLog = logArchive[selectedRound] ?? [];
  const isFirst = selectedRound === 0;
  const isLatest = selectedRound === logArchive.length - 1;
  const roundLabel = selectedRound === 0 ? 'Pre-game Alliances' : 'Round ' + selectedRound;

  return (
    <>
      <p className="mb-2">Game log</p>
      {logArchive.length > 1 && (
        <div className="flex items-center justify-center gap-1 text-xs mb-3">
          <button
            onClick={() => setSelectedRound(r => r - 1)}
            disabled={isFirst}
            className="px-2 py-1 rounded hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <span className="w-32 text-center text-gray-400">{roundLabel}</span>
          <button
            onClick={() => setSelectedRound(r => r + 1)}
            disabled={isLatest}
            className="px-2 py-1 rounded hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      )}
      <div className="logWrapper">
        {selectedLog.map((item, idx) =>
          <motion.p key={selectedRound + '-' + idx} className="text-xs mb-2">{item}</motion.p>
        )}
      </div>
    </>
  )
}
