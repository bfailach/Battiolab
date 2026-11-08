import React, { useState } from 'react';
import { Alert, MenuItem, TextField } from '@mui/material';
import FormDialog, { FormGrid } from '../shared/FormDialog';
import InvoiceDialog from '../invoice/InvoiceDialog';
import salesService, { Sale } from '../../services/sales.service';
import settingsService from '../../services/settings.service';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency } from '../../utils/format';

/** Diálogos compartidos para una factura: verla, registrar su pago y anularla con nota crédito. */
export const useSaleActions = (onChanged: (sale: Sale) => void) => {
  const { notify } = useUI();
  const [invoice, setInvoice] = useState<Sale | null>(null);
  const [paying, setPaying] = useState<Sale | null>(null);
  const [cancelling, setCancelling] = useState<Sale | null>(null);
  const [methods, setMethods] = useState<string[]>([]);
  const [method, setMethod] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openPay = async (sale: Sale) => {
    setError(null);
    setPaying(sale);
    const s = await settingsService.get('sales').catch(() => ({ paymentMethods: ['Efectivo'] }));
    setMethods(s.paymentMethods);
    setMethod(s.paymentMethods[0] || '');
  };
  const openCancel = (sale: Sale) => {
    setError(null);
    setReason('');
    setCancelling(sale);
  };

  const pay = async () => {
    if (!paying || !method) return setError('Elige el medio de pago');
    setBusy(true);
    try {
      const updated = await salesService.pay(paying.id, method);
      notify(`Pago de ${updated.number} registrado`);
      setPaying(null);
      onChanged(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!cancelling) return;
    if (reason.trim().length < 5) return setError('Explica el motivo (mínimo 5 caracteres)');
    setBusy(true);
    try {
      const updated = await salesService.cancel(cancelling.id, reason.trim());
      notify(`${updated.number} anulada con nota crédito ${updated.creditNote?.number}. El stock fue repuesto.`);
      setCancelling(null);
      onChanged(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const dialogs = (
    <>
      <InvoiceDialog sale={invoice} onClose={() => setInvoice(null)} />
      <FormDialog
        open={Boolean(paying)}
        title={`Registrar pago de ${paying?.number || ''}`}
        description={paying ? `${paying.client.name} paga ${formatCurrency(paying.total)}.` : undefined}
        submitLabel="Registrar pago"
        onClose={() => setPaying(null)}
        onSubmit={pay}
        submitting={busy}
        error={error}
        maxWidth="xs"
      >
        <FormGrid columns={1}>
          <TextField select label="Medio de pago" value={method} onChange={(e) => setMethod(e.target.value)}>
            {methods.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
        </FormGrid>
      </FormDialog>
      <FormDialog
        open={Boolean(cancelling)}
        title={`Anular ${cancelling?.number || ''}`}
        submitLabel="Anular con nota crédito"
        onClose={() => setCancelling(null)}
        onSubmit={cancel}
        submitting={busy}
        error={error}
        maxWidth="xs"
      >
        <FormGrid columns={1}>
          <Alert severity="warning">
            Se genera una nota crédito por el valor total, las unidades vuelven al inventario y la factura deja de contar en los reportes. No se puede deshacer.
          </Alert>
          <TextField
            label="Motivo de la anulación"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
            autoFocus
            helperText="Queda en la nota crédito. Por ejemplo: devolución del producto, error en el cliente o en la cantidad."
          />
        </FormGrid>
      </FormDialog>
    </>
  );

  return { openInvoice: setInvoice, openPay, openCancel, dialogs };
};
