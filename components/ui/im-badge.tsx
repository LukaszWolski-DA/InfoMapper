"use client"

import * as React from "react"

type ImBadgeVariant = "pk" | "fk" | "pii" | "default"

export interface ImBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ImBadgeVariant
}

export const ImBadge: React.FC<ImBadgeProps> = ({ variant = "default", className = "", children, ...props }) => {
  const map: Record<ImBadgeVariant, string> = {
    pk: "badge badge--pk",
    fk: "badge badge--fk",
    pii: "badge badge--pii",
    default: "badge"
  }
  const cls = `${map[variant]} ${className}`.trim()
  return (
    <span className={cls} {...props}>{children}</span>
  )
}













