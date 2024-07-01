<script lang="ts" setup>
import { ref, watch } from 'vue';
const props = withDefaults(
  defineProps<{
    fields: number;
    resetOtp?: boolean;
  }>(),
  {
    resetOtp: false,
  }
);

const data = ref<string[]>([]);
const firstInputEl = ref<HTMLInputElement[] | null>(null);
const emit = defineEmits(['update:modelValue']);

const handleOtpInput = (e: any) => {
  if (e.data && e.target.nextElementSibling) {
    e.target.nextElementSibling.focus();
  } else if (e.data == null && e.target.previousElementSibling) {
    e.target.previousElementSibling.focus();
  }
};

const handlePaste = (e: any) => {
  const pasteData = e.clipboardData.getData('text');
  let nextEl;
  if (firstInputEl.value) {
    nextEl = (firstInputEl.value[0] as Element)?.nextElementSibling;
  }
  for (let i = 1; i < pasteData.length; i++) {
    if (nextEl) {
      data.value[i] = pasteData[i];
      nextEl = nextEl.nextElementSibling;
    }
  }
};

watch(
  () => data,
  (newVal) => {
    if (
      newVal.value.length &&
      newVal.value.length === props.fields &&
      !newVal.value.includes('')
    ) {
      emit('update:modelValue', newVal.value.join(''));
    } else {
      emit('update:modelValue', null);
    }
  },
  { deep: true }
);

watchEffect(() => {
  if (props.resetOtp) {
    data.value = [];
  }
});

onMounted(() => {
  if (props.resetOtp) {
    data.value = [];
  }
  if (firstInputEl.value) {
    firstInputEl.value[0].focus();
  }
});
</script>

<template>
  <div class="otp flex gap-2 justify-content-center" @input="handleOtpInput">
    <template v-for="field in fields" :key="field">
      <input
        v-model="data[field - 1]"
        ref="firstInputEl"
        type="text"
        maxlength="1"
        class="border-round-md border-1 w-2rem lg:w-3rem h-2rem lg:h-3rem text-center text-2xl"
        :class="{
          'border-green-500 border-2':
            data[field - 1] && data[field - 1] !== '',
        }"
        @paste="field === 1 && handlePaste($event)"
      />
    </template>
  </div>
</template>
