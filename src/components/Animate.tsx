import { AnimatePresence, motion } from "framer-motion"
import { ReactNode } from "react"

const variants = {
  open: { height: "auto", opacity: 1 },
  closed: { height: 0, opacity: 0 }
}

interface AnimateProps {
  children: ReactNode
  active: boolean
  duration?: number
  ease?: number[]
}

export default function Animate({
  children,
  active,
  duration = 0.2,
  ease = [0.645, 0.045, 0.355, 1]
}: AnimateProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={variants}
          transition={{ duration, ease }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
