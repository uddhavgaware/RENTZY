import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Upload, FileImage, Info } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ listing, bill, bookingId, onClose, onSuccess }) => {
  const [step, setStep] = useState('ready'); // ready | success | error
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const title = listing ? listing.title : bill ? `Bill for ${bill.billingMonth || 'Current Month'}` : 'RentXY Checkout';
  const amount = listing ? (listing.price * 3) : bill ? bill.totalAmount : 0;

  const handleSimulateUpload = () => {
    // Simulate image upload for demonstration
    setIsUploading(true);
    setTimeout(() => {
      setScreenshotUrl('https://via.placeholder.com/150?text=Payment+Screenshot');
      setIsUploading(false);
    }, 1000);
  };

  const handleSettle = async () => {
    if (bill && !screenshotUrl) {
      setErrorMsg('Payment screenshot is compulsory for bills.');
      return;
    }
    
    setStep('processing');
    try {
      // If we had a real backend endpoint for this, we would call it here.
      // For now, we simulate success.
      setTimeout(() => {
        setStep('success');
        if (onSuccess) onSuccess(bill ? bill.id : bookingId);
      }, 1000);
    } catch (err) {
      setErrorMsg('Failed to submit payment proof.');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col border border-gray-100 dark:border-white/10">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-600 p-6 text-white relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 p-1.5 rounded-full">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-[11px] uppercase tracking-widest font-bold">RentXY Payment Portal</p>
              <p className="font-black text-lg leading-tight line-clamp-1">{title}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 flex justify-between items-center border border-white/15">
            <span className="text-white/80 text-sm font-medium">Total Amount Payable</span>
            <span className="text-2xl font-black">₹{amount?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Body content */}
        <div className="overflow-y-auto flex-1">
          {step === 'ready' && (
            <div className="p-6 space-y-6">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-amber-800">🚧 Online Pay Coming Soon!</p>
                <p className="text-xs text-amber-700 mt-1">Direct bank integrations are currently under maintenance. Please settle the amount directly with the owner.</p>
              </div>

              {bill && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-bold text-gray-800">Upload Payment Screenshot</h3>
                  <p className="text-xs text-gray-500">To mark this bill as paid, it is compulsory to upload a screenshot of your payment. The owner will verify and confirm it.</p>
                  
                  {screenshotUrl ? (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary-500 mx-auto">
                      <img src={screenshotUrl} alt="Uploaded" className="w-full h-full object-cover" />
                      <button onClick={() => setScreenshotUrl('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleSimulateUpload}
                      disabled={isUploading}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors bg-gray-50"
                    >
                      {isUploading ? <span className="text-xs font-bold">Uploading...</span> : (
                        <>
                          <Upload size={24} className="mb-2" />
                          <span className="text-xs font-bold">Click to Upload Screenshot</span>
                        </>
                      )}
                    </button>
                  )}
                  {errorMsg && <p className="text-xs font-bold text-red-500 text-center">{errorMsg}</p>}
                </div>
              )}

              <button
                onClick={handleSettle}
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-primary-600/25"
              >
                {bill ? 'Submit Proof & Mark Paid' : 'I Have Settled Offline'}
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="p-10 flex flex-col items-center justify-center text-center my-auto py-16">
              <div className="animate-spin text-primary-500 mb-4">
                <ShieldCheck size={48} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Submitting...</h3>
            </div>
          )}

          {step === 'success' && (
            <div className="p-10 flex flex-col items-center justify-center text-center my-auto py-16">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={44} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Request Submitted! 🎉</h3>
              <p className="text-gray-600 text-sm mb-8">
                {bill ? 'Your payment proof has been sent to the owner for confirmation.' : 'You have marked this as settled offline.'}
              </p>
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl font-black transition-all shadow-lg"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="p-10 flex flex-col items-center justify-center text-center my-auto py-16">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <X size={44} className="text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Failed</h3>
              <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
              <button
                onClick={() => setStep('ready')}
                className="w-full bg-primary-600 text-white py-3 rounded-2xl font-black transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
