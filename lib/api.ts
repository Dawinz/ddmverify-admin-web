const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string; message?: string };
    return data.error ?? data.message ?? res.statusText;
  } catch {
    return await res.text().catch(() => res.statusText);
  }
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiGetOptional<T>(path: string, token: string, fallback: T): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 404) return fallback;
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiPatch(
  path: string,
  token: string,
  body: object,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiPost(
  path: string,
  token: string,
  body: object,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiPut(
  path: string,
  token: string,
  body: object,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiDelete(path: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await parseError(res));
}
