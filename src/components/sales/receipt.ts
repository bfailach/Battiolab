import { Sale, saleStatusLabel } from '../../services/sales.service';
import { formatCurrency, formatDateTime } from '../../utils/format';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Abre una ventana con el comprobante de la venta listo para imprimir o guardar en PDF. */
export const printReceipt = (sale: Sale) => {
  const w = window.open('', '_blank', 'width=420,height=640');
  if (!w) return false;
  const rows = sale.items
    .map(
      (i) =>
        `<tr><td>${i.quantity} × ${esc(i.productName || '')}<br><small>${formatCurrency(i.price)} c/u</small></td><td class="r">${formatCurrency(i.subtotal)}</td></tr>`
    )
    .join('');
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comprobante ${esc(sale.number || sale.id)}</title>
<style>
  body{font-family:system-ui,sans-serif;color:#221D33;margin:24px;font-size:13px}
  h1{font-size:18px;margin:0}
  .muted{color:#625C78}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  td{padding:6px 0;border-bottom:1px solid #E4E2EC;vertical-align:top}
  .r{text-align:right;white-space:nowrap}
  .tot td{border:none;padding:3px 0}
  .grand td{font-weight:700;font-size:15px;border-top:2px solid #221D33;padding-top:8px}
</style></head><body>
  <h1>Battiolab</h1>
  <div class="muted">Vehículos eléctricos: venta y taller</div>
  <p><strong>Comprobante ${esc(sale.number || '')}</strong><br>${formatDateTime(sale.date)}<br>
  Cliente: ${esc(sale.client.name)}<br>Estado: ${saleStatusLabel[sale.status]}${sale.paymentMethod ? `<br>Pago: ${esc(sale.paymentMethod)}` : ''}</p>
  <table>${rows}</table>
  <table>
    <tr class="tot"><td>Subtotal</td><td class="r">${formatCurrency(sale.subtotal)}</td></tr>
    ${sale.taxRate ? `<tr class="tot"><td>Impuesto (${sale.taxRate} %)</td><td class="r">${formatCurrency(sale.taxAmount)}</td></tr>` : ''}
    <tr class="grand"><td>Total</td><td class="r">${formatCurrency(sale.total)}</td></tr>
  </table>
  ${sale.notes ? `<p class="muted">${esc(sale.notes)}</p>` : ''}
  <p class="muted">Gracias por tu compra.</p>
  <script>window.onload=function(){window.print()}</script>
</body></html>`);
  w.document.close();
  return true;
};
