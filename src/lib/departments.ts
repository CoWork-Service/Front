import { DEPARTMENTS, type Department } from '../types'

export const REQUIRED_DEPARTMENT = '회장단'

export function mergeDepartmentOptions(
  departments: readonly Department[] = DEPARTMENTS,
  extras: readonly (Department | string | null | undefined)[] = [],
): Department[] {
  const seen = new Set<string>()
  const result: Department[] = []

  const add = (value?: Department | string | null) => {
    const normalized = value?.trim()
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    result.push(normalized)
  }

  add(REQUIRED_DEPARTMENT)
  departments.forEach(add)
  extras.forEach(add)

  return result.length > 0 ? result : DEPARTMENTS
}
