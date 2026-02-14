const BACKEND = 'http://45.63.87.155:5001';

export default async function handler(req, res) {
  const backendUrl = `${BACKEND}${req.url}`;

  const headers = {};
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

  const fetchOptions = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(backendUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    const data = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    res.send(data);
  } catch (err) {
    res.status(502).json({ error: 'Backend unreachable' });
  }
}
