import billingTranslations from '../src/shared/i18n/billingTranslations';
import {
  getInvoiceAmounts,
  getInvoiceStatusText,
  getInvoiceTotalQuantity,
  getStatementDescription,
  getStatementDirection,
  toLocalDateString,
  validateInvoicePeriod,
} from '../src/shared/utils/billing';

const translate = key => ({
  'invoices.paid': 'Paid',
  'invoices.partiallyPaid': 'Partially Paid',
  'invoices.unpaid': 'Unpaid',
  'invoices.balanceDue': 'Balance Due',
  'invoices.deliveryCharges': 'Delivery Charges',
  'payments.extraChargeAdded': 'Extra Charge Added',
  'payments.creditAdjusted': 'Credit Adjusted',
}[key] || key);

test('keeps previous dues separate from this invoice and payment due', () => {
  const invoice = {
    previousDues: 500,
    totalAmount: 700,
    amountPaid: 0,
    breakdown: {
      deliveryCharges: 600,
      extraCharges: 100,
      discounts: 0,
      thisInvoiceTotal: 700,
      previousDues: 500,
      totalPayable: 700,
      alreadyPaid: 0,
      balanceDue: 700,
    },
  };
  expect(getInvoiceAmounts(invoice)).toEqual({
    deliveryCharges: 600,
    extraCharges: 100,
    discounts: 0,
    thisInvoiceTotal: 700,
    previousDues: 500,
    alreadyPaid: 0,
    balanceDue: 700,
  });
  expect(getInvoiceStatusText({ ...invoice, status: 'pending', statusLabel: 'English server label' }, translate, value => `₹${value}`))
    .toBe('Unpaid — ₹700 Balance Due');

  // Sanitized values observed from the authenticated backend on 2026-09-21.
  const liveInvoice = getInvoiceAmounts({
    previousDues: 36000,
    totalAmount: 300,
    amountPaid: 0,
    balanceDue: 300,
    displayGrandTotal: 300,
    breakdown: {
      deliveryCharges: 300, extraCharges: 0, discounts: 0,
      thisInvoiceTotal: 300, previousDues: 36000,
      totalPayable: 300, alreadyPaid: 0, balanceDue: 300,
    },
  });
  expect(liveInvoice.thisInvoiceTotal).toBe(300);
  expect(liveInvoice.previousDues).toBe(36000);
  expect(liveInvoice.balanceDue).toBe(300);
});

test('reads invoice list amounts without a breakdown and retains advance credit separately', () => {
  expect(getInvoiceAmounts({
    totalAmount: '₹1,200.00', extraTotal: '100', discountTotal: '50',
    previousDues: -200, amountPaid: 300,
  })).toEqual({
    deliveryCharges: 1150,
    extraCharges: 100,
    discounts: 50,
    thisInvoiceTotal: 1200,
    previousDues: -200,
    alreadyPaid: 300,
    balanceDue: 900,
  });
});

test('uses invoice total quantity and falls back to summed item quantities', () => {
  expect(getInvoiceTotalQuantity({ totalQuantity: 4 }, [20, 30])).toBe(4);
  expect(getInvoiceTotalQuantity({ totalQuantity: '7' }, [])).toBe(7);
  expect(getInvoiceTotalQuantity({}, [1, 0, 2, 1])).toBe(4);
});

test('uses ledger debit and credit direction for adjustment labels', () => {
  const extra = { entryType: 'adjustment', debit: 100, credit: null };
  const discount = { entryType: 'adjustment', debit: null, credit: 50 };
  expect(getStatementDirection(extra)).toEqual({ kind: 'debit', amount: 100 });
  expect(getStatementDirection(discount)).toEqual({ kind: 'credit', amount: 50 });
  expect(getStatementDescription(extra, translate)).toBe('Extra Charge Added');
  expect(getStatementDescription(discount, translate)).toBe('Credit Adjusted');
  expect(getStatementDirection({ debit: null, credit: undefined })).toEqual({ kind: 'none', amount: 0 });
});

test('validates inclusive date boundaries without UTC conversion', () => {
  expect(toLocalDateString(new Date(2026, 8, 21))).toBe('2026-09-21');
  expect(validateInvoicePeriod('2020-01-01', '2026-09-21', '2026-09-21')).toBeNull();
  expect(validateInvoicePeriod('2019-12-31', '2026-09-21', '2026-09-21')).toBe('startBefore2020');
  expect(validateInvoicePeriod('2026-09-01', '2026-09-22', '2026-09-21')).toBe('endAfterToday');
  expect(validateInvoicePeriod('2026-09-22', '2026-09-22', '2026-09-21')).toBe('startAfterToday');
  expect(validateInvoicePeriod('2026-09-21', '2026-09-01', '2026-09-21')).toBe('startAfterEnd');
  expect(validateInvoicePeriod('2026-02-31', '2026-09-01', '2026-09-21')).toBe('invalidStartDate');
});

test('all supported languages include the new billing labels', () => {
  const languages = ['en', 'hi', 'mr', 'bn', 'ta', 'te', 'gu', 'pa'];
  expect(Object.keys(billingTranslations).sort()).toEqual(languages.sort());
  const invoiceKeys = Object.keys(billingTranslations.en.invoices);
  const paymentKeys = Object.keys(billingTranslations.en.payments);
  for (const language of languages) {
    expect(Object.keys(billingTranslations[language].invoices).sort()).toEqual(invoiceKeys.sort());
    expect(Object.keys(billingTranslations[language].payments).sort()).toEqual(paymentKeys.sort());
  }
});
