/**
 * Intelligent Filter Component
 * 
 * Reusable filter component with smart detection (simple/advanced mode).
 * Used across all InfoMapper cards (Sources, Object, Requirements, Mapping).
 */

"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ImInput } from "./im-input"
import { ImButton } from "./im-button"
import { parseFilterQuery } from "@/lib/filter/parser"
import { applyFilter } from "@/lib/filter/evaluator"
import type { FilterSchema, ParseError } from "@/lib/filter/types"

export interface IntelligentFilterProps<T> {
  schema: FilterSchema
  data: T[]
  onChange: (filtered: T[]) => void
  contextBuilder?: (item: T) => any
  placeholder?: string
  showExamples?: boolean
  compact?: boolean
  className?: string
}

export function IntelligentFilter<T>({
  schema,
  data,
  onChange,
  contextBuilder,
  placeholder,
  showExamples = true,
  compact = false,
  className = ""
}: IntelligentFilterProps<T>) {
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple')

  // Calculate filtered data (pure computation, no side effects)
  // Note: contextBuilder is a helper function and doesn't need to be in dependencies
  const filteredData = useMemo(() => {
    if (!query.trim()) {
      return data
    }

    try {
      const parseResult = parseFilterQuery(query, schema.defaultField)

      // Check if parse failed
      if ('message' in parseResult) {
        return data
      }

      const { expression } = parseResult

      // Apply filter
      return applyFilter(data, expression, schema, contextBuilder)
    } catch (err) {
      return data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, data, schema])

  // Update mode and error state (side effects in useEffect)
  useEffect(() => {
    if (!query.trim()) {
      setError(null)
      setMode('simple')
      return
    }

    try {
      const parseResult = parseFilterQuery(query, schema.defaultField)

      if ('message' in parseResult) {
        setError((parseResult as ParseError).message)
        setMode('simple')
      } else {
        setError(null)
        setMode(parseResult.mode)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid filter')
      setMode('simple')
    }
  }, [query, schema])

  // Call onChange when filteredData changes (side effect in useEffect)
  // Note: onChange (setState) is stable and doesn't need to be in dependencies
  useEffect(() => {
    onChange(filteredData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData])

  const handleClear = useCallback(() => {
    setQuery("")
    setError(null)
    setMode('simple')
  }, [])

  const defaultPlaceholder = `Search or use advanced: ${schema.fields[0]?.key} = "value"`

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Input */}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <ImInput
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || defaultPlaceholder}
            className={`w-full font-mono ${compact ? 'text-xs' : 'text-xs'}`}
          />
        </div>
        {query && (
          <ImButton
            variant="neutral"
            onClick={handleClear}
          >
            Clear
          </ImButton>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          ❌ {error}
        </div>
      )}

      {/* Success message with mode indicator */}
      {query && !error && (
        <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1">
          {mode === 'simple' ? '🔍' : '⚡'}{' '}
          {mode === 'simple' 
            ? `Searching ${schema.defaultField}` 
            : 'Advanced filter'
          } • {filteredData.length} results
        </div>
      )}

      {/* Hints (fields, operators, examples) */}
      {!compact && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>
            <strong>Fields:</strong> {schema.fields.map(f => f.key).join(', ')}
          </div>
          <div>
            <strong>Operators:</strong> {schema.supportedOperators.join(', ')} • <strong>Logic:</strong> AND, OR
          </div>
          {showExamples && schema.examples && schema.examples.length > 0 && (
            <div className="text-gray-400 italic">
              <strong>Examples:</strong> {schema.examples.slice(0, 3).join(' • ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

