<script setup lang="ts">
import type {
  PreLoginResponse,
  SignInPayload,
  SignInResponse
} from '@/types/auth.type';
import type { FullNameObj } from '@/types/teams.type';
import { useMutation, useQuery } from 'vue-query';
import { useCookies } from '@vueuse/integrations/useCookies';
import { Capacitor } from '@capacitor/core';

const loginStep = ref<'prelogin' | 'password-login' | 'thirdparty-login'>(
  'prelogin'
);
const isMobileapp = Capacitor.isNativePlatform();
const canGetPermissions = ref(false);
const router = useRouter();
const { getCurrentUser } = useMe();
const { fullName } = useVueFilters();
const { initToast } = useToasts();
const { resendVerificationLink } = useAuthVerify();
const { appData } = useAppData();
const { currentUser, updateUserToken, isPortalUser } = useCurrentUserData();
const { getPermissions } = usePermissions(canGetPermissions.value);
const {
  handleMfaSecret,
  handleActivateMFA,
  handleBack,
  submitTOTP,
  mfaSignIn,
  submittingOtp,
  emailOtpMessage,
  qrcodeUrl,
  showOtpForm,
  mfaProvider,
  isMFAEnabled,
  enableMFADialog,
  disableMFADialog,
  isOtpInvalid
} = useMFA();

const email = ref<string>('');
const password = ref();
const isVerified = ref(true);
const isPasswordLoginRequired = ref(true);
const loadingLoggedInUserData = ref(false);
const resetOtpTimer = ref(false);
const isPasswordChangeRequired = ref();
const isMFARegisterRequired = ref();
const isMFASignInRequired = ref();
const mfaProviderCookie = ref();
const signInOtpMessage = ref();
const cookies = useCookies([
  'isPasswordChangeRequired',
  'isMFARegisterRequired',
  'isMFASignInRequired',
  'user',
  'userType'
]);
useQuery(
  ['user-permissions'],
  () => {
    if (isPortalUser.value)
      return;
    return getPermissions();
  },
  {
    onSuccess: (data: any) => {
      userPerms.value = btoa(JSON.stringify(data));
      showToastAndGoHome();
    },
    enabled: canGetPermissions
  }
);

const { mutateAsync: resendVerification } = useMutation(
  (payload: { email: string }) => resendVerificationLink(payload)
);

const { isLoading: resendingOtp, mutateAsync: signIn } = useMutation(
  (payload: SignInPayload) => {
    return useAuthSignIn(payload);
  },
  {
    onSuccess() {
      resetOtpTimer.value = true;
      initToast({
        summary: 'Resend OTP',
        actionType: 'Create',
        detail: `OTP sent successfully to the registered email address.`
      });
    }
  }
);

const { mutateAsync: callMfaSignIn, isLoading: signingIn } = useMutation(
  (payload: SignInPayload & { totp: string }) => mfaSignIn(payload),
  {
    onSuccess: () => {
      showToastAndGoHome();
    },
    onError: () => {
      isOtpInvalid.value = true;
    }
  }
);

function handlePreLogin(data: PreLoginResponse) {
  email.value = data.email;
  isVerified.value = data.isVerified;
  if (data.action === 'signin') {
    if (!data.isVerified) {
      resendVerification({ email: data.email });
    }
    if (data.loginType === 'password') {
      loginStep.value = 'password-login';
    }
    else if (data.loginType === 'thirdparty') {
      loginStep.value = 'thirdparty-login';
    }
  }
  else {
    router.replace({ name: 'auth-signup', query: { email: email.value } });
  }
}

function goToHome(delay: number = 800) {
  return useTimeoutFn(() => {
    loadingLoggedInUserData.value = false;
    router.go(0);
  }, delay);
}

function showToast() {
  initToast({
    title: 'User',
    actionType: 'Sign in',
    detail: `Welcome back ${currentUser.value ? '' : 'to'} <strong>${
      fullName(currentUser.value as FullNameObj) || 'Bright Return'
    }</strong>`
  });
}

