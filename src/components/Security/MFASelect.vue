<script setup lang="ts">
import type {
  CreateMfaDto,
  MFAProvider,
  MFASecret,
} from '@/types/myaccount.type';
import { useMutation } from 'vue-query';

const props = defineProps<{
  email: string;
}>();

const emit = defineEmits<{
  (e: 'generateMfaSecret', val: MFASecret & { mfaProvider: MFAProvider }): void;
}>();

const isMFAEnabled = ref(false);
const mfaProvider = ref<MFAProvider>();

const { generateMFASecret } = useMFA();

const { mutateAsync: handleMFASecret, isLoading } = useMutation(
  (payload: CreateMfaDto) => {
    return generateMFASecret(payload);
  },
  {
    onSuccess: (data) => {
      if (data) {
        emit('generateMfaSecret', {
          ...data,
          mfaProvider: mfaProvider.value as MFAProvider,
        });
      }
    },
  }
);

const initMFAProcess = async (provider: MFAProvider) => {
  mfaProvider.value = provider;
  const payload = {
    email: props.email,
    provider,
  };
  if (!isMFAEnabled.value) {
    await handleMFASecret(payload);
  }
};
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <h3 class="text-lg text-center">
    Select where you'd like to receive login OTP
  </h3>
  <div class="flex flex-row gap-3 justify-content-center">
    <CommonLoading v-if="isLoading" />
    <template v-else>
      <div class="text-center w-4">
        <Button
          type="button"
          icon="pi"
          class="p-button w-full h-full flex-column"
          text
          aria-label="mfa-email"
          @click.prevent="initMFAProcess('EMAIL')"
        >
          <!-- <i class="pi pi-spin pi-spinner text-4xl" v-if="isLoading"></i> -->
          <Icon
            class="flex-none text-7xl md:text-8xl"
            icon="fa6-solid:envelope"
          />
          <p class="text-lg font-medium">Email</p>
        </Button>
      </div>
      <div class="text-center w-4">
        <Button
          type="button"
          icon="pi"
          class="p-button w-full h-full flex-column"
          text
          aria-label="mfa-email"
          @click.prevent="initMFAProcess('TOTP')"
        >
          <!-- <i class="pi pi-spin pi-spinner text-4xl" v-if="isLoading"></i> -->
          <Icon class="flex-none text-7xl md:text-8xl" icon="fa6-solid:key" />
          <p class="text-lg font-medium">MFA</p>
        </Button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped></style>
