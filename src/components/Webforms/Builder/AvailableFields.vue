<script setup lang="ts">
import type {
  FieldType,
  InputAttrType,
  TemplateField,
} from '@/types/webforms.type';

const props = withDefaults(
  defineProps<{
    fields: FieldType[];
    modelName: string;
    alreadyAddedPredefinedFields?: Set<string>;
    serviceModel?: string;
  }>(),
  {
    alreadyAddedPredefinedFields: () => new Set(),
  }
);

const emits = defineEmits<{
  (e: 'payload', data: any): void;
}>();

const predefinedFields = props.fields.filter((field) => field.predefinedType);
const normalFields = props.fields.filter(
  (field) => !(field.predefinedType || field.isStatic)
);
const staticFields = props.fields.filter((field) => field.isStatic);

// Check if normalFields contain BaseTable and move it to predefinedFields
const t = normalFields.findIndex(
  (p) => p.is === 'BaseTable' && !p.predefinedType
);
if (t !== -1) {
  predefinedFields.push(normalFields[t]);
  normalFields.splice(t, 1);
}

function getCleanedPayload(payload: FieldType): TemplateField {
  const cleanedPayload = {} as Record<string, any>;
  Object.entries(payload).forEach(([key, value]) => {
    if (['createdAt', 'updatedAt', 'description', 'icon'].includes(key)) return;
    cleanedPayload[key] = value;
  });
  return cleanedPayload as unknown as TemplateField;
}

const getPayload = ({
  index,
  isPredefined,
  isStatic,
}: {
  index: number;
  isPredefined?: boolean;
  isStatic?: boolean;
}) => {
  let payload: FieldType;

  if (isPredefined) {
    payload = structuredClone(toRaw(predefinedFields[index]));
  } else if (isStatic) {
    payload = structuredClone(toRaw(staticFields[index]));
  } else {
    payload = structuredClone(toRaw(normalFields[index]));
  }

  // const payload = structuredClone(toRaw(props.fields[index]));
  // eslint-disable-next-line
  // Add a default empty label to v-model it later
  if (!Object.keys(payload.props).includes('label')) payload.props.label = '';

  // Add an options entry for base-select if it doesn't exist
  if (
    ['BaseSelect', 'BaseRadioButton'].includes(payload.is) &&
    !payload.props.options
  ) {
    payload.props.options = [];
  }

  // If predefinedType exists, add name of the field as the label
  if (payload.predefinedType) payload.props.label = payload.name;

  // add fieldId for template updation
  payload.fieldId = payload.id;
  delete payload.id;

  // Add attrs-type for date-picker and select tag
  // TODO: ideally should come from backend
  if (payload.is === 'BaseDatePicker') {
    if (payload.attrs && !payload.attrs.type)
      payload.attrs.type = 'date' as InputAttrType;
  }

  return getCleanedPayload(payload);
};
</script>

<template>
  <div class="flex gap-3 flex-column">
    <Card>
      <template #title>
        <h3 class="text-2xl mb-0">Normal Fields</h3>
      </template>
      <template #content>
        <div class="flex flex-wrap gap-2">
          <div v-for="(field, index) in normalFields" :key="index">
            <Button
              class="button button-primary w-full h-full"
              @click="emits('payload', getPayload({ index }))"
              v-tooltip="field.description"
            >
              <span class="inline-block my-auto">
                {{ field.name }}
              </span>
            </Button>
          </div>
        </div>
      </template>
    </Card>
    <Card v-if="staticFields.length">
      <template #title>
        <h3 class="text-2xl mb-0">Static Fields</h3>
      </template>
      <template #content>
        <div class="flex flex-wrap gap-2">
          <div v-for="(field, index) in staticFields" :key="index">
            <Button
              class="button button-primary w-full h-full"
              @click="emits('payload', getPayload({ index, isStatic: true }))"
              v-tooltip="field.description"
            >
              <span class="inline-block my-auto">
                {{ field.name }}
              </span>
            </Button>
          </div>
        </div>
      </template>
    </Card>

    <Card
      v-if="predefinedFields.length > 0"
      title="Predefined Fields"
      :subtitle="modelName"
    >
      <template #title>
        <h3 class="text-2xl mb-0">Predefined Fields</h3>
      </template>
      <template #content>
        <div class="grid gap-3">
          <div v-for="(field, index) in predefinedFields" :key="index">
            <Button
              :disabled="
                alreadyAddedPredefinedFields.has(field.predefinedType || '')
              "
              class="button button-primary disabled:cursor-not-allowed"
              @click="
                emits('payload', getPayload({ index, isPredefined: true }))
              "
            >
              <span class="inline-block my-auto">
                {{ field.name }}
              </span>
            </Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
