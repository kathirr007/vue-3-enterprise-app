<script setup lang="ts">
import type { MFAProvider } from '@/types/myaccount.type';

const props = withDefaults(
  defineProps<{
    otpDigits: number;
    qrcodeUrl?: string;
    provider?: MFAProvider;
    emailOtpMessage?: string;
    submittingOtp?: boolean;
    resendingOtp?: boolean;
    isOtpInvalid?: boolean;
    showBackBtn?: boolean;
    resetOtpTimer?: boolean;
    isVerify?: boolean;
    backBtnLabel?: 'Back' | 'Resend OTP';
  }>(),
  {
    showBackBtn: true,
    backBtnLabel: 'Back'
  }
);

const emit = defineEmits<{
  (e: 'submitTOTP', enteredOTP: string): void;
  (e: 'back'): void;
  (e: 'resendOtp'): void;
  (e: 'hideCloseIcon', data: boolean): void;
}>();

const enteredOTP = ref();
const countDownRef = ref();
const enableResendOtp = ref(false);
const resetOtp = ref(false);

const countDownProps = reactive({
  stopConditions: { 1: 0 },
  circles: [
    {
      id: '1',
      steps: 60,
      size: 30,
      value: 60,
      stepLength: -1,
      strokeWidth: 3,
      valueFontSize: 14
    }
  ]
});

const isOtpEntered = computed(
  () => enteredOTP.value?.length === props.otpDigits
);

function handleBack(action: 'back' | 'resendOtp') {
  if (action === 'resendOtp') {
    resetOtp.value = true;
    enableResendOtp.value = false;
    emit('resendOtp');
    useTimeoutFn(() => (resetOtp.value = false), 400);
    return;
  }
  emit('back');
}
function handleResendOtp(val: boolean) {
  enableResendOtp.value = val;
  emit('hideCloseIcon', val);
}

onMounted(() => {
  enableResendOtp.value = false;
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div v-bind="$attrs">
    <template v-if="provider === 'TOTP' && qrcodeUrl">
      <p class="text-center my-2">
        Please scan the QR Code and enter 6 digit number below to activate
        multi-step authentication.
      </p>
      <div class="flex justify-content-center align-items-center">
        <img :src="qrcodeUrl" alt="">
      </div>
    </template>
    <div v-else>
      <div v-if="isVerify" class="font-medium text-lg">
        <template v-if="provider === 'EMAIL'">
          Your account has multi factor authentication enabled with your
          registered email.
          {{ emailOtpMessage }}
          Please enter the OTP for secured login.
        </template>
        <template v-else>
          Your account has multi factor authentication enabled with Multi-factor
          authentication app, please enter the OTP associated with your account
          for secured login.
        </template>
      </div>
      <div v-else>
        {{ emailOtpMessage }} Enter the OTP below to activate MFA. Once
        activate, you will require to provide an OTP every time you login to
        your account
      </div>
    </div>
    <div class="text-center">
      <p class="my-2 text-center text-lg">
        Enter OTP
      </p>
      <form @submit.stop>
        <div class="otp-container my-2 flex justify-content-center">
          <CommonOTPInput
            v-model="enteredOTP"
            :fields="otpDigits"
            :reset-otp="resetOtp"
          />
        </div>
        <p v-if="isOtpInvalid" class="p-error mb-0">
          Please enter valid OTP
        </p>
        <div
          class="flex mt-3"
          :class="
            showBackBtn ? 'justify-content-between' : 'justify-content-center'
          "
        >
          <template v-if="showBackBtn">
            <div v-if="backBtnLabel === 'Back'" class="flex">
              <Button
                :label="backBtnLabel"
                severity="danger"
                :disabled="!enableResendOtp"
                @click.prevent="handleBack('back')"
              />
              <span
                v-if="!enableResendOtp"
                class="inline-flex align-items-center ml-1"
              >
                in
                <CommonCircularCountDownTimer
                  ref="countDownRef"
                  :main-circle-id="1"
                  :circles="countDownProps.circles"
                  :stop-conditions="countDownProps.stopConditions"
                  @finished="handleResendOtp(true)"
                  @started="handleResendOtp(false)"
                />
                Secs
              </span>
            </div>
            <span
              v-if="backBtnLabel === 'Resend OTP' && provider === 'EMAIL'"
              class="inline-flex align-items-center"
            >
              <span
                :tabindex="enableResendOtp ? 0 : -1"
                :class="
                  enableResendOtp
                    ? 'font-medium cursor-pointer text-primary underline'
                    : 'pointer-event-none'
                "
                @click="handleBack('resendOtp')"
                @keyup.enter="handleBack('resendOtp')"
              >
                {{ backBtnLabel }}
              </span>
              <template v-if="!enableResendOtp">
                <i
                  v-if="resendingOtp"
                  class="pi pi-spin pi-spinner mx-1"
                  style="font-size: 1.5rem;"
                />
                <template v-else>
                  &nbsp;in
                  <CommonCircularCountDownTimer
                    ref="countDownRef"
                    :main-circle-id="1"
                    :circles="countDownProps.circles"
                    :stop-conditions="countDownProps.stopConditions"
                    @finished="enableResendOtp = true"
                    @started="enableResendOtp = false"
                  />
                  Secs
                </template>
              </template>
            </span>
          </template>
          <Button
            label="Submit OTP"
            :disabled="!isOtpEntered"
            :loading="submittingOtp"
            type="submit"
            @click.prevent="emit('submitTOTP', enteredOTP)"
          />
        </div>
      </form>
    </div>
  </div>
</template>
