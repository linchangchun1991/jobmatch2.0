import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

// Resolve the pdfjs instance. esm.sh modules often wrap CJS libraries in a default export.
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Configure the PDF.js worker.
if (pdfjs && pdfjs.GlobalWorkerOptions) {
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
    
    if (!pdfjs) {
      throw new Error('PDF 引擎未能初始化');
    }

    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const totalPages = pdf.numPages;
    onProgress?.(`文档共 ${totalPages} 页，正在并行解析...`);

    // Speed Optimization: Parallelize page processing using Promise.all
    // This is significantly faster than sequential await in a loop for larger docs.
    const pagePromises = [];
    for (let i = 1; i <= totalPages; i++) {
      pagePromises.push(
        pdf.getPage(i).then(async (page: any) => {
          // Note: Granular progress inside Promise.all might be jittery, 
          // but effective for showing "activity".
          const textContent = await page.getTextContent();
          return textContent.items.map((item: any) => item.str).join(' ');
        })
      );
    }

    const pageTexts = await Promise.all(pagePromises);
    onProgress?.('PDF 解析完成，正在合并数据...');
    
    return pageTexts.join('\n');

  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    if (error.name === 'MissingPDFException') {
      throw new Error('无效的 PDF 文件');
    }
    if (error.message && error.message.includes('Setting up fake worker failed')) {
      throw new Error('PDF 解析核心组件加载失败 (Network/Worker Error)，请检查网络连接或刷新页面。');
    }
    throw new Error(`PDF 解析失败: ${error.message}`);
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
  onProgress?.('正在初始化 OCR 视觉引擎 (这可能需要几秒钟)...');
  try {
    const result = await Tesseract.recognize(
      file,
      'chi_sim+eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            onProgress?.(`OCR 识别进度: ${(m.progress * 100).toFixed(0)}%`);
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