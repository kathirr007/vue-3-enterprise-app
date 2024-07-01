import type { InferType } from 'yup';
import { array, number, object, string } from 'yup';
import { CountryEnum } from './common.type';

/**
 *
 * @export
 * @interface Entity
 */
export interface Entity {
  /**
   *
   * @type {string}
   * @memberof Entity
   */
  id?: string;
  /**
   *
   * @type {string}
   * @memberof Entity
   */
  createdDate?: string;
  /**
   *
   * @type {string}
   * @memberof Entity
   */
  updatedDate?: string;
}

/**
 *
 * @export
 * @interface AuditLog
 */
export interface AuditLog {
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  changeType?: string;
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  changeDate?: string;
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  objectType?: AuditLogObjectTypeEnum;
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  objectId?: string;
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  changedBy?: string;
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  reasonCode?: string;
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  comments?: string;
  /**
   *
   * @type {string}
   * @memberof AuditLog
   */
  userToken?: string;
  /**
   *
   * @type {Entity}
   * @memberof AuditLog
   */
  history?: Entity;
}

export const AuditLogObjectTypeEnumConst = {
  Account: 'ACCOUNT',
  AccountEmail: 'ACCOUNT_EMAIL',
  BlockingStates: 'BLOCKING_STATES',
  Bundle: 'BUNDLE',
  CustomField: 'CUSTOM_FIELD',
  Invoice: 'INVOICE',
  Payment: 'PAYMENT',
  Transaction: 'TRANSACTION',
  InvoiceItem: 'INVOICE_ITEM',
  InvoicePayment: 'INVOICE_PAYMENT',
  Subscription: 'SUBSCRIPTION',
  SubscriptionEvent: 'SUBSCRIPTION_EVENT',
  ServiceBroadcast: 'SERVICE_BROADCAST',
  PaymentAttempt: 'PAYMENT_ATTEMPT',
  PaymentMethod: 'PAYMENT_METHOD',
  Tag: 'TAG',
  TagDefinition: 'TAG_DEFINITION',
  Tenant: 'TENANT',
  TenantKvs: 'TENANT_KVS'
} as const;

export type AuditLogObjectTypeEnum =
  (typeof AuditLogObjectTypeEnumConst)[keyof typeof AuditLogObjectTypeEnumConst];

