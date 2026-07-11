import type { ClosingBillData } from "@/components/admin/ClosingBillDocument";

export async function generateClosingBillBlob(data: ClosingBillData): Promise<Blob> {
  const [{ pdf }, { default: ClosingBillDocument }, { createElement }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/admin/ClosingBillDocument"),
    import("react"),
  ]);

  return pdf(createElement(ClosingBillDocument, { data }) as any).toBlob();
}

export async function downloadClosingBillPdf(data: ClosingBillData) {
  const blob = await generateClosingBillBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Final-Bill-${data.billNo}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
