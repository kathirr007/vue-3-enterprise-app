<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import type { Ref } from 'vue';
import type {
  CreateSmartFolder,
  CreateSmartFolderPayload,
  SmartFolder
} from '@/types/smart-folder.type';
import { SmartFolderSettingPayloadSchema } from '@/types/smart-folder.type';
import { useMutation, useQueryClient } from 'vue-query';

interface SmartFolderDataType {
  key: string;
  condition: string;
  value: string;
  multiselectLimit: undefined | number;
}
type EmptyRecord = SmartFolderDataType & { error: string };

const props = defineProps<{
  smartFolderDetails?: SmartFolder;
  basicDetails: CreateSmartFolder;
}>();

const emit = defineEmits<{
  (event: 'back', step: 'setting'): void;
  (event: 'success'): void;
  (
    event: 'setting-values',
    step: { data: { key: string; condition: string; value: string[] }[] }
  ): void;
}>();
const { categoryOptions, createOne, update } = useSmartFolder();
const { isFalsy } = useUtilityFns();
const { initToast } = useToasts();
const { isMedium } = useCommonBreakPoints();
const queryClient = useQueryClient();

const tableCellStyles = { 'min-width': '15rem' };
const tableActionStyles = { 'min-width': '8rem' };

const criteriaOptions = ref([
  { name: 'File Category', value: 'category' },
  // { name: 'File Format', value: 'fileFormat' },
  { name: 'Year', value: 'year' }
]);

const emptyRecord = {
  key: '',
  condition: '',
  value: '',
  multiselectLimit: undefined
};

const duplicateEmails = ref<string[]>([]);
const multiselectLimit = ref();
const { getDuplicates } = useUtilityFns();

function setInitialValues() {
  const multiselectCondition = ['contains', 'in', 'notIn'];
  if (props.smartFolderDetails) {
    const modifiedData = props.smartFolderDetails.data.map((item: any) => ({
      ...item,
      multiselectLimit: multiselectCondition.includes(item.condition)
        ? undefined
        : 1
    }));
    return {
      data: [...modifiedData]
    };
  }
  return {
    data: [{ ...emptyRecord }]
  };
}

const { handleSubmit, meta, values, errors, validate } = useForm({
  validationSchema: SmartFolderSettingPayloadSchema,
  validateOnMount: false,
  initialValues: setInitialValues()
});

const { remove, push, fields } = useFieldArray('data');

function addNewRecord() {
  push(emptyRecord);
  validate({
    mode: 'silent'
  });
}

function removeFieldError(field: Ref<EmptyRecord>): void {
  if (!field.value.error)
    return;
  field.value.error = '';
}

function optionsDisabled(val: any) {
  // TODO:
  return true;
}

function getOptionsBasedOnSelection(selectedValue: string,
  idx?: number): {
    conditionOptions: any[];
    conditionsValueOptions: any[];
    optionsDisabled: (val: { name: string; value: string }) => boolean;
  } {
  const categoryConditionOptions = [
    { name: 'Equals', value: 'equals' },
    { name: 'Not Equals', value: 'notEquals' },
    { name: 'Contains', value: 'in' }
  ];
  const fileFormatConditionOptions = [
    { name: 'Equals', value: 'equals' },
    { name: 'Not Equals', value: 'notEquals' }
  ];
  const yearConditionOptions = [
    { name: 'Contains', value: 'in' },
    { name: 'Equals', value: 'equals' },
    { name: 'Less than', value: 'lt' },
    { name: 'Less than or Equal to', value: 'lte' },
    { name: 'Greater than', value: 'gt' },
    { name: 'Greater than or Equal to', value: 'gte' }
  ];

  const selectedConditions = values.data
    .filter((item: SmartFolderDataType) => {
      return item.key === selectedValue;
    })
    .map((item: SmartFolderDataType) => item.condition);

  const optionsDisabled = (val: { name: string; value: string }) => {
    // TODO:
    if (values.data.length > 1) {
      if (idx === values.data.length - 1) {
        return selectedConditions.includes(val.value);
      }
      else {
        return false;
      }
    }
    return false;
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i < currentYear + 3; i++) {
      years.push({ name: `${i}`, value: `${i}` });
    }
    return years;
  };

  const filterConditionOptions = (conditionOption: {
    name: string;
    value: string;
  }) => {
    return !selectedConditions.includes(conditionOption.value);
  };
  switch (selectedValue) {
    case 'category':
      return {
        conditionOptions: [...categoryConditionOptions],
        conditionsValueOptions: [...categoryOptions],
        optionsDisabled
      };
    case 'fileFormat':
      return {
        conditionOptions: [
          { name: 'Equals', value: 'equals' },
          { name: 'Not Equals', value: 'notEquals' }
        ],
        conditionsValueOptions: [...fileFormatConditionOptions],
        optionsDisabled
      };
    case 'year':
      return {
        conditionOptions: [...yearConditionOptions],
        conditionsValueOptions: [...getYears()],
        optionsDisabled
      };
    default:
      return {
        conditionOptions: [],
        conditionsValueOptions: [],
        optionsDisabled
      };
  }
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function updateDropdownOptions(idx: number) {
  values.data[idx].condition = '';
  values.data[idx].value = '';
  const newOptions = getOptionsBasedOnSelection(values.data[idx].key);
  // setDropdownOptions(idx, newOptions.conditionOptions, 'condition');
  // setDropdownOptions(idx, newOptions.conditionsValueOptions, 'value');
}

