/**
 * Toast notification system
 */

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

class ToastManager {
  private container: HTMLElement;

  constructor() {
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    let container = document.querySelector('.toast-container') as HTMLElement;
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '[OK]';
      case 'error':
        return '[ERROR]';
      case 'info':
        return '[INFO]';
    }
  }

  show(options: ToastOptions): void {
    const { type, title, message, duration = 3000 } = options;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = this.getIcon(type);
    const messageHtml = message ? `<div class="toast-message">${message}</div>` : '';

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${icon} ${title}</div>
        ${messageHtml}
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, duration);
  }

  success(title: string, message?: string): void {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'error', title, message });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'info', title, message });
  }
}

export const toast = new ToastManager();

