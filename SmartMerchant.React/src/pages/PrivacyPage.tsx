export function PrivacyPage() {
  return (
    <div className="mt-12 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black oswald uppercase mb-4">Privacy <span className="lime-text">Policy</span></h1>
        <p className="text-gray-500 font-bold">Last updated: January 2024</p>
      </div>

      <div className="glass-card p-10 space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Information We Collect</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            We collect information you provide directly to us, such as when you create an account, make a transaction, or contact us for support. This includes your name, email address, phone number, and payment information.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">How We Use Your Information</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Information Sharing</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            We do not share your personal information with third parties except as described in this policy. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Security</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All payment data is encrypted using industry-standard SSL technology.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Contact Us</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            If you have any questions about this Privacy Policy, please contact us at privacy@limemerchant.com.
          </p>
        </div>
      </div>
    </div>
  )
}
