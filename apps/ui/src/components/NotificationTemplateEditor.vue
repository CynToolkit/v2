<template>
  <div class="template-editor">
    <div class="field-head">
      <span>Message</span>
      <small
        >Type <code>{{ "{{" }}</code> for variables. Hover one to see its value.</small
      >
    </div>
    <div ref="host" class="editor-host" />
    <button
      v-if="defaultValue && model !== defaultValue"
      type="button"
      class="reset-link"
      @click="model = defaultValue"
    >
      Reset to the default message
    </button>
    <div class="variable-chips" role="group" aria-label="Insert a variable">
      <button
        v-for="info in variables"
        :key="info.name"
        type="button"
        class="variable-chip"
        v-tooltip.top="chipTooltip(info)"
        :aria-label="`Insert ${info.name}`"
        @click="insert(info.name)"
      >
        <i class="pi pi-plus" aria-hidden="true" />{{ info.name }}
      </button>
    </div>
    <small v-if="unknownMessage" class="editor-warning" role="status">{{ unknownMessage }}</small>
    <div class="preview" aria-live="polite">
      <div class="preview-head">
        <span>Preview</span>
        <small :class="{ 'over-limit': overLimit }">
          <template v-if="maxLength">{{ fullPreview.length }} / {{ maxLength }} · </template
          >{{ hasRealValues ? "Uses your latest run" : "Sample values" }}
        </small>
      </div>
      <p v-if="preview.trim()" class="preview-body">{{ preview }}</p>
      <p v-else class="preview-empty">Nothing to send yet.</p>
      <small v-if="overLimit" class="editor-warning" role="status"
        >{{ overLimit }} characters over the limit. A run cuts the message at
        {{ maxLength }}.</small
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { EditorState } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  hoverTooltip,
  keymap,
  MatchDecorator,
  placeholder,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import {
  renderTemplatePreview,
  splitTemplate,
  type NotificationVariableInfo,
} from "../utils/notification-template";
import type { NotificationTemplateEditorProps } from "./NotificationTemplateEditor.types";

const props = defineProps<NotificationTemplateEditorProps>();
const model = defineModel<string>({ required: true });

const host = ref<HTMLDivElement>();
let view: EditorView | undefined;

const known = computed(() => new Set<string>(props.variables.map((info) => info.name)));
const infoFor = (name: string) => props.variables.find((info) => info.name === name);

const fullPreview = computed(() => renderTemplatePreview(model.value, props.variables));
const overLimit = computed(() =>
  props.maxLength && fullPreview.value.length > props.maxLength
    ? fullPreview.value.length - props.maxLength
    : 0,
);
const preview = computed(() =>
  overLimit.value ? `${fullPreview.value.slice(0, props.maxLength! - 1)}…` : fullPreview.value,
);
const hasRealValues = computed(() => props.variables.some((info) => info.value !== undefined));
const unknownMessage = computed(() => {
  const names = [
    ...new Set(
      splitTemplate(model.value).flatMap((part) =>
        part.kind === "variable" && !part.known ? [part.name] : [],
      ),
    ),
  ];
  return names.length
    ? `Unknown variable${names.length > 1 ? "s" : ""}: ${names.map((name) => "{{" + name + "}}").join(", ")}. A run leaves ${names.length > 1 ? "them" : "it"} as written.`
    : "";
});

const chipTooltip = (info: NotificationVariableInfo) =>
  info.value === undefined
    ? `${info.description}. Click to insert.`
    : `${info.description}. Latest run: ${info.value}`;

