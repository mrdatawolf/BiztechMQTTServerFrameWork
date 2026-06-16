const fs = require('fs');
const path = require('path');

function formatDate(date, fmt) {
  const yyyy = String(date.getFullYear());
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');

  return fmt
    .replace('{YYYY-MM-DD}', `${yyyy}-${mm}-${dd}`)
    .replace('{YYYYMMDD}',   `${yyyy}${mm}${dd}`)
    .replace('{YYYY}', yyyy)
    .replace('{MM}', mm)
    .replace('{DD}', dd);
}

async function datedFileExists(check) {
  const { id, label, config } = check;
  const { directory, pattern, lookbackDays = 0 } = config;
  const checkedAt = new Date().toISOString();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let daysBack = 0; daysBack <= lookbackDays; daysBack++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() - daysBack);

    const filename = formatDate(candidate, pattern);
    const fullPath = path.join(directory, filename);

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    const lastModified = new Date(stat.mtimeMs).toISOString();
    const ageSeconds   = Math.floor((Date.now() - stat.mtimeMs) / 1000);
    const fileDate     = candidate.toISOString().slice(0, 10);

    return {
      type: 'dated_file_exists',
      id,
      label,
      ok: true,
      foundFile: fullPath,
      fileDate,
      lastModified,
      ageSeconds,
      checkedAt,
    };
  }

  return {
    type: 'dated_file_exists',
    id,
    label,
    ok: false,
    foundFile: null,
    fileDate: null,
    lastModified: null,
    ageSeconds: null,
    checkedAt,
  };
}

module.exports = datedFileExists;
