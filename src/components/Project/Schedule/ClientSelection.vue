<script setup lang="ts">
import type {
  ScheduleProjectStep,
  UnPlannedProject,
  UnScheduledProjectEntity,
  UnScheduledProjectPayload,
} from '@/types/project.type';
import { UnScheduledProjectClientSelectSchema } from '@/types/project.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import RadioButton from 'primevue/radiobutton';

const props = defineProps<{
  serviceToSchedule: UnPlannedProject;
  typeofSchedule: 'Schedule' | 'Extend' | '';
  formValues?: Record<string, any> | undefined;
}>();

const emit = defineEmits<{
  (
    e: 'submit',
    formValues: Record<string, any>,
    stepName: ScheduleProjectStep
  ): void;
  (e: 'secondary-btn-click'): void;
}>();

const clientSelectionRef = ref<SchemaFormRef | null>(null);

const formData: SchemaForm = {
  fields: [
    {
      label: `How would you like to ${
        props.typeofSchedule === 'Schedule'
          ? props.typeofSchedule.toLowerCase()
          : 'reschedule'
      } the project?`,
      as: RadioButton,
      type: 'radio',
      name: 'clientSelection',
      required: true,
      formGridClass: 'md:col-12',
      isRadioStacked: true,
      options: [
        {
          name: 'clientSelection',
          value: 'single',
          radioLabel: `Would like to ${
            props.typeofSchedule === 'Schedule'
              ? props.typeofSchedule.toLowerCase()
              : 'reschedule'
          } the project one client at a time.`,
        },
        {
          name: 'clientSelection',
          value: 'multiple',
          radioLabel: `Would ${
            props.typeofSchedule === 'Schedule'
              ? props.typeofSchedule.toLowerCase()
              : 'reschedule'
          } the project for multiple clients at a time${
            props.typeofSchedule === 'Schedule'
              ? ' as same team members would manage assigned task for all the clients'
              : ''
          }.`,
          note: `${
            props.typeofSchedule === 'Schedule'
              ? `(However, you can reassign the team members even after scheduling)`
              : ''
          }`,
          noteClasses: 'block ml-4 font-medium font-italic',
        },
      ],
    },
    {
      as: Dropdown,
      type: 'dropdown',
      name: 'clientsSelected',
      label: 'Select the client(s) you would like to assign for',
      required: true,
      autocomplete: 'off',
      options: [],
      optionLabel: 'name',
      optionValue: (option: UnScheduledProjectEntity) => option,
      display: 'chip',
    },
  ],
  validationSchema: UnScheduledProjectClientSelectSchema,
  initialValues: props.formValues || {
    clientSelection: 'single',
    clientsSelected: '',
  },
  btnText: 'Continue',
  secondaryBtnText: 'Back',
};

const { updateFieldProp, findFormIndex, updateOptions } =
  useSchemaForm(formData);

const clientsListIndex = findFormIndex('clientsSelected');

const setClientsSelected = (data: Record<string, any>) => {
  if (!data) return;
  if (Array.isArray(data.clientsSelected)) {
    return data.clientsSelected.length
      ? data.clientsSelected.map((item: UnScheduledProjectPayload) => item)
      : [];
  } else {
    return data.clientSelection !== 'multiple' ? data.clientsSelected : [];
  }
};

const restoreClientSelection = (formValues: Record<string, any>) => {
  const isMultiple = formValues.clientSelection === 'multiple';
  const setFormValues = () => {
    clientSelectionRef.value?.setValues({
      clientSelection: formValues.clientSelection,
      clientsSelected: setClientsSelected(formValues as Record<string, any>),
    });
  };

  updateFieldProp('as', clientsListIndex, isMultiple ? MultiSelect : Dropdown);
  updateFieldProp(
    'type',
    clientsListIndex,
    isMultiple ? 'multiSelect' : 'dropdown'
  );
  setFormValues();
};

watchEffect(() => {
  if (clientSelectionRef.value?.schemaFormValues) {
    restoreClientSelection(clientSelectionRef.value?.schemaFormValues);
  }
  if (props.serviceToSchedule) {
    updateOptions(
      ref([
        ...props.serviceToSchedule.extendedClients,
        ...props.serviceToSchedule.unscheduledClients,
      ]),
      clientsListIndex
    );
  }
});

watch(
  () => props.formValues,
  (val) => {
    if (val) {
      restoreClientSelection(val);
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

const onSubmit = (formValues: Record<string, any>) => {
  emit('submit', formValues, 'update project details');
};
</script>

<template>
  <CommonSchemaForm
    ref="clientSelectionRef"
    :data="formData"
    @secondaryBtnClick="$emit('secondary-btn-click')"
    @submit="onSubmit"
  ></CommonSchemaForm>
</template>

<style lang="scss" scoped></style>
