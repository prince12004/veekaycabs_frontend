import { Document, Page, View, Text, Image, Font, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceCompany } from "./InvoiceDocument";

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
const RED = "#EF4444";

const s = StyleSheet.create({
  page: { fontFamily: "Poppins", fontSize: 8, color: DARK, padding: 20 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  logo: { width: 90, height: 16, objectFit: "contain", marginBottom: 3 },
  tagline: { fontSize: 6, color: MUTED },
  companyBlock: { fontSize: 6.5, color: GRAY, marginTop: 3, lineHeight: 1.25, maxWidth: 230 },

  invoiceTitle: { fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: 1, textAlign: "right" },
  metaBlock: { marginTop: 4, alignItems: "flex-end" },
  metaRow: { flexDirection: "row", gap: 6, marginBottom: 1 },
  metaLabel: { fontSize: 6.7, color: MUTED, width: 65, textAlign: "right" },
  metaValue: { fontSize: 7.2, color: DARK, fontWeight: 600, width: 100, textAlign: "right" },

  divider: { height: 1.2, backgroundColor: ORANGE, marginBottom: 6 },

  twoCol: { flexDirection: "row", gap: 10, marginBottom: 6 },
  card: { flex: 1, backgroundColor: LIGHT, borderRadius: 5, padding: 7 },
  cardTitle: { fontSize: 7, fontWeight: 700, color: ORANGE, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  cardLabel: { fontSize: 6.8, color: MUTED },
  cardValue: { fontSize: 6.8, color: DARK, fontWeight: 600, textAlign: "right", maxWidth: "65%" },

  sectionTitle: { fontSize: 7.5, fontWeight: 700, color: DARK, marginBottom: 3 },

  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 5, overflow: "hidden", marginBottom: 6 },
  tHeadRow: { flexDirection: "row", backgroundColor: DARK, paddingVertical: 3, paddingHorizontal: 7 },
  tHeadCellDesc: { flex: 3, fontSize: 6.6, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 },
  tHeadCellAmt: { flex: 1, fontSize: 6.6, fontWeight: 700, color: "#fff", textAlign: "right", textTransform: "uppercase", letterSpacing: 0.5 },
  tRow: { flexDirection: "row", paddingVertical: 2.6, paddingHorizontal: 7, borderTopWidth: 1, borderTopColor: BORDER },
  tRowAlt: { backgroundColor: LIGHT },
  tCellDesc: { flex: 3, fontSize: 7 },
  tCellAmt: { flex: 1, fontSize: 7, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 7, borderTopWidth: 1.5, borderTopColor: DARK, backgroundColor: "#FFF3ED" },
  totalDesc: { flex: 3, fontSize: 8, fontWeight: 700, color: DARK },
  totalAmt: { flex: 1, fontSize: 8, fontWeight: 700, color: ORANGE, textAlign: "right" },

  balanceStrip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 7, borderRadius: 5, marginBottom: 6 },
  balanceLabel: { fontSize: 8, fontWeight: 600 },
  balanceValue: { fontSize: 11, fontWeight: 700 },

  notesBox: { marginBottom: 6, backgroundColor: LIGHT, borderRadius: 5, padding: 6 },
  notesTitle: { fontSize: 6.8, fontWeight: 700, color: DARK, marginBottom: 2 },
  notesText: { fontSize: 6.8, color: GRAY, lineHeight: 1.3 },

  termsBox: { marginBottom: 6 },
  termsTitle: { fontSize: 6.8, fontWeight: 700, color: DARK, marginBottom: 2 },
  termLine: { fontSize: 5.8, color: GRAY, marginBottom: 1, lineHeight: 1.25 },

  signRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 },
  stampWrap: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.1, borderColor: ORANGE, borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 4, transform: "rotate(-8deg)" },
  stampText: { fontSize: 5, fontWeight: 700, color: ORANGE, textAlign: "center", letterSpacing: 0.2, lineHeight: 1.3 },
  signBlock: { alignItems: "center" },
  signature: { fontFamily: "Signature", fontSize: 16, color: DARK },
  signCaption: { fontSize: 5.8, color: MUTED, marginTop: 1, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 2, width: 110, textAlign: "center" },

  footer: { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 4, textAlign: "center" },
  footerText: { fontSize: 5.6, color: MUTED },
});

