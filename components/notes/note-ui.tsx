// Barrel for the note UI, split into focused modules. Import from here or from
// the specific module — both work.
export {
  Avatar,
  SectionLabel,
  LoadingRows,
  type LayoutMode,
  type NoteSort,
} from "@/components/notes/note-primitives";
export { FilterBar } from "@/components/notes/note-filters";
export { NoteCollection, NoteRow } from "@/components/notes/note-list";
export { DetailDrawer } from "@/components/notes/note-detail";
