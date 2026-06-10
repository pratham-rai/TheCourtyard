// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\components\InvoiceModal.js
import React from 'react';
import { X, Printer, CheckCircle, FileText } from 'lucide-react';

const formatDateDMY = (dateInput) => {
  if (!dateInput) return '';
  const dateStr = String(dateInput);
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export default function InvoiceModal({ isOpen, onClose, invoiceData }) {
  if (!isOpen || !invoiceData) return null;

  const {
    invoiceNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date = new Date(),
    type = 'Court Booking',
    member = { name: 'Valued Guest', email: '', membership: 'None' },
    items = [],
    subtotal = 0,
    discount = 0,
    taxRate = 18,
    total = 0,
    paymentMethod = 'card',
    status = 'success'
  } = invoiceData;

  // Calculate taxes based on customizable rate (0% for wallet top-ups to avoid double-taxation)
  const isTopUp = type.toLowerCase().includes('top-up') || type.toLowerCase().includes('topup');
  const actualTaxRate = isTopUp ? 0 : taxRate;
  const halfTaxRate = actualTaxRate / 2;
  const totalTax = (subtotal - discount) * (actualTaxRate / 100);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const calculatedTotal = subtotal - discount + totalTax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-start justify-center p-4 pt-28 pb-12 overflow-y-auto no-print-backdrop">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
          }
          .print-invoice-area * {
            color: black !important;
            border-color: #ddd !important;
          }
          .fixed {
            position: absolute !important;
            background: none !important;
            backdrop-filter: none !important;
            overflow: visible !important;
          }
        }
      `}} />

      <div className="bg-charcoal border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print-invoice-area">
        {/* Header - No Print */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center no-print">
          <div className="flex items-center gap-2 text-neon-green">
            <FileText className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wider text-white">Invoice details</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-neon-green hover:bg-neon-green/90 text-charcoal text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-charcoal text-white print:bg-white print:text-black">
          {/* Logo & Receipt Title */}
          <div className="flex justify-between items-start border-b border-white/5 print:border-black/10 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-white print:text-black">
                THE COURT<span className="text-neon-green print:text-black">YARD</span>
              </h1>
              <p className="text-[10px] text-gray-400 print:text-gray-500 uppercase tracking-widest mt-1">Premium Sports Sanctuary</p>
            </div>
            <div className="text-right">
              <h2 className="text-xs font-black uppercase tracking-wider text-neon-green print:text-black">TAX INVOICE</h2>
              <p className="text-xs text-gray-400 print:text-gray-600 mt-1 font-mono">{invoiceNo}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{formatDateDMY(date)}</p>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-8 text-xs border-b border-white/5 print:border-black/10 pb-6 mb-6">
            <div>
              <p className="text-gray-400 print:text-gray-500 font-bold uppercase tracking-wider mb-2">SERVICE PROVIDER</p>
              <p className="font-bold text-white print:text-black">The Courtyard Club</p>
              <p className="text-gray-400 print:text-gray-600 mt-0.5">Plot 124, Sportive Sanctuary</p>
              <p className="text-gray-400 print:text-gray-600">Outer Ring Road, Bangalore - 560103</p>
              <p className="text-gray-400 print:text-gray-600">GSTIN: 29AAACT8283L1Z4</p>
            </div>
            <div>
              <p className="text-gray-400 print:text-gray-500 font-bold uppercase tracking-wider mb-2">BILLED TO MEMBER</p>
              <p className="font-bold text-white print:text-black">{member.name}</p>
              <p className="text-gray-400 print:text-gray-600 mt-0.5">{member.email}</p>
              <p className="text-gray-400 print:text-gray-600 font-bold mt-1">
                Tier: <span className="text-electric-blue print:text-black">{member.membership || 'None'}</span>
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="text-xs mb-6">
            <div className="grid grid-cols-3 gap-4 p-3 bg-white/5 print:bg-gray-100 rounded-xl print:rounded-none">
              <div>
                <span className="text-gray-400 print:text-gray-500 block text-[9px] uppercase tracking-wider">PAYMENT STATE</span>
                <span className="text-green-400 print:text-black font-bold uppercase flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {status === 'success' ? 'Settled' : status}
                </span>
              </div>
              <div>
                <span className="text-gray-400 print:text-gray-500 block text-[9px] uppercase tracking-wider">PAYMENT OPTION</span>
                <span className="text-white print:text-black font-bold uppercase mt-0.5 block">{paymentMethod}</span>
              </div>
              <div>
                <span className="text-gray-400 print:text-gray-500 block text-[9px] uppercase tracking-wider">CATEGORY TYPE</span>
                <span className="text-white print:text-black font-bold uppercase mt-0.5 block">{type}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs text-left mb-8 border-collapse">
            <thead>
              <tr className="border-b border-white/10 print:border-black/20 text-gray-400 print:text-gray-600 uppercase tracking-wider">
                <th className="pb-3 font-bold">Line Items</th>
                <th className="pb-3 text-center font-bold">Qty</th>
                <th className="pb-3 text-right font-bold">Unit Price</th>
                <th className="pb-3 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5 print:border-black/10 text-white print:text-black">
                  <td className="py-3 font-semibold">{item.description}</td>
                  <td className="py-3 text-center">{item.qty || 1}</td>
                  <td className="py-3 text-right">₹{item.rate !== undefined ? item.rate.toFixed(2) : item.price?.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono">₹{((item.qty || 1) * (item.rate !== undefined ? item.rate : item.price || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations Summary */}
          <div className="flex justify-end text-xs">
            <div className="w-64 space-y-2 border-t border-white/10 print:border-black/20 pt-4">
              <div className="flex justify-between text-gray-400 print:text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-neon-green print:text-black">
                  <span>Membership Off</span>
                  <span className="font-mono">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-400 print:text-gray-600">
                <span>CGST ({halfTaxRate}%)</span>
                <span className="font-mono">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 print:text-gray-600">
                <span>SGST ({halfTaxRate}%)</span>
                <span className="font-mono">₹{sgst.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-base font-black text-white print:text-black border-t border-white/5 print:border-black/10 pt-2.5">
                <span>Total Paid</span>
                <span className="font-mono text-neon-green print:text-black">₹{calculatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="border-t border-white/5 print:border-black/10 pt-6 mt-12 text-center text-[10px] text-gray-500">
            <p className="font-bold">Thank you for playing at The Courtyard!</p>
            <p className="mt-1">For cancellation policies and club guidelines, please refer to our guidelines. This is a computer generated receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
