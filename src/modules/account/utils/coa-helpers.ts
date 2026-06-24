import type { TreeItem } from '../api/coa.api'

export const buildCoaTree = (data: any[]): TreeItem[] => {
  const map: { [key: string]: TreeItem } = {}
  const roots: TreeItem[] = []

  // Initialize map
  data.forEach((item) => {
    map[item.head_code] = {
      id: item.head_code,
      name: item.head_name,
      level: item.head_level,
      is_active: item.is_active,
      children: [],
    }
  })

  // Build tree
  data.forEach((item) => {
    const parent = map[item.p_head_code]
    if (parent) {
      parent.children?.push(map[item.head_code])
    } else if (item.p_head_code === '0' || item.p_head_code === 0) {
      roots.push(map[item.head_code])
    }
  })

  return roots
}
