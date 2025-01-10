export interface CategorizedPhases {
  categoryTitle: string;
  phases: string[];
}

export interface PhaseList {
  listTitle: string;
  categorizedPhases: CategorizedPhases[];
}
