import type { InjectionKey } from "vue";

export const OpenUpgradeDialogKey: InjectionKey<() => void> = Symbol("openUpgradeDialog");
