import app from '@/app';
import type { APIActions } from '@/types/common.type';

// import type { ToastSeverityOptions } from 'primevue/api';
// import { useToast } from 'primevue/usetoast';

export type ToastSeverityOptions = 'success' | 'info' | 'warning' | 'error';
export interface ShowToastOptions {
  detail: string;
  summary: string;
  severity?: ToastSeverityOptions;
  closable?: boolean;
  life?: number;
}

export interface ToastOptions extends ShowToastOptions {
  life?: number;
  group?: string;
}

export interface InitToastOptions {
  actionType: APIActions;
  severity?: ToastSeverityOptions;
  title?: string;
  summary?: string;
  actionObj?: Record<string, any>;
  detail?: string;
  life?: number;
}

export function useToasts() {
  const toastOptions = ({
    life = 5000,
    severity,
    closable = true,
    detail,
    summary,
    group = 'custom-tc'
  }: ToastOptions) => {
    let toastOptions = {};
    toastOptions = {
      severity,
      summary,
      detail,
      life,
      closable,
      group
    };
    return toastOptions;
  };

  const showToast = ({
    summary,
    detail,
    severity,
    closable,
    life
  }: ShowToastOptions) => {
    return app.config.globalProperties.$toast.add(
      toastOptions({
        severity,
        summary,
        detail,
        closable,
        life
      })
    );
  };

  function initToast({
    title,
    actionType,
    actionObj,
    detail,
    summary,
    severity,
    life
  }: InitToastOptions) {
    const dangerSeverities = [
      'Remove',
      'Delete',
      'Disable',
      'Deactivate',
      'Archive',
      'Error',
      'Cancel',
      'Reject'
    ];
    showToast({
      severity: severity || (dangerSeverities.includes(actionType)
        ? 'error'
        : 'success'),
      summary: summary || `${actionType} ${title}`,
      detail:
        detail
        || `${title} ${
          actionObj?.name
            ? `<strong>${actionObj.name}</strong>`
            : actionObj?.title
            ? `<strong>${actionObj.title}</strong>`
            : ''
        } ${actionType.toLowerCase()}${
          actionType.toLowerCase().charAt(actionType.length - 1) === 'e'
            ? 'd'
            : 'ed'
        } successfully`
    });
  }

  return {
    toastOptions,
    showToast,
    initToast
  };
}
