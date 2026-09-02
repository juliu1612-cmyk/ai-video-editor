import { useRef, useState } from 'react';
import { Button, message } from 'antd';
import { CloudUploadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useApp, type UploadedFile } from '../context/AppContext';
import { uid } from '../utils/format';

interface VideoUploaderProps {
  multiple?: boolean;
  accept?: string;
  maxSize?: number;          // MB
  title?: string;
  desc?: string;
  onChange?: (files: UploadedFile[]) => void;
}

const VideoUploader = ({
  multiple = true,
  accept = '.mp4,.mov',
  maxSize = 2000,
  title = '点击/拖拽上传',
  desc = '文件总时长不得超过30分钟,单个最大2G',
  onChange,
}: VideoUploaderProps) => {
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 批量上传:一次可选多个文件,逐个校验后统一入库
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid: UploadedFile[] = [];
    Array.from(files).forEach(file => {
      if (file.size > maxSize * 1024 * 1024) {
        message.warning(`${file.name} 超过 ${maxSize}MB,已跳过`);
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      if (ext !== 'mp4' && ext !== 'mov') {
        message.warning(`仅支持 MP4、MOV 格式,已跳过: ${file.name}`);
        return;
      }
      valid.push({
        id: uid(),
        name: file.name,
        size: parseFloat((file.size / 1024 / 1024).toFixed(1)),
        duration: 60 + Math.floor(Math.random() * 600), // mock
        url: URL.createObjectURL(file),
        cover: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      });
    });
    if (valid.length === 0) return;
    valid.forEach(f => addUploadedFile(f));
    message.success(
      valid.length === 1 ? `已上传 ${valid[0].name}` : `已上传 ${valid.length} 个视频`
    );
    onChange?.([...uploadedFiles, ...valid]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragOver ? '#6366f1' : '#d1d5db'}`,
          borderRadius: 12,
          background: dragOver ? '#eef2ff' : '#fafafa',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all .2s',
          position: 'relative',
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={e => {
            handleFiles(e.target.files);
            e.target.value = ''; // 允许再次选择同一批文件
          }}
        />
        <CloudUploadOutlined style={{ fontSize: 36, color: '#6366f1' }} />
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{desc}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          仅支持: mp4 / mov
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            已上传 {uploadedFiles.length} 个素材
          </div>
          {uploadedFiles.map(f => (
            <div
              key={f.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 10, background: '#fff', borderRadius: 10,
                border: '1px solid #e5e7eb', marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 56, height: 36, borderRadius: 6,
                  background: f.cover || '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <VideoCameraOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13, fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {f.name}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  {f.size}MB · {Math.floor(f.duration / 60)}分{f.duration % 60}秒
                </div>
              </div>
              <Button type="text" danger size="small" onClick={() => removeUploadedFile(f.id)}>
                移除
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