const variablePattern = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/** Draws each `{{variable}}` as a token; an unknown name is drawn as a problem. */
const variableDecorations = () => {
  const matcher = new MatchDecorator({
    regexp: variablePattern,
    decoration: (match) =>
      Decoration.mark({
        class: known.value.has(match[1]!) ? "cm-variable" : "cm-variable cm-variable-unknown",
      }),
  });
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(editor: EditorView) {
        this.decorations = matcher.createDeco(editor);
      }
      update(update: ViewUpdate) {
        this.decorations = matcher.updateDeco(update, this.decorations);
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
};

/** Hovering a token shows its value from the latest run, or what it stands for. */
const variableHover = hoverTooltip((editor, pos) => {
  const line = editor.state.doc.lineAt(pos);
  for (const match of line.text.matchAll(variablePattern)) {
    const from = line.from + (match.index ?? 0);
    const to = from + match[0].length;
    if (pos < from || pos > to) continue;
    const info = infoFor(match[1]!);
    return {
      pos: from,
      end: to,
      above: true,
      create() {
        const dom = document.createElement("div");
        dom.className = "cm-variable-tip";
        const title = document.createElement("strong");
        title.textContent = info ? info.name : match[1]!;
        const body = document.createElement("span");
        body.textContent = !info
          ? "Unknown variable. A run leaves it as written."
          : info.value !== undefined
            ? `Latest run: ${info.value}`
            : `${info.description}. Filled in when the run finishes.`;
        dom.append(title, body);
        return { dom };
      },
    };
  }
  return null;
});

const completeVariables = (context: CompletionContext) => {
  const word = context.matchBefore(/\{\{\s*[A-Za-z0-9_]*/);
  if (!word && !context.explicit) return null;
  return {
    from: word ? word.from : context.pos,
    options: props.variables.map((info) => ({
      label: `{{${info.name}}}`,
      type: "variable",
      detail: info.value ?? info.description,
      apply: `{{${info.name}}}`,
    })),
    validFor: /^\{\{\s*[A-Za-z0-9_]*$/,
  };
};

const mono = 'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, monospace';
// Built on the PrimeVue input tokens so it matches every other field in the app.
const theme = EditorView.theme({
  "&": {
    color: "var(--p-inputtext-color)",
    backgroundColor: "var(--p-inputtext-background)",
    border: "1px solid var(--p-inputtext-border-color)",
    borderRadius: "var(--p-inputtext-border-radius)",
    boxShadow: "var(--p-inputtext-shadow)",
    transition: "border-color var(--p-transition-duration, 0.2s)",
  },
  "&:hover": { borderColor: "var(--p-inputtext-hover-border-color)" },
  "&.cm-focused": {
    outline: "none",
    borderColor: "var(--p-inputtext-focus-border-color)",
  },
  ".cm-scroller": { fontFamily: mono, fontSize: "0.82rem", lineHeight: "1.6" },
  ".cm-content": {
    padding: "var(--p-inputtext-padding-y, 0.5rem) var(--p-inputtext-padding-x, 0.75rem)",
    minHeight: "5.5rem",
    caretColor: "var(--p-primary-color)",
  },
  ".cm-line": { padding: 0 },
  ".cm-placeholder": { color: "var(--p-inputtext-placeholder-color)" },
  ".cm-variable": {
    padding: "1px 4px",
    borderRadius: "5px",
    color: "var(--p-primary-color)",
    backgroundColor: "color-mix(in srgb, var(--p-primary-color) 8%, transparent)",
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 24%, transparent)",
  },
  ".cm-variable-unknown": {
    color: "var(--p-message-error-color, var(--p-red-600, #dc2626))",
    backgroundColor: "color-mix(in srgb, var(--p-red-500, #dc2626) 10%, transparent)",
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--p-red-500, #dc2626) 35%, transparent)",
  },
  ".cm-tooltip": {
    border: "1px solid var(--pl-border)",
    borderRadius: "8px",
    backgroundColor: "var(--pl-card)",
    color: "var(--p-text-color)",
    boxShadow: "var(--pl-shadow-sm)",
    overflow: "hidden",
  },
  ".cm-variable-tip": {
    display: "grid",
    gap: "2px",
    padding: "6px 10px",
    fontSize: "0.78rem",
    maxWidth: "20rem",
    "& span": { color: "var(--pl-muted)" },
  },
  ".cm-tooltip-autocomplete > ul": { fontFamily: mono, fontSize: "0.78rem" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--p-highlight-background)",
    color: "var(--p-highlight-color)",
  },
  ".cm-completionDetail": { color: "var(--pl-muted)", fontStyle: "normal", marginLeft: "0.75em" },
});

const insert = (name: string) => {
  if (!view) return;
  view.dispatch(view.state.replaceSelection(`{{${name}}}`));
  view.focus();
};

onMounted(() => {
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: model.value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        placeholder("Write the message, for example {{workflow}} {{status}}"),
        variableDecorations(),
        variableHover,
        autocompletion({ override: [completeVariables], icons: false }),
        theme,
        EditorView.contentAttributes.of({ "aria-label": "Message template" }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) model.value = update.state.doc.toString();
        }),
      ],
    }),
  });
});

watch(
  () => model.value,
  (value) => {
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  },
);
// Tokens are drawn from the known names, so redraw when they change.
watch(known, () => view?.dispatch({}));

onBeforeUnmount(() => view?.destroy());
</script>

<style scoped>
.template-editor {
  display: grid;
  gap: 10px;
}
.variable-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.variable-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 8px;
  border: 1px solid var(--pl-border);
  border-radius: 999px;
  background: var(--pl-card);
  color: var(--p-text-color);
  font: inherit;
  font-size: 0.74rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
}
.variable-chip i {
  color: var(--pl-muted);
  font-size: 0.6rem;
}
.variable-chip:hover {
  border-color: var(--pl-border-strong);
}
.variable-chip:focus-visible {
  outline: 1px solid var(--p-primary-color);
  outline-offset: 2px;
}
.reset-link {
  justify-self: start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--pl-muted);
  font: inherit;
  font-size: 0.74rem;
  text-decoration: underline;
  cursor: pointer;
}
.reset-link:hover {
  color: var(--p-text-color);
}
.over-limit {
  color: var(--p-message-error-color, var(--p-red-600, #dc2626));
}
.editor-warning {
  color: var(--p-message-error-color, var(--p-red-600, #dc2626));
  font-size: 0.74rem;
}
.field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.field-head span {
  color: var(--p-text-muted-color, var(--pl-muted));
  font-size: 0.75rem;
  font-weight: 600;
}
.field-head small {
  color: var(--pl-muted);
  font-size: 0.72rem;
}
.field-head code {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--pl-hover);
  font-size: 0.7rem;
}
.preview {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--pl-sunken);
}
.preview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.preview-head span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--pl-muted);
}
.preview-head small {
  color: var(--pl-muted);
  font-size: 0.72rem;
}
.preview-body,
.preview-empty {
  max-height: 8.5rem;
  overflow: auto;
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.preview-empty {
  color: var(--pl-muted);
}
</style>