function updateConditionValueMultiselect(idx: number) {
  values.data[idx].value = '';
  const multiselectCondition = ['contains', 'in', 'notIn'];
  /* if (multiselectCondition.includes(values.data[idx].condition)) {
    multiselectLimit.value = undefined;
  } else {
    multiselectLimit.value = 1;
  } */
  values.data[idx].multiselectLimit = multiselectCondition.includes(
    values.data[idx].condition
  )
    ? undefined
    : 1;
}

const { isLoading: creatingSmartFolder, mutateAsync: createUpdateSmartFolder }
  = useMutation(
    (payload: CreateSmartFolderPayload) => {
      if (props.smartFolderDetails) {
        return update({ id: props.smartFolderDetails.id, payload });
      }
      return createOne(payload);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Create',
          summary: `${
            props.smartFolderDetails ? 'Update' : 'Create'
          } Smart Folder`,
          detail: `Smart Folder <strong>${props.basicDetails.name}</strong> ${
            props.smartFolderDetails ? 'updated' : 'created'
          } successfully`
        });
        queryClient.invalidateQueries('smart-folder-list');
        queryClient.invalidateQueries('smart-folder-limit');
      }
    }
  );

const onSubmit = handleSubmit(async (values: any) => {
  const payload = {
    ...props.basicDetails,
    ...values
  };
  await createUpdateSmartFolder(payload);
  emit('success');
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <form @submit.stop="onSubmit">
    <div class="p-datatable p-component p-datatable-responsive-scroll">
      <div class="p-datatable-wrapper overflow-x-auto">
        <table
          class="bulk-create-table p-datatable-table w-full"
          role="table"
          cellspacing="0"
          cellpadding="0"
        >
          <thead class="bg-gray-50 p-datatable-thead" role="rowgroup">
            <tr>
              <th role="cell" :style="tableCellStyles">
                Criteria <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableCellStyles">
                Condition <span class="text-red-600">*</span>
                <span class="block font-normal">
                  (Use <strong>"Contains"</strong> to select multiple values)
                </span>
              </th>
              <th role="cell" :style="tableCellStyles">
                Value <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableActionStyles">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody relative" role="rowgroup">
            <tr
              v-for="(field, idx) in fields"
              :key="field.key"
              role="row"
              class="relative"
              :class="[
                {
                  'border-red-400 border-2': (
                    field.value as unknown as EmptyRecord
                  ).error,
                },
              ]"
            >
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`key_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >Criteria</label>
                <VField
                  :id="`key_${idx}`"
                  v-slot="{ handleChange, value, validate }"
                  :name="`data[${idx}].key`"
                >
                  <Dropdown
                    class="w-full"
                    :model-value="value"
                    :options="criteriaOptions"
                    option-label="name"
                    option-value="value"
                    placeholder="Select a Criteria"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      updateDropdownOptions(idx);
                      removeFieldError(field as unknown as Ref<EmptyRecord>);
                    "
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="errors"
                      :values="values"
                      :error-key="`data[${idx}].key`"
                    />
                  </transition>
                </VField>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`condition_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >Condition</label>
                <VField
                  :id="`condition_${idx}`"
                  v-slot="{ handleChange, value, validate }"
                  :name="`data[${idx}].condition`"
                >
                  <Dropdown
                    class="w-full"
                    :model-value="value"
                    :options="
                      getOptionsBasedOnSelection(values.data[idx].key)
                        .conditionOptions || []
                    "
                    :disabled="isFalsy((values.data[idx] as any).key)"
                    option-label="name"
                    option-value="value"
                    placeholder="Select a Condition"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      updateConditionValueMultiselect(idx);
                      removeFieldError(field as unknown as Ref<EmptyRecord>);
                    "
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="errors"
                      :values="values"
                      :error-key="`data[${idx}].condition`"
                    />
                  </transition>
                </VField>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`value_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >
                  Condition Value
                </label>
                <VField
                  :id="`value_${idx}`"
                  v-slot="{ handleChange, value, validate }"
                  :name="`data[${idx}].value`"
                >
                  <MultiSelect
                    filter
                    :selection-limit="(field.value as any).multiselectLimit"
                    class="w-full"
                    :model-value="value"
                    :options="
                      getOptionsBasedOnSelection(values.data[idx].key)
                        .conditionsValueOptions || []
                    "
                    :disabled="isFalsy((values.data[idx] as any).key)"
                    option-label="name"
                    option-value="value"
                    placeholder="Select a Value"
                    :max-selected-labels="3"
                    :selected-items-label="getSelectedItemsLabel('values')"
                    :virtual-scroller-options="{ itemSize: 30 }"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="errors"
                      :values="values"
                      :error-key="`data[${idx}].value`"
                    />
                  </transition>
                </VField>
              </td>
              <td
                role="cell"
                valign="top"
                :style="tableActionStyles"
                class="text-right md:text-left"
              >
                <Button
                  v-if="fields.length > 1"
                  type="button"
                  icon="pi pi-trash"
                  aria-label="delete-record"
                  class="p-button-sm p-button-rounded p-button-danger"
                  @click="remove(idx)"
                />
                <span v-if="idx === fields.length - 1">
                  <Button
                    icon="pi pi-plus"
                    aria-label="add-record"
                    class="p-button-sm p-button-rounded p-button-primary ml-2"
                    @click="addNewRecord"
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </form>

  <div class="flex justify-content-between mt-4">
    <div>
      <Button
        label="Back"
        class="max-w-max font-medium p-button-text"
        icon="pi pi-chevron-left"
        @click="emit('back', 'setting')"
      />
    </div>
    <Button
      label="Submit"
      type="submit"
      class="p-button ml-2"
      :loading="creatingSmartFolder"
      :disabled="!meta.valid"
      @click="onSubmit"
    />
  </div>
</template>