export const InvoiceItemCurrencyEnumConst = {
  Aed: 'AED',
  Afn: 'AFN',
  All: 'ALL',
  Amd: 'AMD',
  Ang: 'ANG',
  Aoa: 'AOA',
  Ars: 'ARS',
  Aud: 'AUD',
  Awg: 'AWG',
  Azn: 'AZN',
  Bam: 'BAM',
  Bbd: 'BBD',
  Bdt: 'BDT',
  Bgn: 'BGN',
  Bhd: 'BHD',
  Bif: 'BIF',
  Bmd: 'BMD',
  Bnd: 'BND',
  Bob: 'BOB',
  Brl: 'BRL',
  Bsd: 'BSD',
  Btn: 'BTN',
  Bwp: 'BWP',
  Byr: 'BYR',
  Bzd: 'BZD',
  Cad: 'CAD',
  Cdf: 'CDF',
  Chf: 'CHF',
  Clp: 'CLP',
  Cny: 'CNY',
  Cop: 'COP',
  Crc: 'CRC',
  Cuc: 'CUC',
  Cup: 'CUP',
  Cve: 'CVE',
  Czk: 'CZK',
  Djf: 'DJF',
  Dkk: 'DKK',
  Dop: 'DOP',
  Dzd: 'DZD',
  Egp: 'EGP',
  Ern: 'ERN',
  Etb: 'ETB',
  Eur: 'EUR',
  Fjd: 'FJD',
  Fkp: 'FKP',
  Gbp: 'GBP',
  Gel: 'GEL',
  Ggp: 'GGP',
  Ghs: 'GHS',
  Gip: 'GIP',
  Gmd: 'GMD',
  Gnf: 'GNF',
  Gtq: 'GTQ',
  Gyd: 'GYD',
  Hkd: 'HKD',
  Hnl: 'HNL',
  Hrk: 'HRK',
  Htg: 'HTG',
  Huf: 'HUF',
  Idr: 'IDR',
  Ils: 'ILS',
  Imp: 'IMP',
  Inr: 'INR',
  Iqd: 'IQD',
  Irr: 'IRR',
  Isk: 'ISK',
  Jep: 'JEP',
  Jmd: 'JMD',
  Jod: 'JOD',
  Jpy: 'JPY',
  Kes: 'KES',
  Kgs: 'KGS',
  Khr: 'KHR',
  Kmf: 'KMF',
  Kpw: 'KPW',
  Krw: 'KRW',
  Kwd: 'KWD',
  Kyd: 'KYD',
  Kzt: 'KZT',
  Lak: 'LAK',
  Lbp: 'LBP',
  Lkr: 'LKR',
  Lrd: 'LRD',
  Lsl: 'LSL',
  Ltl: 'LTL',
  Lvl: 'LVL',
  Lyd: 'LYD',
  Mad: 'MAD',
  Mdl: 'MDL',
  Mga: 'MGA',
  Mkd: 'MKD',
  Mmk: 'MMK',
  Mnt: 'MNT',
  Mop: 'MOP',
  Mro: 'MRO',
  Mur: 'MUR',
  Mvr: 'MVR',
  Mwk: 'MWK',
  Mxn: 'MXN',
  Myr: 'MYR',
  Mzn: 'MZN',
  Nad: 'NAD',
  Ngn: 'NGN',
  Nio: 'NIO',
  Nok: 'NOK',
  Npr: 'NPR',
  Nzd: 'NZD',
  Omr: 'OMR',
  Pab: 'PAB',
  Pen: 'PEN',
  Pgk: 'PGK',
  Php: 'PHP',
  Pkr: 'PKR',
  Pln: 'PLN',
  Pyg: 'PYG',
  Qar: 'QAR',
  Ron: 'RON',
  Rsd: 'RSD',
  Rub: 'RUB',
  Rwf: 'RWF',
  Sar: 'SAR',
  Sbd: 'SBD',
  Scr: 'SCR',
  Sdg: 'SDG',
  Sek: 'SEK',
  Sgd: 'SGD',
  Shp: 'SHP',
  Sll: 'SLL',
  Sos: 'SOS',
  Spl: 'SPL',
  Srd: 'SRD',
  Std: 'STD',
  Svc: 'SVC',
  Syp: 'SYP',
  Szl: 'SZL',
  Thb: 'THB',
  Tjs: 'TJS',
  Tmt: 'TMT',
  Tnd: 'TND',
  Top: 'TOP',
  Try: 'TRY',
  Ttd: 'TTD',
  Tvd: 'TVD',
  Twd: 'TWD',
  Tzs: 'TZS',
  Uah: 'UAH',
  Ugx: 'UGX',
  Usd: 'USD',
  Uyu: 'UYU',
  Uzs: 'UZS',
  Vef: 'VEF',
  Vnd: 'VND',
  Vuv: 'VUV',
  Wst: 'WST',
  Xaf: 'XAF',
  Xcd: 'XCD',
  Xdr: 'XDR',
  Xof: 'XOF',
  Xpf: 'XPF',
  Yer: 'YER',
  Zar: 'ZAR',
  Zmw: 'ZMW',
  Zwd: 'ZWD',
  Btc: 'BTC'
} as const;

export type InvoiceItemCurrencyEnum =
  (typeof InvoiceItemCurrencyEnumConst)[keyof typeof InvoiceItemCurrencyEnumConst];

/**
 *
 * @export
 * @interface InvoiceItem
 */
export interface InvoiceItem {
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  invoiceItemId: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  invoiceId?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  linkedInvoiceItemId?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  accountId: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  childAccountId?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  bundleId?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  subscriptionId?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  productName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  planName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  phaseName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  usageName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  prettyProductName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  prettyPlanName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  prettyPhaseName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  prettyUsageName?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  itemType?: InvoiceItemItemTypeEnum;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  description?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  startDate?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  endDate?: string;
  /**
   *
   * @type {number}
   * @memberof InvoiceItem
   */
  amount?: number;
  /**
   *
   * @type {number}
   * @memberof InvoiceItem
   */
  rate?: number;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  currency?: InvoiceItemCurrencyEnum;
  /**
   *
   * @type {number}
   * @memberof InvoiceItem
   */
  quantity?: number;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  itemDetails?: string;
  /**
   *
   * @type {string}
   * @memberof InvoiceItem
   */
  catalogEffectiveDate?: string;
  /**
   *
   * @type {Array<InvoiceItem>}
   * @memberof InvoiceItem
   */
  childItems?: Array<InvoiceItem>;
  /**
   *
   * @type {Array<AuditLog>}
   * @memberof InvoiceItem
   */
  auditLogs?: Array<AuditLog>;
}

