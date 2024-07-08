<script setup lang="ts">
import type { AutoMappingEntry, TemplateField } from '@/types/webforms.type';
import draggable from 'vuedraggable';

const props = withDefaults(
  defineProps<{
    toInject: TemplateField;
    selectedRowIndex: number;
    tableColumnIndex: number;
    // Allow user to add table name for first Column
    isFirstColumn: boolean;
  }>(),
  {
    selectedRowIndex: -1,
    tableColumnIndex: -1,
    isFirstColumn: true
  }
);

const emits = defineEmits<{
  (e: 'inject:add', value: any): void;
  (e: 'inject:edit', value: any): void;
  (e: 'inject:column:edit', value: any, columnIndex: number): void;
}>();

const {
  currentBlock,
  enableIsMultiple,
  isCheckboxOrRadio,
  isStatic,
  isHeading,
  isDivider
} = useWebformTemplates();

const injectField = reactive(
  structuredClone(toRaw(props.toInject)) as TemplateField
);
const isAutoMap = ref(false);
const newMap = ref();
const drag = ref(false);
const dragOptions = reactive({
  animation: 200,
  group: 'description',
  disabled: false
});
// Store all the options for select tag
const optionHolder = ref('');
const disableInjection = ref(false);
const autoMapList = ref<AutoMappingEntry[]>([]);
const headingLevels = ref([1, 2, 3, 4]);
const textAlignments = ref(['Left', 'Center', 'Right']);
const spacerValues = ref(['None', '1', '2', '3']);
/* const enableIsMultiple = computed(() => {
  const fieldsToCheck = ['BaseSelect', 'BaseRadioButton', 'BaseCheckbox'];
  return fieldsToCheck.includes(injectField.is);
});
const isCheckboxOrRadio = computed(() => {
  const fieldsToCheck = ['BaseRadioButton', 'BaseCheckbox'];
  return fieldsToCheck.includes(injectField.is);
}); */

const disableInjectField = computed(() => {
  return (
    (props.isFirstColumn && !injectField.props.label)
    || (injectField.is === 'BaseSwitch' && !injectField.attrs.switchText)
    || (injectField.is === 'BaseTable'
    && ((props.isFirstColumn && !injectField.props.label)
    || !(injectField.props.columns as any[])[0].props.label
    || (!props.isFirstColumn
    && !(injectField.props.columns as any[])[0].props.label)))
  );
});

if (injectField.is === 'BaseTable') {
  autoMapList.value = (injectField.props.columns as any)[0].props
    .autoMapping as AutoMappingEntry[];
}
if (props.tableColumnIndex !== -1) {
  autoMapList.value = injectField.props.autoMapping || reactive([]);
}
isAutoMap.value = autoMapList?.value.length !== 0 || false;

function handleOptionHolder() {
  const optionsEntered = optionHolder.value.split(',');
  optionsEntered.forEach((option: string) => {
    if (!injectField.props.options?.includes(option)) {
      if (isCheckboxOrRadio.value) {
        injectField.attrs.isMultiple
          ? injectField.props.options?.push(option)
          : (injectField.props.options = [option]);
      }
      else {
        injectField.props.options?.push(option);
      }
    }
  });
  optionHolder.value = '';
}

function handleAddField() {
  emits('inject:add', injectField);
}

function addAutoMap() {
  // ignore if already there.
  const isExists = new Set(
    autoMapList.value.map((x: any) => x.name.toLowerCase())
  ).has(newMap.value.toLowerCase().trim());

  if (!isExists) {
    autoMapList.value.push({
      name: newMap.value.trim()
    });
  }
  newMap.value = '';
}

function ejectMap({ name }: { name: string }) {
  const index = autoMapList.value
    .map((x: any) => x.name.toLowerCase())
    .indexOf(name.toLowerCase());
  if (index === -1)
    return;
  autoMapList.value.splice(index, 1);
}

function onSubmit(typeofSubmit: 'add' | 'edit',
  injectField?: TemplateField,
  columnIndex?: number) {
  if (typeofSubmit === 'add') {
    handleAddField();
  }
  else if (injectField) {
    if (columnIndex)
      emits('inject:column:edit', injectField, columnIndex);
    else emits('inject:edit', injectField);
  }
}

watchEffect(() => {
  if (autoMapList.value) {
    injectField.props.autoMapping = autoMapList.value;
  }
  if (
    [true, false, undefined].includes(injectField.attrs.isMultiple)
    && !injectField.isEditing
  ) {
    injectField.props.options = [];
  }
});

