import type { BrowserProviderSpecs } from "@pipelab/shared";

const browserProviderSpecs = {
  schemaVersion: 1,
  releaseConfigVersion: "3.1.0",
  catalog: {
    buildTypes: [
      {
        id: "desktop",
        label: "Desktop",
      },
      {
        id: "web",
        label: "Web",
      },
      {
        id: "mobile",
        label: "Mobile",
      },
      {
        id: "console",
        label: "Console",
      },
      {
        id: "bundle",
        label: "Bundle",
      },
    ],
    sources: [
      {
        id: "@pipelab/core/source/folder",
        label: "Folder",
        fields: [
          {
            key: "path",
            type: "directory",
            label: "Folder path",
            required: true,
          },
        ],
        output: {
          kind: "files",
          container: "directory",
        },
        defaultConfig: {
          path: "",
        },
        requiresAgentInspection: false,
      },
      {
        id: "@pipelab/core/source/web-folder",
        label: "Web app folder",
        fields: [
          {
            key: "path",
            type: "directory",
            label: "Folder path",
            required: true,
          },
        ],
        output: {
          kind: "application",
          platform: "web",
          container: "directory",
        },
        defaultConfig: {
          path: "",
        },
        requiresAgentInspection: false,
      },
      {
        id: "@pipelab/core/source/zip",
        label: "ZIP",
        fields: [
          {
            key: "path",
            type: "file",
            label: "ZIP path",
            required: true,
            fileExtensions: ["zip"],
          },
        ],
        output: {
          kind: "files",
          container: "archive",
          format: "zip",
        },
        defaultConfig: {
          path: "",
        },
        requiresAgentInspection: false,
      },
      {
        id: "@pipelab/core/source/web-zip",
        label: "Web app ZIP",
        fields: [
          {
            key: "path",
            type: "file",
            label: "ZIP path",
            required: true,
            fileExtensions: ["zip"],
          },
        ],
        output: {
          kind: "application",
          platform: "web",
          container: "archive",
          format: "zip",
        },
        defaultConfig: {
          path: "",
        },
        requiresAgentInspection: false,
      },
      {
        id: "@pipelab/plugin-construct/source",
        label: "Construct project",
        fields: [
          {
            key: "path",
            type: "file",
            label: "Project file",
            required: true,
            fileExtensions: ["c3p"],
            showInWizard: true,
          },
          {
            key: "profilePath",
            type: "select",
            label: "Browser profile",
            required: true,
          },
          {
            key: "accountConnectionId",
            type: "connection",
            integration: "Construct Account",
            label: "Construct account",
            required: false,
          },
          {
            key: "version",
            type: "text",
            label: "Construct version",
            placeholder: "Empty: the project's saved release",
            options: [
              {
                label: "latest",
                value: "latest",
              },
              {
                label: "beta",
                value: "beta",
              },
            ],
            required: false,
          },
        ],
        output: {
          kind: "project",
          technology: "construct",
          container: "file",
        },
        defaultConfig: {
          path: "",
          profilePath: "",
          accountConnectionId: "",
          version: "",
        },
        requiresAgentInspection: true,
      },
      {
        id: "@pipelab/plugin-godot/source",
        label: "Godot project",
        fields: [
          {
            key: "path",
            type: "directory",
            label: "Project path",
            required: true,
            showInWizard: true,
          },
        ],
        output: {
          kind: "project",
          technology: "godot",
          container: "directory",
        },
        defaultConfig: {
          path: "",
        },
        requiresAgentInspection: true,
      },
    ],
    producers: [
      {
        id: "@pipelab/core/passthrough",
        label: "Passthrough",
        accepts: {},
        planning: {
          mode: "automatic",
        },
        defaultConfig: {},
        requiresAgentInspection: false,
        targets: [
          {
            id: "output",
            label: "Output",
            transform: {
              changes: {},
            },
            defaultConfig: {},
          },
        ],
      },
      {
        id: "@pipelab/core/unzip",
        label: "Extract ZIP",
        accepts: {
          container: "archive",
          format: "zip",
        },
        planning: {
          mode: "automatic",
        },
        defaultConfig: {},
        requiresAgentInspection: false,
        targets: [
          {
            id: "output",
            label: "Extracted files",
            transform: {
              changes: {
                container: "directory",
              },
              remove: ["format"],
            },
            defaultConfig: {},
          },
        ],
      },
      {
        id: "@pipelab/core/bundle",
        label: "Bundle",
        accepts: {
          kind: ["application", "files"],
          container: ["directory", "archive"],
        },
        planning: {
          mode: "build",
        },
        inputs: "many",
        defaultConfig: {},
        requiresAgentInspection: false,
        targets: [
          {
            id: "zip",
            label: "ZIP archive",
            buildType: "bundle",
            output: {
              kind: "files",
              container: "archive",
              format: "zip",
            },
            defaultConfig: {},
          },
        ],
      },
      {
        id: "@pipelab/plugin-construct/producer",
        label: "Construct",
        accepts: {
          kind: "project",
          technology: "construct",
        },
        planning: {
          mode: "build",
        },
        defaultConfig: {},
        requiresAgentInspection: false,
        targets: [
          {
            id: "web",
            label: "web",
            buildType: "web",
            output: {
              kind: "application",
              technology: "construct",
              platform: "web",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "webview2-windows-x64",
            label: "webview2-windows-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "webview2",
              platform: "windows",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "wkwebview-macos-arm64",
            label: "wkwebview-macos-arm64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "wkwebview",
              platform: "macos",
              architecture: "arm64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "cef-linux-x64",
            label: "cef-linux-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "cef",
              platform: "linux",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
        ],
      },
      {
        id: "@pipelab/plugin-electron/producer",
        label: "Electron",
        accepts: {
          kind: "application",
          platform: "web",
          container: "directory",
        },
        planning: {
          mode: "build",
        },
        supportsBeforeBuildHooks: true,
        defaultConfig: {},
        requiresAgentInspection: false,
        targets: [
          {
            id: "windows-x64",
            label: "windows-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "electron",
              platform: "windows",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "windows-arm64",
            label: "windows-arm64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "electron",
              platform: "windows",
              architecture: "arm64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "linux-x64",
            label: "linux-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "electron",
              platform: "linux",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "linux-arm64",
            label: "linux-arm64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "electron",
              platform: "linux",
              architecture: "arm64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "macos-arm64",
            label: "macos-arm64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "electron",
              platform: "macos",
              architecture: "arm64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
        ],
      },
      {
        id: "@pipelab/plugin-tauri/producer",
        label: "Tauri",
        accepts: {
          kind: "application",
          platform: "web",
          container: "directory",
        },
        planning: {
          mode: "build",
        },
        defaultConfig: {},
        requiresAgentInspection: false,
        targets: [
          {
            id: "windows-x64",
            label: "windows-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "tauri",
              platform: "windows",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "linux-x64",
            label: "linux-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "tauri",
              platform: "linux",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
          {
            id: "macos-arm64",
            label: "macos-arm64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "tauri",
              platform: "macos",
              architecture: "arm64",
              container: "directory",
            },
            defaultConfig: {},
            availabilityStatus: "unknown",
          },
        ],
      },
      {
        id: "@pipelab/plugin-godot/producer",
        label: "Godot exporter",
        accepts: {
          kind: "project",
          technology: "godot",
          container: "directory",
        },
        planning: {
          mode: "build",
        },
        defaultConfig: {
          executable: "",
        },
        requiresAgentInspection: true,
        targets: [
          {
            id: "windows-x64",
            label: "windows-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "godot",
              platform: "windows",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {
              preset: "",
            },
            fields: [
              {
                key: "preset",
                type: "select",
                label: "Godot export preset",
                required: true,
              },
            ],
            availabilityStatus: "unknown",
          },
          {
            id: "linux-x64",
            label: "linux-x64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "godot",
              platform: "linux",
              architecture: "x64",
              container: "directory",
            },
            defaultConfig: {
              preset: "",
            },
            fields: [
              {
                key: "preset",
                type: "select",
                label: "Godot export preset",
                required: true,
              },
            ],
            availabilityStatus: "unknown",
          },
          {
            id: "macos-arm64",
            label: "macos-arm64",
            buildType: "desktop",
            output: {
              kind: "application",
              technology: "godot",
              platform: "macos",
              architecture: "arm64",
              container: "directory",
            },
            defaultConfig: {
              preset: "",
            },
            fields: [
              {
                key: "preset",
                type: "select",
                label: "Godot export preset",
                required: true,
              },
            ],
            availabilityStatus: "unknown",
          },
          {
            id: "web",
            label: "web",
            buildType: "web",
            output: {
              kind: "application",
              technology: "godot",
              platform: "web",
              container: "directory",
            },
            defaultConfig: {
              preset: "",
            },
            fields: [
              {
                key: "preset",
                type: "select",
                label: "Godot export preset",
                required: true,
              },
            ],
            availabilityStatus: "unknown",
          },
        ],
      },
    ],
    destinations: [
      {
        id: "@pipelab/core/destination/folder",
        label: "Folder",
        icon: {
          type: "icon",
          icon: "mdi-folder-outline",
        },
        fields: [],
        slotFields: [
          {
            key: "outputDir",
            type: "directory",
            label: "Output folder",
            required: true,
          },
        ],
        accepts: {},
        requiresBuild: true,
        defaultConfig: {},
      },
      {
        id: "@pipelab/core/destination/zip",
        label: "ZIP",
        icon: {
          type: "icon",
          icon: "mdi-folder-zip-outline",
        },
        fields: [],
        slotFields: [
          {
            key: "outputPath",
            type: "file",
            label: "ZIP output path",
            required: true,
            fileExtensions: ["zip"],
            pathMode: "save",
          },
        ],
        accepts: {
          container: ["directory", "archive"],
        },
        defaultConfig: {},
      },
      {
        id: "@pipelab/plugin-steam/destination",
        label: "Steam",
        fields: [
          {
            key: "accountConnectionId",
            type: "connection",
            integration: "@pipelab/plugin-steam",
            label: "Steam account",
            required: true,
          },
          {
            key: "appId",
            type: "text",
            label: "Steam App ID",
            required: true,
          },
        ],
        slotFields: [
          {
            key: "depotId",
            type: "text",
            label: "Depot ID",
            required: true,
          },
        ],
        accepts: {
          kind: "application",
          platform: ["windows", "linux", "macos"],
          container: "directory",
        },
        defaultConfig: {
          accountConnectionId: "",
          appId: "",
        },
      },
      {
        id: "@pipelab/plugin-itch/destination",
        label: "Itch.io",
        fields: [
          {
            key: "accountConnectionId",
            type: "connection",
            integration: "@pipelab/plugin-itch",
            label: "Itch account",
            required: true,
          },
          {
            key: "project",
            type: "text",
            label: "Project",
            required: true,
          },
        ],
        slotFields: [
          {
            key: "channel",
            type: "text",
            label: "Channel",
            required: true,
          },
        ],
        accepts: {
          kind: ["application", "files"],
          container: ["directory", "archive"],
        },
        defaultConfig: {
          accountConnectionId: "",
          project: "",
        },
      },
      {
        id: "@pipelab/plugin-poki/destination",
        label: "Poki",
        fields: [
          {
            key: "accountConnectionId",
            type: "connection",
            integration: "@pipelab/plugin-poki",
            label: "Poki account",
          },
          {
            key: "project",
            type: "text",
            label: "Poki project",
            required: true,
          },
        ],
        accepts: {
          kind: "application",
          platform: "web",
          container: "directory",
        },
        defaultConfig: {
          accountConnectionId: "",
          project: "",
        },
      },
      {
        id: "@pipelab/pipelab-cloud/destination",
        label: "Pipelab Cloud",
        description: "Store selected build artifacts in your private Pipelab Cloud storage.",
        icon: {
          type: "image",
          image:
            "data:image/webp;base64,UklGRrAFAABXRUJQVlA4WAoAAAAQAAAAXwAAXwAAQUxQSPQAAAABgFtbWxzni4hMOKs60PRAGxSA+8BlmE44synFKoIOiPCRo9+z71/q44iYAFyrjY+5yu6l5TvHD6Nx15Fblh3Jsnof3aZskh1R+bLqhiYMO7I/obmq7XaEu8UVbb+j3C8uNN2OdNecUWFHO6gTO/AaLIBR2hFPI8AJM3HQyx31pTaFWzF+R95HdjGzy5VdFXay+/f/35/CTiq7mtnlyC56dt4UbsXoJbelhhNm4oBRYpZGAOzAa7AAoAKvoE4w37LqGpxve059i8vtllG3wLXzz4HNEBpcr2wSJpKsws0jtyy/JMrSjXDXN+NjrvJaUnP0RuNaVlA4IJYEAABQGgCdASpgAGAAPjEUiEKiISEaOWU4IAMEsx2+RndQsfR/mfwa4cLuTk9/Pf9M+2ntq+KH/WurH5gP07/pvWw9AD+o/yjrQPQA/Xf0tP2H+Ef9qv259mb//5pf2b/4au//vvCDogOD4uZx5/8D1Bs7Pz36LvV2/bf2K1ZPF9/jVRUfwj3d197PoJdRJnazre1CJVfSqVH4+CqbMsp7MqkCh4MbmdebOLBO1Y8ylnxWOaebk1qF/s/vatFgo5F2VRB30rXDs6ewai/YjCQcvVSr07ukj01dwcENXQAA/v74aFhX0fabfmW3+gc99sX8Fjufdj9o2KM+fMnsQg8D6P/zkWeFlo1JtPWznpEr9AR5sIi23/Ir+P+oe40YWnKYP25lJj3UDfyXJ97nan8tbIHCXqF7PVq5sLao/XxCL7bNk+/u2lWnkykZdm+rE7A3S1JVZm2I34sb6S7y3jZ9PsbHwg09iAq93M13c/a0y11DVVdG7Fw/UhuXy8LMP2LIoUX8sBUeOP9iG/L/xi+UBV1+YL3ObJy0gvW/+8lD/y8VC/oZQw819H//NF8NHXhnfts4uqLGk63+QmCBmNe8M5Fla98yZFjfAg7XkEDL9G/Bq4LmdVib0V/8IAsgwPjdYhzP6l5f1BGh671BzvYV0B0BilGPNP+L7WUS1j7rBuRgCdlIQyt/F7uCmDrFY6ycVRMj2UXxXNZgUhdZoyrDbMEHj9mnYI5fLX8OqliKVIXJf9hg1zGBg25mQfNPsvS9rz91v4A60gt4mKXToRrBRTFLFZSZHA9glgFY359NHbUsnsIVm8rewh+LlyCpo+JRI+3Qt2nSc2dKxBGuBwd8X/v8u80U2UCyw5kZQW1qN3LKxgrWDY6xZojYXvXPn3L6aEnK2DEY8BvkSkj2L5fGjixxaUn+TNWvxUU9jJie9DdM8ABlwXeS9Nl+pJAqq1p2Jp6k5YOFgP+TM6aiTeUsieYIJBiKRadNZ8N9f5OoMfrmM7SbpQi+5z/9wcJX5dpoQaUO0VX1Bn3qdzchIzNdktKf+piGJcT1TsgzXUitb0GXwCkq/+bNuSZec9+gm1+c2X8cvWFmBttqvOXkTERENV9Xa3JiTOrmRXStt+8IZP/1+SNGUjd5TD+1/lMRPpNhgEF0APKJKKpqLc4mvdxZCQRhXo84O4oy65Vl5XaFJLNP1V+m2npxG2tWxw//4+svaJPFwfnQI8d4MShZCAYNXXEDcDU9KPT+0Oq/u5QG5xfuIpri2UK0ogYOOX33RHJLJsMxy1TmpwdN367cHgEePP+9cz1TYr8fkRDNhsvShFY+q1J2IqrLCiCyTzbgF1u4WqOWQMOaJWbDeVIJYf4XPUHsPDK2v/8XmtYdO+/5bmWIt07U4JogSfiK6Tz0gPwHl+gJXXeueO5rc5mzubsEUWaK6RELCDZ7iSmA0GHouyNBnnlT/4X5suvswTrEUZcmbIo6d4oHbhE6wqbdsqolOy4GdtrA44nY5Vnu3p0rVVSW4SyuHr9ztGzVnPOBG04rH4XeKHf95Kw778IJGlvzwgXzyQKAAAAA",
        },
        accepts: {
          kind: "application",
          container: ["file", "directory", "archive"],
        },
        defaultConfig: {},
      },
    ],
    notifications: [
      {
        id: "@pipelab/plugin-notifications/discord",
        label: "Discord",
        description: "Post the result of a run to a Discord channel through a webhook.",
        icon: {
          type: "image",
          image:
            "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%235865F2%22%20d%3D%22M20.317%204.3698a19.7913%2019.7913%200%2000-4.8851-1.5152.0741.0741%200%2000-.0785.0371c-.211.3753-.4447.8648-.6083%201.2495-1.8447-.2762-3.68-.2762-5.4868%200-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077%200%2000-.0785-.037%2019.7363%2019.7363%200%2000-4.8852%201.515.0699.0699%200%2000-.0321.0277C.5334%209.0458-.319%2013.5799.0992%2018.0578a.0824.0824%200%2000.0312.0561c2.0528%201.5076%204.0413%202.4228%205.9929%203.0294a.0777.0777%200%2000.0842-.0276c.4616-.6304.8731-1.2952%201.226-1.9942a.076.076%200%2000-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077%200%2001-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743%200%2001.0776-.0105c3.9278%201.7933%208.18%201.7933%2012.0614%200a.0739.0739%200%2001.0785.0095c.1202.099.246.1981.3728.2924a.077.077%200%2001-.0066.1276%2012.2986%2012.2986%200%2001-1.873.8914.0766.0766%200%2000-.0407.1067c.3604.698.7719%201.3628%201.225%201.9932a.076.076%200%2000.0842.0286c1.961-.6067%203.9495-1.5219%206.0023-3.0294a.077.077%200%2000.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061%200%2000-.0312-.0286zM8.02%2015.3312c-1.1825%200-2.1569-1.0857-2.1569-2.419%200-1.3332.9555-2.4189%202.157-2.4189%201.2108%200%202.1757%201.0952%202.1568%202.419%200%201.3332-.9555%202.4189-2.1569%202.4189zm7.9748%200c-1.1825%200-2.1569-1.0857-2.1569-2.419%200-1.3332.9554-2.4189%202.1569-2.4189%201.2108%200%202.1757%201.0952%202.1568%202.419%200%201.3332-.946%202.4189-2.1568%202.4189Z%22%2F%3E%3C%2Fsvg%3E",
        },
        fields: [
          {
            key: "webhook",
            type: "connection",
            integration: "Notification webhook",
            label: "Webhook",
            description:
              "The saved webhook URL. It is a secret, so it is never stored in the workflow file.",
            required: true,
          },
          {
            key: "template",
            type: "text",
            label: "Message",
            description:
              "Variables: {{workflow}}, {{status}}, {{duration}}, {{version}}, {{destinations}} (results and URLs), {{error}}.",
            required: true,
            maxLength: 2000,
          },
        ],
        defaultConfig: {
          webhook: "",
          template:
            "{{workflow}} {{version}}: {{status}} in {{duration}}\n{{destinations}}\n{{error}}",
        },
      },
      {
        id: "@pipelab/plugin-notifications/slack",
        label: "Slack",
        description: "Post the result of a run to a Slack channel through an incoming webhook.",
        icon: {
          type: "icon",
          icon: "mdi-slack",
        },
        fields: [
          {
            key: "webhook",
            type: "connection",
            integration: "Notification webhook",
            label: "Webhook",
            description:
              "The saved webhook URL. It is a secret, so it is never stored in the workflow file.",
            required: true,
          },
          {
            key: "template",
            type: "text",
            label: "Message",
            description:
              "Variables: {{workflow}}, {{status}}, {{duration}}, {{version}}, {{destinations}} (results and URLs), {{error}}.",
            required: true,
          },
        ],
        defaultConfig: {
          webhook: "",
          template:
            "{{workflow}} {{version}}: {{status}} in {{duration}}\n{{destinations}}\n{{error}}",
        },
      },
      {
        id: "@pipelab/plugin-notifications/webhook",
        label: "Generic webhook",
        description: "POST the rendered template to any HTTPS endpoint.",
        icon: {
          type: "icon",
          icon: "mdi-webhook",
        },
        fields: [
          {
            key: "webhook",
            type: "connection",
            integration: "Notification webhook",
            label: "Webhook",
            description:
              "The saved webhook URL. It is a secret, so it is never stored in the workflow file.",
            required: true,
          },
          {
            key: "contentType",
            type: "text",
            label: "Content type",
            description: "Sent as the Content-Type header. JSON bodies get JSON-escaped values.",
            placeholder: "application/json",
            options: [
              {
                value: "application/json",
                label: "application/json",
              },
              {
                value: "text/plain",
                label: "text/plain",
              },
            ],
          },
          {
            key: "template",
            type: "text",
            label: "Body",
            description:
              "The request body, rendered. Variables: {{workflow}}, {{status}}, {{duration}}, {{version}}, {{destinations}} (results and URLs), {{error}}.",
            required: true,
          },
        ],
        defaultConfig: {
          webhook: "",
          contentType: "application/json",
          template:
            '{"workflow":"{{workflow}}","version":"{{version}}","status":"{{status}}","duration":"{{duration}}","destinations":"{{destinations}}","error":"{{error}}"}',
        },
      },
    ],
  },
  providers: [
    {
      id: "@pipelab/plugin-construct",
      name: "Construct",
      icon: {
        type: "image",
        image:
          "data:image/webp;base64,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",
      },
      description: "Pipelab provider for exporting and packaging Construct 3 projects",
      isOfficial: true,
      packageName: "@pipelab/plugin-construct",
      integrations: [
        {
          name: "Browser Executable",
          fields: [
            {
              key: "path",
              label: "Browser Executable Path",
              type: "file",
              placeholder: "e.g., /usr/bin/google-chrome",
            },
          ],
        },
        {
          name: "Browser Profile",
          fields: [
            {
              key: "path",
              label: "Chrome profile directory",
              type: "directory",
              placeholder: "e.g., ~/.config/google-chrome",
            },
          ],
        },
        {
          name: "Construct Account",
          fields: [
            {
              key: "username",
              label: "Username",
              type: "text",
            },
            {
              key: "password",
              label: "Password",
              type: "password",
            },
          ],
          testable: true,
        },
      ],
    },
    {
      id: "@pipelab/plugin-electron",
      name: "Electron",
      icon: {
        type: "image",
        image:
          "data:image/webp;base64,UklGRooFAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSKkBAAABkHNt2yHGG3oGMda22bF3Zdu2bZRWpclWSbWq7N2KnW1rZuPkjef73iciJgDGOy04ef3pj/zS0rxvj68cm9Uaqt3B2R8k9utT/RwtTfZ/FsNvdtfR0CTIE4vhkTq2/N2RWP61yrPS56kovNfJwrp8Ufl/pik/R9Qe9Yyk3RbFZ5MMpN0T1ReSYvl3RPlpL06OqN8TY50Qjq9Rn3yGqH0N/KdCederbreQTq+macTyq05VWUK7sYomeTxhnUr7hXguAPcz03MHGCLUPYBsrq3AR67H6CTkTRawDQrYll9nC56y3f3B9i6fLSplK+HLYwu/sb1+zHbrCtuxY2yLZrH1bcXWAK+5HgBZXGuAvlzdAec10yMHwC6myQBQJ+T5mVYJh3kWo8o6v1g+plWFVSwjUa13j+O8Wx06Rgy/m6KmMxgGoeZH9K1FTO+stqNuHCRd0BUkIH7SaU1HE2DS26NnrQvD4yIdvwfBfPs7Gs43hU132i9bH0e6sFxnY2jj55I0KKw997mpR5PToNTpsfVxvIdrujtQ3WTg8uDuu6ikJHx969jifg1gHABWUDggugMAADASAJ0BKkAAQAA+nUSbSiWjoiGoFA34sBOJQBf6NiEe22/Pk6YBvLv/AwSWa+30ZSvADSBY4/0o9c36M8631J7An8o/s3VP/b32c/2jdKuLMfccrhTcCBrusTLw1vIeA9yap+F1ssobL9nC3OV7hRHDSFjUxGXRBDVB6jeSnU+HeIdwixX9TlrZK11qXpchKkiPeKABedrmEwAA/voof/af9Lf/9EHFEQZKmYpjJhJZhclkv/NzM8p0PrMoKndFyM1xIE/hr/9VgTPlNmKZysqTHaJFiYjyKzQP5cQU1pbFA2Iz6pEWuLLDCSp8RPtrXbN5OIS/Ywa78E16Oe+gsZR0a4OTmSaLoo+3b6sRN8ocKZ8YVVbiry38/4JbYxagoI127KZhHFB2h8YZpG9uKtz4m95kD6R6W0KOh/S3csNPZrz9QTBbylEQGXzeBqEIWYOVzZfNHqmzWJFVtnpc5QvagXGvLVugRErhThy49OozeVF18sTe/JVvcKAMirm+6Hef15V0JFC6/MxaLE4DXgkrKIIAsMA9VjHbn1xBvotFnR/ERZ41vY/WgyChSmSaHzi4Z0KEaJTvCS3nZfV2xpx+8h6oFh+Z8KNaJfQpjbWC70xPYu2+UveYbJk6jvC0msPlMBGiprlkVUO9RP69Cu44UegDKvfhR4g3Kuyjq/A41o/8RtNzKR69jI7hJ8JPo9zXJN/48Jfx0odqFfxF6Tsmt+9777O4GVQDkJBNXv5+a/VTYVi46k3UOc16raWB9aabkWov7P1rGf+KhtEGo9om7PmXSfN+8rUL9bUn3NIA1yUISuzgnA7nPxWweOk6WQc5/fX2p4GBxOIp8LTqeTZNW2HuVi0798KZcWwbOG6e9QCkKmcOuyThhKM7h/qKIkiZfLiMd6BAdOeqL8dyhZe/5/GMw6f+GrHNhOstfsUfXLhq6Cw580vyKR+bwXzoPWMR0FtJIAwrtZ55cHuzyIl3NRvmecRkq9d/ZN7CdFO7Iv/WkWsG5Bm4s6eTF8mhBU2AEhiSnH7udS8mv01wT+GvzdDO961hOKnCvKhkSfwOVCKS00vAABj4Z52kB+icVa7hMNt2nzAJyZzZ9KQNAqAIcH6kytZlpuSNZ5LrpIpish9tZXMGkl7K6i1FUrxln9mTDlz5XCJ6Ta9PLPN8q/5/lNNujHt+UtdUDRK0Wmih7HInExwMZZ3b18SIT3bu4wFvOWVnNAfDS4jOEZTF49xbSaw3JCVuHNb6yFb26zV79mEFb3d9xEHwAA==",
      },
      description: "Pipelab provider for packaging apps with Electron",
      isOfficial: true,
      packageName: "@pipelab/plugin-electron",
    },
    {
      id: "@pipelab/plugin-steam",
      name: "Steam",
      icon: {
        type: "image",
        image:
          "data:image/webp;base64,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",
      },
      description: "Pipelab provider for publishing games to Steam via SteamCMD",
      isOfficial: true,
      packageName: "@pipelab/plugin-steam",
      integrations: [
        {
          name: "Steam Account",
          testable: true,
          fields: [
            {
              key: "username",
              label: "Steam Username",
              type: "text",
              placeholder: "e.g., steam_user",
            },
          ],
        },
      ],
    },
    {
      id: "@pipelab/plugin-itch",
      name: "Itch.io",
      icon: {
        type: "image",
        image:
          "data:image/webp;base64,UklGRg4FAABXRUJQVlA4WAoAAAAwAAAAPwAAPwAAQUxQSCkCAAANkHRb27G3E7o+Jali205mtW23sTOrbdu2bXNkux3Ftm28n7/3fZ87IiYAgnuP7ufpYGmqUHY2VJVmfX9bAJal42OGKKFbojC1dvAeMLLrw7WPSkbsVoZBQInn8Dinm4frGbDfOQqCe8UkP9pSJ5JscwRENU1ccPoIJ0bfSxDdeu3g2EzhVk0Bi33PHrsikOI6GO19vGVRtxA9X4DdeaOj2vn1fA2WpyeFtfNRvADb4+Nju3lcB+uz+q82bBXYX15015C+Uwjgwu5sfbJLoNj7RBKnZzNoDvG4rss+gggO7KjTsRNUrWef1bIbRQbrTtYDWAm6puPvA9IwQlh2WIkJoBxg/B/RpDD5JYbQCrvnraQVXDUGtCXB/Ygh2INaqAM1H0tqzqbUrBXUTJQSYspOBbHWBlNiVVXWxApKHYhlZHkT+/+jP7GUN6MkpLiUgi5PUn+Aj8NI3QWuxpN6DXx08iL0WwIob8YQOgwAh5NNyVR+0ap/lEhmC3RuWWBNpPCtrrrTa4ksht4jg/uSeMbp42LP9iZQsw4GZh47TiASBl9pmcfcGvBcNGYaY6ea+XRHJo9n6uo/8G4Pi5/F0Kl/ELA9tv9yZtY0Q9Du1cXnezNREwnB7+w5MYSBZ+sgYnaSxwFrkQoXcxCVu75j9jpTESq3vIXodWdPjl8WINDvw1/AZP39w8aTw4MkPLg/d19LwKzy/8u71cHBoT7O1ibKtsqCjP8pKRAcAFZQOCC+AgAAkA4AnQEqQABAAD6dSp1KpaSioagUC1CwE4lsDbcklF4I5MYIrn7r+D6o94lvSK8wH7Lb4B+yXWQegB5ov5HfBz+3XpVNEFaDLA0nbO27ENRfvwa1WW6M3MgcwWXEzEhDjzOgMaJXUPvU/v7Imh/FY26oGCTw0Xog21byYAAA/umd//jx//xzP//jWGjo/DfvIeefzKbLXurv7URhNUcBgdX0TW4SKGUUff6CnmtEuplZoURqjA1Qt6IAqBxWkRPuLPYswG7/8MHQA1ClALPp41irLyVcH8P1e6p9wWgdfDh4apR4BavVceUijFm3Z7ZCkScry7tyNbONXut8kggnQ+S7iMUx+La7N3XSWRtKcYb3Vdx2cYb0514uNPTQ2tWUPXF8nvlrSu9wI9H1r88zvQQb+SHA5zYOzWED+Hl8PqqtOTqo2AQ7D3qbHDEkLo6rnbQAtgT257059lHXsKUazanaYazLltKqETgLq3qU7aiMO8b1eGNL0Cl/jLtQa6v7w/LvlU59jHu0+/y+6Jpja1OveC+FOooynA1UYr6xRuQYcE25cchw7LlxUUyl9OdtMaXjAe88v55VWT7CbsHlk9+X5+sWZs63XLVDAWSHQ03oz2EAdQX1DhoQqLnvzoJHzgusYi0yEV+9PJERfT+7SpXVeCFjEKAOKPjsbuwYT8XMTD69VpIWjwGje3LoJIXcu/bRln2LIGWlZIW5XWoP3cj20YDXIdnAVB626+ojpCJnMmFUWfGIJZ8x8Z9S2GlQQKq705rkaWOpJTXAGj0YF03n/wwmgAstDXfubzdeFgSw+YfBVutWyeV187Tw6zILy8p6LR/qZQmH+tCCPQUnxauggX2FNEl2SSp1PerjxUHQXfuLBUu2HF84X9KxVcJslL4zi//E/gklTH5eGt51xwtgVwTNCwiOZRzgQAAA",
      },
      description: "Pipelab provider for publishing games to itch.io",
      isOfficial: true,
      packageName: "@pipelab/plugin-itch",
      integrations: [
        {
          name: "Itch Butler Account",
          testable: true,
          fields: [
            {
              key: "apiKey",
              label: "API key",
              type: "password",
              placeholder: "API key",
            },
          ],
        },
      ],
    },
    {
      id: "@pipelab/plugin-poki",
      name: "Poki",
      icon: {
        type: "image",
        image:
          "data:image/webp;base64,UklGRjIFAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSNoBAAABkKxtm6FHX3X12HZs8wzGK3vWtmf1J9uxzbOw7TmA2GnETgq76qqvRsuImAD4j+1Oj0vPLSjMy0yYORrf6OR1N79X+z1DjA/3hbW/Hm5LG4uILNr7uV3IqF0/DsU7OEjKlVYh9Xo3UgmCaeW+NOiXTzNFSr5zaZR/LyFG6LZQGg+2UAPu4QGJsH+/q40eGJIoB3c7msiaPom0d5Wm7GaJtilTy4TXEvHz8Tr2Mkxsu4YFdRJ19dxoMYFLnIw0u0Yir5wRZRPHxldHoC8k+keOWpyPr2WB2kqBjy9WuygtPKVEP9nwzlGZVmVDxRSVON8Gb5FKRq8NPekqecM2DOWqFHIbeOHvJG/YhuE8lfQeG3ozVBZ5NvhxKlMrbaiapuK8t+ETVYEzNlwA5WUcn1ihtrAVn7dIjT7F95yqwQaOjW+CiLNqsNXMigJlApeIQeQF9bjq5keDfQwT2w0aJ77F9HqCDshtxdOSDVrJhn4sfWuIHqAHh3AM7qWg2z0ygKF/vwv66bbQXLCZgklS+p2b4d9KCBieGvNM+GVTwTxJudwiNHk3UgmgJAt3fGoXkTq/7Y8jgHd00uprX6v9niHGh/vC2p/3NqWOAfR0elx6bkFhXmbCTBf+YwNWUDggMgMAAHASAJ0BKkAAQAA+nUSeS6WjoqGoGAlYsBOJbAC++a7ZXnPOveA3gI6NfH1EbZXzGfp36xemn7y15Meas/1XtVkQOz6735gaQLFnyU/qf2BOjX6AH6AKeiTLtg9HITfAMigDoNCOkzfshFurcKNQgZRlKlUh0HMHQHXZS80FIqDYYlkImVEK6pwjG1Y6+SJQEnNbrvB0NEoh9XQogAD+4TH8ncSuX/U08/cl+ltFmSEw3CmWOWajP3dX5jtmknDpPVyUflBqSXaw5UrvRRjmbTWvOr3t74ioc37PnU0C2DXk2qjGL1/1EIWixKAoLvxf1KwMiX8rLeCpYs3kBIFe9fCsLulSeljEMEvvtRbBEPIXb8FoiFTeL+dBnFZJVlp52rEGs8KzIeTeVKhZNyGjZY4YzKz/PJORhfbAUKRuxbjMRnkBCAANuHgAx8HHtZf+H6xkdqUEnbDxOF9sN/fvBC6Fd+z+jmdHz3M6j/YqskNhPMv1wKOK8htDwHBWxnz/xLUOHmtxcDuTzB6jCtNHLqLDr4b2qJLQg3dYsNJ2Kuq95mtpllNgFw2f+SuoJ/96szRbRONKYvRZCqbQkcvssg4Y1t8pYSdM51aNiHr33RUzXP7/ifQL942v0oIFTstVjWw2QuE1IeF+oGf3TPCW0PlnYZCpWSPgI6Wvh4QNcjoxUaGAhcmJpvAw3Z5iT8vYRkUMcMYL54CXU9mIn/NvP5zmCL09CjNsAYmXePkMnUx8/7IbHjTWPyKV1Y+4uqg0QuBEbwdu0IniZiM/Iv2FfCeZuWrYuOKY6HKuNRUkHiDpz6U5eN0jR6Zu+wjSarWwOfj/q5DQPeRmaUdGlhmlEtcMn3ii4/yq1m0pnXPzRIzzYFizjluPOxRGDoP2jk8xHs5J3glY9ldEGHvExVeyq3AHWfpMMmXPGuwDyat0zOzEj7T9FDuWY1Uh1d002jPjG64EGPltUmdlAW4EcwkQGZk7SNM23I4Di59nHFLlAunsxwYhE50UxrnyYpJkNr4l+6dZzzOCEd9EvNtzH7VGN5sT0TKpfS/I7XCMe9bAfS3P69qvMJv2zMLt2OSgfkbQAAAA",
      },
      description: "Pipelab provider for publishing HTML5 games to Poki",
      isOfficial: true,
      packageName: "@pipelab/plugin-poki",
      integrations: [
        {
          name: "Poki Account",
          testable: true,
          fields: [
            {
              key: "account",
              label: "Account name",
              type: "text",
              placeholder: "e.g., studio",
            },
          ],
        },
      ],
    },
    {
      id: "@pipelab/plugin-tauri",
      name: "Tauri",
      icon: {
        type: "image",
        image:
          "data:image/webp;base64,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",
      },
      description: "Pipelab provider for packaging apps with Tauri",
      isOfficial: true,
      packageName: "@pipelab/plugin-tauri",
    },
    {
      id: "@pipelab/plugin-godot",
      name: "Godot",
      icon: {
        type: "image",
        image:
          "data:image/svg+xml;base64,PCEtLSBHb2RvdCBFbmdpbmUgTG9nbyDCqSAyMDE3IEFuZHJlYSBDYWxhYnLDsywgQ0MgQlkgNC4wLiBTb3VyY2UgYW5kIGxpY2Vuc2U6IGh0dHBzOi8vZ2l0aHViLmNvbS9nb2RvdGVuZ2luZS9nb2RvdC90cmVlL21hc3Rlci9taXNjL2xvZ28gLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0Ij48ZyBmaWxsPSIjZmZmIj48cGF0aCBkPSJNMTA1IDY3M3YzM3E0MDcgMzU0IDgxNCAwdi0zM3oiLz48cGF0aCBmaWxsPSIjNDc4Y2JmIiBkPSJtMTA1IDY3MyAxNTIgMTRxMTIgMSAxNSAxNGw0IDY3IDEzMiAxMCA4LTYxcTItMTEgMTUtMTVoMTYycTEzIDQgMTUgMTVsOCA2MSAxMzItMTAgNC02N3EzLTEzIDE1LTE0bDE1Mi0xNFY0MjdxMzAtMzkgNTYtODEtMzUtNTktODMtMTA4LTQzIDIwLTgyIDQ3LTQwLTM3LTg4LTY0IDctNTEgOC0xMDItNTktMjgtMTIzLTQyLTI2IDQzLTQ2IDg5LTQ5LTctOTggMC0yMC00Ni00Ni04OS02NCAxNC0xMjMgNDIgMSA1MSA4IDEwMi00OCAyNy04OCA2NC0zOS0yNy04Mi00Ny00OCA0OS04MyAxMDggMjYgNDIgNTYgODF6bTAgMzN2MzljMCAyNzYgODEzIDI3NiA4MTQgMHYtMzlsLTEzNCAxMi01IDY5cS0yIDEwLTE0IDEzbC0xNjIgMTFxLTEyIDAtMTYtMTFsLTEwLTY1SDQ0NmwtMTAgNjVxLTQgMTEtMTYgMTFsLTE2Mi0xMXEtMTItMy0xNC0xM2wtNS02OXoiLz48cGF0aCBkPSJNNDgzIDYwMGMwIDM0IDU4IDM0IDU4IDB2LTg2YzAtMzQtNTgtMzQtNTggMHoiLz48Y2lyY2xlIGN4PSI3MjUiIGN5PSI1MjYiIHI9IjkwIi8+PGNpcmNsZSBjeD0iMjk5IiBjeT0iNTI2IiByPSI5MCIvPjwvZz48ZyBmaWxsPSIjNDE0MDQyIj48Y2lyY2xlIGN4PSIzMDciIGN5PSI1MzIiIHI9IjYwIi8+PGNpcmNsZSBjeD0iNzE3IiBjeT0iNTMyIiByPSI2MCIvPjwvZz48L3N2Zz4K",
      },
      description: "Godot Release provider",
      isOfficial: true,
      packageName: "@pipelab/plugin-godot",
    },
    {
      id: "@pipelab/pipelab-cloud",
      name: "Pipelab Cloud",
      icon: {
        type: "image",
        image:
          "data:image/webp;base64,UklGRrAFAABXRUJQVlA4WAoAAAAQAAAAXwAAXwAAQUxQSPQAAAABgFtbWxzni4hMOKs60PRAGxSA+8BlmE44synFKoIOiPCRo9+z71/q44iYAFyrjY+5yu6l5TvHD6Nx15Fblh3Jsnof3aZskh1R+bLqhiYMO7I/obmq7XaEu8UVbb+j3C8uNN2OdNecUWFHO6gTO/AaLIBR2hFPI8AJM3HQyx31pTaFWzF+R95HdjGzy5VdFXay+/f/35/CTiq7mtnlyC56dt4UbsXoJbelhhNm4oBRYpZGAOzAa7AAoAKvoE4w37LqGpxve059i8vtllG3wLXzz4HNEBpcr2wSJpKsws0jtyy/JMrSjXDXN+NjrvJaUnP0RuNaVlA4IJYEAABQGgCdASpgAGAAPjEUiEKiISEaOWU4IAMEsx2+RndQsfR/mfwa4cLuTk9/Pf9M+2ntq+KH/WurH5gP07/pvWw9AD+o/yjrQPQA/Xf0tP2H+Ef9qv259mb//5pf2b/4au//vvCDogOD4uZx5/8D1Bs7Pz36LvV2/bf2K1ZPF9/jVRUfwj3d197PoJdRJnazre1CJVfSqVH4+CqbMsp7MqkCh4MbmdebOLBO1Y8ylnxWOaebk1qF/s/vatFgo5F2VRB30rXDs6ewai/YjCQcvVSr07ukj01dwcENXQAA/v74aFhX0fabfmW3+gc99sX8Fjufdj9o2KM+fMnsQg8D6P/zkWeFlo1JtPWznpEr9AR5sIi23/Ir+P+oe40YWnKYP25lJj3UDfyXJ97nan8tbIHCXqF7PVq5sLao/XxCL7bNk+/u2lWnkykZdm+rE7A3S1JVZm2I34sb6S7y3jZ9PsbHwg09iAq93M13c/a0y11DVVdG7Fw/UhuXy8LMP2LIoUX8sBUeOP9iG/L/xi+UBV1+YL3ObJy0gvW/+8lD/y8VC/oZQw819H//NF8NHXhnfts4uqLGk63+QmCBmNe8M5Fla98yZFjfAg7XkEDL9G/Bq4LmdVib0V/8IAsgwPjdYhzP6l5f1BGh671BzvYV0B0BilGPNP+L7WUS1j7rBuRgCdlIQyt/F7uCmDrFY6ycVRMj2UXxXNZgUhdZoyrDbMEHj9mnYI5fLX8OqliKVIXJf9hg1zGBg25mQfNPsvS9rz91v4A60gt4mKXToRrBRTFLFZSZHA9glgFY359NHbUsnsIVm8rewh+LlyCpo+JRI+3Qt2nSc2dKxBGuBwd8X/v8u80U2UCyw5kZQW1qN3LKxgrWDY6xZojYXvXPn3L6aEnK2DEY8BvkSkj2L5fGjixxaUn+TNWvxUU9jJie9DdM8ABlwXeS9Nl+pJAqq1p2Jp6k5YOFgP+TM6aiTeUsieYIJBiKRadNZ8N9f5OoMfrmM7SbpQi+5z/9wcJX5dpoQaUO0VX1Bn3qdzchIzNdktKf+piGJcT1TsgzXUitb0GXwCkq/+bNuSZec9+gm1+c2X8cvWFmBttqvOXkTERENV9Xa3JiTOrmRXStt+8IZP/1+SNGUjd5TD+1/lMRPpNhgEF0APKJKKpqLc4mvdxZCQRhXo84O4oy65Vl5XaFJLNP1V+m2npxG2tWxw//4+svaJPFwfnQI8d4MShZCAYNXXEDcDU9KPT+0Oq/u5QG5xfuIpri2UK0ogYOOX33RHJLJsMxy1TmpwdN367cHgEePP+9cz1TYr8fkRDNhsvShFY+q1J2IqrLCiCyTzbgF1u4WqOWQMOaJWbDeVIJYf4XPUHsPDK2v/8XmtYdO+/5bmWIt07U4JogSfiK6Tz0gPwHl+gJXXeueO5rc5mzubsEUWaK6RELCDZ7iSmA0GHouyNBnnlT/4X5suvswTrEUZcmbIo6d4oHbhE6wqbdsqolOy4GdtrA44nY5Vnu3p0rVVSW4SyuHr9ztGzVnPOBG04rH4XeKHf95Kw778IJGlvzwgXzyQKAAAAA",
      },
      description: "Store and share selected Pipelab build artifacts.",
      isOfficial: true,
      packageName: "@pipelab/providers",
    },
    {
      id: "@pipelab/plugin-notifications",
      name: "Notifications",
      icon: {
        type: "icon",
        icon: "mdi-bell-outline",
      },
      description: "Announce finished runs to Discord, Slack, email or any webhook.",
      isOfficial: true,
      packageName: "@pipelab/plugin-notifications",
      integrations: [
        {
          name: "Notification webhook",
          testable: true,
          fields: [
            {
              key: "url",
              label: "Webhook URL",
              type: "password",
              placeholder: "https://discord.com/api/webhooks/…",
            },
          ],
        },
      ],
    },
  ],
} satisfies BrowserProviderSpecs;

export default browserProviderSpecs;
