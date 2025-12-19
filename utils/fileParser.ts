import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

// 初始化 PDF Worker
// 关键修复：强制指向与 package.json 版本 (3.11.174) 一致的 CDN
// 这避免了 Vercel/Zeabur 构建环境中找不到本地 worker 文件的常见错误
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
    // 尝试作为文本读取
    try {
        return await file.text();
    } catch(e) {
        throw new Error('不支持的文件格式。仅支持 PDF, Word (docx) 或 图片。');
    }
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
    onProgress?.(`文档共 ${totalPages} 页，正在逐页解析...`);

    let fullText = '';
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      
      // 每5页暂停一下，避免浏览器卡死
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
    }
    
    return fullText;

  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    throw new Error(`PDF 解析失败: ${error.message || '文档可能已加密或损坏'}`);
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
  onProgress?.('正在初始化 OCR 视觉识别引擎...');
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