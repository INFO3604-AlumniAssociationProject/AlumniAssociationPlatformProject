import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, X } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type PDFViewerProps = {
  pdfUrl?: string;
  src?: string;
  onClose: () => void;
};

export default function PDFViewer({ pdfUrl, src, onClose }: PDFViewerProps) {
  const fileUrl = pdfUrl || src;
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setPageNumber(1);
    setScale(1.2);
    setRotation(0);
  }, [fileUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  if (!fileUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col" data-overlay="true">
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale((current) => Math.max(0.5, current - 0.2))} className="p-2 hover:bg-white/10 rounded-full">
            <ZoomOut size={20} />
          </button>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((current) => Math.min(3, current + 0.2))} className="p-2 hover:bg-white/10 rounded-full">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => setRotation((current) => (current + 90) % 360)} className="p-2 hover:bg-white/10 rounded-full">
            <RotateCw size={20} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((current) => current - 1)}
            className="p-2 hover:bg-white/10 rounded-full disabled:opacity-40"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            disabled={pageNumber >= (numPages || 1)}
            onClick={() => setPageNumber((current) => current + 1)}
            className="p-2 hover:bg-white/10 rounded-full disabled:opacity-40"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-4">
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-white">Loading PDF...</div>}>
          <Page pageNumber={pageNumber} scale={scale} rotate={rotation} />
        </Document>
      </div>
    </div>
  );
}
