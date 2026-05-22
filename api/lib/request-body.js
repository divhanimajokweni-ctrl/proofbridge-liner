const DEFAULT_MAX_BODY_BYTES = 64 * 1024

export async function readJsonBody(req, { maxBytes = DEFAULT_MAX_BODY_BYTES } = {}) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }

  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) throw new Error('BODY_TOO_LARGE')
    return raw ? JSON.parse(raw) : {}
  }

  if (!req || typeof req[Symbol.asyncIterator] !== 'function') {
    return {}
  }

  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buf.length
    if (size > maxBytes) throw new Error('BODY_TOO_LARGE')
    chunks.push(buf)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}
