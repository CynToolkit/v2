/** Options every command that reads the app's data folder accepts. */
export interface UserDataOptions {
  userData?: string;
}

/** Options of a command that also asks before it deletes. */
export interface ForcedUserDataOptions extends UserDataOptions {
  force?: boolean;
}
