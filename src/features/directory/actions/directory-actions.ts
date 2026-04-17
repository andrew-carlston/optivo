// Barrel re-export for the directory config actions.
// Split into focused files for maintainability:
//   _shared.ts         types, system column/status constants, access helpers
//   column-actions.ts  column registry CRUD + system column seeding
//   status-actions.ts  status options CRUD + system status seeding
//   view-actions.ts    saved views CRUD
//   page-data-actions.ts  batched page loader (directory page)

export type { ColumnRow, StatusOptionRow, SavedViewRow } from "./_shared";

export {
  getColumns,
  updateColumn,
  createCustomColumn,
  reorderColumns,
  archiveColumn,
} from "./column-actions";

export {
  getStatusOptions,
  createStatusOption,
  updateStatusOption,
  archiveStatusOption,
} from "./status-actions";

export {
  getSavedViews,
  saveView,
  deleteView,
} from "./view-actions";

export { getDirectoryPageData } from "./page-data-actions";