export const InvoiceItemItemTypeEnumConst = {
  ExternalCharge: 'EXTERNAL_CHARGE',
  Fixed: 'FIXED',
  Recurring: 'RECURRING',
  RepairAdj: 'REPAIR_ADJ',
  CbaAdj: 'CBA_ADJ',
  CreditAdj: 'CREDIT_ADJ',
  ItemAdj: 'ITEM_ADJ',
  Usage: 'USAGE',
  Tax: 'TAX',
  ParentSummary: 'PARENT_SUMMARY'
} as const;

export type InvoiceItemItemTypeEnum =
  (typeof InvoiceItemItemTypeEnumConst)[keyof typeof InvoiceItemItemTypeEnumConst];

export const InvoiceCurrencyEnumConst = {
  Aed: 'AED',
  Afn: 'AFN',
  All: 'ALL',
  Amd: 'AMD',
  Ang: 'ANG',
  Aoa: 'AOA',
  Ars: 'ARS',
  Aud: 'AUD',
  Awg: 'AWG',
  Azn: 'AZN',
  Bam: 'BAM',
  Bbd: 'BBD',
  Bdt: 'BDT',
  Bgn: 'BGN',
  Bhd: 'BHD',
  Bif: 'BIF',
  Bmd: 'BMD',
  Bnd: 'BND',
  Bob: 'BOB',
  Brl: 'BRL',
  Bsd: 'BSD',
  Btn: 'BTN',
  Bwp: 'BWP',
  Byr: 'BYR',
  Bzd: 'BZD',
  Cad: 'CAD',
  Cdf: 'CDF',
  Chf: 'CHF',
  Clp: 'CLP',
  Cny: 'CNY',
  Cop: 'COP',
  Crc: 'CRC',
  Cuc: 'CUC',
  Cup: 'CUP',
  Cve: 'CVE',
  Czk: 'CZK',
  Djf: 'DJF',
  Dkk: 'DKK',
  Dop: 'DOP',
  Dzd: 'DZD',
  Egp: 'EGP',
  Ern: 'ERN',
  Etb: 'ETB',
  Eur: 'EUR',
  Fjd: 'FJD',
  Fkp: 'FKP',
  Gbp: 'GBP',
  Gel: 'GEL',
  Ggp: 'GGP',
  Ghs: 'GHS',
  Gip: 'GIP',
  Gmd: 'GMD',
  Gnf: 'GNF',
  Gtq: 'GTQ',
  Gyd: 'GYD',
  Hkd: 'HKD',
  Hnl: 'HNL',
  Hrk: 'HRK',
  Htg: 'HTG',
  Huf: 'HUF',
  Idr: 'IDR',
  Ils: 'ILS',
  Imp: 'IMP',
  Inr: 'INR',
  Iqd: 'IQD',
  Irr: 'IRR',
  Isk: 'ISK',
  Jep: 'JEP',
  Jmd: 'JMD',
  Jod: 'JOD',
  Jpy: 'JPY',
  Kes: 'KES',
  Kgs: 'KGS',
  Khr: 'KHR',
  Kmf: 'KMF',
  Kpw: 'KPW',
  Krw: 'KRW',
  Kwd: 'KWD',
  Kyd: 'KYD',
  Kzt: 'KZT',
  Lak: 'LAK',
  Lbp: 'LBP',
  Lkr: 'LKR',
  Lrd: 'LRD',
  Lsl: 'LSL',
  Ltl: 'LTL',
  Lvl: 'LVL',
  Lyd: 'LYD',
  Mad: 'MAD',
  Mdl: 'MDL',
  Mga: 'MGA',
  Mkd: 'MKD',
  Mmk: 'MMK',
  Mnt: 'MNT',
  Mop: 'MOP',
  Mro: 'MRO',
  Mur: 'MUR',
  Mvr: 'MVR',
  Mwk: 'MWK',
  Mxn: 'MXN',
  Myr: 'MYR',
  Mzn: 'MZN',
  Nad: 'NAD',
  Ngn: 'NGN',
  Nio: 'NIO',
  Nok: 'NOK',
  Npr: 'NPR',
  Nzd: 'NZD',
  Omr: 'OMR',
  Pab: 'PAB',
  Pen: 'PEN',
  Pgk: 'PGK',
  Php: 'PHP',
  Pkr: 'PKR',
  Pln: 'PLN',
  Pyg: 'PYG',
  Qar: 'QAR',
  Ron: 'RON',
  Rsd: 'RSD',
  Rub: 'RUB',
  Rwf: 'RWF',
  Sar: 'SAR',
  Sbd: 'SBD',
  Scr: 'SCR',
  Sdg: 'SDG',
  Sek: 'SEK',
  Sgd: 'SGD',
  Shp: 'SHP',
  Sll: 'SLL',
  Sos: 'SOS',
  Spl: 'SPL',
  Srd: 'SRD',
  Std: 'STD',
  Svc: 'SVC',
  Syp: 'SYP',
  Szl: 'SZL',
  Thb: 'THB',
  Tjs: 'TJS',
  Tmt: 'TMT',
  Tnd: 'TND',
  Top: 'TOP',
  Try: 'TRY',
  Ttd: 'TTD',
  Tvd: 'TVD',
  Twd: 'TWD',
  Tzs: 'TZS',
  Uah: 'UAH',
  Ugx: 'UGX',
  Usd: 'USD',
  Uyu: 'UYU',
  Uzs: 'UZS',
  Vef: 'VEF',
  Vnd: 'VND',
  Vuv: 'VUV',
  Wst: 'WST',
  Xaf: 'XAF',
  Xcd: 'XCD',
  Xdr: 'XDR',
  Xof: 'XOF',
  Xpf: 'XPF',
  Yer: 'YER',
  Zar: 'ZAR',
  Zmw: 'ZMW',
  Zwd: 'ZWD',
  Btc: 'BTC'
} as const;

