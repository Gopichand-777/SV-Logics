/**
 * uploadToR2 — uploads a file directly from the browser to Cloudflare R2
 * using a presigned PUT URL obtained from the backend.
 *
 * The file never passes through the Render server.
 * Uses XMLHttpRequest (not fetch) to support progress events.
 *
 * @param {File}     file         - The file to upload
 * @param {string}   presignedUrl - Presigned PUT URL from backend
 * @param {Function} onProgress   - Callback(percent: 0-100)
 */
export const uploadToR2 = (file, presignedUrl, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100), e.loaded, e.total);
      }
    });

    xhr.onload  = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload. Check your connection.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. File may be too large for current connection speed.'));

    xhr.send(file);
  });

/** Format bytes to human-readable size string */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/** Estimate upload time in seconds given file size and typical upload speed */
export const estimateUploadTime = (bytes) => {
  // Assume ~5 Mbps upload (conservative for Indian broadband)
  const bitsPerSecond = 5 * 1024 * 1024;
  const seconds = (bytes * 8) / bitsPerSecond;
  if (seconds < 60) return `~${Math.ceil(seconds)} seconds`;
  return `~${Math.ceil(seconds / 60)} minutes`;
};
