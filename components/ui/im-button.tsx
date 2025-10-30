"use client"

import * as React from "react"

type ImButtonVariant = "primary" | "danger" | "neutral" | "success"

export interface ImButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ImButtonVariant
}

export const ImButton = React.forwardRef<HTMLButtonElement, ImButtonProps>(
  ({ variant = "neutral", className = "", children, ...props }, ref) => {
    const base = "im-button"
    const variantClass = `im-button--${variant}`
    return (
      <button ref={ref} className={`${base} ${variantClass} ${className}`.trim()} {...props}>
        {children}
      </button>
    )
  }
)
ImButton.displayName = "ImButton"













