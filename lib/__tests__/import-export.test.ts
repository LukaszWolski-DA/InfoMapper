import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { importData, exportData, clearAllData } from '@/lib/import-export'
import type { ImportResult, ClearDataResult } from '@/lib/import-export'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/lib/store', () => ({
  getObjectState: vi.fn(),
  setObjectState: vi.fn(),
}))

vi.mock('@/lib/error-handler', () => ({
  handleError: vi.fn(),
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

vi.mock('@/lib/utils', () => ({
  normalizeStereotype: vi.fn((value) => value || 'object'),
}))

// Import mocked modules
import { toast } from 'sonner'
import { getObjectState, setObjectState } from '@/lib/store'
import { handleError, safeLocalStorage } from '@/lib/error-handler'

// ============================
// Test Data Fixtures
// ============================

const validMinimalData = {
  timestamp: '2024-01-01T00:00:00.000Z',
  items: [],
  connections: [],
  modelItems: [],
  modelRelationships: [],
  concepts: [],
  logicalEntities: [],
  logicalAttributes: [],
  requirements: [],
}

const validCompleteData = {
  timestamp: '2024-01-01T00:00:00.000Z',
  items: [
    {
      itemId: 'entity-1',
      itemType: 'entity' as const,
      left: 100,
      top: 100,
      hidden: false,
      collapsed: false,
      objectType: 'object',
    },
  ],
  connections: [
    {
      id: 'conn-1',
      type: 'attribute-mapping' as const,
      source: {
        attrId: 'attr-1',
        attrName: 'id',
        parentId: 'entity-1',
        parentType: 'entity',
        itemId: 'item-1',
      },
      target: {
        attrId: 'attr-2',
        attrName: 'id',
        parentId: 'entity-2',
        parentType: 'entity',
        itemId: 'item-2',
      },
    },
  ],
  modelItems: [],
  modelRelationships: [],
  concepts: [
    {
      id: 'concept-1',
      name: 'Sales',
      description: 'Sales domain',
    },
  ],
  logicalEntities: [
    {
      id: 'entity-1',
      conceptId: 'concept-1',
      name: 'Customer',
      stereotype: 'object',
    },
  ],
  logicalAttributes: [
    {
      id: 'attr-1',
      entityId: 'entity-1',
      name: 'CustomerId',
      dataType: 'Integer',
      isPrimaryKey: true,
      isPII: false,
    },
  ],
  requirements: [
    {
      id: 'req-1',
      name: 'Data Quality',
      displayId: 1,
      type: 'Non-functional' as const,
    },
  ],
}

const invalidData = {
  // Missing required fields
  items: 'not-an-array',
  connections: null,
}

// ============================
// Mock Setup Helpers
// ============================

function setupMockStore(state = {}) {
  const defaultState = {
    items: [],
    connections: [],
    modelItems: [],
    modelRelationships: [],
    concepts: [],
    logicalEntities: [],
    logicalAttributes: [],
    requirements: [],
    settings: {
      entityStereotypes: [
        { id: 'object', label: 'Object', isDefault: true, order: 1 },
      ],
      sourceColumnTags: [],
    },
    version: 1,
  }

  vi.mocked(getObjectState).mockReturnValue({ ...defaultState, ...state })
  vi.mocked(setObjectState).mockImplementation((updater) => {
    if (typeof updater === 'function') {
      updater(defaultState)
    }
  })
}

function createMockFile(data: any, filename = 'test.json'): File {
  const content = typeof data === 'string' ? data : JSON.stringify(data)
  const blob = new Blob([content], { type: 'application/json' })
  return new File([blob], filename, { type: 'application/json' })
}

// ============================
// Tests: importData()
// ============================

describe('importData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMockStore()
  })

  it('should import valid minimal JSON successfully', async () => {
    const file = createMockFile(validMinimalData)
    const result: ImportResult = await importData(file, { merge: false, validate: true })

    expect(result.success).toBe(true)
    expect(result.stats).toBeDefined()
    expect(result.stats?.concepts).toBe(0)
    expect(result.stats?.entities).toBe(0)
    expect(toast.success).toHaveBeenCalled()
  })

  it('should import valid complete JSON with stats', async () => {
    const file = createMockFile(validCompleteData)
    const result: ImportResult = await importData(file, { merge: false, validate: true })

    expect(result.success).toBe(true)
    expect(result.stats).toEqual({
      concepts: 1,
      entities: 1,
      attributes: 1,
      connections: 1,
      requirements: 1,
    })
    expect(setObjectState).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('1 entities, 1 attributes')
    )
  })

  it('should reject invalid JSON syntax', async () => {
    const file = createMockFile('{ invalid json }')
    const result: ImportResult = await importData(file)

    expect(result.success).toBe(false)
    expect(result.message).toContain('Import failed')
    expect(handleError).toHaveBeenCalled()
  })

  it('should handle Zod validation errors when validate=true', async () => {
    const file = createMockFile(invalidData)
    const result: ImportResult = await importData(file, { validate: true })

    expect(result.success).toBe(false)
    expect(handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'import-export',
        action: 'importData',
      })
    )
  })

  it('should merge data when merge=true', async () => {
    setupMockStore({
      concepts: [{ id: 'existing-concept', name: 'Existing' }],
    })

    const file = createMockFile(validCompleteData)
    await importData(file, { merge: true })

    expect(setObjectState).toHaveBeenCalled()
    const setStateCall = vi.mocked(setObjectState).mock.calls[0][0]

    // Verify it's a function that merges data
    expect(typeof setStateCall).toBe('function')
  })

  it('should replace data when merge=false', async () => {
    setupMockStore({
      concepts: [{ id: 'existing-concept', name: 'Existing' }],
    })

    const file = createMockFile(validCompleteData)
    await importData(file, { merge: false })

    expect(setObjectState).toHaveBeenCalled()
  })

  it('should normalize entity stereotypes on import', async () => {
    const file = createMockFile(validCompleteData)
    await importData(file)

    // normalizeStereotype should be called for entity items
    expect(setObjectState).toHaveBeenCalled()
  })

  it('should handle FileReader errors', async () => {
    const file = createMockFile(validMinimalData)

    // Mock FileReader to trigger error
    const originalFileReader = global.FileReader

    class MockFileReader {
      onerror: any = null
      onload: any = null
      error: any = null
      result: any = null

      readAsText() {
        if (this.onerror) {
          this.error = new Error('Read failed')
          this.onerror()
        }
      }
    }

    global.FileReader = MockFileReader as any

    const result = await importData(file)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to read file')
    expect(handleError).toHaveBeenCalled()

    global.FileReader = originalFileReader
  })

  it('should skip validation when validate=false', async () => {
    const file = createMockFile(validMinimalData)
    const result = await importData(file, { validate: false })

    // Should still succeed even with validation disabled
    expect(result.success).toBe(true)
  })
})

