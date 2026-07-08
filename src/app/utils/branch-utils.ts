export function sortBranchesByDistance(branches: any[]): any[] {
  return [...branches].sort((a, b) => {
    const distanceA = a.distance ?? Number.POSITIVE_INFINITY;
    const distanceB = b.distance ?? Number.POSITIVE_INFINITY;
    return distanceA - distanceB;
  });
}

export function filterBranchesBySearch(branches: any[], searchTerm: string): any[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return branches;
  }

  return branches.filter((branch) => {
    const searchableFields = [
      branch.name,
      branch.street,
      branch.buildingNumber,
      branch.postalCode,
      branch.city,
      branch.address,
      branch.restaurantName
    ];

    return searchableFields.some((field) => String(field ?? '').toLowerCase().includes(normalizedSearch));
  });
}

export function getDisplayedBranches(branches: any[], searchTerm: string): any[] {
  const sortedBranches = sortBranchesByDistance(branches);
  return filterBranchesBySearch(sortedBranches, searchTerm);
}
