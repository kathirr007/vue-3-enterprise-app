<script setup>
import { ref } from 'vue';

const vueform = ref({
  schema: {
    /* personal_title: {
      type: 'static',
      content: 'Personal details',
      tag: 'h2',
    },
    divider: {
      type: 'static',
      tag: 'hr',
    }, */
    first_name: {
      type: 'text',
      label: 'First name',
      rules: ['required', 'max:255'],
      columns: {
        container: 4,
        label: 12,
        wrapper: 12
      },
      default: 'John'
    },
    last_name: {
      type: 'text',
      label: 'Last name',
      rules: ['required', 'max:255'],
      columns: {
        container: 4,
        label: 12,
        wrapper: 12
      },
      default: 'Doe'
    },
    email_1: {
      type: 'text',
      inputType: 'email',
      rules: ['nullable', 'email'],
      label: 'Email',
      columns: {
        container: 4
      }
    },
    display_name: {
      type: 'text',
      label: 'Display name',
      rules: ['required', 'max:255', 'alpha_num'],
      default: 'johndoe',
      addons: {
        before: 'mydomain.com/'
      },
      columns: {
        container: 6
      }
    },
    birthday: {
      type: 'date',
      label: 'Date of birth',
      rules: ['required'],
      default: '1989-07-07',
      displayFormat: 'MMMM Do, YYYY',
      columns: {
        container: 6
      }
    },
    textarea: {
      type: 'textarea',
      label: 'Address'
    },
    gender: {
      type: 'radiogroup',
      items: ['Male', 'Female', 'Other', 'I prefer not to say'],
      label: 'Gender',
      rules: ['required']
    },
    contact_title: {
      type: 'static',
      content: 'Contact details',
      tag: 'h2',
      top: '2'
    },
    divider_1: {
      type: 'static',
      tag: 'hr'
    },
    email: {
      type: 'text',
      inputType: 'email',
      rules: ['required', 'max:255', 'email'],
      label: 'Email',
      columns: {
        container: 6
      },
      default: 'john@doe.com'
    },
    phone: {
      type: 'text',
      inputType: 'tel',
      fieldName: 'Phone',
      label: 'Phone',
      columns: {
        container: 6
      },
      placeholder: 'optional',
      floating: false
    },
    address: {
      type: 'object',
      schema: {
        street: {
          type: 'text',
          placeholder: 'Street',
          rules: ['required', 'max:255'],
          label: 'Address',
          default: '123 Maple Street'
        },
        city: {
          type: 'text',
          columns: {
            label: 12,
            wrapper: 12
          },
          rules: ['required', 'max:255'],
          placeholder: 'City',
          default: 'Anytown'
        },
        country: {
          type: 'select',
          search: true,
          native: false,
          inputType: 'search',
          autocomplete: 'disabled',
          placeholder: 'Country',
          items: {
            AF: 'Afghanistan',
            AX: 'Aland Islands',
            AL: 'Albania',
            DZ: 'Algeria',
            AS: 'American Samoa',
            AD: 'Andorra',
            AO: 'Angola',
            AI: 'Anguilla',
            AQ: 'Antarctica',
            AG: 'Antigua And Barbuda'
          },
          columns: {
            container: 6
          },
          rules: ['required'],
          default: 'US'
        },
        state: {
          type: 'select',
          search: true,
          native: false,
          inputType: 'search',
          autocomplete: 'disabled',
          placeholder: 'State',
          items: {
            AL: 'Alabama',
            AK: 'Alaska',
            AZ: 'Arizona',
            AR: 'Arkansas',
            CA: 'California',
            CO: 'Colorado',
            CT: 'Connecticut',
            DE: 'Delaware',
            DC: 'District Of Columbia',
            FL: 'Florida'
          },
          conditions: [['address.country', 'in', ['US']]],
          columns: {
            container: 6
          },
          rules: ['required'],
          default: 'PA'
        },
        zip: {
          type: 'text',
          columns: {
            container: 6,
            label: 12,
            wrapper: 12
          },
          rules: ['required', 'max:255', 'alpha_num'],
          placeholder: 'Zip',
          default: '17101'
        }
      }
    },
    preferences_title: {
      type: 'static',
      content: 'Preferences',
      tag: 'h2',
      top: '2'
    },
    divider_2: {
      type: 'static',
      tag: 'hr'
    },
    language: {
      type: 'select',
      search: true,
      native: false,
      label: 'Language',
      inputType: 'search',
      autocomplete: 'off',
      items: [
        'Abaza',
        'Abkhazian',
        'Acehnese',
        'Adyghe',
        'Afrikaans',
        'Akan',
        'Albanian',
        'Alemannic'
      ],
      rules: ['required'],
      columns: {
        container: 6
      },
      default: 'English'
    },
    currency: {
      type: 'select',
      search: true,
      native: false,
      label: 'Currency',
      inputType: 'search',
      autocomplete: 'off',
      items: [
        {
          symbol: '$',
          name: 'US Dollar',
          symbol_native: '$',
          decimal_digits: 2,
          rounding: 0,
          code: 'USD',
          name_plural: 'US dollars'
        },
        {
          symbol: 'CA$',
          name: 'Canadian Dollar',
          symbol_native: '$',
          decimal_digits: 2,
          rounding: 0,
          code: 'CAD',
          name_plural: 'Canadian dollars'
        },
        {
          symbol: '€',
          name: 'Euro',
          symbol_native: '€',
          decimal_digits: 2,
          rounding: 0,
          code: 'EUR',
          name_plural: 'euros'
        },
        {
          symbol: 'AED',
          name: 'United Arab Emirates Dirham',
          symbol_native: 'د.إ.‏',
          decimal_digits: 2,
          rounding: 0,
          code: 'AED',
          name_plural: 'UAE dirhams'
        }
      ],
      rules: ['required'],
      columns: {
        container: 6
      },
      labelProp: 'code',
      valueProp: 'code',
      default: 'USD'
    },
    accessible_only: {
      type: 'checkbox',
      text: 'Show accessible accommodations only'
    },
    security_title: {
      type: 'static',
      content: 'Security',
      tag: 'h2',
      top: '2'
    },
    divider_3: {
      type: 'static',
      tag: 'hr'
    },
    reset_password: {
      type: 'button',
      buttonLabel: 'Send email to reset password',
      buttonType: 'anchor',
      label: 'Password',
      description:
        'To change your password, we need to send a reset link to your email address.'
    },
    close_sessions: {
      type: 'button',
      buttonLabel: 'Sign out',
      buttonType: 'anchor',
      label: 'Active sessions',
      description:
        'Selecting "Sign out" will sign you out from all devices except this one. This can take up to 10 minutes.'
    },
    delete_account: {
      type: 'button',
      buttonLabel: 'Sign out',
      buttonType: 'anchor',
      description: 'Permanently delete your mydomain.com account.',
      label: 'Delete account'
    },
    fellow_title: {
      type: 'static',
      content: 'Fellow traveller',
      tag: 'h2',
      top: '2'
    },
    divider_4: {
      type: 'static',
      tag: 'hr'
    },
    fellow_travellers: {
      type: 'group',
      schema: {
        container: {
          type: 'group',
          schema: {
            date_of_birth: {
              type: 'static',
              content: 'Date of birth',
              columns: {
                container: 4
              }
            },
            first_name: {
              type: 'static',
              content: 'First name',
              columns: {
                container: 4
              }
            },

            last_name: {
              type: 'static',
              content: 'Last name',
              columns: {
                container: 4
              }
            }
          },
          conditions: [['fellow_travellers.fellows', 'not_empty']]
        },
        fellows: {
          type: 'list',
          element: {
            type: 'object',
            schema: {
              birthday: {
                type: 'date',
                rules: ['required'],
                columns: {
                  container: 4,
                  label: 12,
                  wrapper: 12
                },
                displayFormat: 'MMMM Do, YYYY'
              },
              first_name: {
                type: 'text',
                columns: {
                  container: 4,
                  label: 12,
                  wrapper: 12
                },
                rules: ['required']
              },
              last_name: {
                type: 'text',
                rules: ['required', 'max:255'],
                columns: {
                  container: 4,
                  label: 12,
                  wrapper: 12
                }
              }
            }
          },
          addText: '+ Add another traveler',
          initial: 0
        }
      },
      before:
        'Enter the person\'s name exactly as it\'s written on their passport or other official travel document.\n<br><br>\nIt\'s important to enter a correct date of birth because these details can be used for booking or ticketing purposes.\n<br><br>'
    }
  }
});
</script>

<template>
  <Vueform v-bind="vueform" />
</template>
