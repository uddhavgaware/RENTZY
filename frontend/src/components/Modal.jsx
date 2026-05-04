import React, { useState, useEffect } from 'react';
import { AlertCircle, Info, X } from 'lucide-react';

const Modal = ({ isOpen, type = 'alert', title, message, onConfirm, onCancel, defaultValue = '', placeholder = 'Enter value...' }) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      if (!inputValue.trim()) {
        return;
      }
      onConfirm(inputValue);
    } else {
      if (onConfirm) onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 transition-transform">
        <div className="flex items-start mb-4 relative">
          <div className="flex items-center gap-4 flex-1 pr-8">
            {type === 'alert' ? (
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Info size={24} />
              </div>
            ) : type === 'confirm' ? (
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertCircle size={24} />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Info size={24} />
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 leading-tight">{title}</h3>
          </div>
          {type !== 'alert' && (
            <button onClick={onCancel} className="absolute right-0 top-0 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mb-6 ml-16">
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{message}</p>
          
          {type === 'prompt' && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="mt-4 w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
              autoFocus
            />
          )}
        </div>

        <div className="flex justify-end gap-3">
          {type !== 'alert' && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl font-medium text-white transition-colors shadow-sm text-sm ${
              type === 'alert' ? 'bg-blue-600 hover:bg-blue-700' :
              type === 'confirm' ? 'bg-red-600 hover:bg-red-700' :
              'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {type === 'alert' ? 'OK' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
