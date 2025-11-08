app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
});