const money = (n: number) => `Rs. ${Math.round(n || 0).toLocaleString("en-IN")}`;
const dt = (iso: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "—";

export interface ClosingBillData {
  bookingId: string;
  billNo: string;
  billDate: string;
  customer: { name: string; mobile: string; email: string };
  car: { name: string; regNo: string; type: string; fuel: string };
  start: string;
  end: string;
  nights: number;
  meter: {
    startingMeter: number;
    closingMeter: number;
    totalKms: number;
    kmsLimit: number;
    extraKms: number;
    extraKmRate: number;
    extraKmCharge: number;
  };
  lateReturn: {
    actualReturnTime: string;
    lateHours: number;
    lateHourRate: number;
    lateCharges: number;
  };
  charges: {
    bookingFare: number;
    gst: number;
    discount: number;
    doorstepCharge: number;
    pickupCharges: number;
    dropCharges: number;
    fastagStateTax: number;
    allStateChallan: number;
    overspeedingFine: number;
    fuelCharges: number;
    damageCharges: number;
    washingCharges: number;
    totalCharges: number;
  };
  settlement: {
    advancePaid: number;
    settlementAmount: number; // positive = due from customer, negative = refund to customer
  };
  notes?: string;
  company: InvoiceCompany;
}

export default function ClosingBillDocument({ data }: { data: ClosingBillData }) {
  const { company, meter, lateReturn, charges, settlement } = data;
  const isRefund = settlement.settlementAmount < 0;
  const isSettled = settlement.settlementAmount === 0;

  const chargeRows: Array<[string, number]> = [
    ["Base Rental Fare", charges.bookingFare],
    ...(charges.gst > 0 ? [["GST", charges.gst] as [string, number]] : []),
    ...(charges.discount > 0 ? [["Discount / Coupon", -charges.discount] as [string, number]] : []),
    ...(charges.doorstepCharge > 0 ? [["Doorstep Delivery Charge", charges.doorstepCharge] as [string, number]] : []),
    ...(meter.extraKmCharge > 0 ? [[`Extra KM Charges (${meter.extraKms} km @ ${money(meter.extraKmRate)}/km)`, meter.extraKmCharge] as [string, number]] : []),
    ...(lateReturn.lateCharges > 0 ? [[`Late Return Charges (${lateReturn.lateHours} hrs @ ${money(lateReturn.lateHourRate)}/hr)`, lateReturn.lateCharges] as [string, number]] : []),
    ...(charges.pickupCharges > 0 ? [["Pickup Charges", charges.pickupCharges] as [string, number]] : []),
    ...(charges.dropCharges > 0 ? [["Drop Charges", charges.dropCharges] as [string, number]] : []),
    ...(charges.fastagStateTax > 0 ? [["Fastag / State Tax", charges.fastagStateTax] as [string, number]] : []),
    ...(charges.allStateChallan > 0 ? [["All State Challan", charges.allStateChallan] as [string, number]] : []),
    ...(charges.overspeedingFine > 0 ? [["Overspeeding Fine", charges.overspeedingFine] as [string, number]] : []),
    ...(charges.fuelCharges > 0 ? [["Fuel Charges", charges.fuelCharges] as [string, number]] : []),
    ...(charges.damageCharges > 0 ? [["Damages", charges.damageCharges] as [string, number]] : []),
    ...(charges.washingCharges > 0 ? [["Washing", charges.washingCharges] as [string, number]] : []),
  ];

  return (
    <Document title={`Final Bill ${data.billNo}`}>
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
            <Text style={s.invoiceTitle}>FINAL SETTLEMENT BILL</Text>
            <View style={s.metaBlock}>
              <View style={s.metaRow}><Text style={s.metaLabel}>Bill No</Text><Text style={s.metaValue}>{data.billNo}</Text></View>
              <View style={s.metaRow}><Text style={s.metaLabel}>Bill Date</Text><Text style={s.metaValue}>{dt(data.billDate)}</Text></View>
              <View style={s.metaRow}><Text style={s.metaLabel}>Booking ID</Text><Text style={s.metaValue}>{data.bookingId}</Text></View>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* Guest / Trip details */}
        <View style={s.twoCol}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Guest Details</Text>
            <View style={s.cardRow}><Text style={s.cardLabel}>Name</Text><Text style={s.cardValue}>{data.customer.name}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Mobile</Text><Text style={s.cardValue}>{data.customer.mobile}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Departure</Text><Text style={s.cardValue}>{dt(data.start)}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Arrival</Text><Text style={s.cardValue}>{dt(data.end)}</Text></View>
          </View>
          <View style={s.card}>
            <Text style={s.cardTitle}>Vehicle Details</Text>
            <View style={s.cardRow}><Text style={s.cardLabel}>Cab No</Text><Text style={s.cardValue}>{data.car.regNo}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Vehicle</Text><Text style={s.cardValue}>{data.car.name}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Category</Text><Text style={s.cardValue}>{data.car.type} · {data.car.fuel}</Text></View>
            <View style={s.cardRow}><Text style={s.cardLabel}>Duration</Text><Text style={s.cardValue}>{data.nights} day{data.nights !== 1 ? "s" : ""}</Text></View>
          </View>
        </View>

        {/* Meter & KM table */}
        <Text style={s.sectionTitle}>Meter &amp; KM Summary</Text>
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={s.tHeadCellDesc}>Description</Text>
            <Text style={s.tHeadCellAmt}>Reading</Text>
          </View>
          {[
            ["Starting Meter", `${meter.startingMeter.toLocaleString("en-IN")} km`],
            ["Closing Meter", `${meter.closingMeter.toLocaleString("en-IN")} km`],
            ["Total KMs", `${meter.totalKms.toLocaleString("en-IN")} km`],
            ["KMs Limit", `${meter.kmsLimit.toLocaleString("en-IN")} km`],
            ["Extra KMs", `${meter.extraKms.toLocaleString("en-IN")} km @ ${money(meter.extraKmRate)}/km`],
            ["Scheduled Return", dt(data.end)],
            ...(lateReturn.actualReturnTime ? [["Actual Return", dt(lateReturn.actualReturnTime)]] : []),
            ...(lateReturn.lateHours > 0 ? [["Late By", `${lateReturn.lateHours} hr${lateReturn.lateHours !== 1 ? "s" : ""} @ ${money(lateReturn.lateHourRate)}/hr`]] : []),
          ].map(([label, value], i) => (
            <View key={label} style={i % 2 === 1 ? [s.tRow, s.tRowAlt] : [s.tRow]}>
              <Text style={s.tCellDesc}>{label}</Text>
              <Text style={s.tCellAmt}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Charges table */}
        <Text style={s.sectionTitle}>Charges Breakdown</Text>
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={s.tHeadCellDesc}>Description</Text>
            <Text style={s.tHeadCellAmt}>Amount</Text>
          </View>
          {chargeRows.map(([label, value], i) => (
            <View key={label} style={i % 2 === 1 ? [s.tRow, s.tRowAlt] : [s.tRow]}>
              <Text style={s.tCellDesc}>{label}</Text>
              <Text style={value < 0 ? [s.tCellAmt, { color: GREEN }] : [s.tCellAmt]}>{value < 0 ? "- " : ""}{money(Math.abs(value))}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalDesc}>Total Charges</Text>
            <Text style={s.totalAmt}>{money(charges.totalCharges)}</Text>
          </View>
          <View style={s.tRow}>
            <Text style={s.tCellDesc}>Advance Payment (Security Deposit)</Text>
            <Text style={[s.tCellAmt, { color: GREEN, fontWeight: 700 }]}>{money(settlement.advancePaid)}</Text>
          </View>
        </View>

        <View style={[s.balanceStrip, { backgroundColor: isSettled ? "#D1FAE5" : isRefund ? "#D1FAE5" : "#FFF3ED" }]}>
          <Text style={[s.balanceLabel, { color: isSettled ? "#065F46" : isRefund ? "#065F46" : ORANGE }]}>
            {isSettled ? "Fully Settled" : isRefund ? "Refund Due to Customer" : "Balance Due from Customer"}
          </Text>
          <Text style={[s.balanceValue, { color: isSettled ? "#065F46" : isRefund ? "#065F46" : ORANGE }]}>
            {isSettled ? "Rs. 0" : money(Math.abs(settlement.settlementAmount))}
          </Text>
        </View>

        {data.notes ? (
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>Notes</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {/* Terms */}
        <View style={s.termsBox}>
          <Text style={s.termsTitle}>Terms &amp; Conditions</Text>
          <Text style={s.termLine}>• Any refund due is processed separately by our team within 7 working days of this settlement.</Text>
          <Text style={s.termLine}>• Traffic challans, fines and toll charges incurred during the rental period are the renter's sole responsibility.</Text>
          <Text style={s.termLine}>• This is a computer-generated final settlement bill for the completed rental period.</Text>
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
