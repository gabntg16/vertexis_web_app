import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  Package,
  ShieldCheck,
  ThermometerSnowflake,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { JTShippingLabelData } from '../../services/jtExpress';

interface JTShippingLabelProps {
  labelData: JTShippingLabelData;
  onClose: () => void;
}

export const JTShippingLabel: React.FC<JTShippingLabelProps> = ({
  labelData,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStub = () => {
    // Generate a printable snapshot / trigger browser save to PDF
    window.print();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl flex flex-col rounded-3xl bg-neutral-900 border border-neutral-700 shadow-2xl overflow-hidden my-auto max-h-[95vh]">
        {/* Top Control Bar (Non-Printable) */}
        <div className="p-4 bg-neutral-800/90 border-b border-neutral-700 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-xs tracking-wider">
              J&T EXPRESS
            </div>
            <span className="text-xs font-bold text-white">Official Air Waybill (4"x6" Thermal Format)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
              title="Print to thermal or desktop printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>

            <button
              onClick={handleDownloadStub}
              className="px-3 py-1.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold transition-colors flex items-center space-x-1"
              title="Save / Export as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Shipping Label Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-neutral-950 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[420px] bg-white text-black font-sans text-xs border-2 border-black p-4 rounded-md shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
            style={{ minHeight: '580px' }}
          >
            {/* Header: J&T Logo & Hotline */}
            <div className="border-b-2 border-black pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-[#E30613] text-white font-black px-2 py-1 text-base tracking-tighter rounded-xs">
                  J&T <span className="font-light text-xs tracking-normal">EXPRESS</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-700">
                  PHILIPPINES
                </span>
              </div>
              <div className="text-right text-[9px] font-mono leading-tight">
                <p className="font-bold">Hotline: (02) 8911-1888</p>
                <p className="text-neutral-600">www.jtexpress.ph</p>
              </div>
            </div>

            {/* Routing Code & Large Destination Tag */}
            <div className="grid grid-cols-3 border-b-2 border-black py-2 items-center">
              <div className="col-span-2 border-r-2 border-black pr-2">
                <p className="text-[9px] uppercase font-bold text-neutral-600">Destination Sorting Hub</p>
                <p className="text-2xl font-black tracking-tight leading-none text-black">
                  {labelData.destinationCode}
                </p>
                <p className="text-[10px] font-mono font-bold mt-1 text-neutral-700">
                  Routing: {labelData.sortingCode}
                </p>
              </div>
              <div className="pl-2 text-center">
                <p className="text-[9px] font-bold text-neutral-600 uppercase">Service</p>
                <span className="inline-block bg-black text-white text-[10px] font-extrabold px-2 py-0.5 rounded-xs mt-0.5">
                  EZ AIR/LAND
                </span>
                <p className="text-[9px] font-mono mt-1 font-bold">PREPAID</p>
              </div>
            </div>

            {/* Barcode & Waybill Number */}
            <div className="border-b-2 border-black py-2.5 text-center">
              {/* Simulated High-Res Code128 Barcode */}
              <div className="h-12 w-full flex items-center justify-center space-x-0.5 bg-white px-2">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-black"
                    style={{
                      width: i % 7 === 0 ? '4px' : i % 3 === 0 ? '2px' : '1.5px',
                      marginLeft: i % 4 === 0 ? '1.5px' : '0px',
                    }}
                  />
                ))}
              </div>
              <p className="font-mono text-base font-black tracking-widest mt-1">
                {labelData.billCode}
              </p>
              <p className="text-[9px] text-neutral-500 font-mono">Ref Order: #{labelData.orderId}</p>
            </div>

            {/* Receiver Section (To) */}
            <div className="border-b-2 border-black py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.5">
                  RECEIVER (TO)
                </span>
                <span className="text-[10px] font-bold font-mono">
                  {labelData.receiver.mobile || labelData.receiver.phone}
                </span>
              </div>
              <p className="font-black text-sm uppercase leading-tight">
                {labelData.receiver.branchName || labelData.receiver.name}
              </p>
              <p className="text-[11px] font-semibold text-neutral-800 mt-0.5 leading-snug">
                {labelData.receiver.address}
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5 font-medium">
                Contact Person: {labelData.receiver.name}
              </p>
            </div>

            {/* Sender Section (From) */}
            <div className="border-b-2 border-black py-2 bg-neutral-50 p-1.5 rounded-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-bold uppercase text-neutral-600">
                  SENDER (FROM):
                </span>
                <span className="text-[9px] font-mono font-bold">
                  {labelData.sender.mobile}
                </span>
              </div>
              <p className="font-bold text-[11px] uppercase leading-tight">
                {labelData.sender.companyName}
              </p>
              <p className="text-[10px] text-neutral-700 leading-tight">
                {labelData.sender.address}
              </p>
            </div>

            {/* Commodity & Package Breakdown */}
            <div className="border-b-2 border-black py-2 grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="text-neutral-500 block text-[9px] font-bold uppercase">Weight</span>
                <span className="font-bold">{labelData.totalWeightKg} KG</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[9px] font-bold uppercase">Total Packs</span>
                <span className="font-bold">{labelData.totalPacks} Pouches</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[9px] font-bold uppercase">Declared Value</span>
                <span className="font-bold">₱{labelData.declaredValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Item Manifest */}
            <div className="border-b-2 border-black py-1.5 text-[9px] text-neutral-700 font-mono">
              <p className="font-bold uppercase text-black">Package Contents:</p>
              <p className="truncate">
                {labelData.items.map((it) => `${it.itemQuantity}x ${it.itemName}`).join(', ')}
              </p>
            </div>

            {/* Handling Instructions & Signatures */}
            <div className="pt-2 grid grid-cols-3 gap-2 items-center">
              <div className="col-span-2 space-y-1">
                <div className="flex items-center space-x-1 text-red-600 font-black text-[9px] uppercase">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>PERISHABLE CONFECTIONERY</span>
                </div>
                <p className="text-[8px] text-neutral-600 leading-tight">
                  Keep dry & below 28°C. Do not expose to direct heat. Fragile vacuum-sealed food product.
                </p>
              </div>

              {/* QR Code Placeholder for Scanner */}
              <div className="border border-black p-1 text-center bg-white">
                <QrCode className="w-8 h-8 mx-auto text-black" />
                <span className="text-[7px] font-mono block leading-none mt-0.5">SCAN J&T</span>
              </div>
            </div>

            {/* Footer Date Stamp */}
            <div className="mt-3 pt-1 border-t border-dashed border-neutral-400 text-[8px] text-neutral-500 flex justify-between font-mono">
              <span>VertexIS Enterprise Logistics Engine</span>
              <span>Printed: {new Date(labelData.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
