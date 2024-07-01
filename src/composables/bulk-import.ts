import type { BulkImportColumn } from '@/types/bulkimport.type';
import isMobilePhone from 'validator/es/lib/isMobilePhone';
import dayjs from 'dayjs';

export const ClientImportColumns: BulkImportColumn[] = [
  {
    order: 0,
    name: 'name',
    label: `${$tConfig('CLIENT')} Name`,
    required: true,
    format: 'text'
  },
  {
    order: 3,
    name: 'email',
    label: 'Email',
    format: 'email',
    validate: (value: string) => {
      return value
        .toLowerCase()
        .match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)
        ? true
        : 'Invalid email';
      // return regex.test(value.toLowerCase()) ? true : 'Invalid email';
    }
  },
  {
    order: 4,
    name: 'mobile',
    label: 'Mobile',
    format: 'text',
    validate: (value: string) => {
      return value && isMobilePhone(`${value}`, 'en-US')
        ? true
        : 'Invalid mobile phone number';
    }
  }
];

export const HolidayImportColumns: BulkImportColumn[] = [
  {
    order: 0,
    name: 'date',
    label: 'Date',
    required: true,
    format: 'date',
    validate: (value: string) => {
      // regex to check for valid date format
      return value.match(/^\d{2}-\d{2}-\d{4}$/g) && dayjs(value).isValid()
        ? true
        : 'Invalid date - use MM-DD-YYYY';
    }
  },
  {
    order: 1,
    name: 'name',
    label: 'Name',
    required: true,
    format: 'text'
  },
  {
    order: 2,
    name: 'description',
    label: 'Description',
    required: false,
    format: 'text'
  }
];

export interface HolidayImportMappedRows {
  [name: (typeof HolidayImportColumns)[number]['name']]: string;
}

export interface ClientImportMappedRows {
  [name: (typeof ClientImportColumns)[number]['name']]: string;
}
