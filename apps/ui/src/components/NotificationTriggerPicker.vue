<template>
  <div class="rules">
    <template v-for="(trigger, index) in triggers" :key="index">
      <span v-if="index > 0" class="rule-or">or</span>
      <div class="rule">
        <Select
          class="rule-event"
          :model-value="trigger.on"
          :options="TRIGGER_EVENTS as unknown as EventOption[]"
          option-label="label"
          option-value="on"
          :aria-label="`Event ${index + 1}`"
          @update:model-value="changeKind(index, $event)"
        >
          <template #value="{ value }">
            <span class="choice"
              ><i :class="eventOf(value)?.icon" aria-hidden="true" />{{
                eventOf(value)?.label
              }}</span
            >
          </template>
          <template #option="{ option }">
            <span class="choice"
              ><i :class="option.icon" aria-hidden="true" />{{ option.label }}</span
            >
          </template>
        </Select>
        <Select
          v-if="'destinationId' in trigger"
          class="rule-destination"
          :model-value="trigger.destinationId"
          :options="destinations"
          option-label="label"
          option-value="id"
          placeholder="Choose a destination"
          :aria-label="`Destination for event ${index + 1}`"
          @update:model-value="changeDestination(index, trigger, $event)"
        >
          <template #value="{ value, placeholder }">
            <span v-if="destinationOf(value)" class="choice"
              ><ServiceIcon
                :icon="destinationOf(value)?.icon"
                fallback="mdi mdi-cloud-upload-outline"
                size="sm"
              />{{ destinationOf(value)?.label }}</span
            >
            <span v-else>{{ placeholder }}</span>
          </template>
          <template #option="{ option }">
            <span class="choice"
              ><ServiceIcon
                :icon="option.icon"
                fallback="mdi mdi-cloud-upload-outline"
                size="sm"
              />{{ option.label }}</span
            >
          </template>
        </Select>
        <Button
          class="rule-remove"
          text
          rounded
          size="small"
          severity="secondary"
          icon="pi pi-times"
          :aria-label="`Remove event ${index + 1}`"
          v-tooltip.top="'Remove this event'"
          @click="remove(index)"
        />
      </div>
    </template>
    <p v-if="!triggers.length" class="rule-empty" role="status">
      Add an event, or this notification is never sent.
    </p>
    <Button
      class="rule-add"
      label="Add another event"
      icon="pi pi-plus"
      text
      size="small"
      severity="secondary"
      :disabled="!available"
      @click="add"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "primevue/button";
import Select from "primevue/select";
import type {
  IconType,
  ReleaseNotificationConfig,
  ReleaseNotificationTrigger,
} from "@pipelab/shared";
import ServiceIcon from "./ServiceIcon.vue";
import {
  effectiveTriggers,
  nextTrigger,
  removeTriggerAt,
  replaceTrigger,
  TRIGGER_EVENTS,
  triggerOfKind,
  type TriggerEventKind,
} from "../utils/notification-triggers";

interface EventOption {
  on: TriggerEventKind;
  label: string;
  icon: string;
}

const props = defineProps<{
  target: ReleaseNotificationConfig;
  destinations: Array<{ id: string; label: string; icon?: IconType }>;
}>();

const eventOf = (kind: TriggerEventKind) => TRIGGER_EVENTS.find((event) => event.on === kind);
const destinationOf = (id: string) =>
  props.destinations.find((destination) => destination.id === id);
const triggers = computed(() => effectiveTriggers(props.target));
const destinationIds = computed(() => props.destinations.map((destination) => destination.id));
const available = computed(() => Boolean(nextTrigger(props.target, destinationIds.value)));

const changeKind = (index: number, kind: TriggerEventKind) => {
  const current = triggers.value[index];
  const keep = current && "destinationId" in current ? current.destinationId : undefined;
  props.target.triggers = replaceTrigger(
    props.target,
    index,
    triggerOfKind(kind, keep ?? destinationIds.value[0]),
  );
};
const changeDestination = (
  index: number,
  trigger: ReleaseNotificationTrigger,
  destinationId: string,
) => {
  if (!("destinationId" in trigger)) return;
  props.target.triggers = replaceTrigger(props.target, index, { ...trigger, destinationId });
};
const remove = (index: number) => {
  props.target.triggers = removeTriggerAt(props.target, index);
};
const add = () => {
  const next = nextTrigger(props.target, destinationIds.value);
  if (next) props.target.triggers = [...triggers.value, next];
};
</script>

<style scoped>
.rules {
  display: grid;
  gap: 4px;
}
.rule {
  display: flex;
  align-items: center;
  gap: 8px;
}
.choice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.choice > i {
  color: var(--pl-muted);
  font-size: 0.9rem;
}
.rule-or {
  margin: 2px 0;
  color: var(--pl-muted);
  font-size: 0.74rem;
}
.rule-event {
  flex: 0 1 15rem;
  min-width: 0;
}
.rule-destination {
  flex: 1 1 10rem;
  min-width: 0;
}
.rule-remove {
  margin-left: auto;
  margin-right: -0.5rem;
  flex: 0 0 auto;
}
.rule-empty {
  margin: 0;
  color: var(--p-message-error-color, var(--p-red-600, #dc2626));
  font-size: 0.78rem;
}
.rule-add {
  justify-self: start;
  padding-left: 0;
  padding-right: 0;
}
</style>
