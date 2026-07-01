import { Document, Page, View, Text, Image, Font, StyleSheet } from "@react-pdf/renderer";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "/fonts/Poppins-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Poppins-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Poppins-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Poppins-Bold.ttf", fontWeight: 700 },
  ],
});
Font.register({ family: "Signature", src: "/fonts/Pacifico-Regular.ttf" });

const ORANGE = "#E8540A";
const DARK = "#0F0F1A";
const GRAY = "#4A4A6A";
const MUTED = "#9090A8";
const BORDER = "#E4E5EF";
const LIGHT = "#F8F9FC";
const GREEN = "#10B981";

const s = StyleSheet.create({
  page: { fontFamily: "Poppins", fontSize: 9, color: DARK, padding: 28 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  logo: { width: 105, height: 19, objectFit: "contain", marginBottom: 5 },
  tagline: { fontSize: 7, color: MUTED },
  companyBlock: { fontSize: 7.5, color: GRAY, marginTop: 5, lineHeight: 1.45, maxWidth: 230 },

  invoiceTitle: { fontSize: 17, fontWeight: 700, color: ORANGE, letterSpacing: 1, textAlign: "right" },
  metaBlock: { marginTop: 6, alignItems: "flex-end" },
  metaRow: { flexDirection: "row", gap: 6, marginBottom: 2 },
  metaLabel: { fontSize: 7.5, color: MUTED, width: 70, textAlign: "right" },
  metaValue: { fontSize: 8, color: DARK, fontWeight: 600, width: 110, textAlign: "right" },

  statusBadge: { marginTop: 6, alignSelf: "flex-end", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 4, fontSize: 7.5, fontWeight: 700 },

  divider: { height: 1.5, backgroundColor: ORANGE, marginBottom: 10 },

  twoCol: { flexDirection: "row", gap: 12, marginBottom: 10 },
  card: { flex: 1, backgroundColor: LIGHT, borderRadius: 6, padding: 10 },
  cardTitle: { fontSize: 8, fontWeight: 700, color: ORANGE, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3.5 },
  cardLabel: { fontSize: 7.8, color: MUTED },
  cardValue: { fontSize: 7.8, color: DARK, fontWeight: 600, textAlign: "right", maxWidth: "65%" },

  sectionTitle: { fontSize: 8.5, fontWeight: 700, color: DARK, marginBottom: 6 },

  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, overflow: "hidden", marginBottom: 10 },
  tHeadRow: { flexDirection: "row", backgroundColor: DARK, paddingVertical: 5.5, paddingHorizontal: 9 },
  tHeadCellDesc: { flex: 3, fontSize: 7.8, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 },
  tHeadCellAmt: { flex: 1, fontSize: 7.8, fontWeight: 700, color: "#fff", textAlign: "right", textTransform: "uppercase", letterSpacing: 0.5 },
  tRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 9, borderTopWidth: 1, borderTopColor: BORDER },
  tRowAlt: { backgroundColor: LIGHT },
  tCellDesc: { flex: 3, fontSize: 8.3 },
  tCellAmt: { flex: 1, fontSize: 8.3, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 9, borderTopWidth: 1.5, borderTopColor: DARK, backgroundColor: "#FFF3ED" },
  totalDesc: { flex: 3, fontSize: 9.5, fontWeight: 700, color: DARK },
  totalAmt: { flex: 1, fontSize: 9.5, fontWeight: 700, color: ORANGE, textAlign: "right" },

  balanceStrip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 9, borderRadius: 6, marginBottom: 10 },
  balanceLabel: { fontSize: 8.3, fontWeight: 600 },
  balanceValue: { fontSize: 11.5, fontWeight: 700 },

  termsBox: { marginBottom: 12 },
  termsTitle: { fontSize: 7.8, fontWeight: 700, color: DARK, marginBottom: 4 },
  termLine: { fontSize: 6.7, color: GRAY, marginBottom: 2, lineHeight: 1.35 },

  signRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 },
  stampWrap: { width: 62, height: 62, borderRadius: 31, borderWidth: 1.3, borderColor: ORANGE, borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 5, transform: "rotate(-8deg)" },
  stampText: { fontSize: 6, fontWeight: 700, color: ORANGE, textAlign: "center", letterSpacing: 0.3, lineHeight: 1.4 },
  signBlock: { alignItems: "center" },
  signature: { fontFamily: "Signature", fontSize: 21, color: DARK },
  signCaption: { fontSize: 6.8, color: MUTED, marginTop: 2, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 3, width: 120, textAlign: "center" },

  footer: { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, textAlign: "center" },
  footerText: { fontSize: 6.5, color: MUTED },
});

