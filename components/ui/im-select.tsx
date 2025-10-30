"use client"

import * as React from "react"

export interface ImSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const ImSelect = React.forwardRef<HTMLSelectElement, ImSelectProps>(
  ({ className = "", children, ...props }, ref) => (
    <select ref={ref} className={`im-filter ${className}`.trim()} {...props}>
      {children}
    </select>
  )
)
ImSelect.displayName = "ImSelect"













