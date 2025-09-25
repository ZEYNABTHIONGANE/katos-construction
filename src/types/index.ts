/**
 * Index des types pour l'application Katos
 * Exporte tous les types et interfaces pour une utilisation facile
 */

// Types User
export type { User, UserRole, CreateUserData, UpdateUserData } from './user';

// Types Project
export type { Project, ProjectStatus, CreateProjectData, UpdateProjectData } from './project';

// Types Message
export type {
  Message,
  CreateMessageData,
  UpdateMessageData,
  ValidMessage
} from './message';

// Types Media
export type {
  Media,
  MediaType,
  CreateMediaData,
  UpdateMediaData,
  MediaUpload
} from './media';

// Types Selection
export type {
  Selection,
  SelectionStatus,
  CreateSelectionData,
  UpdateSelectionData,
  ReviewSelectionData
} from './selection';

// Types Catalog
export type {
  CatalogItem,
  CatalogCategory,
  CreateCatalogItemData,
  UpdateCatalogItemData,
  CatalogFilters
} from './catalog';

// Constantes
export { CATALOG_CATEGORIES } from './catalog';