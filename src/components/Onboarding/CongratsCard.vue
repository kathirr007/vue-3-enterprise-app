<script setup lang="ts">
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  orgData?: Org;
}>();

const { initToast } = useToasts();
const queryClient = useQueryClient();

const scheduleDemoCall = ref(false);

const { mutateAsync: createUpdateOrg, isLoading: updatingOrg } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Onboarding Complete',
        detail: 'Thank you for completing the onboarding process.'
      });
      queryClient.invalidateQueries('pending-org-integrations');
      queryClient.invalidateQueries('org-data');
      if (scheduleDemoCall.value) {
        window.open('https://rebrand.ly/br-onboarding-consultation', '_blank');
      }
    }
  }
);

async function handleCTAClick(scheduleCall = false) {
  scheduleDemoCall.value = scheduleCall;
  const { logo, regCertificate, ...payload } = props.orgData as Org;
  delete payload?.logo;
  await createUpdateOrg({
    ...payload,
    logo: logo ? logo.id : '',
    regCertificate: regCertificate ? regCertificate.id : '',
    onboardingCTAClicked: 'true'
  } as Partial<OrgCreatePayload>);
}
</script>

<template>
  <div class="pb-4">
    <div
      class="flex justify-content-between align-items-center relative overflow-hidden"
      style=" background: #38b6ff;border-radius: 1rem;"
    >
      <div class="px-5 pt-2">
        <div class="font-bold text-medium text-3xl md:text-5xl mt-3 mb-3">
          Onboarding Complete! Great
          <span
            class="white-space-nowrap inline-flex align-items-center ml-1 gap-1"
          >
            Job!
            <Icon
              icon="fluent-emoji-flat:glowing-star"
              class="flex-none text-5xl mt-1"
            />
          </span>
        </div>

        <div class="font-semibold md:font-bold text-lg md:text-2xl w-full">
          Elevate your practice with BrightReturn! Schedule a support call for a
          seamless setup.
        </div>

        <div class="py-6 flex">
          <Button
            label="Not Now"
            :loading="updatingOrg && !scheduleDemoCall"
            class="mr-3"
            @click="handleCTAClick()"
          />

          <Button
            label="Schedule Call"
            :loading="updatingOrg && scheduleDemoCall"
            @click="handleCTAClick(true)"
          />
        </div>
      </div>

      <img
        src="/images/cta-trophy_400x400.png"
        alt="Image"
        class="hidden md:block mr-4 mx-2"
        style="height: 230px;"
      >
    </div>
  </div>
</template>
