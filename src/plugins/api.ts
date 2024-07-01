import axios from 'axios';
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import router from '@/router';
import app from '@/app';
import type { CustomAxiosRequestConfig } from '@/types/common.type';

let baseURL = '/api/v1';

if (import.meta.env.VITE_API_ENDPOINT) {
  baseURL = import.meta.env.VITE_API_ENDPOINT as string;
}

const $api = axios.create({ baseURL, withCredentials: true });
const { addToast, getErrorMessage } = useApiErrorHandler();
const { updateUserToken } = useCurrentUserData();

// Add a request interceptor
$api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = useAccessToken();
    const newConfig = config;
    const token = accessToken.value;
    if (newConfig.headers) {
      newConfig.headers.Authorization = `Bearer ${token}`;
    }
    return newConfig;
  },
  (error: AxiosError) => {
    Promise.reject(error);
  }
);

// Response error handler
function handleError(err: AxiosError, catchErrors = true) {
  if (err.response) {
    if (err.response?.status === 400) {
      app.config.globalProperties.$toast.add(addToast({ error: err }));
    }
    else if (err.response?.status === 401 || err.response?.status === 409) {
      app.config.globalProperties.$toast.add(addToast({ error: err }));
      if (err.response?.status === 401) {
        updateUserToken(null);
        router.replace({ name: 'auth-signin' });
      }
    }
    else {
      if (catchErrors) {
        app.config.globalProperties.$toast.add(addToast({ error: err }));
      }
      if (!catchErrors) {
        throw {
          error: err,
          message: getErrorMessage(err.response)
        };
      }
    }
    throw err;
  }
  else {
    app.config.globalProperties.$toast.add(
      addToast({
        error: err,
        detail:
          'Unable to connect to server. Please check your internet connectivity'
      })
    );
  }
}

// Add response interceptor
$api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) =>
    handleError(
      err,
      (err.response?.config as CustomAxiosRequestConfig).catchErrors
    )
);

export default $api;
