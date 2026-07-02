import type { InvoiceData } from "@/components/admin/InvoiceDocument";

export async function generateInvoiceBlob(data: InvoiceData): Promise<Blob> {
  const [{ pdf }, { default: InvoiceDocument }, { createElement }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/admin/InvoiceDocument"),
    import("react"),
  ]);

  return pdf(createElement(InvoiceDocument, { data }) as any).toBlob();
}

export async function downloadInvoicePdf(data: InvoiceData) {
  const blob = await generateInvoiceBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${data.invoiceNo}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