async function showToastAndGoHome(data?: {
  res: SignInResponse | string;
  payload?: { email: string; password: string };
}) {
  if (!(data?.res as SignInResponse)?.permissions) {
    signInOtpMessage.value = data?.res;
  }
  password.value = data?.payload?.password;
  // updateUserToken(cookies.get('user'));
  userType.value = (cookies.get('userType'));

  isPasswordChangeRequired.value = await cookies.get(
    'isPasswordChangeRequired'
  );
  isMFARegisterRequired.value = await cookies.get('isMFARegisterRequired');
  isMFASignInRequired.value = await cookies.get('isMFASignInRequired');
  mfaProviderCookie.value = await cookies.get('mfaProvider');

  if (isPasswordChangeRequired.value && data) {
    open(data.res as string, '_self');
    return;
  }
  if (isMFARegisterRequired.value || isMFASignInRequired.value) {
    isPasswordLoginRequired.value = false;
    return;
  }

  loadingLoggedInUserData.value = true;
  // const userData = await getCurrentUser(userType.value === 'CLIENT_USER');
  // updateUserToken(userData);
  await getCurrentUser(userType.value === 'CLIENT_USER')
    .then((data: any) => {
      updateUserToken(data);
      showToast();
      goToHome();
    })
    .catch((err: any) => {
      console.log(err);
      loadingLoggedInUserData.value = false;
      goToHome(2000);
    });
}

async function handleMfaSignin(totp: string) {
  const payload = {
    totp,
    email: email.value,
    password: password.value
  };
  await callMfaSignIn(payload);
}

async function handleResendOtp() {
  const payload = {
    email: email.value,
    password: password.value
  };
  await signIn(payload);
}

async function handleOtp(otp: string) {
  await submitTOTP(otp, email.value);
  isMFARegisterRequired.value = false;
  isPasswordLoginRequired.value = true;
}

function handleLogin() {
  if (!isPortalUser.value) {
    canGetPermissions.value = true;
  }
  else {
    showToastAndGoHome();
  }
}

function gotoPrelogin() {
  isVerified.value = true;
  loginStep.value = 'prelogin';
}
</script>

