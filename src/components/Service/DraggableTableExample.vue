<!-- <script setup lang="ts">
import draggable from 'vuedraggable';
const props = defineProps<{
  list: any[];
}>();

const list2 = computed(() => [
  { id: 1, name: 'Abby', sport: 'basket' },
  { id: 2, name: 'Brooke', sport: 'foot' },
  { id: 3, name: 'Courtenay', sport: 'volley' },
  { id: 4, name: 'David', sport: 'rugby' },
]);
const list3 = ref(list2.value.map((item) => item));
const { list: listProp } = toRefs(props);
const listData = ref([...JSON.parse(JSON.stringify(props.list))]);

const dragging = ref(false);
</script>

<template>
  <div class="row">
    <div class="col-8">
      <h3>Draggable table</h3>

      <table class="table table-striped">
        <thead class="thead-dark">
          <tr>
            <th scope="col">Id</th>
            <th scope="col">Name</th>
            <th scope="col">Sport</th>
          </tr>
        </thead>
        <draggable :list="list3" tag="tbody" item-key="name">
          <template #item="{ element }">
            <tr>
              <td scope="row">{{ element.id }}</td>
              <td>{{ element.name }}</td>
              <td>{{ element.sport }}</td>
            </tr>
          </template>
        </draggable>
      </table>
    </div>
    <pre>
  {{ list3 }}
</pre
    >
  </div>
</template>

<style scoped>
.buttons {
  margin-top: 35px;
}
</style> -->

<script setup>
import { Field, FieldArray, Form } from 'vee-validate';
import draggable from 'vuedraggable';

// you can set initial values for those array fields
const initialValues = {
  links: [{ id: 1, url: 'https://github.com/logaretm' }]
};
function onSubmit(values) {
  console.log(JSON.stringify(values, null, 2));
}
</script>

<template>
  <Form :initial-values="initialValues" @submit="onSubmit">
    <FieldArray v-slot="{ fields, push, remove }" name="links">
      <!-- <draggable :list="fields" tag="tbody" item-key="name"> -->
      <draggable
        :list="fields"
        tag="div"
        item-key="testing-fieldarray"
        :component-data="{
          list: fields,
        }"
      >
        <template #item="{ element: field, index: idx }">
          <div :key="field.key" class="p-2 border-1 border-round-md mb-2">
            <Field :name="`links[${idx}].url`" type="url" />
            <button type="button" @click="remove(idx)">
              Remove
            </button>
          </div>
        </template>
      </draggable>
      <!-- </draggable> -->
      <button
        type="button"
        @click="push({ id: Date.now(), name: '', url: '' })"
      >
        Add
      </button>

      <pre>{{ fields }}</pre>
    </FieldArray>
    <button>Submit</button>
  </Form>
</template>
