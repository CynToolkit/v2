export interface FileItem {
  name: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  size: number;
  mtime: number;
}

export interface FileRoot {
  name: string;
  path: string;
}

export interface FileRowDoubleClick {
  data: FileItem;
}
