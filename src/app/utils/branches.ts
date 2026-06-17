import { Branch } from '../services/branch.service';

/**
 * Sort branches by city (or name) then by name — stable, reusable comparator.
 */
export function sortBranches(list: Branch[]): Branch[] {
  return [...list].sort((x, y) => {
    const a = (x.city || x.name).localeCompare(y.city || y.name);
    return a !== 0 ? a : x.name.localeCompare(y.name);
  });
}
