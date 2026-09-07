import type { VendorCategory } from '../api/types'

export interface CategoryTreeItem extends VendorCategory {
  level: number
  full_path: string
  children: CategoryTreeItem[]
}

export interface CategorySelectOption {
  value: number
  label: string
  level: number
  full_path: string
}

/**
 * Builds a hierarchical tree from a flat list of vendor categories.
 */
export const buildCategoryTree = (categories: VendorCategory[]): CategoryTreeItem[] => {
  const categoryMap = new Map<number, CategoryTreeItem>()
  const rootCategories: CategoryTreeItem[] = []

  // Initialize nodes
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      ...cat,
      level: 0,
      full_path: cat.name,
      children: [],
    })
  })

  // Build hierarchy
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)
    if (!node) return

    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      const parentNode = categoryMap.get(cat.parent_id)!
      node.level = parentNode.level + 1
      node.full_path = `${parentNode.full_path} > ${cat.name}`
      parentNode.children.push(node)
    } else {
      rootCategories.push(node)
    }
  })

  // Recursively update levels and paths
  const recalculatePaths = (node: CategoryTreeItem, parentPath = '', level = 0) => {
    node.level = level
    node.full_path = parentPath ? `${parentPath} > ${node.name}` : node.name
    node.children.forEach((child) => recalculatePaths(child, node.full_path, level + 1))
  }

  rootCategories.forEach((root) => recalculatePaths(root, '', 0))

  return rootCategories
}

/**
 * Gets all descendant IDs for a category to prevent circular parent-child nesting.
 */
export const getDescendantIds = (categoryId: number, categories: VendorCategory[]): number[] => {
  const descendants: number[] = []
  const directChildren = categories.filter((cat) => cat.parent_id === categoryId)

  directChildren.forEach((child) => {
    descendants.push(child.id)
    descendants.push(...getDescendantIds(child.id, categories))
  })

  return descendants
}

/**
 * Flattens the category tree into a clean, simple hierarchical Select option list.
 * e.g.
 * Raw Materials
 *   — Steel & Metals
 *     —— Stainless Steel
 */
export const getHierarchicalCategoryOptions = (
  categories: VendorCategory[],
  excludeCategoryId?: number | null
): CategorySelectOption[] => {
  if (!categories || categories.length === 0) return []

  const tree = buildCategoryTree(categories)
  const excludedIds = new Set<number>()

  if (excludeCategoryId) {
    excludedIds.add(excludeCategoryId)
    const descendants = getDescendantIds(excludeCategoryId, categories)
    descendants.forEach((id) => excludedIds.add(id))
  }

  const options: CategorySelectOption[] = []

  const traverse = (nodes: CategoryTreeItem[]) => {
    nodes.forEach((node) => {
      if (excludedIds.has(node.id)) return

      const prefix = node.level === 0 ? '' : '— '.repeat(node.level)

      options.push({
        value: node.id,
        label: `${prefix}${node.name}`,
        level: node.level,
        full_path: node.full_path,
      })

      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(tree)
  return options
}
