"use client"

import * as React from "react"

export interface ImInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const ImInput = React.forwardRef<HTMLInputElement, ImInputProps>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`im-filter ${className}`.trim()} {...props} />
  )
)
ImInput.displayName = "ImInput"













