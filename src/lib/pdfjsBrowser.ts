/**
 * Load pdf.js from /public so webpack does not wrap pdfjs-dist/build/pdf.mjs.
 * That wrap throws "Object.defineProperty called on non-object" with eval source maps.
 */
const pdfjs = (await import(
  /* webpackIgnore: true */
  '/itms/ai/pdf.min.mjs'
)) as typeof import('pdfjs-dist');

export const {
  AnnotationLayer,
  AnnotationMode,
  getDocument,
  GlobalWorkerOptions,
  PDFDataRangeTransport,
  TextLayer,
} = pdfjs;

export default pdfjs;
