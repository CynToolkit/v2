<template>
  <span class="service-icon" :class="`size-${size}`" aria-hidden="true">
    <img v-if="image" :src="image" alt="" />
    <i v-else :class="iconClass" />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { providerIconClass, providerIconImage } from "../utils/provider-icons";
import type { ServiceIconProps } from "./ServiceIcon.types";

const props = withDefaults(defineProps<ServiceIconProps>(), {
  fallback: "mdi mdi-puzzle-outline",
  size: "md",
});
const image = computed(() => providerIconImage(props.icon));
const iconClass = computed(() => providerIconClass(props.icon, props.fallback));
</script>

<style scoped>
.service-icon {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  color: var(--pl-accent);
}
.service-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.size-sm {
  width: 1.1rem;
  height: 1.1rem;
  font-size: 1rem;
}
.size-md {
  width: 1.4rem;
  height: 1.4rem;
  font-size: 1.15rem;
}
.size-lg {
  width: 1.6rem;
  height: 1.6rem;
  font-size: 1.3rem;
}
</style>
