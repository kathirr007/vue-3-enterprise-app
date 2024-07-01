<script setup lang="ts">
import type { MetaObj } from '@/types/common.type';
import type { CreateEntityTimer, TimerObj } from '@/types/timer.type';
import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  timerData: TimerObj;
}>();

const emit = defineEmits<{
  (e: 'modalClose'): void;
}>();

const { handleSubmit } = useForm();
const { initToast } = useToasts();
const queryClient = useQueryClient();
const { stop } = useTimer();
const { metaFilter } = useUtilityFns();
const { dateToDateTime } = useVueFilters();

const { value: timeSpent } = useField<number>('timeSpent');

const { mutateAsync: updateTimer, isLoading: stopIsLoading } = useMutation(
  (payload: CreateEntityTimer & { id: string }) => {
    return stop(payload);
  }
);

const onSubmit = handleSubmit(async (values) => {
  await updateTimer({
    id: props.timerData.id,
    entityId: props.timerData.entity.id,
    timeSpent: values.timeSpent,
  });
  queryClient.invalidateQueries('timers-list');
  initToast({
    actionType: 'Update',
    title: 'Stop Timer',
    summary: 'Stop Timer',
    detail: `Timer for the task <strong>${metaFilter(
      props.timerData.entity.meta as MetaObj[],
      'title'
    )}</strong> is stopped successfully`,
  });
  emit('modalClose');
});
</script>
<template>
  <form @submit.stop="onSubmit">
    <div class="flex align-items-center w-full mb-4">
      <p class="w-5 text-left font-bold mb-0">Start Date & Time :</p>
      <p class="w-7">
        {{ dateToDateTime(props.timerData.createdAt as string).date }}
        {{ dateToDateTime(props.timerData.createdAt as string).time }}
      </p>
    </div>
    <div class="flex align-items-center w-full mb-4">
      <p class="w-5 text-left font-bold mb-0">End Date & Time :</p>
      <p class="w-7">
        {{ dateToDateTime().date }}
        {{ dateToDateTime().time }}
      </p>
    </div>
    <div class="flex align-items-center w-full mb-4">
      <p class="w-5 text-left font-bold mb-0">Time Spent :</p>
      <p class="w-7">
        <CommonTimer :timerData="timerData" units hideControls />
      </p>
    </div>
    <div class="flex align-items-center w-full mb-4">
      <p class="w-5 text-left font-bold mb-0">Enter Actual :</p>

      <div class="p-inputgroup w-7 lg:w-auto">
        <InputNumber id="timeSpent" v-model="timeSpent" class="w-full" />
        <span class="p-inputgroup-addon"> mins </span>
      </div>
    </div>

    <div class="flex justify-content-between mt-4">
      <Button
        label="Submit"
        type="submit"
        class="p-button ml-auto"
        :loading="stopIsLoading"
      />
    </div>
  </form>
</template>
