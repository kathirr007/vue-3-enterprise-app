<script setup lang="ts">
import type { CommonUser } from '@/types/client.type';
import { ClientAuthUserDisableSchema } from '@/types/client.type';
import type { User } from '@/types/teams.type';
import type { FieldEntry } from 'vee-validate';

const props = defineProps<{
  selectedAuthUser: CommonUser;
  clientUsers: FieldEntry<CommonUser>[];
}>();

const emit = defineEmits<{
  (event: 'submit', value: string): void;
  (event: 'cancel'): void;
}>();

const { fullName } = useVueFilters();

const { values, errors, meta, setValues, validate } = useForm({
  validationSchema: ClientAuthUserDisableSchema,
  initialErrors: undefined,
  initialValues: undefined
});

const { value: clientUserId } = useField('clientUserId');

const userOptions = computed(() => {
  const users = props.clientUsers.map((user) => {
    return {
      id: user.value.id,
      name: fullName(user.value as User),
      isActive: user.value.isActive
    };
  });
  return users.filter(user => user.id && user.isActive);
});
</script>

<!-- To disable Rameshwari Kodam, please select alternate team member to whom you want to assign all the above liablilities. -->

<template>
  <div>
    {{
      userOptions.length
        ? `Please select the alternative client user to make
    as Authorised User.`
        : `You don't have any client user or
    active client user to make as Authorised User. Please add a
    client user or enable existing client user first.`
    }}
    <p class="text-md">
      To disable
      <strong>{{ fullName(selectedAuthUser as User) }}</strong>.
    </p>
    <form v-if="userOptions.length">
      <div class="field mb-0">
        <label for="User" class="block font-medium text-900">User <span class="text-red-500">*</span></label>
        <Dropdown
          v-model="clientUserId"
          class="w-full"
          :options="userOptions"
          option-label="name"
          option-value="id"
          :filter="true"
          placeholder="Select a User to make it as Authorised User"
          @blur="validate()"
        />

        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="clientUserId"
            :feedback="false"
          />
        </transition>
      </div>
      <div class="flex justify-content-between mt-3">
        <Button
          type="button"
          class="p-button-danger"
          label="Cancel"
          @click="emit('cancel')"
        />
        <Button
          type="submit"
          label="Submit"
          :disabled="!meta.valid"
          @click.prevent="emit('submit', values.clientUserId)"
        />
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped></style>
