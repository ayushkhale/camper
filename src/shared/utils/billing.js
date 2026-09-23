const numberFrom = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const number = typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^\d.-]/g, ''));
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

export const getInvoiceAmounts = (invoice = {}) => {
  const breakdown = invoice.breakdown || {};
  const thisInvoiceTotal = numberFrom(
    breakdown.thisInvoiceTotal,
    invoice.totalAmount,
    invoice.currentCharges,
    invoice.displayGrandTotal,
  );
  const extraCharges = numberFrom(breakdown.extraCharges, invoice.extraTotal);
  const discounts = numberFrom(breakdown.discounts, invoice.discountTotal);
  const alreadyPaid = numberFrom(breakdown.alreadyPaid, invoice.amountPaid, invoice.displayAmountPaid);

  return {
    deliveryCharges: numberFrom(
      breakdown.deliveryCharges,
      thisInvoiceTotal - extraCharges + discounts,
    ),
    extraCharges,
    discounts,
    thisInvoiceTotal,
    previousDues: numberFrom(breakdown.previousDues, invoice.previousDues),
    alreadyPaid,
    balanceDue: Math.max(0, numberFrom(
      breakdown.balanceDue,
      invoice.balanceDue,
      thisInvoiceTotal - alreadyPaid,
    )),
  };
};

export const getInvoiceTotalQuantity = (invoice = {}, itemQuantities = []) => {
  const payloadQuantity = invoice.totalQuantity;
  if (payloadQuantity !== null && payloadQuantity !== undefined && payloadQuantity !== '') {
    return Math.max(0, numberFrom(payloadQuantity));
  }

  return itemQuantities.reduce(
    (total, quantity) => total + Math.max(0, numberFrom(quantity)),
    0,
  );
};

export const getInvoiceStatusText = (invoice, t, formatCurrency) => {
  const status = invoice?.status;
  const balanceDue = getInvoiceAmounts(invoice).balanceDue;
  if (status === 'paid') return t('invoices.paid');
  if (status === 'partially_paid') {
    return `${t('invoices.partiallyPaid')} — ${formatCurrency(balanceDue)} ${t('invoices.balanceDue')}`;
  }
  if (status === 'pending') {
    return `${t('invoices.unpaid')} — ${formatCurrency(balanceDue)} ${t('invoices.balanceDue')}`;
  }
  return invoice?.statusLabel || t('invoices.pending');
};

export const getStatementDescription = (entry, t) => {
  switch (entry?.entryType) {
    case 'delivery_charge': return t('invoices.deliveryCharges');
    case 'payment_received': return t('payments.paymentReceived');
    case 'opening_balance': return t('customerDetail.openingBalance');
    case 'adjustment':
      if (entry.debit != null) return t('payments.extraChargeAdded');
      if (entry.credit != null) return t('payments.creditAdjusted');
      return entry.description || '';
    case 'deposit_to_bill': return entry.referenceNote || entry.description || t('payments.depositToBill');
    default: return entry?.description || '';
  }
};

export const getStatementDirection = entry => {
  if (entry?.debit != null) return { kind: 'debit', amount: numberFrom(entry.debit) };
  if (entry?.credit != null) return { kind: 'credit', amount: numberFrom(entry.credit) };
  return { kind: 'none', amount: 0 };
};

export const toLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return toLocalDateString(date) === value ? date : null;
};

export const validateInvoicePeriod = (start, end, today = toLocalDateString()) => {
  if (!parseLocalDate(start)) return 'invalidStartDate';
  if (!parseLocalDate(end)) return 'invalidEndDate';
  if (start < '2020-01-01') return 'startBefore2020';
  if (start > today) return 'startAfterToday';
  if (end > today) return 'endAfterToday';
  if (end < start) return 'startAfterEnd';
  return null;
};
