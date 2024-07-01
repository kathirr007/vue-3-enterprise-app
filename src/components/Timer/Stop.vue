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
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        title: 'Stop Timer',
        summary: 'Stop Timer',
        detail: `Timer for the task <strong>${metaFilter(
          props.timerData.entity.meta as MetaObj[],
          'title'
        )}</strong> is stopped successfully`
      });
      emit('modalClose');
    }
  }
);

function updateTimeSpent(val: number) {
  timeSpent.value = val;
}

const onSubmit = handleSubmit(async (values) => {
  await updateTimer({
    id: props.timerData.id,
    entityId: props.timerData.entity.id,
    timeSpent: values.timeSpent
  });
  queryClient.invalidateQueries('timers-list');
  queryClient.invalidateQueries('completed-timers-list');
  queryClient.invalidateQueries('task-details');
});
</script>

<template>
  <form @submit.stop="onSubmit">
    <div class="p-datatable p-component p-datatable-responsive-scroll">
      <div class="p-datatable-wrapper overflow-x-auto">
        <table
          class="p-datatable-table w-full"
          role="table"
          cellspacing="0"
          cellpadding="0"
        >
          <thead class="bg-gray-50 p-datatable-thead" role="rowgroup">
            <tr>
              <th class="w-3 text-center" role="cell">
                Start Date & Time
              </th>
              <th class="w-3 text-center" role="cell">
                End Date & Time
              </th>
              <th class="w-3 text-center" role="cell">
                Time Spent
              </th>
              <th class="text-center" role="cell">
                Enter Actual
              </th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody relative" role="rowgroup">
            <tr role="row" class="relative">
              <td role="cell" valign="top" class="text-center">
                <div class="date">
                  {{ dateToDateTime(timerData.createdAt as string).date }}
                </div>
                <div class="time">
                  {{ dateToDateTime(timerData.createdAt as string).time }}
                </div>
              </td>
              <td role="cell" valign="top" class="text-center">
                <div class="date">
                  {{ dateToDateTime().date }}
                </div>
                <div class="time">
                  {{ dateToDateTime().time }}
                </div>
              </td>
              <td role="cell" valign="top" class="text-center">
                <CommonTimer
                  :timer-data="timerData"
                  units
                  hide-controls
                  class="justify-content-center"
                />
              </td>
              <td role="cell" valign="top" class="text-center">
                <div class="p-inputgroup w-6rem lg:w-auto">
                  <InputNumber
                    id="timeSpent"
                    v-model="timeSpent"
                    class="w-full"
                    @input="updateTimeSpent($event.value as number)"
                  />
                  <span class="p-inputgroup-addon"> mins </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex justify-content-between mt-4">
      <Button
        label="Stop"
        type="submit"
        class="p-button p-button-danger ml-auto"
        :loading="stopIsLoading"
      />
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
