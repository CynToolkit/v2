---
"@pipelab/providers": patch
---

Construct exports now launch Chromium with a software WebGL fallback (SwiftShader), so exports no longer fail with "Failed to initialize WebGL" on machines without a usable GPU, such as macOS CI runners and VMs.
