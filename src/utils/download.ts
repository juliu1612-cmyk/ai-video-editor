import { message } from 'antd';

/**
 * 触发浏览器下载一个视频。
 * 优先 fetch 成 blob 后走 <a download>(可跨域的资源);
 * 失败(跨域受限)时回退为直接打开链接并提示。
 */
export const downloadVideo = async (url: string, filename: string): Promise<void> => {
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '_');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${safeName}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
  } catch {
    // 回退:新窗口打开
    window.open(url, '_blank');
    message.warning('当前资源跨域受限,已在新窗口打开,可右键另存为');
  }
};

/**
 * 批量下载:逐个触发,间隔 400ms 避免浏览器拦截
 */
export const downloadVideosBatch = async (
  items: { url: string; title: string }[]
): Promise<void> => {
  if (!items.length) return;
  message.success(`开始下载 ${items.length} 个视频`);
  for (const item of items) {
    await downloadVideo(item.url, item.title);
    await new Promise(r => setTimeout(r, 400));
  }
};
