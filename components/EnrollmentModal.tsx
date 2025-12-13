import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { Course } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; 
  course: Course;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ isOpen, onClose, onConfirm, course }) => {
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleConfirm = async () => {
    setStep('processing');
    // Simulate API call processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('success');
    if (onConfirm) {
      onConfirm();
    }
  };

  const reset = () => {
    setStep('confirm');
    onClose();
  }

  // Helper to safely get price number
  const price = Number(course.price);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={reset}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {step !== 'success' && (
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">Complete Enrollment</h3>
                <button onClick={reset} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                </div>
            )}

            <div className="p-6">
              {step === 'confirm' && (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-800 line-clamp-2">{course.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">by {course.instructor}</p>
                      <p className="text-brand-blue font-bold mt-1">
                        {price === 0 ? t('course.free') : `$${price.toFixed(2)}`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Course Price</span>
                      <span className="font-medium text-gray-900">{price === 0 ? t('course.free') : `$${price.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">$0.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
                      <span className="text-gray-800">Total</span>
                      <span className="text-brand-blue">{price === 0 ? t('course.free') : `$${price.toFixed(2)}`}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Secure enrollment via Lekol Alèz</span>
                  </div>

                  <button
                    onClick={handleConfirm}
                    className="w-full py-3 bg-brand-blue hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} />
                    {price === 0 ? t('details.enroll') : 'Pay & Enroll'}
                  </button>
                </div>
              )}

              {step === 'processing' && (
                <div className="py-10 flex flex-col items-center text-center space-y-4">
                  <Loader2 size={48} className="text-brand-blue animate-spin" />
                  <div>
                    <h4 className="font-bold text-gray-800">{t('auth.processing')}</h4>
                    <p className="text-sm text-gray-500">Securing your spot in the course.</p>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="py-6 flex flex-col items-center text-center space-y-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center"
                  >
                    <Check size={40} strokeWidth={3} />
                  </motion.div>
                  
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">Success! 🎉</h4>
                    <p className="text-gray-500 mt-2">You have successfully enrolled in<br/> <span className="font-semibold text-gray-700">{course.title}</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button 
                        onClick={() => { reset(); }}
                        className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => { reset(); navigate('/'); }}
                        className="py-2.5 px-4 rounded-xl bg-brand-orange text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-colors"
                    >
                        Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};