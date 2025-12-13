import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, Share2, Award } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  studentName,
  courseTitle,
  instructorName,
  completionDate,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useLanguage();

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsGenerating(true);

    try {
      // Small delay to ensure render
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Landscape A4: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate - ${courseTitle}.pdf`);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col relative"
            >
              {/* Header / Actions */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Award className="text-brand-orange" size={20} />
                    {t('cert.title')}
                 </h3>
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-sky-600 transition-colors font-medium text-sm disabled:opacity-70"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isGenerating ? 'Generating...' : t('cert.download')}
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                 </div>
              </div>

              {/* Certificate Preview Wrapper */}
              <div className="p-8 bg-gray-200 overflow-auto flex justify-center">
                 {/* 
                    Actual Certificate DOM Element 
                    Aspect Ratio for A4 Landscape approx 1.414 : 1 
                 */}
                 <div 
                    ref={certificateRef}
                    className="bg-white text-gray-800 w-[800px] h-[565px] shrink-0 relative p-12 shadow-xl border-[16px] border-double border-brand-dark/10"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                 >
                    {/* Ornamental Corners */}
                    <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-brand-orange"></div>
                    <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-brand-orange"></div>
                    <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-brand-orange"></div>
                    <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-brand-orange"></div>

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                    <div className="h-full flex flex-col items-center justify-between text-center relative z-10">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="h-10 w-10 bg-brand-orange rounded-lg flex items-center justify-center text-white">
                                <Award size={24} />
                            </div>
                            <span className="text-2xl font-bold tracking-widest text-brand-dark font-sans">LEKOL ALÈZ</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center w-full space-y-6">
                            <h1 className="text-5xl font-bold text-brand-blue mb-2">{t('cert.title')}</h1>
                            <p className="text-lg text-gray-500 uppercase tracking-widest font-sans text-xs">{t('cert.presentedTo')}</p>
                            
                            <div className="py-2 border-b-2 border-gray-200 w-3/4 mx-auto">
                                <h2 className="text-6xl font-signature text-brand-dark p-4">{studentName}</h2>
                            </div>

                            <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
                                {t('cert.message')}
                            </p>

                            <h3 className="text-3xl font-bold text-gray-800">{courseTitle}</h3>
                        </div>

                        {/* Footer / Signatures */}
                        <div className="flex justify-between items-end w-full px-10 mt-8">
                             <div className="flex flex-col items-center gap-2">
                                 <span className="font-signature text-3xl text-brand-blue">{completionDate}</span>
                                 <div className="h-px w-40 bg-gray-300"></div>
                                 <span className="text-xs uppercase tracking-widest text-gray-400 font-sans">{t('cert.date')}</span>
                             </div>

                             {/* Gold Seal */}
                             <div className="relative">
                                 <div className="w-24 h-24 bg-brand-orange rounded-full flex items-center justify-center text-white shadow-inner border-4 border-amber-300">
                                    <Award size={40} />
                                 </div>
                                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 w-16 h-6 shadow-md rounded-sm -z-10"></div>
                             </div>

                             <div className="flex flex-col items-center gap-2">
                                 <span className="font-signature text-3xl text-brand-blue">{instructorName}</span>
                                 <div className="h-px w-40 bg-gray-300"></div>
                                 <span className="text-xs uppercase tracking-widest text-gray-400 font-sans">{t('cert.signature')}</span>
                             </div>
                        </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};