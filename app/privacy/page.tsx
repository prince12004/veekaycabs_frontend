"use client";
import PageLayout from "@/components/layout/PageLayout";
import { Shield } from "lucide-react";

const sections = [
  {
    id: "collection",
    title: "1. Information We Collect",
    content: `We collect the following information when you use Veekay Cabs:

Personal Identification:
• Name, mobile number, email address
• Date of birth (from KYC documents)
• Residential address

KYC Documents:
• Aadhaar Card (stored masked: XXXX XXXX 1234)
• PAN Card number
• Driving Licence number and details

Usage Data:
• Booking history and preferences
• Vehicle GPS location during rental period
• Device information and IP address
• App/website usage patterns`,
  },
  {
    id: "usage",
    title: "2. How We Use Your Information",
    content: `Your information is used to:
• Verify your identity for vehicle rental (KYC compliance)
• Process bookings and payments
• Send booking confirmations and updates via SMS/WhatsApp/email
• Monitor vehicle location for safety during rental
• Improve our services and personalise your experience
• Comply with legal and regulatory requirements
• Send promotional offers (only with your consent)`,
  },
  {
    id: "sharing",
    title: "3. Information Sharing",
    content: `We do NOT sell your personal data to third parties. We may share information with:

Service Providers:
• Payment processors (Razorpay) — for transaction processing
• KYC verification agencies (Karza/Signzy) — for document verification
• SMS/WhatsApp providers (MSG91/WATI) — for communications
• Cloud storage (AWS S3) — for secure document storage

Legal Requirements:
• Government/law enforcement authorities when legally required
• In response to court orders or legal processes`,
  },
  {
    id: "security",
    title: "4. Data Security",
    content: `We implement industry-standard security measures:
• All data transmitted over HTTPS/TLS encryption
• Aadhaar numbers stored in masked format only
• Passwords and sensitive data encrypted with bcrypt
• Regular security audits and vulnerability assessments
• Limited employee access to personal data on need-to-know basis
• AWS S3 server-side encryption for stored documents`,
  },
  {
    id: "cookies",
    title: "5. Cookies",
    content: `We use cookies and similar technologies to:
• Keep you logged in between sessions
• Remember your preferences (city, car type)
• Analyse website traffic (Google Analytics)
• Improve user experience

You can disable cookies in your browser settings, but this may affect functionality.`,
  },
  {
    id: "rights",
    title: "6. Your Rights",
    content: `You have the right to:
• Access your personal data we hold
• Request correction of inaccurate information
• Request deletion of your account and data
• Withdraw consent for marketing communications
• Data portability (receive your data in a machine-readable format)

To exercise these rights, contact us at privacy@veekaycabs.com`,
  },
  {
    id: "retention",
    title: "7. Data Retention",
    content: `We retain your data for:
• Active accounts: as long as the account is active
• Booking records: 7 years (for legal/tax compliance)
• KYC documents: 5 years from last transaction
• Deleted accounts: 90 days before permanent deletion

GPS data during rental: retained for 90 days after rental completion.`,
  },
  {
    id: "children",
    title: "8. Children's Privacy",
    content: `Our services are not directed to persons under 18 years of age. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a minor, please contact us immediately for deletion.`,
  },
  {
    id: "contact",
    title: "9. Contact / Data Protection Officer",
    content: `For any privacy concerns or data requests:
Email: privacy@veekaycabs.com
Phone: +91 99999 26867
Address: A 13, 1st Floor, Ganesh Nagar, New Delhi 110092

We aim to respond to all requests within 30 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] py-20 pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8540A]/10 border border-[#E8540A]/25 text-[#E8540A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Shield size={14} />
            Privacy
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white font-syne mb-4">Privacy Policy</h1>
          <p className="text-white/60 text-lg">Last updated: June 1, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-[#E4E5EF] p-8 lg:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <p className="text-[#4A4A6A] leading-relaxed mb-8 text-base border-l-4 border-[#E8540A] pl-4 bg-[#FFF3ED] py-3 pr-4 rounded-r-lg">
            At Veekay Cabs, we are committed to protecting your privacy and ensuring the security of your personal information.
          </p>
          <div className="space-y-10">
            {sections.map((s) => (
              <div key={s.id} id={s.id}>
                <h2 className="text-xl font-bold text-[#0F0F1A] mb-4 font-syne flex items-center gap-3">
                  <span className="w-2 h-6 bg-[#E8540A] rounded-full inline-block" />
                  {s.title}
                </h2>
                <p className="text-[#4A4A6A] leading-relaxed whitespace-pre-line text-sm">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