// ============================
// Tests: exportData()
// ============================

describe('exportData', () => {
  let mockCreateElement: ReturnType<typeof vi.fn>
  let mockAppendChild: ReturnType<typeof vi.fn>
  let mockRemoveChild: ReturnType<typeof vi.fn>
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>
  let mockClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockStore(validCompleteData)

    // Mock document methods
    mockClick = vi.fn()
    mockAppendChild = vi.fn()
    mockRemoveChild = vi.fn()
    mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
    } as any)
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild)
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild)

    // Mock URL methods
    mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create downloadable blob with correct data', () => {
    exportData()

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Data exported successfully')
  })

  it('should use default filename', () => {
    const mockAnchor = { href: '', download: '', click: mockClick }
    mockCreateElement.mockReturnValue(mockAnchor as any)

    exportData()

    expect(mockAnchor.download).toBe('info_mapper_export.json')
  })

  it('should use custom filename when provided', () => {
    const mockAnchor = { href: '', download: '', click: mockClick }
    mockCreateElement.mockReturnValue(mockAnchor as any)

    exportData({ filename: 'custom-export.json' })

    expect(mockAnchor.download).toBe('custom-export.json')
  })

  it('should include all state data in export', () => {
    exportData()

    // Verify getObjectState was called
    expect(getObjectState).toHaveBeenCalled()
  })

  it('should clean up resources after export', () => {
    exportData()

    expect(mockAppendChild).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRemoveChild).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalled()
  })

  it('should handle export errors gracefully', () => {
    mockCreateElement.mockImplementation(() => {
      throw new Error('DOM error')
    })

    exportData()

    expect(handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'import-export',
        action: 'exportData',
      })
    )
  })
})

// ============================
// Tests: clearAllData()
// ============================

describe('clearAllData', () => {
  let mockReload: ReturnType<typeof vi.fn>
  let mockSetTimeout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.location.reload
    mockReload = vi.fn()
    vi.stubGlobal('location', { reload: mockReload })

    // Mock setTimeout
    mockSetTimeout = vi.spyOn(global, 'setTimeout').mockImplementation(
      ((callback: Function) => {
        callback()
        return 1 as any
      }) as any
    )

    // Mock localStorage operations
    vi.mocked(safeLocalStorage.removeItem).mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should clear all default localStorage keys', async () => {
    const result: ClearDataResult = await clearAllData({
      showToast: false,
      reload: false,
    })

    expect(safeLocalStorage.removeItem).toHaveBeenCalledTimes(5)
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('infoMapperStateV1')
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('infoMapperSourcesV1')
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('infoMapperRequirementsV1')
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('objectTreeUIv1')
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('infoMapperUIv1')
    expect(result.success).toBe(true)
    expect(result.cleared).toBe(5)
    expect(result.failed).toBe(0)
  })

  it('should return success result', async () => {
    const result = await clearAllData({ reload: false })

    expect(result).toEqual({
      success: true,
      cleared: 5,
      failed: 0,
    })
  })

  it('should show success toast when showToast=true', async () => {
    await clearAllData({ showToast: true, reload: false })

    expect(toast.success).toHaveBeenCalledWith('All data cleared successfully')
  })

  it('should not show toast when showToast=false', async () => {
    await clearAllData({ showToast: false, reload: false })

    expect(toast.success).not.toHaveBeenCalled()
  })

  it('should reload page when reload=true', async () => {
    await clearAllData({ reload: true })

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 500)
    expect(mockReload).toHaveBeenCalled()
  })

  it('should not reload when reload=false', async () => {
    await clearAllData({ reload: false })

    expect(mockReload).not.toHaveBeenCalled()
  })

  it('should handle partial failures', async () => {
    vi.mocked(safeLocalStorage.removeItem)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)

    const result = await clearAllData({ showToast: true, reload: false })

    expect(result.success).toBe(false)
    expect(result.cleared).toBe(3)
    expect(result.failed).toBe(2)
    expect(toast.warning).toHaveBeenCalledWith('Cleared 3 of 5 storage items')
  })

  it('should clear custom keys when provided', async () => {
    const customKeys = ['key1', 'key2']
    await clearAllData({ keys: customKeys, reload: false })

    expect(safeLocalStorage.removeItem).toHaveBeenCalledTimes(2)
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('key1')
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith('key2')
  })

  it('should handle errors during clear operation', async () => {
    vi.mocked(safeLocalStorage.removeItem).mockImplementation(() => {
      throw new Error('Storage error')
    })

    const result = await clearAllData({ reload: false })

    expect(result.success).toBe(false)
    expect(result.cleared).toBe(0)
    expect(handleError).toHaveBeenCalled()
  })
})
