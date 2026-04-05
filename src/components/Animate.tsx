import { AnimatePresence, motion, type Easing } from "framer-motion"

const variants = {
  open: { height: "auto", opacity: 1 },
  closed: { height: 0, opacity: 0 }
}

export default function Animate({
  children,
  active,
  duration = 0.2,
  ease = [0.645, 0.045, 0.355, 1] as Easing,
  skipInitial = false
}: {
  children: React.ReactNode
  active: unknown
  duration?: number
  ease?: Easing
  skipInitial?: boolean
}) {
  return (
    <AnimatePresence initial={!skipInitial}>
      {active ? (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={variants}
          transition={{ duration, ease }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
