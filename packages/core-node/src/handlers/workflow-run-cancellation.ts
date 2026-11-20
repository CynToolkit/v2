export class WorkflowRunCancellationRegistry {
  private readonly controllers = new Map<string, AbortController>();

  register(runId: string, controller: AbortController) {
    this.controllers.set(runId, controller);
  }

  cancel(runId: string) {
    const controller = this.controllers.get(runId);
    if (!controller) return false;
    controller.abort("Interrupted by user");
    return true;
  }

  cancelAll() {
    for (const controller of this.controllers.values()) controller.abort("Interrupted by shutdown");
    this.controllers.clear();
  }

  remove(runId: string, controller: AbortController) {
    if (this.controllers.get(runId) === controller) this.controllers.delete(runId);
  }
}
