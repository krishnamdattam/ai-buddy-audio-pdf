"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface MenuItem {
  icon: (props: { className?: string }) => JSX.Element;
  label: string;
  onClick: () => void;
  className?: string;
}

interface MenuBarProps {
  items: MenuItem[];
  className?: string;
}

const springConfig = {
  duration: 0.3,
  ease: "easeInOut"
}

export function MenuBar({ items, className }: MenuBarProps) {
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
    <div className={cn(
      "flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700/50",
      className
    )}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          <button
            onClick={item.onClick}
            className={cn(
              "p-2 text-gray-400 hover:text-white rounded-full transition-colors relative group",
              item.className
            )}
            title={item.label}
          >
            {item.icon({ className: "h-4 w-4" })}
            <span className="sr-only">{item.label}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </div>
          </button>
          
          {index < items.length - 1 && (
            <div className="w-px h-4 bg-gray-700/50" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
} 