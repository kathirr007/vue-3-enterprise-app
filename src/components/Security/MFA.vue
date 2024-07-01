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
  isOtpInvalid,
} = useMFA();

const isDisable = ref<boolean>(false);

const hanldeToggleMFA = (val: Event) => {
  if (!isMFAEnabled.value) {
    disableMFADialog.value = false;
    enableMFADialog.value = true;
  } else {
    enableMFADialog.value = false;
    disableMFADialog.value = true;
  }
};

const handleDisableMFA = async () => {
  await handleActivateMFA({
    payload: {},
    actionType: 'Disable',
  });
};

const handleConfirmCancel = () => {
  isMFAEnabled.value = true;
  disableMFADialog.value = false;
};

const handleMFADialogClose = () => {
  enableMFADialog.value = false;
  showOtpForm.value = false;
};

const handleOtp = (otp: string) => {
  submitTOTP(otp, props.userDetails.email);
};

const handleDisableCloseIcon = (val: boolean) => {
  isDisable.value = val;
};

watchEffect(() => {
  if (props.userDetails) {
    isMFAEnabled.value = !!props.userDetails.isMfaEnabled;
  }
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
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
      class="inline-flex"
      v-tooltip="
        `${
          isMFAEnabled && userDetails.org?.isMfaEnabled
            ? `MFA can't be disabled as it's mandatory for all users.`
            : ''
        }`
      "
    >
      <span
        class="inline-flex cursor-pointer"
        :class="{
          'pointer-events-none': isMFAEnabled && userDetails.org?.isMfaEnabled,
        }"
        @click.prevent="hanldeToggleMFA"
      >
        <InputSwitch
          inputId="toggleMFA"
          v-model="isMFAEnabled"
          class="pointer-events-none"
          :disabled="isMFAEnabled && userDetails.org?.isMfaEnabled"
        />
      </span>
    </span>
  </div>
  <Dialog
    modal
    appendTo="body"
    :header="'Enable Multi Factor Authentication'"
    v-model:visible="enableMFADialog"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw', maxWidth: '650px' }"
    :contentClass="'border-round-bottom-md'"
    :closeOnEscape="false"
    @hide="handleMFADialogClose"
  >
    <SecurityMFASelect
      v-if="!isMFAEnabled && !showOtpForm"
      :email="userDetails.email"
      @generateMfaSecret="handleMfaSecret"
    />
    <SecurityMFAOtp
      v-else
      :otpDigits="6"
      :qrcodeUrl="qrcodeUrl"
      :provider="mfaProvider"
      :emailOtpMessage="emailOtpMessage"
      :submittingOtp="submittingOtp"
      :isOtpInvalid="isOtpInvalid"
      @submitTOTP="handleOtp"
      @back="handleBack"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="disableMFADialog"
    :visible="disableMFADialog"
    title="Disable Multi-factor Authentication"
    @confirm="handleDisableMFA"
    @cancel="handleConfirmCancel"
    @hide="disableMFADialog = false"
    :closeOnEscape="false"
  >
    <div>Are you sure you want to disable MFA feature?</div>
  </CommonConfirmRemoveDialog>
</template>
