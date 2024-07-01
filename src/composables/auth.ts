import $api from '@/plugins/api';
import type {
  ClientUserClient,
  ClientUserSignInPayload,
  ForgotPasswordPayload,
  GoogleSignInResponse,
  PreLoginPayload,
  PreLoginResponse,
  ResetPasswordPayload,
  SignInPayload,
  SignInResponse,
  SignUpPayload,
  SignUpResponse
} from '@/types/auth.type';
import { useCookies } from '@vueuse/integrations/useCookies';

const cookies = useCookies(['isloggedin', 'user']);

export const useAccessToken = createGlobalState(() => {
  return useLocalStorage<string>('accessToken', null);
});

export async function useAuthPreLogin(payload: PreLoginPayload) {
  const { data } = await $api.post<PreLoginResponse>('auth/prelogin', payload);
  return data;
}

export async function useAuthForgotPassword(payload: ForgotPasswordPayload) {
  const { data } = await $api.post<void>('auth/forgotpassword', payload);
  return data;
}

export async function useAuthResetPassword(payload: ResetPasswordPayload) {
  const { data } = await $api.post<SignInResponse>(
    'auth/resetpassword',
    payload
  );
  return data;
}

export async function useAuthSignUp(payload: SignUpPayload) {
  const { data } = await $api.post<SignUpResponse>('auth/signup', payload);
  return data;
}

export async function useAuthSignIn(payload: SignInPayload) {
  const { data } = await $api.post<SignInResponse>('auth/signin', payload);
  return data;
}

export function useAuthSignOut() {
  return $api.post('auth/logout');
}

export async function useAuthGoogleSignIn() {
  const { data } = await $api.get<GoogleSignInResponse>('auth/google');
  return data;
}

/* export function useCurrentUser() {
  const user = ref<AuthUser>();
  const cookieData = cookies.get('user');
  if (cookieData) {
    user.value = cookieData;
  }
  return user;
} */

export function usePasswordValidator() {
  const strongRegEx = `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\\W_])(?=.{8,})`;

  function checkPasswordRule(
    rule: 'lower' | 'upper' | 'number' | 'symbol',
    value?: string
  ) {
    if (!value) {
      return false;
    }
    switch (rule) {
      case 'lower':
        return /((?=.*[a-z]))(?=.{1,})./.test(value);
      case 'upper':
        return /((?=.*[A-Z]))(?=.{1,})./.test(value);
      case 'number':
        return /((?=.*[0-9]))(?=.{1,})./.test(value);
      case 'symbol':
        return /^(?=.*[\W_]).*$/.test(value);
      default:
        return false;
    }
  }

  return {
    strongRegEx,
    checkPasswordRule
  };
}

export function useSwitchAccount() {
  const getAllClients = async (id: string) => {
    const { data } = await $api.get<
      { client: ClientUserClient; isActive: boolean }[]
    >(`portal/auth/${id}`);
    return data.map((item) => {
      return { ...item.client, isActive: item.isActive };
    });
  };

  const signin = async (payload: ClientUserSignInPayload) => {
    const { data } = await $api.post<SignInResponse>(
      'portal/auth/signin',
      payload
    );
    return data;
  };
  return {
    getAllClients,
    signin
  };
}