export type InvoiceCurrencyEnum =
  (typeof InvoiceCurrencyEnumConst)[keyof typeof InvoiceCurrencyEnumConst];
export const InvoiceStatusEnumConst = {
  Draft: 'DRAFT',
  Committed: 'COMMITTED',
  Void: 'VOID'
} as const;

export type InvoiceStatusEnum =
  (typeof InvoiceStatusEnumConst)[keyof typeof InvoiceStatusEnumConst];

/**
 *
 * @export
 * @interface ClientBillingInvoice
 */

export const InvoiceLineItemsSchema = array().min(1).of(
  object().shape({
    projectName: string().required().nullable().label('Project Name'),
    amount: number().required().nullable().label('Amount'),
    rate: number().optional().nullable().label('Rate'),
    quantity: number().optional().nullable().label('Quantity'),
    description: string().optional().nullable().label('Description')
  })
);

export interface InvoiceLineItemsPayload {
  projectName: string;
  amount: number | null;
  billableAmount?: number;
  rate?: number | null;
  quantity?: number;
  description?: string;
};

export const GenerateInvoiceDetailsSchema = object().shape(
  {
    clientName: string().required().label('Client Name'),
    lineItems: InvoiceLineItemsSchema,
    clientId: string().required().label('Client ID'),
    projectId: string().optional().nullable().label('Project ID'),
    description: string().optional().label('Description'),
    notes: string().optional().label('Customer Notes'),
    terms: string().optional().label('Terms and Conditions'),
    currency: string().optional().label('Currency'),
    raisedBy: string().required().label('Raised By'),
    address: string().required().nullable().label('Address'),
    city: string().required().label('City'),
    state: string().required().nullable().label('State'),
    country: string().required().nullable().label('Country'),
    // zipcode: string().required().nullable().validateZipcode().label('Zipcode'),
    zipcode: string().required().nullable()
      .when('country', (country, schema) => {
        return country
          ? schema.validateZipcode((CountryEnum as any)[country])
          : schema.validateZipcode();
      }).label('Zipcode'),
    invoiceNumber: string()
      .trim()
      .nullable()
      .notRequired()
      .matches(
        /^[a-zA-Z]{3}[0-9]{7}$/,
        'Invoice number must be 3 letters followed by 7 numbers'
      )
      .label('Invoice Number'),
    taxNo: string().nullable().optional().label('Tax No'),
    endDate: string().required().nullable().label('Due Date'),
    startDate: string().required().nullable().label('Invoice Date')
  },
  [['zipcode', 'zipcode']]
);

