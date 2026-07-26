import React from 'react';
import { ShieldCheck, Shield, AlertTriangle } from 'lucide-react';

const PrivacyPage = () => {
  const sections = [
    {
      title: '1. Information We Collect',
      content: `When you register for a RentXY account, we collect personal information such as your name, email address, phone number, and password. If you choose to undergo KYC verification, we may collect government-issued identification documents. We also collect data about your interactions with the platform, including properties viewed, messages sent, and search preferences.`
    },
    {
      title: '2. How We Use Your Information',
      content: `RentXY uses your information to provide, personalize, and improve our services. This includes facilitating communication between tenants and owners, verifying user identities for trust and safety, providing customer support, and sending important updates regarding your account or bookings. We do not sell your personal data to third parties.`
    },
    {
      title: '3. Data Security',
      content: `We implement robust security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.`
    },
    {
      title: '4. Sharing Your Information',
      content: `We may share your information with trusted third-party service providers who assist us in operating our platform, conducting our business, or serving our users (e.g., payment gateways, SMS providers). These parties are obligated to keep your information confidential. We may also disclose your information if required by law or to protect the rights, property, or safety of RentXY, our users, or others.`
    },
    {
      title: '5. Cookies and Tracking Technologies',
      content: `RentXY uses cookies and similar tracking technologies to enhance your experience on our platform. Cookies help us understand how you use our site, remember your preferences, and serve relevant content. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent, though some parts of the platform may not function properly without them.`
    },
    {
      title: '6. Third-Party Links',
      content: `Our platform may contain links to third-party websites or services that are not owned or controlled by RentXY. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites or services. We encourage you to read the privacy policies of any third-party sites you visit.`
    },
    {
      title: '7. Children\'s Privacy',
      content: `RentXY does not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us. If we become aware that we have collected personal data from children without verification of parental consent, we take steps to remove that information from our servers.`
    },
    {
      title: '8. Changes to This Privacy Policy',
      content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.`
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
            <ShieldCheck size={16} /> Legal
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-300">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-8">
            <Shield className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-blue-800">
              Your privacy is critically important to us. This policy outlines the types of information we gather, how we use it, and the steps we take to safeguard it.
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
            <ShieldCheck size={16} className="text-primary-500" />
            <span>RentXY is committed to protecting your personal information.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
