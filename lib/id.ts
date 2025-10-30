// Prosty generator identyfikatorów z prefiksami. Bez zależności zewnętrznych.

function baseId(): string {
  const ts = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 10)
  return `${ts}${rnd}`
}

export function genConceptId(): string {
  return `conc_${baseId()}`
}

export function genLogicalEntityId(): string {
  return `lent_${baseId()}`
}

export function genLogicalAttributeId(): string {
  return `latr_${baseId()}`
}

export function genRelationshipId(): string {
  return `rel_${baseId()}`
}

export function genConnectionId(): string {
  return `conn_${baseId()}`
}

export function genRequirementId(): string {
  return `req_${baseId()}`
}

export function genDiagramItemId(): string {
  return `item_${baseId()}`
}

// (opcjonalnie) Parse pomocniczy do diagnostyki typu ID
export function parseIdType(id: string): string | null {
  const m = /^(\w+)_/.exec(id)
  return m ? m[1] : null
}



