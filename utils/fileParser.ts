import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

// 初始化 PDF Worker
// 关键修复：不要让 Vite 尝试打包 worker，而是直接指向稳定的 CDN 地址
// 这解决了生产环境 "Setting up fake worker failed" 的常见错误
if (typeof window !== 'undefined') {
  // @ts-ignore
  const pdfjs = pdfjsLib.default || pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

export const parseFile = async (file: File, onProgress?: (status: string) => void): Promise<string> => {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return parsePdf(file, onProgress);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDocx(file, onProgress);
  } else if (fileType.startsWith('image/')) {
    return parseImage(file, onProgress);
  } else {
    throw new Error('不支持的文件格式。仅支持 PDF, Word (docx) 或 图片。');
  }
};

const parsePdf = async (file: File, onProgress?: (status: string) => void): Promise<string> => {
  onProgress?.('正在加载 PDF 文档...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // @ts-ignore
    const pdfjs = pdfjsLib.default || pdfjsLib;

    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const totalPages = pdf.numPages;
    onProgress?.(`文档共 ${totalPages} 页，正在解析...`);

    let fullText = '';
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      // Slight delay to prevent UI freezing
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
    }
    
    return fullText;

  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    throw new Error(`PDF 解析失败: ${error.message || '未知错误'}`);
  }
};

const parseDocx = async (file: File, onProgress?: (status: string) => void): Promise<string> => {
  onProgress?.('正在解析 Word 文档...');
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error: any) {
    console.error("Docx Parsing Error:", error);
    throw new Error(`Word 解析失败: ${error.message}`);
  }
};

const parseImage = async (file: File, onProgress?: (status: string) => void): Promise<string> => {
  onProgress?.('正在初始化 OCR 视觉引擎...');
  try {
    const result = await Tesseract.recognize(
      file,
      'chi_sim+eng',
      {
        logger: m => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(`OCR 识别进度: ${(m.progress * 100).toFixed(0)}%`);
          }
        }
      }
    );

    return result.data.text;
  } catch (error: any) {
    console.error("OCR Error:", error);
    throw new Error(`图片识别失败: ${error.message}`);
  }
};