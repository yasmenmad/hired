/**
 * APPLICATION LAYER — Notification Port
 * Abstract interface. Presentation layer provides concrete implementation.
 */
export class INotificationPort {
  notify(message) { throw new Error('Not implemented'); }
  notifySuccess(message) { throw new Error('Not implemented'); }
  notifyError(message)   { throw new Error('Not implemented'); }
}