<template>
  <div class="surface-section w-full md:w-6 p-4 md:p-6 text-center">
    <div class="flex flex-column justify-content-center min-h-full">
      <a
        href="https://www.brightreturn.com/"
        target="_blank"
        title="Bright Return"
      >
        <img
          :src="appData.logoExtended"
          alt="appData.logoAltText"
          height="70"
          class="mb-3"
        >
      </a>
      <transition name="slide-up" mode="out-in">
        <template v-if="isVerified">
          <div
            v-if="loadingLoggedInUserData"
            class="w-full max-w-26rem mx-auto"
          >
            <CommonLoading />
          </div>
          <template v-else>
            <div
              v-if="loginStep === 'prelogin'"
              class="w-full max-w-26rem mx-auto"
            >
              <h1 class="text-xl font-medium text-900 mb-5">
                Sign in or Sign up
              </h1>
              <span v-if="!isMobileapp">
                <div class="flex justify-content-between">
                  <AuthGoogleSignIn />
                </div>
                <Divider align="center" class="my-4">
                  <span class="text-600 font-normal text-sm">OR</span>
                </Divider>
                <p class="mb-3 lg:mb-1 text-center">
                  Continue using your email address
                </p>
              </span>
              <AuthPreSignInForm @success="handlePreLogin" />
            </div>
            <div
              v-else-if="loginStep === 'password-login'"
              class="w-full max-w-26rem mx-auto"
            >
              <div
                v-if="isMFARegisterRequired && !isMFASignInRequired"
                class="card border shadow-3"
              >
                <h2 class="text-lg font-medium text-900 mb-5">
                  As your organization enabled Multi Factor Authentication as
                  mandatory for all users. Please follow the below quick steps to
                  register Multi Factor Authentication.
                </h2>
                <SecurityMFASelect
                  v-if="isMFARegisterRequired && !showOtpForm"
                  :email="`${email}`"
                  @generate-mfa-secret="handleMfaSecret"
                />
                <SecurityMFAOtp
                  v-if="showOtpForm"
                  :otp-digits="6"
                  :qrcode-url="qrcodeUrl"
                  :provider="mfaProvider"
                  :email-otp-message="emailOtpMessage"
                  :submitting-otp="submittingOtp || signingIn"
                  :is-otp-invalid="isOtpInvalid"
                  @submit-t-o-t-p="handleOtp"
                  @back="handleBack"
                />
              </div>
              <template v-else>
                <h1 class="text-xl font-medium text-900 mb-5">
                  Sign in to your account
                </h1>
                <SecurityMFAOtp
                  v-if="isMFASignInRequired"
                  :otp-digits="6"
                  :qrcode-url="qrcodeUrl"
                  :provider="mfaProviderCookie"
                  :email-otp-message="signInOtpMessage"
                  :submitting-otp="submittingOtp || signingIn"
                  :resending-otp="resendingOtp"
                  :reset-otp-timer="resetOtpTimer"
                  :is-otp-invalid="isOtpInvalid"
                  back-btn-label="Resend OTP"
                  :show-back-btn="mfaProviderCookie === 'EMAIL'"
                  is-verify
                  class="card border shadow-3"
                  @submit-t-o-t-p="handleMfaSignin"
                  @back="handleBack"
                  @resend-otp="handleResendOtp"
                />
                <template v-if="isPasswordLoginRequired">
                  <h3 class="text-lg text-left">
                    Hey, it's great to see you again!
                  </h3>
                  <AuthSignInForm
                    v-if="email"
                    :email="email"
                    @success="showToastAndGoHome"
                    @prelogin="loginStep = 'prelogin'"
                  />
                </template>
              </template>
            </div>
            <div v-else class="w-full max-w-26rem mx-auto">
              <h1 class="text-xl font-medium text-900 mb-5">
                Sign in to your account
              </h1>
              <div v-if="isMobileapp" class="text-center">
                <p>
                  Login with Google is not supported on Mobile. Please login from
                  your computer and set a password to your account.
                </p>
              </div>
              <div v-else class="flex justify-content-between">
                <AuthGoogleSignIn />
              </div>
              <div class="font-medium mt-4 text-left">
                <a
                  class="text-base mt-2 cursor-pointer"
                  @click.prevent="loginStep = 'prelogin'"
                >
                  Sign in as different user
                </a>
              </div>
            </div>
          </template>
        </template>
        <template v-else>
          <div class="w-full max-w-26rem mx-auto">
            <h1 class="text-2xl font-medium text-900 mb-5">
              Hey, it's great to see you again!
            </h1>
            <p class="font-medium">
              Oho! your email is not verified yet. <br>
              Please verify your email to login.
            </p>
            <p>
              We've resent verification link on the registered email. Please
              follow that link to login again.
            </p>
            <div class="font-medium mt-4">
              <a
                class="text-base mt-2 cursor-pointer"
                :to="{ name: 'auth-signin' }"
                @click.prevent="gotoPrelogin"
              >
                Sign in as different user
              </a>
            </div>
          </div>
        </template>
      </transition>
      <div v-if="false" class="w-full max-w-26rem mx-auto">
        <a href="#" class="font-medium mt-3 flex align-items-center"><i
                                                                       class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
                                                                     />
          <span>Help</span></a>
      </div>
      <AuthMobileAppDownload />
    </div>
  </div>
  <div
    class="hidden md:block w-6 bg-no-repeat info-graphics"
    :class="loginStep === 'prelogin' ? 'login-signup' : 'welcome-info'"
  />
</template>

<route lang="yaml">
meta:
  layout: auth
  ignoreAuth: true
</route>
