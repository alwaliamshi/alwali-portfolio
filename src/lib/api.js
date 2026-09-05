const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_URL}${path}`;
}

export function getAdminToken() {
  return localStorage.getItem('portfolio_admin_token');
}
export function setAdminToken(token) { localStorage.setItem('portfolio_admin_token', token); }
export function clearAdminToken() { localStorage.removeItem('portfolio_admin_token'); }

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const authHeaders = () => ({ Authorization: `Bearer ${getAdminToken()}` });

export function getDocuments() { return request('/api/documents', { cache: 'no-store' }); }
export function login(username, password) {
  return request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
}
export function getAdminDocuments() { return request('/api/admin/documents', { headers: authHeaders(), cache: 'no-store' }); }
export function uploadDocument(formData) { return request('/api/documents', { method: 'POST', headers: authHeaders(), body: formData }); }
export function deleteDocument(id) { return request(`/api/documents/${id}`, { method: 'DELETE', headers: authHeaders() }); }
export async function getAdminOriginalUrl(id) {
  const response = await fetch(apiUrl(`/api/admin/documents/${id}/original`), { headers: authHeaders() });
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Could not open original'); }
  return URL.createObjectURL(await response.blob());
}

export function getTheme() { return request('/api/theme', { cache: 'no-store' }); }
export function uploadTheme(formData) { return request('/api/theme', { method: 'POST', headers: authHeaders(), body: formData }); }
export function deleteTheme() { return request('/api/theme', { method: 'DELETE', headers: authHeaders() }); }

export function getProjects() { return request('/api/projects', { cache: 'no-store' }); }
export function getAdminProjects() { return request('/api/admin/projects', { headers: authHeaders(), cache: 'no-store' }); }
export function createProject(formData) { return request('/api/projects', { method: 'POST', headers: authHeaders(), body: formData }); }
export function updateProject(id, formData) { return request(`/api/projects/${id}`, { method: 'PUT', headers: authHeaders(), body: formData }); }
export function deleteProject(id) { return request(`/api/projects/${id}`, { method: 'DELETE', headers: authHeaders() }); }

export function getAbout() {
  return request('/api/about', { cache: 'no-store' });
}

export function getAdminAbout() {
  return request('/api/admin/about', {
    headers: authHeaders(),
    cache: 'no-store'
  });
}

export function updateAbout(about) {
  return request('/api/about', {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(about)
  });
}