const money = (n: number) => `Rs. ${Math.round(n || 0).toLocaleString("en-IN")}`;
const dt = (iso: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "—";

export interface InvoiceCompany {
  companyName: string;
  tagline?: string;
  gstNumber?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  website?: string;
  addressDelhi?: string;
}

export interface InvoiceData {
  bookingId: string;
  invoiceNo: string;
  invoiceDate: string;
  status: string;
  customer: { name: string; mobile: string; email: string };
  car: { name: string; regNo: string; type: string; fuel: string };
  start: string;
  end: string;
  nights: number;
  bookingType: string;
  doorstep: boolean;
  pickupLocation: string;
  deliveryAddress?: string | null;
  payment: {
    bookingFare: number;
    gst: number;
    discount: number;
    doorstepCharge: number;
    extraKmCharge: number;
    securityDeposit: number;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    mode: string;
    status: string;
  };
  company: InvoiceCompany;
}

const STATUS_COLORS: Record<string, [string, string]> = {
  Success: ["#D1FAE5", "#065F46"],
  Partial: ["#FEF3C7", "#92400E"],
  Pending: ["#FEE2E2", "#991B1B"],
};

export default function InvoiceDocument({ data }: { data: InvoiceData }) {
  const { company, payment } = data;
  const badgeColors = STATUS_COLORS[payment.status] || STATUS_COLORS.Pending;
  const balanceOk = payment.balanceDue <= 0;

  return (
    <Document title={`Invoice ${data.invoiceNo}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src="/logo.png" style={s.logo} />
            <Text style={s.tagline}>{company.tagline || "Delhi NCR's Most Trusted Self-Drive Car Rental"}</Text>
            <Text style={s.companyBlock}>
              {company.addressDelhi}
              {"\n"}
              {[company.phone1, company.phone2].filter(Boolean).join("  |  ")}
              {"\n"}
              {[company.email, company.website].filter(Boolean).join("  |  ")}
              {company.gstNumber ? `\nGSTIN: ${company.gstNumber}` : ""}
            </Text>
          </View>
          <View>
            <Text style={s.invoiceTitle}>TAX INVOICE</Text>
            <View style={s.metaBlock}>
              <View style={s.metaRow}><Text style={s.metaLabel}>Invoice No</Text><Text style={s.metaValue}>{data.invoiceNo}</Text></View>
              <View style={s.metaRow}><Text style={s.metaLabel}>Invoice Date</Text><Text style={s.metaValue}>{dt(data.invoiceDate)}</Text></View>
              <View style={s.metaRow}><Text style={s.metaLabel}>Booking ID</Text><Text style={s.metaValue}>{data.bookingId}</Text></View>
            </View>
            <Text style={[s.statusBadge, { backgroundColor: badgeColors[0], color: badgeColors[1] }]}>
              PAYMENT {payment.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Bill To / Booking details */}
        <View style={s.twoCol}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Billed To</Text>
            <View style={s.cardRow}><Text style={s.cardLabel}>Name</Text><Text style={s.cardValue}>{data.customer.name}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Mobile</Text><Text style={s.cardValue}>{data.customer.mobile}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Email</Text><Text style={s.cardValue}>{data.customer.email}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Booking Type</Text><Text style={s.cardValue}>{data.bookingType}</Text></View>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Vehicle & Rental Details</Text>
            <View style={s.cardRow}><Text style={s.cardLabel}>Vehicle</Text><Text style={s.cardValue}>{data.car.name} ({data.car.regNo})</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Category</Text><Text style={s.cardValue}>{data.car.type} · {data.car.fuel}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Pickup</Text><Text style={s.cardValue}>{dt(data.start)}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Return</Text><Text style={s.cardValue}>{dt(data.end)}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Duration</Text><Text style={s.cardValue}>{data.nights} day{data.nights !== 1 ? "s" : ""}</Text></View>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>{data.doorstep ? "Delivery Address" : "Pickup Location"}</Text>
              <Text style={s.cardValue}>{data.doorstep ? data.deliveryAddress || "—" : data.pickupLocation}</Text>
            </View>
          </View>
        </View>

        {/* Charges table — every row is a real stored field, nothing recomputed/guessed */}
        <Text style={s.sectionTitle}>Charges Breakdown</Text>
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={s.tHeadCellDesc}>Description</Text>
            <Text style={s.tHeadCellAmt}>Amount</Text>
          </View>
          <View style={s.tRow}>
            <Text style={s.tCellDesc}>Base Rental Fare ({data.nights} day{data.nights !== 1 ? "s" : ""} · {data.car.name})</Text>
            <Text style={s.tCellAmt}>{money(payment.bookingFare)}</Text>
          </View>
          {payment.gst > 0 && (
            <View style={[s.tRow, s.tRowAlt]}>
              <Text style={s.tCellDesc}>GST</Text>
              <Text style={s.tCellAmt}>{money(payment.gst)}</Text>
            </View>
          )}
          {payment.discount > 0 && (
            <View style={s.tRow}>
              <Text style={s.tCellDesc}>Discount / Coupon</Text>
              <Text style={[s.tCellAmt, { color: GREEN }]}>- {money(payment.discount)}</Text>
            </View>
          )}
          {data.doorstep && payment.doorstepCharge > 0 && (
            <View style={[s.tRow, s.tRowAlt]}>
              <Text style={s.tCellDesc}>Doorstep Delivery Charge</Text>
              <Text style={s.tCellAmt}>{money(payment.doorstepCharge)}</Text>
            </View>
          )}
          {payment.extraKmCharge > 0 && (
            <View style={s.tRow}>
              <Text style={s.tCellDesc}>Extra KM Charges</Text>
              <Text style={s.tCellAmt}>{money(payment.extraKmCharge)}</Text>
            </View>
          )}
          <View style={[s.tRow, s.tRowAlt]}>
            <Text style={s.tCellDesc}>Security Deposit (Refundable)</Text>
            <Text style={s.tCellAmt}>{money(payment.securityDeposit)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalDesc}>Total Amount</Text>
            <Text style={s.totalAmt}>{money(payment.totalAmount)}</Text>
          </View>
          <View style={s.tRow}>
            <Text style={s.tCellDesc}>Amount Paid ({payment.mode})</Text>
            <Text style={[s.tCellAmt, { color: GREEN, fontWeight: 700 }]}>{money(payment.amountPaid)}</Text>
          </View>
        </View>

        <View style={[s.balanceStrip, { backgroundColor: balanceOk ? "#D1FAE5" : "#FEE2E2" }]}>
          <Text style={[s.balanceLabel, { color: balanceOk ? "#065F46" : "#991B1B" }]}>
            {balanceOk ? "Balance Settled" : "Balance Due from Customer"}
          </Text>
          <Text style={[s.balanceValue, { color: balanceOk ? "#065F46" : "#991B1B" }]}>{money(Math.abs(payment.balanceDue))}</Text>
        </View>

        {/* Terms */}
        <View style={s.termsBox}>
          <Text style={s.termsTitle}>Terms & Conditions</Text>
          <Text style={s.termLine}>• Vehicle must be returned with the same fuel level; shortfall is charged at Rs. 120/litre (petrol) or Rs. 100/litre (diesel) from the deposit.</Text>
          <Text style={s.termLine}>• Security deposit is refunded within 7 working days of return, subject to no damage, no violations, on-time return and no dues.</Text>
          <Text style={s.termLine}>• Extra kilometres beyond the included limit are charged as per the applicable per-km rate for the vehicle category.</Text>
          <Text style={s.termLine}>• Traffic challans, fines and toll charges incurred during the rental period are the renter's sole responsibility.</Text>
          <Text style={s.termLine}>• This is a computer-generated tax invoice and constitutes a valid proof of booking and payment.</Text>
        </View>

        {/* Signature */}
        <View style={s.signRow}>
          <View style={s.stampWrap}>
            <Text style={s.stampText}>VEEKAY CABS{"\n"}◆ VERIFIED ◆{"\n"}AUTHORIZED</Text>
          </View>
          <View style={s.signBlock}>
            <Text style={s.signature}>{company.companyName || "Veekay Cabs"}</Text>
            <Text style={s.signCaption}>Authorized Signatory</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>{company.companyName || "Veekay Cabs"} · {company.website || "veekaycabs.com"} · {company.email}</Text>
          <Text style={s.footerText}>Thank you for choosing us. Drive safe!</Text>
        </View>
      </Page>
    </Document>
  );
}
