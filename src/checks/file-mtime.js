const fs = require('fs');
const path = require('path');

function walkDir(dir, extensions, recursive) {
  let files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      files = files.concat(walkDir(full, extensions, recursive));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!extensions?.length || extensions.includes(ext)) files.push(full);
    }
  }
  return files;
}

async function fileMtime(check) {
  const { id, label, config } = check;
  const { path: dirPath, extensions = [], recursive = false } = config;
  const checkedAt = new Date().toISOString();

  const files = walkDir(dirPath, extensions, recursive);

  let lastModified = null;
  let ageSeconds = null;

  if (files.length > 0) {
    let maxMtime = 0;
    for (const file of files) {
      try {
        const { mtimeMs } = fs.statSync(file);
        if (mtimeMs > maxMtime) maxMtime = mtimeMs;
      } catch {
        // file disappeared between walk and stat — skip
      }
    }
    if (maxMtime > 0) {
      lastModified = new Date(maxMtime).toISOString();
      ageSeconds = Math.floor((Date.now() - maxMtime) / 1000);
    }
  }

  return {
    type: 'file_mtime',
    id,
    label,
    path: dirPath,
    lastModified,
    ageSeconds,
    fileCount: files.length,
    checkedAt,
  };
}

module.exports = fileMtime;
