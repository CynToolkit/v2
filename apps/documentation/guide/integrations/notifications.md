# Notifications

Notification targets announce a finished run to a chat channel or a webhook. They
run inside the Pipelab engine after the run ends, so a run started from the
desktop app and one started from the [CLI](/cli/reference) notify the same way.

## Add a target

1. Open the workflow. Below **Destinations**, the **Notifications** section lists its targets.
2. Choose **Add notification**, then **Discord**, **Slack** or **Generic webhook**.
3. In the edit dialog, pick or add the **Webhook** connection. It holds the webhook URL, which is a secret: anyone who has it can post to the channel. The workflow file stores only the connection's workflow alias, never the URL.
4. Under **If**, choose the events that send it.
5. Edit the message template. Type `{{workflow}}`-style variables with autocomplete, or click one to insert it, and hover a variable to see its value from the latest finished run. A **Preview** shows the message as a run would send it. **Reset to the default message** restores the starting template.
6. Choose **Send test message** to post a short test message through the selected connection and confirm the channel receives it.

The edit dialog reads like a recipe: **If** one of these events happens, **Then** send this message to Discord or the webhook.

## Choose when it is sent

A target is sent once per run, when any of its events happens. A new target starts with **A run succeeds** or **A run fails**, so it is sent for every finished run.

| Event                                                  | Sent when                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **A run succeeds** / **A run fails**                   | The run ends that way. A run that completes with errors counts as a failure.                       |
| **A destination is deployed** / **A deployment fails** | At least one delivery to the destination you pick completed, or failed, whatever else the run did. |

Add more than one event with **Add another event**; they are joined with "or". Pick one destination to tell a channel only about that store, for example **Deployed** on Steam for the team and **A run fails** for whoever is on call. The message still describes the whole run, so `{{destinations}}` lists every delivery.

The workflow **Settings**, **Notifications** switches **When a run succeeds** and **When a run fails** also apply to the desktop notification and to the **A run succeeds** and **A run fails** events. They do not affect a destination event. A cancelled run never notifies. Notifications are sent when the run ends, not while it is running, and a target with no event is never sent (Pipelab flags it as needing attention).

| Target          | What it sends                                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Discord         | The rendered template as the message of a Discord webhook. Longer than 2,000 characters is cut with `…`.                                                                                                                                                                               |
| Slack           | The rendered template as the text of a Slack incoming webhook (`hooks.slack.com`). Values such as an error message have `&`, `<` and `>` escaped so they cannot become links or mentions. Your own template text is sent as written, so Slack formatting such as `<https://example.com | a link>` works. |
| Generic webhook | A `POST` to the URL whose body is the rendered template, with the content type you set.                                                                                                                                                                                                |

For a JSON content type, substituted values are JSON-escaped so the body stays valid. The
generic webhook can reach any other service that accepts a webhook, for example Microsoft Teams
or ntfy.

## Template variables

Write a variable as `{{name}}`. A template is required, and a name that does not exist is rejected when the workflow is checked.

| Variable           | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| `{{workflow}}`     | The workflow name.                                                 |
| `{{status}}`       | `success` or `failure`.                                            |
| `{{duration}}`     | How long the run took, for example `2m 5s`.                        |
| `{{version}}`      | The version entered when the run started.                          |
| `{{destinations}}` | One line per delivery with its result, such as `Steam: completed`. |
| `{{error}}`        | A summary of what failed, empty when nothing did.                  |

Pipelab redacts secrets, including the webhook URL, from the message before it is sent. Secrets are never available as variables.

## Webhook URLs

The URL must use `https`. `http` is accepted only for `localhost` and loopback addresses, which is meant for testing. The **Notification webhook** connection can be tested from the Connections page: the test sends a short test message to the channel.

## Run from the CLI or CI

Supply the webhook URL for the workflow alias with `--connection`, the same way as any other connection field. The alias is the one stored in the workflow's notification target (for example `discord`):

```sh
pipelab workflow run ./release.json --connection discord.url=env:DISCORD_WEBHOOK
```

A target whose connection has no value for the run is skipped and a warning is logged. It does not stop the run from starting.

## Delivery

Delivery is best effort and never changes the run's result. If a webhook cannot be reached or answers with an error, Pipelab retries up to two more times, waiting 0.5 and 2 seconds, then logs a warning. Each attempt times out after 8 seconds. Error messages never include the URL or the response body.

Email is not available yet. The desktop notification remains a UI-only feature: it appears only for runs started from the app while it is open.
