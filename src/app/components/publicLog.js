import { motion } from "motion/react"
export default function PublicLog({ logContent, round, logArchive }) {
  const roundLog = logArchive[round]
    return (
        <div className="logWrapper" >
          <p className="mb-5" overflow="scroll">Game log</p>
          {
            roundLog.map((item, idx) =>
              <motion.p key={idx} className="text-xs mb-2" >{item}</motion.p>
            )
          }
        </div>
    )
}