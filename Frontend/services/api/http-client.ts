type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type HttpRequestOptions = {
  method?: HttpMethod
  body?: unknown
  token?: string
}

export async function httpClient<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "Request failed")
  }

  return (await response.json()) as T
}