export type GenerateInvoiceDetailsPayload = InferType<
  typeof GenerateInvoiceDetailsSchema
>;

export const SelectClientForInvoiceSchema = object({
  client: object().optional().nullable().label('Client'),
  project: object().required().nullable().label('Project'),
  billingProfile: object().required().nullable().label('Billing Profile')
});

export interface GenerateInvoicePayload {
  clientId: string;
  raisedBy?: string;
  projectId: string;
  billingProfileId: string;
  amount: number;
  currency: string;
  projectName: string;
  startDate: string;
  endDate: string;
  address: string;
  city: string;
  zipcode: string;
  postalCode?: string;
  state: string;
  country: string;
  description?: string;
  clientName?: string;
  reminderEnabled?: boolean;
  taxAmount?: number;
  tax?: number;
  discountAmount?: number;
  discount?: number;
  otherCharges?: number;
  notes?: string;
  terms?: string;
  rate?: number;
  quantity?: number;
}

export const CreatePaymentSchema = object({
  amount: number().required().nullable().label('Amount'),
  paymentMode: string().required().nullable().label('Payment Mode'),
  referenceNumber: string().optional().nullable().label('Reference Number'),
  paymentReceivedBy: string()
    .required()
    .nullable()
    .label('Payment Receieved By'),
  remarks: string().optional().min(3).nullable().label('Remarks')
});

export type CreatePaymentPayload = InferType<typeof CreatePaymentSchema>;

export interface ClientBillingInvoice {
  /**
   *
   * @type {number}
   * @memberof Invoice
   */
  amount?: number;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  currency?: InvoiceCurrencyEnum;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  status?: InvoiceStatusEnum;
  /**
   *
   * @type {number}
   * @memberof Invoice
   */
  creditAdj?: number;
  /**
   *
   * @type {number}
   * @memberof Invoice
   */
  refundAdj?: number;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  invoiceId?: string;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  invoiceDate?: string;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  targetDate?: string;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  invoiceNumber?: string;
  /**
   *
   * @type {number}
   * @memberof Invoice
   */
  balance?: number;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  accountId?: string;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  bundleKeys?: string;
  /**
   *
   * @type {Array<InvoiceItem>}
   * @memberof Invoice
   */
  credits?: Array<InvoiceItem>;
  /**
   *
   * @type {Array<InvoiceItem>}
   * @memberof Invoice
   */
  items?: Array<InvoiceItem>;
  /**
   *
   * @type {Array<string>}
   * @memberof Invoice
   */
  trackingIds?: Array<string>;
  /**
   *
   * @type {boolean}
   * @memberof Invoice
   */
  isParentInvoice?: boolean;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  parentInvoiceId?: string;
  /**
   *
   * @type {string}
   * @memberof Invoice
   */
  parentAccountId?: string;
  /**
   *
   * @type {Array<AuditLog>}
   * @memberof Invoice
   */
  auditLogs?: Array<AuditLog>;
  id?: string;
  client: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
    billingRate: number;
    description: string;
    billingType: 'HOURLY' | 'FIXED' | 'NONE';
  };
  raisedBy: {
    firstName: string;
    lastName: string;
    id: string;
    name: string;
  };

  data: Partial<GenerateInvoicePayload>;
}

export interface InvoiceTemplate {
  paymentUrl: string;
  templateData: {
    id: string;
    invoiceNumber: string;
    total: number;
    invoiceDate: string;
    dueAmount: number;
    status: 'PAID' | 'CANCELLED' | 'PARTIALLY_PAID' | 'PENDING';
    dueDate: string;
    lineItem: [
      {
        description: string;
        quantity: number;
        price: number;
      }
    ];
    discount: {
      amount: number;
      rate: number;
    };
    tax: {
      amount: number;
      rate: number;
    };
    otherCharges: number;
    terms: string;
    notes: string;
    billTo: {
      name: string;
      address1: string;
      postalCode: string;
      city: string;
      state: string;
      country: string;
    };
    CPAData: {
      name: string;
      address1: string;
      city: string;
      state: string;
      country: string;
      logo: string;
      postalCode: string;
    };
  };
  status: 'PAID' | 'CANCELLED' | 'PARTIALLY_PAID' | 'PENDING';
}
