export function TermsPage() {
  return (
    <div className="mt-12 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black oswald uppercase mb-4">Terms of <span className="lime-text">Service</span></h1>
        <p className="text-gray-500 font-bold">Last updated: January 2024</p>
      </div>

      <div className="glass-card p-10 space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Acceptance of Terms</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            By accessing and using Lime Merchant services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use our services.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Use of Services</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            You agree to use our services only for lawful purposes. You are prohibited from using our services for any illegal activities, including but not limited to money laundering, fraud, or any activities that violate applicable laws.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Account Responsibilities</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Fees and Payments</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            Our current fee is 3.99% per transaction. We reserve the right to modify our fees at any time with 30 days' notice. All fees are non-refundable unless otherwise stated.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Limitation of Liability</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            Lime Merchant shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black oswald uppercase lime-text">Contact</h2>
          <p className="text-gray-400 leading-relaxed font-bold">
            For any questions regarding these Terms of Service, please contact us at legal@limemerchant.com.
          </p>
        </div>
      </div>
    </div>
  )
}
