import { Sale } from '../../services/sales.service';
import { CompanySettings, taxRegimeLabel } from '../../services/settings.service';
import { formatDocument, formatPhone, docLabel, FINAL_CONSUMER_DOCUMENT } from '../../utils/validation';
import { amountInWords } from '../../utils/numberToWords';

const esc = (s?: string | number | null) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const dateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const date = (d?: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

export const hasResolution = (c: CompanySettings) => Boolean(c.resolutionNumber && c.resolutionTo);
export const missingCompanyData = (c: CompanySettings) =>
  [
    !c.legalName && 'razón social',
    !c.nit && 'NIT',
    !c.address && 'dirección',
    !c.city && 'ciudad',
    !hasResolution(c) && 'resolución de facturación DIAN'
  ].filter(Boolean) as string[];

/**
 * Representación gráfica de la factura, como documento HTML imprimible.
 * Sigue los requisitos del art. 617 del E.T. y del art. 11 de la Resolución DIAN 000165 de 2023
 * que dependen del sistema. CUFE, firma digital y QR los asigna el proveedor tecnológico al validar.
 */
export const invoiceHtml = (sale: Sale, c: CompanySettings) => {
  const isInvoice = hasResolution(c);
  const title = isInvoice ? 'Factura electrónica de venta' : 'Comprobante de venta';
  const cancelled = sale.status === 'cancelled';
  const cu = sale.customer || { name: sale.client.name };
  const finalConsumer = cu.document === FINAL_CONSUMER_DOCUMENT;
  const lines = sale.items
    .map(
      (i, idx) => `<tr>
        <td class="c">${idx + 1}</td>
        <td>${esc(i.sku)}</td>
        <td>${esc(i.productName)}</td>
        <td class="r">${i.quantity}</td>
        <td class="c">${esc(i.unit || 'UND')}</td>
        <td class="r">${money(i.price)}</td>
        <td class="r">${i.taxRate} %</td>
        <td class="r">${money(i.taxAmount)}</td>
        <td class="r b">${money(i.total)}</td>
      </tr>`
    )
    .join('');
  const taxRows = (sale.taxes?.length ? sale.taxes : [{ rate: 0, base: sale.subtotal, amount: 0 }])
    .map((t) => `<tr><td>${t.rate ? `IVA ${t.rate} %` : 'Excluido / 0 %'} <span class="m">sobre ${money(t.base)}</span></td><td class="r">${money(t.amount)}</td></tr>`)
    .join('');
  const issuer = c.legalName || c.tradeName || 'Battiolab';
  const resolution = isInvoice
    ? `Autorización de numeración de facturación DIAN No. ${esc(c.resolutionNumber)} del ${date(c.resolutionDate)}, prefijo ${esc(c.resolutionPrefix) || 'sin prefijo'}, del ${esc(c.resolutionPrefix)}${c.resolutionFrom} al ${esc(c.resolutionPrefix)}${c.resolutionTo}${c.resolutionValidUntil ? `, vigente hasta el ${date(c.resolutionValidUntil)}` : ''}.`
    : 'Documento interno sin resolución de facturación DIAN. No reemplaza la factura electrónica de venta.';

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)} ${esc(sale.number)}</title>
<style>
  @page { size: letter; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Figtree Variable", "Segoe UI", system-ui, sans-serif; color: #111; margin: 0; padding: 28px; font-size: 11.5px; line-height: 1.45; background: #fff; }
  .top { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 2px; }
  .m { color: #666; }
  .box { border: 1.5px solid #111; border-radius: 10px; padding: 12px 14px; }
  .doc-title { font-size: 12px; font-weight: 800; text-transform: none; margin: 0; }
  .doc-number { font-size: 26px; font-weight: 800; margin: 2px 0 8px; letter-spacing: -0.01em; }
  .kv { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; }
  .kv span:nth-child(odd) { color: #666; }
  .res { margin: 14px 0; padding: 8px 12px; background: #f4f4f2; border-radius: 8px; font-size: 10.5px; }
  h3 { font-size: 11px; margin: 18px 0 6px; color: #666; font-weight: 700; }
  .buyer { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 24px; }
  table { width: 100%; border-collapse: collapse; }
  .items th { text-align: left; font-size: 10px; color: #666; font-weight: 700; padding: 6px 6px; border-bottom: 1.5px solid #111; }
  .items td { padding: 7px 6px; border-bottom: 1px solid #e3e3e0; vertical-align: top; }
  .r { text-align: right; white-space: nowrap; } .c { text-align: center; } .b { font-weight: 700; }
  .bottom { display: grid; grid-template-columns: 1fr 300px; gap: 24px; margin-top: 16px; align-items: start; }
  .totals td { padding: 4px 0; }
  .grand td { border-top: 2px solid #111; padding-top: 8px; font-size: 16px; font-weight: 800; }
  .words { font-weight: 700; }
  .cufe { margin-top: 18px; display: grid; grid-template-columns: 84px 1fr; gap: 12px; align-items: center; border-top: 1px solid #e3e3e0; padding-top: 12px; font-size: 10px; }
  .qr { width: 84px; height: 84px; border: 1.5px dashed #999; border-radius: 6px; display: grid; place-items: center; text-align: center; color: #888; font-size: 9px; padding: 4px; }
  .void { margin: 14px 0; padding: 10px 14px; border: 2px solid #c62828; color: #c62828; border-radius: 10px; font-weight: 700; }
  .stamp { position: fixed; top: 38%; left: 0; right: 0; text-align: center; font-size: 110px; font-weight: 900; color: rgba(198,40,40,0.12); transform: rotate(-18deg); pointer-events: none; }
  .foot { margin-top: 16px; font-size: 9.5px; color: #666; }
</style></head><body>
${cancelled ? '<div class="stamp">ANULADA</div>' : ''}
<div class="top">
  <div>
    <p class="brand">${esc(c.tradeName || issuer)}</p>
    ${c.tradeName && c.legalName && c.tradeName !== c.legalName ? `<div>${esc(c.legalName)}</div>` : ''}
    <div><b>NIT ${c.nit ? formatDocument('NIT', c.nit, c.checkDigit) : '<span class="m">sin registrar</span>'}</b></div>
    <div>${esc(taxRegimeLabel[c.taxRegime] || '')}${c.taxNotes ? `. ${esc(c.taxNotes)}` : ''}</div>
    <div>${esc(c.address)}${c.city ? `, ${esc(c.city)}` : ''}</div>
    <div>${c.phone ? `Tel. ${formatPhone(c.phone)}` : ''}${c.email ? `${c.phone ? ', ' : ''}${esc(c.email)}` : ''}</div>
    ${c.website ? `<div>${esc(c.website)}</div>` : ''}
  </div>
  <div class="box">
    <p class="doc-title">${esc(title)}</p>
    <p class="doc-number">${esc(sale.number || 'Sin número')}</p>
    <div class="kv">
      <span>Expedición</span><span>${dateTime(sale.date)}</span>
      <span>Forma de pago</span><span>${sale.paymentForm === 'credito' ? 'Crédito' : 'Contado'}</span>
      ${sale.paymentForm === 'credito' && sale.dueDate ? `<span>Vencimiento</span><span>${date(sale.dueDate)}</span>` : ''}
      <span>Medio de pago</span><span>${esc(sale.paymentMethod || (sale.paymentForm === 'credito' ? 'Pendiente' : ''))}</span>
    </div>
  </div>
</div>

<div class="res">${resolution}</div>

${cancelled && sale.creditNote ? `<div class="void">Anulada mediante nota crédito ${esc(sale.creditNote.number)} del ${date(sale.creditNote.date)}. Motivo: ${esc(sale.creditNote.reason)}</div>` : ''}

<h3>Adquirente</h3>
<div class="buyer">
  <div><b>${esc(cu.name)}</b></div>
  <div>${finalConsumer ? 'Consumidor final' : `${docLabel(cu.documentType)} ${formatDocument(cu.documentType, cu.document, cu.checkDigit)}`}</div>
  ${cu.address || cu.city ? `<div>${esc(cu.address)}${cu.city ? `${cu.address ? ', ' : ''}${esc(cu.city)}` : ''}</div>` : ''}
  ${cu.phone || cu.email ? `<div>${cu.phone ? formatPhone(cu.phone) : ''}${cu.email ? `${cu.phone ? ', ' : ''}${esc(cu.email)}` : ''}</div>` : ''}
</div>

<h3>Detalle</h3>
<table class="items">
  <thead><tr><th class="c">#</th><th>Código</th><th>Descripción</th><th class="r">Cant.</th><th class="c">U. M.</th><th class="r">Valor unitario</th><th class="r">IVA</th><th class="r">Valor IVA</th><th class="r">Total</th></tr></thead>
  <tbody>${lines}</tbody>
</table>

<div class="bottom">
  <div>
    <h3 style="margin-top:0">Valor en letras</h3>
    <div class="words">${amountInWords(sale.total)}</div>
    ${sale.notes ? `<h3>Observaciones</h3><div>${esc(sale.notes)}</div>` : ''}
  </div>
  <table class="totals">
    <tr><td>Subtotal</td><td class="r">${money(sale.subtotal)}</td></tr>
    ${taxRows}
    <tr><td>Total ítems</td><td class="r">${sale.items.reduce((s, i) => s + i.quantity, 0)}</td></tr>
    <tr class="grand"><td>Total a pagar</td><td class="r">${money(sale.total)}</td></tr>
  </table>
</div>

<div class="cufe">
  <div class="qr">QR asignado al validar en la DIAN</div>
  <div>
    <div><b>CUFE:</b> ${isInvoice ? 'pendiente de validación por el proveedor tecnológico' : 'no aplica'}</div>
    <div class="m">${isInvoice ? 'Representación gráfica de la factura electrónica de venta. Tiene validez una vez la DIAN la valide y se asigne el CUFE, la firma digital y el código QR.' : 'Este comprobante es de uso interno. Para expedir facturas electrónicas registra la resolución DIAN en Empresa y transmítelas por un proveedor tecnológico.'}</div>
  </div>
</div>

<div class="foot">
  ${c.invoiceFooter ? `${esc(c.invoiceFooter)}<br>` : ''}
  Elaborada por ${esc(sale.createdBy || '')} con Battiolab ERP, software propio de ${esc(issuer)}${c.nit ? ` (NIT ${formatDocument('NIT', c.nit, c.checkDigit)})` : ''}.
</div>
</body></html>`;
};
