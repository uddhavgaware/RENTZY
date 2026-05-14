import React from 'react';
import { FileText, Shield, AlertTriangle } from 'lucide-react';

const TermsPage = () => {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using the RentXY platform ("Service"), you agree to be legally bound by these Terms of Service. If you do not agree to these terms, please refrain from using our platform immediately. RentXY reserves the right to update or modify these terms at any time without prior notice. Your continued use of the Service after any such modifications constitutes your legally binding acceptance of the new terms.`
    },
    {
      title: '2. Liability & Dispute Disclaimer',
      content: `RentXY functions solely as an introductory marketplace to connect prospective tenants with property owners and movers. We are strictly not a party to any lease, rental, or moving agreements signed between users. RentXY IS NOT RESPONSIBLE FOR ANY PROBLEMS, DISPUTES, OR FINANCIAL LOSSES AFTER BOOKING AND PAYMENT ARE DONE. Any disputes regarding property condition, unpaid rent, or breach of contract must be resolved directly between the tenant and the owner/vendor.`
    },
    {
      title: '3. Booking & Payment Policies',
      content: `All monetary transactions, deposits, and rent payments are direct agreements between the tenant and the owner. WE EXPRESSLY DISCLAIM ALL LIABILITY FOR REFUNDS. Once a booking or payment is processed, whether online or offline, RentXY assumes zero responsibility for refunds, partial returns, or chargebacks under any circumstances.`
    },
    {
      title: '4. Property Listings and Accuracy',
      content: `Property owners and agents who list on RentXY must ensure that all listing information is accurate, up-to-date, and not misleading. RentXY does not verify the physical condition, legality, or safety of listed properties. Listing fraudulent or misrepresented properties constitutes a violation of these terms and may result in immediate account termination, withholding of funds, and legal action.`
    },
    {
      title: '5. KYC Verification',
      content: `RentXY offers an optional KYC (Know Your Customer) verification system utilizing government-issued identification. A "Verified" badge strictly indicates that the user's uploaded identity matches public records at the time of verification. It DOES NOT constitute an endorsement, guarantee, or warranty of the user's character, financial stability, or reliability. You must conduct your own independent background checks.`
    },
    {
      title: '6. Roommate Matching Risk Acknowledgment',
      content: `The roommate matching feature is provided entirely "as-is". RentXY does not verify the accuracy of roommate preferences, lifestyle information, or criminal backgrounds of users. Users assume all risks associated with meeting and cohabitating with individuals found through this platform. Users are advised to exercise extreme caution and due diligence.`
    },
    {
      title: '7. Indemnification',
      content: `You agree to indemnify, defend, and hold harmless RentXY, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including, without limitation, reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the Platform or your violation of these Terms.`
    },
    {
      title: '8. Governing Law',
      content: `These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts located in Pune, Maharashtra, and the parties hereby irrevocably consent to the personal jurisdiction and venue therein.`
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
            <FileText size={16} /> Legal
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-300">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl mb-8">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-amber-800">
              Please read these terms carefully before using the RentXY platform. By using our service, you agree to be bound by these terms and conditions.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  {section.title}
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center gap-3 text-sm text-gray-500">
            <Shield size={16} className="text-primary-500" />
            <span>RentXY is committed to protecting your rights and ensuring a safe marketplace experience.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
