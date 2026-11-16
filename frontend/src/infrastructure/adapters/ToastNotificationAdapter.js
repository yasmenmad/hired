/**
 * INFRASTRUCTURE LAYER — Toast Notification Adapter
 * Implements INotificationPort using a React state setter.
 * The domain/application layers never touch React.
 */
import { INotificationPort } from '../../application/ports/INotificationPort';

export class ToastNotificationAdapter extends INotificationPort {
  constructor(showToastFn) {
    super();
    this._show = showToastFn;
  }

  notify(message)        { this._show(message); }
  notifySuccess(message) { this._show(message); }
  notifyError(message)   { this._show(`Error: ${message}`); }
}
