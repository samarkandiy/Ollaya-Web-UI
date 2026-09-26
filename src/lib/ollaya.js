/**
 * Minimal Ollaya API client.
 *
 * Every method takes an options bag that must include `baseUrl` and may include
 * `apiKey`. This keeps the client stateless so React components can pass the
 * user-configured settings straight in.
 *
 * All errors thrown from this module are `OllayaError` instances that expose
 * the raw `{ error, code, detail }` envelope from the server, plus the HTTP
 * status when available.
 */

export class OllayaError extends Error {
  constructor(message, { code, status, detail, cause } = {}) {
    super(message)
    this.name = "OllayaError"
    this.code = code
    this.status = status
    this.detail = detail
    if (cause) this.cause = cause
  }
}

function trimBase(baseUrl) {
  if (!baseUrl) return "http://127.0.0.1:11435"
  return baseUrl.replace(/\/+$/, "")
}

function buildHeaders(opts, extra) {
  const headers = { Accept: "application/json", ...(extra || {}) }
  if (opts?.apiKey) headers.Authorization = `Bearer ${opts.apiKey}`
  return headers
}

async function parseErrorResponse(res) {
  let body = null
  try {
    body = await res.json()
  } catch {
    // no body / not JSON
  }
  const message =
    (body && typeof body.error === "string" && body.error) ||
    `${res.status} ${res.statusText}` ||
    "Request failed"
  throw new OllayaError(message, {
    code: body?.code,
    status: res.status,
    detail: body?.detail,
  })
}

async function requestJson(opts, method, path, { body, headers, signal } = {}) {
  const url = `${trimBase(opts.baseUrl)}${path}`
  const init = { method, headers: buildHeaders(opts, headers), signal }
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body)
    init.headers["Content-Type"] = "application/json"
  }
  let res
  try {
    res = await fetch(url, init)
  } catch (err) {
    throw new OllayaError(
      err?.message || "Network request failed. Is the Ollaya server running?",
      { cause: err }
    )
  }
  if (!res.ok) await parseErrorResponse(res)
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Iterate over newline-delimited JSON from a streaming endpoint.
 * Yields parsed objects one line at a time.
 *
 * Errors that arrive as a final NDJSON line ({ "error": "...", "code": "..." })
 * are surfaced as `OllayaError`.
 */
async function* streamNdjson(opts, method, path, { body, signal } = {}) {
  const url = `${trimBase(opts.baseUrl)}${path}`
  const init = { method, headers: buildHeaders(opts), signal }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers["Content-Type"] = "application/json"
  }
  let res
  try {
    res = await fetch(url, init)
  } catch (err) {
    throw new OllayaError(
      err?.message || "Network request failed. Is the Ollaya server running?",
      { cause: err }
    )
  }
  if (!res.ok) await parseErrorResponse(res)
  if (!res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const raw = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)
        if (!raw) continue
        let parsed
        try {
          parsed = JSON.parse(raw)
        } catch {
          continue
        }
        if (parsed && parsed.error) {
          throw new OllayaError(parsed.error, {
            code: parsed.code,
            detail: parsed.detail,
          })
        }
        yield parsed
      }
    }
    const tail = buffer.trim()
    if (tail) {
      try {
        const parsed = JSON.parse(tail)
        if (parsed && parsed.error) {
          throw new OllayaError(parsed.error, {
            code: parsed.code,
            detail: parsed.detail,
          })
        }
        yield parsed
      } catch (err) {
        if (err instanceof OllayaError) throw err
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // ignore
    }
  }
}

// ---------- Endpoints ----------

export async function ping(opts, { signal } = {}) {
  // GET / returns some liveness body; we only care about the HTTP status.
  const url = `${trimBase(opts.baseUrl)}/`
  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(opts),
    signal,
  })
  return res.ok
}

export function getVersion(opts, options) {
  return requestJson(opts, "GET", "/api/version", options)
}

export function listModels(opts, options) {
  return requestJson(opts, "GET", "/api/tags", options)
}

export function listRunning(opts, options) {
  return requestJson(opts, "GET", "/api/ps", options)
}

export function showModel(opts, model, options) {
  return requestJson(opts, "POST", "/api/show", {
    ...options,
    body: { model },
  })
}

export function decide(opts, payload, options) {
  return requestJson(opts, "POST", "/api/decide", {
    ...options,
    body: payload,
  })
}

export function copyModel(opts, source, destination, options) {
  return requestJson(opts, "POST", "/api/copy", {
    ...options,
    body: { source, destination },
  })
}

export function deleteModel(opts, model, options) {
  return requestJson(opts, "DELETE", "/api/delete", {
    ...options,
    body: { model },
  })
}

export function pullModel(opts, model, options) {
  return streamNdjson(opts, "POST", "/api/pull", {
    ...options,
    body: { model },
  })
}

export function createModel(opts, payload, options) {
  return streamNdjson(opts, "POST", "/api/create", {
    ...options,
    body: payload,
  })
}

// Also expose the raw helpers for advanced callers.
export { requestJson, streamNdjson, trimBase }
