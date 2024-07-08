<script setup lang="ts">
import type { User } from '@/types/teams.type';

const props = withDefaults(
  defineProps<{
    userDetails: User;
  }>(),
  {}
);

const { defaultBreakpoints } = useCommonBreakPoints();
const {
  handleMfaSecret,
  handleActivateMFA,
  handleBack,
  submitTOTP,
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

const isDisable = ref<boolean>(false);

function hanldeToggleMFA(val: Event) {
  if (!isMFAEnabled.value) {
    disableMFADialog.value = false;
    enableMFADialog.value = true;
  }
  else {
    enableMFADialog.value = false;
    disableMFADialog.value = true;
  }
}

async function handleDisableMFA() {
  await handleActivateMFA({
    payload: {},
    actionType: 'Disable'
  });
}

function handleConfirmCancel() {
  isMFAEnabled.value = true;
  disableMFADialog.value = false;
}

function handleMFADialogClose() {
  enableMFADialog.value = false;
  showOtpForm.value = false;
}

function handleOtp(otp: string) {
  submitTOTP(otp, props.userDetails.email);
}

function handleDisableCloseIcon(val: boolean) {
  isDisable.value = val;
}

watchEffect(() => {
  if (props.userDetails) {
    isMFAEnabled.value = !!props.userDetails.isMfaEnabled;
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="field flex align-items-center">
    <label
      for="toggleMFA"
      class="cursor-pointer mb-0 mr-3 font-medium text-900 text-base"
      @click.prevent="hanldeToggleMFA"
    >
      {{
        `${
          isMFAEnabled
            ? 'Multi Factor Authentication is enabled for your account'
            : 'Enable Multi Factor Authentication'
        }`
      }}
    </label>
    <span
      v-tooltip="
        `${
          isMFAEnabled && userDetails.org?.isMfaEnabled
            ? `MFA can't be disabled as it's mandatory for all users.`
            : ''
        }`
      "
      class="inline-flex"
    >
      <span
        class="inline-flex cursor-pointer"
        :class="{
          'pointer-events-none': isMFAEnabled && userDetails.org?.isMfaEnabled,
        }"
        @click.prevent="hanldeToggleMFA"
      >
        <InputSwitch
          v-model="isMFAEnabled"
          input-id="toggleMFA"
          class="pointer-events-none"
          :disabled="isMFAEnabled && userDetails.org?.isMfaEnabled"
        />
      </span>
    </span>
  </div>
  <Dialog
    v-model:visible="enableMFADialog"
    modal
    append-to="body"
    header="Enable Multi Factor Authentication"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw', maxWidth: '650px' }"
    content-class="border-round-bottom-md"
    :close-on-escape="false"
    @hide="handleMFADialogClose"
  >
    <SecurityMFASelect
      v-if="!isMFAEnabled && !showOtpForm"
      :email="userDetails.email"
      @generate-mfa-secret="handleMfaSecret"
    />
    <SecurityMFAOtp
      v-else
      :otp-digits="6"
      :qrcode-url="qrcodeUrl"
      :provider="mfaProvider"
      :email-otp-message="emailOtpMessage"
      :submitting-otp="submittingOtp"
      :is-otp-invalid="isOtpInvalid"
      @submit-t-o-t-p="handleOtp"
      @back="handleBack"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="disableMFADialog"
    :visible="disableMFADialog"
    title="Disable Multi-factor Authentication"
    :close-on-escape="false"
    @confirm="handleDisableMFA"
    @cancel="handleConfirmCancel"
    @hide="disableMFADialog = false"
  >
    <div>Are you sure you want to disable MFA feature?</div>
  </CommonConfirmRemoveDialog>
</template>
