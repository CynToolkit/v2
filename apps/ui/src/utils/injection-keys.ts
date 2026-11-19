import { InjectionKey } from "vue";

export const OpenUpgradeDialogKey: InjectionKey<() => void> = Symbol("openUpgradeDialog");
