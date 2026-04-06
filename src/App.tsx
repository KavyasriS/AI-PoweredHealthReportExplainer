/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Stethoscope, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info,
  Download,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { analyzeMedicalReport } from './services/geminiService';
import { cn } from './lib/utils';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      setError('Please upload an image or PDF file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!preview || !file) return;

    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeMedicalReport(preview, file.type);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError('An error occurred while analyzing the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!resultRef.current) return;
    
    const canvas = await html2canvas(resultRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`MediSpeak_Report_Analysis_${new Date().getTime()}.pdf`);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-medical-500 p-2 rounded-lg">
              <Stethoscope className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl text-slate-900">MediSpeak</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Languages className="w-4 h-4" /> English & Tamil Support</span>
            <span className="flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Private & Secure</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Instructions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl text-slate-900">Understand your health reports in English & தமிழ்.</h2>
              <p className="text-slate-500 text-lg">
                Upload your medical report and our AI will explain it in simple English and Tamil for easy understanding.
              </p>
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={cn(
                "relative group border-2 border-dashed rounded-2xl p-8 transition-all duration-200 flex flex-col items-center justify-center text-center",
                preview ? "border-medical-500 bg-medical-50" : "border-slate-300 hover:border-medical-400 hover:bg-slate-50 cursor-pointer"
              )}
              onClick={() => !preview && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />

              {preview ? (
                <div className="space-y-4 w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="relative aspect-[3/4] max-h-64 mx-auto rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                    {file?.type === 'application/pdf' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                        <FileText className="w-16 h-16 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-600 truncate px-4 w-full">{file.name}</span>
                      </div>
                    ) : (
                      <img src={preview} alt="Report Preview" className="w-full h-full object-contain" />
                    )}
                    <button 
                      onClick={reset}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full bg-medical-600 hover:bg-medical-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-medical-200 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing Report...
                        </>
                      ) : (
                        <>
                          Analyze Report
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-8 pointer-events-none">
                  <div className="w-16 h-16 bg-medical-100 text-medical-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-medical-600 font-semibold">Click or drag to upload</p>
                    <p className="text-xs text-slate-400 mt-2">Supports JPG, PNG, PDF (Max 10MB)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Privacy Note:</strong> Your reports are processed securely. We do not store your medical data permanently.
              </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-medical-100 border-t-medical-500 rounded-full animate-spin"></div>
                    <Stethoscope className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-medical-500 w-8 h-8" />
                  </div>
                  <h3 className="text-xl mb-2">Processing your report...</h3>
                  <p className="text-slate-500 max-w-xs">
                    Our AI is identifying medical terms and simplifying the findings in English and Tamil.
                  </p>
                </motion.div>
              ) : result ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="bg-medical-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Analysis Results
                    </h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={downloadPDF}
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                      <button 
                        onClick={reset}
                        className="text-white/80 hover:text-white text-sm flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" /> New
                      </button>
                    </div>
                  </div>
                  <div className="p-6 lg:p-8" ref={resultRef}>
                    <div className="markdown-body prose prose-slate max-w-none">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-red-900 mb-2">Analysis Failed</h3>
                  <p className="text-red-700 mb-6">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-400 font-medium">No Report Analyzed</h3>
                  <p className="text-slate-400 text-sm max-w-xs mt-2">
                    Upload a medical report on the left to see the AI-powered explanation in English and Tamil.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white mb-4">
                <Stethoscope className="w-6 h-6 text-medical-400" />
                <span className="text-xl font-display font-bold">MediSpeak</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Empowering patients with clear, understandable health information in English and Tamil. 
                Our mission is to bridge the gap between complex medical data and patient understanding.
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h4 className="text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Medical Disclaimer / மருத்துவ எச்சரிக்கை
              </h4>
              <p className="text-xs leading-relaxed">
                MediSpeak is an AI-powered educational tool. It does not provide medical advice, 
                diagnosis, or treatment. Always seek the advice of your physician.
                MediSpeak என்பது ஒரு AI-இயங்கும் கல்வி கருவியாகும். இது மருத்துவ ஆலோசனை, நோயறிதல் அல்லது சிகிச்சையை வழங்காது.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2026 MediSpeak AI. All Rights Reserved.</p>
            <div className="flex items-center gap-2 bg-slate-800/30 px-3 py-1.5 rounded-full border border-slate-700/50">
              <span className="text-slate-500">Platform</span>
              <span className="text-white font-semibold">Google Antigravity</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
