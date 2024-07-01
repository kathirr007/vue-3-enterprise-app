import type { AxiosResponse } from 'axios';

export interface ToastOptions {
  error: any;
  life?: number;
  severity?: string;
  closable?: boolean;
  detail?: string;
  summary?: string;
}

export function useApiErrorHandler() {
  const getErrorMessage = (response: AxiosResponse) => {
    let message = 'Something went wrong';
    if (Array.isArray(response.data?.message)) {
      message = response.data.message[0];
    }
    else {
      message = response.data.message;
    }
    return message;
  };

  const addToast = ({
    error,
    life,
    severity,
    closable,
    detail,
    summary
  }: ToastOptions) => {
    let toastOptions = {};
    toastOptions = {
      severity: severity || 'error',
      summary: summary || `Error: ${error.response?.statusText}`,
      detail: detail || getErrorMessage(error.response),
      life: life || 5000,
      closable: closable || false
    };
    return toastOptions;
  };

  return {
    getErrorMessage,
    addToast
  };
}
