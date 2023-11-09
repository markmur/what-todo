import { AnimatePresence, motion } from "framer-motion"

import React from "react"

const variants = {
  open: { height: "auto", opacity: 1 },
  closed: { height: 0, opacity: 0 }
}

export default function Animate({ children, active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={variants}
          transition={{ duration: 0.2, ease: [0.645, 0.045, 0.355, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
