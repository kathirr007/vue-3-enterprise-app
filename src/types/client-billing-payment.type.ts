export interface ClientBillingPayment {
  id: string;
  amount: number;
  killbillPaymentNumber: string;
  paymentDate: string;
  source: string;
  sourceId: string;
  invoice: {
    client: {
      id: string;
      name: string;
    };
    killBillInvoiceNumber: string;
  };
}

export interface CLientBillingPaymentTiles {
  totalAmount: number;
  paymentAmount: number;
  otherAmount: number;
}
