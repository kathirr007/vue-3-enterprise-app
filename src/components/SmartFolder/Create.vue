<script setup lang="ts">
import type { CreateSmartFolder, SmartFolder } from '@/types/smart-folder.type';
import type { Step } from '@/types/common.type';

// import { Component } from 'vue';
import SmartFolderBasic from './Basic.vue';
import SmartFolderSetting from './Setting.vue';

const props = defineProps<{
  smartFolder?: SmartFolder;
  revisit?: boolean;
}>();

const emit = defineEmits<{
  (event: 'success'): void;
  (event: 'back'): void;
}>();

const { smartFolder: smartFolderProp } = toRefs(props);
const router = useRouter();
const { getOne: getFolderDetails } = useSmartFolder();
const basicDetails = ref<CreateSmartFolder>();

// const { data: smartFolderDetails, isLoading: loadingDetails } = useQuery(
//   'smart-folder-details',
//   () => {
//     /* return props.smartFolder
//       ? getFolderDetails(props.smartFolder.id)
//       : undefined; */
//     return '';
//   },
//   {
//     onSuccess: (data: any) => {
//       // emit('success');
//     },
//   }
// );

const currentStep = ref<'basic' | 'setting'>('basic');
const steps: Record<'basic' | 'setting', unknown> = {
  basic: SmartFolderBasic,
  setting: SmartFolderSetting
};
const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'basic',
      label: `${props.revisit ? 'Update/View' : ''} Details`
    },
    {
      name: 'setting',
      label: `${props.revisit ? 'Update/View' : ''} Setting`
    }
  ];
  return steps;
});

async function handleBasic(values: CreateSmartFolder) {
  basicDetails.value = { ...values };
  currentStep.value = 'setting';
}

function handleBack(step: 'basic' | 'setting') {
  if (step === 'basic') {
    // router.push({
    //   name: 'admin-ai-setting',
    //   // params: { broadcastTo },
    //   query: { activeIndex: '1' },
    // });
    emit('back');
  }
  else {
    currentStep.value = 'basic';
  }
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div :class="currentStep !== 'setting' ? 'lg:w-8 xl:w-6 mx-auto' : ''">
    <CommonSteps
      id="abc"
      readonly
      :items="stepItems"
      class="mb-4"
      :current="currentStep"
    />
    <h2 class="text-2xl">
      <span v-if="currentStep === 'basic'">{{ revisit ? 'Update/View' : '' }} Details</span>
      <span v-if="currentStep === 'setting'">
        {{ revisit ? 'Update/View' : '' }} Setting
        <span>(Automatically categorize and view documents in a smart folder based
          on specified 'AND' conditions.)</span>
      </span>
    </h2>
    <!-- <CommonLoading v-if="loadingDetails" /> -->
    <KeepAlive>
      <component
        :is="steps[currentStep]"
        :key="currentStep"
        :smart-folder-details="smartFolderProp"
        :basic-details="basicDetails"
        @basic="handleBasic"
        @back="handleBack"
        @success="emit('back')"
      />
    </KeepAlive>
  </div>
</template>
