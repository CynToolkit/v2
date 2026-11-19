# Pipelab Editor UI

Use the existing Editor design system when adding or changing UI in this
package. Start with the closest shipped screen or component and reuse its
structure, control variants, and states where they serve the same purpose.

## Sources of truth

- [The PrimeVue Lara preset](src/main.ts) defines the base Editor theme.
  Use PrimeVue controls and their existing size and severity variants for
  standard inputs, buttons, menus, dialogs, messages, and tags.
- [The shared design layer](src/style/workflow.scss) defines Editor tokens and
  shared control styles. Use semantic `--p-*` variables and the `--pl-*` roles
  below. Avoid legacy variables such as `--surface-card` and
  `--primary-color`. Raw palette shades belong in theme definitions or in
  visualizations with their own palette, such as the execution terminal.

## Applying the design system

| UI role | Existing convention |
| --- | --- |
| Cards and recessed panels | `--pl-card`, `--pl-sunken`, `--pl-border`, `--pl-radius`, `--pl-radius-sm` |
| Text and identifiers | `--p-text-color`, `--pl-muted`, `--pl-font-mono` for paths, run IDs, and logs |
| Interaction | `--pl-hover` for hover, `--pl-selected` or `--pl-selected-shadow` for selection, and `--pl-focus` for keyboard outlines |
| Feedback | `--pl-info` for running or informational states, `--pl-ok` for success, `--pl-warn` for partial failure or warning, `--pl-danger` for failure, and `--pl-muted` for neutral states |
| Loading placeholders | `--pl-skeleton` |

For examples, use [Settings](src/components/Settings.vue) for selectable
navigation, [the dashboard](src/pages/index.vue) for execution status badges,
and [run history](src/pages/workflow-runs.vue) for a layout that adapts to its
container width. For custom execution indicators, reuse the shared
`.status-*` classes and `--pl-status-color` mapping from the design layer.

Keep feature-specific styling scoped to the component. When a reusable visual
role is missing, add a semantic token to the shared design layer and give it
appropriate values in both themes. Use the theme's surface and text roles
together so the same component reads correctly in both themes.

Use native links for navigation and buttons for actions. Keep keyboard focus
visible and expose selection and status with accessible names or state
attributes. Pair status color with text or a named icon. Base embedded layouts
on available content width where sidebars or panels can reduce that space.

For visual or interaction changes, verify the affected states in the Editor
in light and dark mode. Check narrow content widths when the change affects
layout. Use keyboard navigation when changing interactive controls.