watch(
  injectField,
  () => {
    currentBlock.value = injectField;
    if (enableIsMultiple.value && injectField.is !== 'BaseFileUpload') {
      disableInjection.value = injectField.props.options?.length === 0;
      return;
    }
    disableInjection.value = false;
  },
  { immediate: true }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <form class="flex flex-column justify-around" @submit.stop.prevent>
    <template v-if="isStatic">
      <template v-if="isHeading">
        <!-- Heading Level -->
        <div class="field">
          <label
            class="block font-medium text-900 cursor-pointer"
            for="headingLevel"
          >
            Heading Level
          </label>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="(headingLevel, idx) in headingLevels"
              :key="idx"
              class="flex align-items-center"
            >
              <RadioButton
                v-model="injectField.attrs.level"
                :input-id="`headingLevel${headingLevel}`"
                :name="`headingLevel${headingLevel}`"
                :value="headingLevel"
              />
              <label
                :for="`headingLevel${headingLevel}`"
                class="cursor-pointer ml-2"
              >Heading {{ headingLevel }}</label>
            </div>
          </div>
        </div>
        <!-- Heading Text -->
        <div class="field">
          <label
            class="block font-medium text-900 cursor-pointer"
            for="headingLabel"
          >
            Heading Text
            <span class="text-red-600">*</span>
          </label>
          <InputText
            id="headingLabel"
            v-model="injectField.props.label"
            :disabled="Boolean(injectField.predefinedType)"
            required="true"
            class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            name="headingText"
            placeholder="Heading Text"
            type="text"
          />
        </div>
        <!-- Text Alignment -->
        <div class="field">
          <label
            class="block font-medium text-900 cursor-pointer"
            for="textAlignment"
          >
            Text Align
          </label>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="(textAlignment, idx) in textAlignments"
              :key="idx"
              class="flex align-items-center"
            >
              <RadioButton
                v-model="injectField.attrs.align"
                :input-id="`textAlign${idx}`"
                :name="`textAlign${idx}`"
                :value="textAlignment.toLowerCase()"
              />
              <label :for="`textAlign${idx}`" class="cursor-pointer ml-2">{{
                textAlignment
              }}</label>
            </div>
          </div>
        </div>
      </template>
      <template v-if="isDivider">
        <!-- Divider Text -->
        <!-- <div class="field">
          <label
            class="block font-medium text-900 cursor-pointer"
            for="dividerLabel"
          >
            Divider Text
          </label>
          <InputText
            id="dividerLabel"
            v-model="injectField.props.label"
            :disabled="Boolean(injectField.predefinedType)"
            required="true"
            class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            name="dividerText"
            placeholder="Divider Text"
            type="text"
          />
        </div> -->
        <!-- Divider Space -->
        <div class="field">
          <label
            class="block font-medium text-900 cursor-pointer"
            for="textAlignment"
          >
            Space Top
          </label>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="(spacer, idx) in spacerValues"
              :key="idx"
              class="flex align-items-center"
            >
              <RadioButton
                v-model="injectField.attrs.top"
                :input-id="`spaceTop${idx}`"
                :name="`spaceTop${idx}`"
                :value="spacer"
              />
              <label :for="`spaceTop${idx}`" class="cursor-pointer ml-2">{{
                spacer
              }}</label>
            </div>
          </div>
        </div>
        <div class="field">
          <label
            class="block font-medium text-900 cursor-pointer"
            for="textAlignment"
          >
            Space Bottom
          </label>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="(spacer, idx) in spacerValues"
              :key="idx"
              class="flex align-items-center"
            >
              <RadioButton
                v-model="injectField.attrs.bottom"
                :input-id="`spaceBottom${idx}`"
                :name="`spaceBottom${idx}`"
                :value="spacer"
              />
              <label :for="`spaceBottom${idx}`" class="cursor-pointer ml-2">{{
                spacer
              }}</label>
            </div>
          </div>
        </div>
      </template>
    </template>
    <template v-else>
      <!-- Label -->
      <div v-if="injectField.is === 'BaseTable' || tableColumnIndex !== -1">
        <label
          v-if="isFirstColumn && tableColumnIndex === -1"
          class="block font-medium text-900 cursor-pointer"
          for="fieldLabel"
        >
          Table Name
          <span class="text-red-600">*</span>
        </label>
        <InputText
          v-if="isFirstColumn && tableColumnIndex === -1"
          id="fieldLabel"
          v-model="injectField.props.label"
          :disabled="Boolean(injectField.predefinedType)"
          required="true"
          class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="label"
          type="text"
        />
        <label
          class="block font-medium text-900 cursor-pointer"
          for="firstcolumn"
        >Column Name</label>
        <template v-if="tableColumnIndex === -1 && injectField.props.columns">
          <InputText
            id="firstcolumn"
            v-model="injectField.props.columns[0].props.label"
            required="true"
            class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            name="label"
            type="text"
          />
        </template>
        <InputText
          v-else
          id="firstcolumn"
          v-model="injectField.props.label"
          required="true"
          class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="label"
          type="text"
        />
        <div class="my-2">
          <label
            class="block font-medium text-900 cursor-pointer"
            for="automapping"
          >Use Auto Mapping</label>
          <Checkbox
            id="automapping"
            v-model="isAutoMap"
            binary
            class="shadow-sm mt-1 ml-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
            name="required"
            type="checkbox"
          />
          <div v-if="isAutoMap" class="border border-rounded p-1">
            <div class="overflow-y-auto max-h-64">
              <p class="text-sm">
                The order of the list prioritises the mapping
              </p>
              <div class="w-full">
                <div
                  v-if="autoMapList?.length === 0"
                  class="text-sm text-yellow-700 text-center"
                >
                  You have not added any mappings.
                </div>
                <draggable
                  v-model="autoMapList"
                  v-bind="dragOptions"
                  :component-data="{
                    tag: 'ul',
                    type: 'transition-group',
                    name: !drag ? 'flip-list' : null,
                  }"
                  item-key="name"
                  @start="drag = true"
                  @end="drag = false"
                >
                  <template #item="{ element, index }">
                    <div
                      class="flex justify-content-between bg-gray-100 w-4/5 mx-auto border-b px-2 py-1 my-1 rounded hover:cursor-move"
                    >
                      <span> {{ index + 1 }}. {{ element.name }} </span>
                      <span
                        class="text-sm text-red-500 font-bold cursor-pointer"
                        @click.prevent="ejectMap(element)"
                      >
                        x
                      </span>
                    </div>
                  </template>
                </draggable>
              </div>
            </div>
            <div>
              <div
                class="border-t pt-2 flex mt-2 items-center justify-content-between"
              >
                <label
                  class="block font-medium text-900 cursor-pointer"
                  for="addMap"
                >Add New Map</label>
                <InputText
                  id="addMap"
                  v-model="newMap"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md"
                  name="addMap"
                  type="text"
                />
                <Button
                  class="button button-primary"
                  @click.prevent="addAutoMap"
                >
                  Add Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="field">
        <label
          class="block font-medium text-900 cursor-pointer"
          for="fieldLabel"
        >
          Label
          <span class="text-red-600">*</span>
        </label>
        <InputText
          id="fieldLabel"
          v-model="injectField.props.label"
          :disabled="Boolean(injectField.predefinedType)"
          required="true"
          class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="label"
          placeholder="Label"
          type="text"
        />
      </div>
      <!-- Placeholder -->
      <div
        v-if="
          !['BaseDatePicker', 'BaseTable', 'BaseSwitch'].includes(
            injectField.is,
          ) && tableColumnIndex === -1
        "
        class="field"
      >
        <label
          class="block font-medium text-900 cursor-pointer"
          for="fieldPlaceholder"
        >
          Placeholder
        </label>
        <InputText
          id="fieldPlaceholder"
          v-model="injectField.props.placeholder"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="placeholder"
          placeholder="Placeholder"
          type="text"
        />
      </div>
      <!-- Is Multiple -->
      <div v-if="enableIsMultiple" class="flex space-x-2">
        <div class="field flex align-items-center gap-2">
          <Checkbox
            v-model="injectField.attrs.isMultiple"
            binary
            input-id="isFieldMultiple"
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
            name="isFieldMultiple"
            type="checkbox"
            :disabled="injectField.isEditing"
          />
          <label
            class="block mb-0 font-medium text-900 cursor-pointer"
            for="isFieldMultiple"
          >
            Is Multiple
          </label>
        </div>
      </div>
      <!-- Options -->
      <div v-if="injectField.is === 'BaseSwitch'" class="field">
        <label
          class="block font-medium text-900 cursor-pointer"
          for="fieldSwitchText"
        >
          Switch Text
          <span class="text-red-600">*</span>
        </label>
        <InputText
          id="fieldSwitchText"
          v-model="injectField.attrs.switchText"
          :disabled="Boolean(injectField.predefinedType)"
          required="true"
          class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="fieldSwitchText"
          placeholder="Field Switch Text"
          type="text"
        />
      </div>
      <div
        v-if="enableIsMultiple && injectField.is !== 'BaseFileUpload'"
        class="field"
      >
        <label
          class="block font-medium text-900 cursor-pointer"
          for="optionPlaceholder"
          aria-describedby="options-label-help"
        >
          Options
          <span class="text-red-600">*</span>
          <small
            id="options-label-help"
            class="block font-normal text-gray-500"
          >
            Enter options with comma separated.
          </small>
        </label>
        <InputText
          id="optionPlaceholder"
          v-model="optionHolder"
          class="disabled:cursor-not-allowed shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="optionHolder"
          type="text"
          :disabled="Boolean(injectField.predefinedType)"
          placeholder="Enter Options"
          @keyup.enter="handleOptionHolder"
        />
        <div class="flex flex-wrap mt-2 gap-2">
          <!-- <div class="grid grid-cols-6 gap-1"> -->
          <Tag
            v-for="(option, index) in injectField.props.options"
            :key="index"
          >
            <div class="flex align-items-center gap-2">
              <span class="text-sm font-normal">
                {{ option }}
              </span>
              <i
                tabindex="0"
                class="pi pi-times text-xs mt-1 hover:text-red-500"
                :class="
                  Boolean(injectField.predefinedType)
                    ? 'pointer-events-none'
                    : 'cursor-pointer'
                "
                role="link"
                @click="injectField.props.options?.splice(index, 1)"
                @keyup.enter="injectField.props.options?.splice(index, 1)"
              />
            </div>
          </Tag>
          <!-- <div
            v-for="(option, index) in injectField.props.options"
            :key="index"
            class="flex items-center mr-2 mb-2 justify-content-between p-1 px-2 bg-indigo-600 rounded-full text-white"
          >
            <span class="break-all"> {{ option }} </span>
            <Button
              class="disabled:cursor-not-allowed h-5 w-5 cursor-pointer transform hover:scale-110"
              :disabled="Boolean(injectField.predefinedType)"
              @click="injectField.props.options?.splice(index, 1)"
            >
              <i class="pi pi-times-circle text-2xl" />
            </Button>
          </div> -->
        </div>
        <Button
          class="disabled:cursor-not-allowed p-button button-primary mt-2"
          :disabled="
            !optionHolder
              || injectField.props.options?.includes(optionHolder)
              || Boolean(injectField.predefinedType)
          "
          @click.prevent="handleOptionHolder"
        >
          Add
        </Button>
      </div>
      <!-- Hint -->
      <div class="field">
        <label
          class="block font-medium text-900 cursor-pointer"
          for="fieldHint"
        >
          Hint
        </label>
        <InputText
          id="fieldHint"
          v-model="injectField.attrs.before"
          :disabled="Boolean(injectField.predefinedType)"
          class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="hint"
          placeholder="Hint"
          type="text"
        />
      </div>
      <!-- Description -->
      <div class="field">
        <label
          class="block font-medium text-900 cursor-pointer"
          for="fieldDescription"
        >
          Description
        </label>
        <InputText
          id="fieldDescription"
          v-model="injectField.attrs.description"
          :disabled="Boolean(injectField.predefinedType)"
          class="disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          name="description"
          placeholder="Description"
          type="text"
        />
      </div>
      <!-- Required -->
      <div class="flex space-x-2">
        <div class="field flex align-items-center gap-2">
          <template v-if="injectField.is === 'BaseTable'">
            <Checkbox
              v-model="(injectField.props.columns as any[])[0].rules.required"
              binary
              input-id="requiredField"
              class="shadow-sm mt-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
              name="required"
              type="checkbox"
            />
          </template>
          <Checkbox
            v-else
            v-model="injectField.rules.required"
            binary
            input-id="requiredField"
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
            name="required"
            type="checkbox"
          />
          <label
            class="block mb-0 font-medium text-900 cursor-pointer"
            for="requiredField"
          >
            Required
          </label>
        </div>
      </div>
    </template>
    <div class="flex flex-row-reverse">
      <Button
        v-if="tableColumnIndex !== -1 && injectField.props.columns"
        type="submit"
        class="button button-primary"
        :disabled="
          disableInjection
            || (injectField.is === 'BaseTable'
              && ((isFirstColumn && !injectField.props.label)
                || !injectField.props.columns[0].props.label
                || (!isFirstColumn && !injectField.props.columns[0].props.label)))
        "
        @click.prevent="onSubmit('edit', injectField, tableColumnIndex)"
      >
        Edit Column
      </Button>

      <Button
        v-else-if="selectedRowIndex === -1 || injectField.is === 'BaseTable'"
        type="submit"
        class="button button-primary"
        :disabled="disableInjection || disableInjectField"
        @click.prevent="onSubmit('add')"
      >
        Add Field
      </Button>
      <Button
        v-else
        type="submit"
        class="button button-primary"
        :disabled="disableInjection || disableInjectField"
        @click.prevent="onSubmit('edit', injectField)"
      >
        Update Field
      </Button>
    </div>
  </form>
</template>

<style scoped lang="scss">
.list-group {
  min-height: 20px;
}
.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
</style>
