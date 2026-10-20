function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err.message);
  
  if (err.message && (
    err.message.includes('Format gambar tidak didukung') || 
    err.message.includes('Only JPG') ||
    err.message.includes('Hanya JPG') ||
    err.message.includes('Format berkas harus berupa')
  )) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Ukuran file melebihi batas maksimal yang diizinkan.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
}

module.exports = errorHandler;
