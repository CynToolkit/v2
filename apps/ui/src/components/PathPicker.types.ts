export interface PathPickerProps {
  kind?: "directory" | "file";
  /** `save` lets the user name a file that does not exist yet (output paths). */
  mode?: "open" | "save";
  label?: string;
  placeholder?: string;
  fileExtensions?: string[];
}
