import { motion } from "motion/react"

export default function PublicLog({ logContent }) {
  return (
    <div className="logWrapper">
      <p className="mb-5">Game log</p>
      {logContent.map((item, idx) =>
        <motion.p key={idx} className="text-xs mb-2">{item}</motion.p>
      )}
    </div>
  )
}
