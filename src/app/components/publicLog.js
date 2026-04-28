import { motion } from "motion/react"
import { useState, useEffect } from "react"

export default function PublicLog({ logArchive }) {
  const [selectedRound, setSelectedRound] = useState(0);

  // Auto-advance to the latest entry whenever a new round is added
  useEffect(() => {
    setSelectedRound(logArchive.length - 1);
  }, [logArchive.length]);

  const selectedLog = logArchive[selectedRound] ?? [];
  const isFirst = selectedRound === 0;
  const isLatest = selectedRound === logArchive.length - 1;
  const roundLabel = selectedRound === 0 ? 'Team Formation' : 'Round ' + selectedRound;

  return (
    <div className="logWrapper">
      <div className="flex items-center justify-between mb-4">
        <p>Game log</p>
        {logArchive.length > 1 && (
          <div className="flex items-center gap-1 text-xs">
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
      </div>
      {selectedLog.map((item, idx) =>
        <motion.p key={selectedRound + '-' + idx} className="text-xs mb-2">{item}</motion.p>
      )}
    </div>
  )
}
