import React, { useState } from 'react';
import { uploadArticles } from '../services/api';

export const BulkUploadTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<File | null>(null);

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('pdfs', file);
    });
    if (metadata) {
      formData.append('metadata', metadata);
    }

    try {
      await uploadArticles(formData);
      alert('上传成功！');
    } catch (error) {
      alert('上传失败：' + error.message);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">批量上传文章</h2>
      
      <div className="mb-4">
        <label className="block mb-2">元数据 CSV 文件</label>
        <input 
          type="file" 
          accept=".csv"
          onChange={e => setMetadata(e.target.files?.[0] || null)} 
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">PDF 文件</label>
        <input 
          type="file" 
          multiple 
          accept=".pdf"
          onChange={e => setFiles(Array.from(e.target.files || []))} 
        />
      </div>

      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleUpload}
      >
        开始上传
      </button>
    </div>
  );
}; 