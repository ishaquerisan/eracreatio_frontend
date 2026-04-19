const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const {
    method = 'GET',
    payload,
    token,
  } = options;

  const headers = {};
  const isFormDataPayload = typeof FormData !== 'undefined' && payload instanceof FormData;

  if (payload !== undefined && !isFormDataPayload) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body:
      payload === undefined
        ? undefined
        : isFormDataPayload
          ? payload
          : JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

export function postNewsletterSubscription(payload) {
  return request('/newsletter', {
    method: 'POST',
    payload,
  });
}

export function postContactInquiry(payload) {
  return request('/contacts', {
    method: 'POST',
    payload,
  });
}

export function getPublishedBlogs() {
  return request('/blogs');
}

export function getPublicGalleries() {
  return request('/galleries');
}

export function getPublicCommercialProjects() {
  return request('/commercial-projects');
}

export function getPublicCommercialProjectByIdentifier(idOrSlug) {
  return request(`/commercial-projects/${idOrSlug}`);
}

export function getPublicVillaByIdentifier(idOrSlug) {
  return request(`/villas/${idOrSlug}`);
}

export function getPublicVillas() {
  return request('/villas');
}

export function getPublishedBlogByIdentifier(idOrSlug) {
  return request(`/blogs/${idOrSlug}`);
}

export function adminLogin(payload) {
  return request('/admin/login', {
    method: 'POST',
    payload,
  });
}

export function adminLogout(token) {
  return request('/admin/logout', {
    method: 'POST',
    token,
  });
}

export function getAdminProfile(token) {
  return request('/admin/me', { token });
}

export function verifyAdminPassword(token, password) {
  return request('/admin/verify-password', {
    method: 'POST',
    token,
    payload: { password },
  });
}

export function getAdminNewsletterSubscriptions(token) {
  return request('/admin/newsletter-subscriptions', { token });
}

export function getAdminContactInquiries(token) {
  return request('/admin/contact-inquiries', { token });
}

export function deleteAdminContactInquiry(token, contactId) {
  return request(`/admin/contact-inquiries/${contactId}`, {
    method: 'DELETE',
    token,
  });
}

export function getAdminBlogs(token) {
  return request('/admin/blogs', { token });
}

export function getAdminGalleryEntries(token) {
  return request('/admin/gallery-entries', { token });
}

export function getAdminCommercialProjects(token) {
  return request('/admin/commercial-projects', { token });
}

export function getAdminVillas(token) {
  return request('/admin/villas', { token });
}

export function createAdminGalleryEntry(token, payload) {
  return request('/admin/gallery-entries', {
    method: 'POST',
    token,
    payload,
  });
}

export function updateAdminGalleryEntry(token, entryId, payload) {
  return request(`/admin/gallery-entries/${entryId}`, {
    method: 'PUT',
    token,
    payload,
  });
}

export function deleteAdminGalleryEntry(token, entryId) {
  return request(`/admin/gallery-entries/${entryId}`, {
    method: 'DELETE',
    token,
  });
}

export function createAdminCommercialProject(token, payload) {
  return request('/admin/commercial-projects', {
    method: 'POST',
    token,
    payload,
  });
}

export function updateAdminCommercialProject(token, projectId, payload) {
  return request(`/admin/commercial-projects/${projectId}`, {
    method: 'PUT',
    token,
    payload,
  });
}

export function deleteAdminCommercialProject(token, projectId) {
  return request(`/admin/commercial-projects/${projectId}`, {
    method: 'DELETE',
    token,
  });
}

export function createAdminVilla(token, payload) {
  return request('/admin/villas', {
    method: 'POST',
    token,
    payload,
  });
}

export function updateAdminVilla(token, villaId, payload) {
  return request(`/admin/villas/${villaId}`, {
    method: 'PUT',
    token,
    payload,
  });
}

export function deleteAdminVilla(token, villaId) {
  return request(`/admin/villas/${villaId}`, {
    method: 'DELETE',
    token,
  });
}

export function createAdminBlog(token, payload) {
  return request('/admin/blogs', {
    method: 'POST',
    token,
    payload,
  });
}

export function updateAdminBlog(token, blogId, payload) {
  return request(`/admin/blogs/${blogId}`, {
    method: 'PUT',
    token,
    payload,
  });
}

export function deleteAdminBlog(token, blogId) {
  return request(`/admin/blogs/${blogId}`, {
    method: 'DELETE',
    token,
  });
}
