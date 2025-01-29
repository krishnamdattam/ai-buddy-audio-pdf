"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface MenuBarItem {
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
  label: string
  onClick?: () => void
}

interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuBarItem[]
}

const springConfig = {
  duration: 0.3,
  ease: "easeInOut"
}

export function MenuBar({ items, className, ...props }: MenuBarProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = React.useState({ left: 0, width: 0 })
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (activeIndex !== null && menuRef.current && tooltipRef.current) {
      const menuItem = menuRef.current.children[activeIndex] as HTMLElement
      const menuRect = menuRef.current.getBoundingClientRect()
      const itemRect = menuItem.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
    
      const left = itemRect.left - menuRect.left + (itemRect.width - tooltipRect.width) / 2
    
      setTooltipPosition({
        left: Math.max(0, Math.min(left, menuRect.width - tooltipRect.width)),
        width: tooltipRect.width
      })
    }
  }, [activeIndex])

  return (
    <div className={cn("relative", className)} {...props}>
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={springConfig}
            className="absolute left-0 right-0 -top-[31px] pointer-events-none z-50"
          >
            <motion.div
              ref={tooltipRef}
              className={cn(
                "h-7 px-3 rounded-lg inline-flex justify-center items-center overflow-hidden",
                "bg-white/95 backdrop-blur",
                "border border-gray-200",
                "shadow-lg",
                "text-gray-800"
              )}
              initial={{ x: tooltipPosition.left }}
              animate={{ x: tooltipPosition.left }}
              transition={springConfig}
              style={{ width: "auto" }}
            >
              <p className="text-[13px] font-medium leading-tight whitespace-nowrap">
                {items[activeIndex].label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Radiating glow layers */}
      <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 blur-2xl animate-magic-pulse" />
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 blur-xl animate-magic-pulse-delayed" />
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-400/40 via-pink-400/40 to-purple-400/40 blur-lg animate-magic-pulse-delayed-2" />
      
      <div 
        ref={menuRef}
        className={cn(
          "relative h-10 px-1.5 inline-flex justify-center items-center gap-[3px] overflow-hidden z-10",
          "rounded-full bg-white/95 backdrop-blur",
          "border border-gray-200",
          "shadow-lg",
          className
        )}
      >
        {items.map((item, index) => (
          <button 
            key={index}
            className={cn(
              "w-8 h-8 px-3 py-1 rounded-full flex justify-center items-center gap-2",
              "text-gray-600 hover:text-gray-900",
              "hover:bg-gray-100 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={item.onClick}
          >
            <div className="flex justify-center items-center">
              <div className="w-[18px] h-[18px] flex justify-center items-center overflow-hidden">
                <item.icon className="w-full h-full" />
              </div>
            </div>
            <span className="sr-only">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 