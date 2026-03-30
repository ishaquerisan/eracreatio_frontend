import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import JournalContent from '../components/JournalContent';
import {
  adminLogin,
  adminLogout,
  createAdminBlog,
  createAdminCommercialProject,
  createAdminGalleryEntry,
  deleteAdminBlog,
  deleteAdminCommercialProject,
  deleteAdminGalleryEntry,
  getAdminBlogs,
  getAdminCommercialProjects,
  getAdminContactInquiries,
  getAdminGalleryEntries,
  getAdminNewsletterSubscriptions,
  getAdminProfile,
  updateAdminCommercialProject,
  updateAdminGalleryEntry,
  updateAdminBlog,
} from '../services/api';

const ADMIN_TOKEN_STORAGE_KEY = 'era_admin_token';
const COMMERCIAL_PROJECT_IMAGE_ASPECT = 3 / 2;
const BLOG_IMAGE_ASPECT = 4 / 3;
const BLOG_EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    [{ align: [] }],
    ['clean'],
  ],
};
const BLOG_EDITOR_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'blockquote',
  'link',
  'align',
];

function hasRichTextContent(value) {
  const html = String(value || '');

  if (!html.trim()) {
    return false;
  }

  if (/<img\b[^>]*>/i.test(html)) {
    return true;
  }

  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  return plainText.length > 0;
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return parsedDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createEmptyBlogForm() {
  return {
    id: null,
    title: '',
    excerpt: '',
    content: '',
    imageFile: null,
    imagePreviewUrl: '',
    existingImageUrl: '',
    category: 'General',
    author: 'Era Creatio Editorial',
    slug: '',
    publishedAt: '',
    isPublished: true,
  };
}

function mapBlogToForm(blog) {
  const publishedAtValue = blog.publishedAt ? new Date(blog.publishedAt).toISOString().slice(0, 16) : '';

  return {
    id: blog.id,
    title: blog.title || '',
    excerpt: blog.excerpt || '',
    content: blog.content || '',
    imageFile: null,
    imagePreviewUrl: '',
    existingImageUrl: blog.imageUrl || '',
    category: blog.category || 'General',
    author: blog.author || 'Era Creatio Editorial',
    slug: blog.slug || '',
    publishedAt: publishedAtValue,
    isPublished: Boolean(blog.isPublished),
  };
}

function createEmptyCommercialProjectForm() {
  return {
    id: null,
    name: '',
    location: '',
    category: 'ongoing',
    landArea: '',
    units: '',
    imageFile: null,
    imagePreviewUrl: '',
    existingImageUrl: '',
    slug: '',
    summary: '',
    details: '',
  };
}

function mapCommercialProjectToForm(project) {
  return {
    id: project.id,
    name: project.name || '',
    location: project.location || '',
    category: project.category || 'ongoing',
    landArea: project.landArea || '',
    units: project.units || '',
    imageFile: null,
    imagePreviewUrl: '',
    existingImageUrl: project.image || project.imageUrl || '',
    slug: project.slug || '',
    summary: project.summary || '',
    details: project.details || '',
  };
}

function revokePreviewUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ''));
    };

    reader.onerror = () => {
      reject(new Error('Could not read selected image.'));
    };

    reader.readAsDataURL(file);
  });
}

function loadImageElement(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not process selected image.')));
    image.src = imageSrc;
  });
}

async function createCroppedImageBlob(imageSrc, cropAreaPixels) {
  const image = await loadImageElement(imageSrc);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not open image editor.');
  }

  const targetWidth = Math.max(1, Math.round(cropAreaPixels.width));
  const targetHeight = Math.max(1, Math.round(cropAreaPixels.height));

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  context.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not crop selected image.'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}

function createEmptyGalleryForm() {
  return {
    id: null,
    galleryType: 'independent',
    category: 'ongoing',
    placeName: '',
    images: [],
    existingImages: [],
  };
}

function createGalleryPreviewFile(file) {
  return {
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
  };
}

function revokeGalleryPreviewFiles(items) {
  for (const item of items || []) {
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const Admin = () => {
  const [token, setToken] = useState(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '');
  const [adminUsername, setAdminUsername] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({
    username: 'admin@123',
    password: 'pass@123',
  });

  const [activeTab, setActiveTab] = useState('newsletter');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [galleryEntries, setGalleryEntries] = useState([]);
  const [commercialProjects, setCommercialProjects] = useState([]);

  const [blogForm, setBlogForm] = useState(createEmptyBlogForm());
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState(null);
  const [blogMessage, setBlogMessage] = useState({ type: '', text: '' });
  const [isBlogCropOpen, setIsBlogCropOpen] = useState(false);
  const [blogCropSource, setBlogCropSource] = useState('');
  const [blogCropFileName, setBlogCropFileName] = useState('');
  const [blogCropPosition, setBlogCropPosition] = useState({ x: 0, y: 0 });
  const [blogCropZoom, setBlogCropZoom] = useState(1);
  const [blogCropAreaPixels, setBlogCropAreaPixels] = useState(null);
  const [isApplyingBlogCrop, setIsApplyingBlogCrop] = useState(false);
  const [commercialProjectForm, setCommercialProjectForm] = useState(createEmptyCommercialProjectForm());
  const [isSavingCommercialProject, setIsSavingCommercialProject] = useState(false);
  const [deletingCommercialProjectId, setDeletingCommercialProjectId] = useState(null);
  const [commercialProjectMessage, setCommercialProjectMessage] = useState({ type: '', text: '' });
  const [isCommercialCropOpen, setIsCommercialCropOpen] = useState(false);
  const [commercialCropSource, setCommercialCropSource] = useState('');
  const [commercialCropFileName, setCommercialCropFileName] = useState('');
  const [commercialCropPosition, setCommercialCropPosition] = useState({ x: 0, y: 0 });
  const [commercialCropZoom, setCommercialCropZoom] = useState(1);
  const [commercialCropAreaPixels, setCommercialCropAreaPixels] = useState(null);
  const [isApplyingCommercialCrop, setIsApplyingCommercialCrop] = useState(false);
  const [galleryForm, setGalleryForm] = useState(createEmptyGalleryForm());
  const [isSavingGalleryEntry, setIsSavingGalleryEntry] = useState(false);
  const [deletingGalleryEntryId, setDeletingGalleryEntryId] = useState(null);
  const [galleryMessage, setGalleryMessage] = useState({ type: '', text: '' });
  const blogUploadInputRef = useRef(null);
  const blogPreviewRef = useRef('');
  const commercialProjectUploadInputRef = useRef(null);
  const commercialProjectPreviewRef = useRef('');
  const galleryUploadInputRef = useRef(null);
  const galleryPreviewsRef = useRef([]);

  const dashboardCounts = useMemo(
    () => ({
      subscriptions: subscriptions.length,
      contacts: contacts.length,
      blogs: blogs.length,
      galleries: galleryEntries.length,
      commercialProjects: commercialProjects.length,
    }),
    [subscriptions, contacts, blogs, galleryEntries, commercialProjects]
  );

  async function loadAdminData(sessionToken) {
    setIsLoadingData(true);
    setDataError('');

    try {
      const [subscriptionData, contactData, blogData, galleryData, commercialProjectData] = await Promise.all([
        getAdminNewsletterSubscriptions(sessionToken),
        getAdminContactInquiries(sessionToken),
        getAdminBlogs(sessionToken),
        getAdminGalleryEntries(sessionToken),
        getAdminCommercialProjects(sessionToken),
      ]);

      setSubscriptions(subscriptionData.subscriptions || []);
      setContacts(contactData.contacts || []);
      setBlogs(blogData.blogs || []);
      setGalleryEntries(galleryData.entries || []);
      setCommercialProjects(commercialProjectData.projects || []);
    } catch (error) {
      const message = error.message || 'Could not load admin data right now.';
      setDataError(message);

      if (message.toLowerCase().includes('unauthorized')) {
        localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        setToken('');
        setAuthError('Session expired. Please login again.');
      }
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAdmin() {
      if (!token) {
        return;
      }

      setIsBootstrapping(true);
      setAuthError('');

      try {
        const profile = await getAdminProfile(token);

        if (!isMounted) {
          return;
        }

        setAdminUsername(profile.admin?.username || 'Admin');
        await loadAdminData(token);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        setToken('');
        setAuthError(error.message || 'Could not validate admin session.');
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapAdmin();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    blogPreviewRef.current = blogForm.imagePreviewUrl;
  }, [blogForm.imagePreviewUrl]);

  useEffect(() => () => {
    revokePreviewUrl(blogPreviewRef.current);
  }, []);

  useEffect(() => {
    commercialProjectPreviewRef.current = commercialProjectForm.imagePreviewUrl;
  }, [commercialProjectForm.imagePreviewUrl]);

  useEffect(() => () => {
    revokePreviewUrl(commercialProjectPreviewRef.current);
  }, []);

  useEffect(() => {
    galleryPreviewsRef.current = galleryForm.images;
  }, [galleryForm.images]);

  useEffect(() => () => {
    revokeGalleryPreviewFiles(galleryPreviewsRef.current);
  }, []);

  const resetBlogCropState = () => {
    setIsBlogCropOpen(false);
    setBlogCropSource('');
    setBlogCropFileName('');
    setBlogCropPosition({ x: 0, y: 0 });
    setBlogCropZoom(1);
    setBlogCropAreaPixels(null);
    setIsApplyingBlogCrop(false);

    if (blogUploadInputRef.current) {
      blogUploadInputRef.current.value = '';
    }
  };

  const resetBlogForm = () => {
    setBlogForm((previous) => {
      revokePreviewUrl(previous.imagePreviewUrl);
      return createEmptyBlogForm();
    });

    resetBlogCropState();
  };

  const resetCommercialProjectForm = () => {
    setCommercialProjectForm((previous) => {
      revokePreviewUrl(previous.imagePreviewUrl);
      return createEmptyCommercialProjectForm();
    });

    setIsCommercialCropOpen(false);
    setCommercialCropSource('');
    setCommercialCropFileName('');
    setCommercialCropPosition({ x: 0, y: 0 });
    setCommercialCropZoom(1);
    setCommercialCropAreaPixels(null);
    setIsApplyingCommercialCrop(false);

    if (commercialProjectUploadInputRef.current) {
      commercialProjectUploadInputRef.current.value = '';
    }
  };

  const resetGalleryForm = () => {
    setGalleryForm((previous) => {
      revokeGalleryPreviewFiles(previous.images);
      return createEmptyGalleryForm();
    });

    if (galleryUploadInputRef.current) {
      galleryUploadInputRef.current.value = '';
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const data = await adminLogin(loginForm);
      const newToken = data.token || '';

      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, newToken);
      setToken(newToken);
      setAdminUsername(data.admin?.username || 'Admin');
    } catch (error) {
      setAuthError(error.message || 'Invalid username or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    const currentToken = token;

    if (currentToken) {
      try {
        await adminLogout(currentToken);
      } catch (_error) {
        // Logout should proceed client-side even if API call fails.
      }
    }

    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken('');
    setAdminUsername('');
    setSubscriptions([]);
    setContacts([]);
    setBlogs([]);
    setGalleryEntries([]);
    setCommercialProjects([]);
    resetBlogForm();
    resetCommercialProjectForm();
    resetGalleryForm();
    setBlogMessage({ type: '', text: '' });
    setCommercialProjectMessage({ type: '', text: '' });
    setGalleryMessage({ type: '', text: '' });
  };

  const handleBlogSubmit = async (event) => {
    event.preventDefault();
    setBlogMessage({ type: '', text: '' });

    if (!blogForm.id && !blogForm.imageFile) {
      setBlogMessage({ type: 'error', text: 'Please upload a cover image.' });
      return;
    }

    if (!blogForm.excerpt.trim()) {
      setBlogMessage({ type: 'error', text: 'Please add a short excerpt.' });
      return;
    }

    if (!hasRichTextContent(blogForm.content)) {
      setBlogMessage({ type: 'error', text: 'Please add article content before publishing.' });
      return;
    }

    setIsSavingBlog(true);

    try {
      const payload = new FormData();
      payload.append('title', blogForm.title.trim());
      payload.append('excerpt', blogForm.excerpt.trim());
      payload.append('content', blogForm.content);
      payload.append('category', blogForm.category.trim());
      payload.append('author', blogForm.author.trim());
      payload.append('slug', blogForm.slug.trim());
      payload.append('isPublished', String(Boolean(blogForm.isPublished)));

      if (blogForm.publishedAt) {
        payload.append('publishedAt', blogForm.publishedAt);
      }

      if (blogForm.imageFile) {
        payload.append('image', blogForm.imageFile);
      }

      if (blogForm.id) {
        await updateAdminBlog(token, blogForm.id, payload);
        setBlogMessage({ type: 'success', text: 'Article updated successfully.' });
      } else {
        await createAdminBlog(token, payload);
        setBlogMessage({ type: 'success', text: 'Article published successfully.' });
      }

      resetBlogForm();
      await loadAdminData(token);
      setActiveTab('blogs');
    } catch (error) {
      setBlogMessage({ type: 'error', text: error.message || 'Could not save article.' });
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleBlogImageSelected = async (event) => {
    const selectedFile = event.target.files && event.target.files[0] ? event.target.files[0] : null;

    if (!selectedFile) {
      return;
    }

    if (!String(selectedFile.type || '').startsWith('image/')) {
      setBlogMessage({ type: 'error', text: 'Only image files are allowed.' });

      if (blogUploadInputRef.current) {
        blogUploadInputRef.current.value = '';
      }

      return;
    }

    try {
      const cropSource = await readFileAsDataUrl(selectedFile);

      setBlogMessage({ type: '', text: '' });
      setBlogCropFileName(selectedFile.name || 'blog-cover.jpg');
      setBlogCropSource(cropSource);
      setBlogCropPosition({ x: 0, y: 0 });
      setBlogCropZoom(1);
      setBlogCropAreaPixels(null);
      setIsBlogCropOpen(true);
    } catch (error) {
      setBlogMessage({ type: 'error', text: error.message || 'Could not load selected image.' });

      if (blogUploadInputRef.current) {
        blogUploadInputRef.current.value = '';
      }

      return;
    }

    setBlogForm((previous) => {
      revokePreviewUrl(previous.imagePreviewUrl);

      return {
        ...previous,
        imageFile: null,
        imagePreviewUrl: '',
      };
    });
  };

  const handleCancelBlogImageCrop = () => {
    resetBlogCropState();
  };

  const handleApplyBlogImageCrop = async () => {
    if (!blogCropSource || !blogCropAreaPixels) {
      setBlogMessage({ type: 'error', text: 'Please adjust crop area before applying.' });
      return;
    }

    setIsApplyingBlogCrop(true);

    try {
      const croppedBlob = await createCroppedImageBlob(blogCropSource, blogCropAreaPixels);
      const sourceName = blogCropFileName.replace(/\.[^/.]+$/, '') || 'blog-cover';
      const croppedFile = new File([croppedBlob], `${sourceName}-cropped.jpg`, { type: 'image/jpeg' });

      setBlogForm((previous) => {
        revokePreviewUrl(previous.imagePreviewUrl);

        return {
          ...previous,
          imageFile: croppedFile,
          imagePreviewUrl: URL.createObjectURL(croppedFile),
        };
      });

      setBlogMessage({ type: '', text: '' });
      handleCancelBlogImageCrop();
    } catch (error) {
      setBlogMessage({ type: 'error', text: error.message || 'Could not crop selected image.' });
    } finally {
      setIsApplyingBlogCrop(false);
    }
  };

  const handleClearSelectedBlogImage = () => {
    setBlogForm((previous) => {
      revokePreviewUrl(previous.imagePreviewUrl);

      return {
        ...previous,
        imageFile: null,
        imagePreviewUrl: '',
      };
    });

    if (blogUploadInputRef.current) {
      blogUploadInputRef.current.value = '';
    }
  };

  const handleDeleteBlog = async (blogId) => {
    const confirmed = window.confirm('Delete this article?');

    if (!confirmed) {
      return;
    }

    setBlogMessage({ type: '', text: '' });
    setDeletingBlogId(blogId);

    try {
      await deleteAdminBlog(token, blogId);

      if (blogForm.id === blogId) {
        resetBlogForm();
      }

      setBlogMessage({ type: 'success', text: 'Article deleted successfully.' });
      await loadAdminData(token);
    } catch (error) {
      setBlogMessage({ type: 'error', text: error.message || 'Could not delete article.' });
    } finally {
      setDeletingBlogId(null);
    }
  };

  const handleCommercialProjectSubmit = async (event) => {
    event.preventDefault();
    setCommercialProjectMessage({ type: '', text: '' });

    if (!commercialProjectForm.id && !commercialProjectForm.imageFile) {
      setCommercialProjectMessage({ type: 'error', text: 'Please upload a cover image.' });
      return;
    }

    setIsSavingCommercialProject(true);

    try {
      const payload = new FormData();
      payload.append('name', commercialProjectForm.name.trim());
      payload.append('location', commercialProjectForm.location.trim());
      payload.append('category', commercialProjectForm.category);
      payload.append('landArea', commercialProjectForm.landArea.trim());
      payload.append('units', commercialProjectForm.units.trim());
      payload.append('slug', commercialProjectForm.slug.trim());
      payload.append('summary', commercialProjectForm.summary.trim());
      payload.append('details', commercialProjectForm.details.trim());

      if (commercialProjectForm.imageFile) {
        payload.append('image', commercialProjectForm.imageFile);
      }

      if (commercialProjectForm.id) {
        await updateAdminCommercialProject(token, commercialProjectForm.id, payload);
        setCommercialProjectMessage({ type: 'success', text: 'Commercial project updated successfully.' });
      } else {
        await createAdminCommercialProject(token, payload);
        setCommercialProjectMessage({ type: 'success', text: 'Commercial project created successfully.' });
      }

      resetCommercialProjectForm();
      await loadAdminData(token);
      setActiveTab('commercialProjects');
    } catch (error) {
      setCommercialProjectMessage({ type: 'error', text: error.message || 'Could not save commercial project.' });
    } finally {
      setIsSavingCommercialProject(false);
    }
  };

  const handleCancelCommercialImageCrop = () => {
    setIsCommercialCropOpen(false);
    setCommercialCropSource('');
    setCommercialCropFileName('');
    setCommercialCropPosition({ x: 0, y: 0 });
    setCommercialCropZoom(1);
    setCommercialCropAreaPixels(null);

    if (commercialProjectUploadInputRef.current) {
      commercialProjectUploadInputRef.current.value = '';
    }
  };

  const handleApplyCommercialImageCrop = async () => {
    if (!commercialCropSource || !commercialCropAreaPixels) {
      setCommercialProjectMessage({ type: 'error', text: 'Please adjust crop area before applying.' });
      return;
    }

    setIsApplyingCommercialCrop(true);

    try {
      const croppedBlob = await createCroppedImageBlob(commercialCropSource, commercialCropAreaPixels);
      const sourceName = commercialCropFileName.replace(/\.[^/.]+$/, '') || 'commercial-project';
      const croppedFile = new File([croppedBlob], `${sourceName}-cropped.jpg`, { type: 'image/jpeg' });

      setCommercialProjectForm((previous) => {
        revokePreviewUrl(previous.imagePreviewUrl);

        return {
          ...previous,
          imageFile: croppedFile,
          imagePreviewUrl: URL.createObjectURL(croppedFile),
        };
      });

      setCommercialProjectMessage({ type: '', text: '' });
      handleCancelCommercialImageCrop();
    } catch (error) {
      setCommercialProjectMessage({ type: 'error', text: error.message || 'Could not crop selected image.' });
    } finally {
      setIsApplyingCommercialCrop(false);
    }
  };

  const handleCommercialProjectImageSelected = async (event) => {
    const selectedFile = event.target.files && event.target.files[0] ? event.target.files[0] : null;

    if (!selectedFile) {
      return;
    }

    if (!String(selectedFile.type || '').startsWith('image/')) {
      setCommercialProjectMessage({ type: 'error', text: 'Only image files are allowed.' });

      if (commercialProjectUploadInputRef.current) {
        commercialProjectUploadInputRef.current.value = '';
      }

      return;
    }

    try {
      const cropSource = await readFileAsDataUrl(selectedFile);

      setCommercialProjectMessage({ type: '', text: '' });
      setCommercialCropFileName(selectedFile.name || 'commercial-project.jpg');
      setCommercialCropSource(cropSource);
      setCommercialCropPosition({ x: 0, y: 0 });
      setCommercialCropZoom(1);
      setCommercialCropAreaPixels(null);
      setIsCommercialCropOpen(true);
    } catch (error) {
      setCommercialProjectMessage({ type: 'error', text: error.message || 'Could not load selected image.' });

      if (commercialProjectUploadInputRef.current) {
        commercialProjectUploadInputRef.current.value = '';
      }

      return;
    }

    setCommercialProjectForm((previous) => {
      revokePreviewUrl(previous.imagePreviewUrl);

      return {
        ...previous,
        imageFile: null,
        imagePreviewUrl: '',
      };
    });
  };

  const handleEditCommercialProject = (project) => {
    setCommercialProjectForm((previous) => {
      revokePreviewUrl(previous.imagePreviewUrl);
      return mapCommercialProjectToForm(project);
    });

    if (commercialProjectUploadInputRef.current) {
      commercialProjectUploadInputRef.current.value = '';
    }

    setCommercialProjectMessage({ type: '', text: '' });
  };

  const handleCancelCommercialProjectEdit = () => {
    resetCommercialProjectForm();
    setCommercialProjectMessage({ type: '', text: '' });
  };

  const handleDeleteCommercialProject = async (projectId) => {
    const confirmed = window.confirm('Delete this commercial project?');

    if (!confirmed) {
      return;
    }

    setCommercialProjectMessage({ type: '', text: '' });
    setDeletingCommercialProjectId(projectId);

    try {
      await deleteAdminCommercialProject(token, projectId);

      if (commercialProjectForm.id === projectId) {
        resetCommercialProjectForm();
      }

      setCommercialProjectMessage({ type: 'success', text: 'Commercial project deleted successfully.' });
      await loadAdminData(token);
    } catch (error) {
      setCommercialProjectMessage({ type: 'error', text: error.message || 'Could not delete commercial project.' });
    } finally {
      setDeletingCommercialProjectId(null);
    }
  };

  const handleGalleryFilesSelected = (event) => {
    const incomingFiles = Array.from(event.target.files || []);

    if (!incomingFiles.length) {
      return;
    }

    setGalleryMessage({ type: '', text: '' });
    setGalleryForm((previous) => {
      const availableSlots = Math.max(0, 3 - previous.images.length);
      const acceptedFiles = incomingFiles.slice(0, availableSlots).map(createGalleryPreviewFile);

      if (incomingFiles.length > availableSlots) {
        setGalleryMessage({ type: 'error', text: 'Maximum 3 images allowed per place.' });
      }

      return {
        ...previous,
        images: [...previous.images, ...acceptedFiles],
      };
    });

    if (galleryUploadInputRef.current) {
      galleryUploadInputRef.current.value = '';
    }
  };

  const handleRemoveSelectedGalleryImage = (imageIndex) => {
    setGalleryForm((previous) => {
      const nextImages = [...previous.images];
      const removedImage = nextImages.splice(imageIndex, 1)[0];

      revokeGalleryPreviewFiles([removedImage]);

      return {
        ...previous,
        images: nextImages,
      };
    });
  };

  const handleClearSelectedGalleryImages = () => {
    setGalleryForm((previous) => {
      revokeGalleryPreviewFiles(previous.images);

      return {
        ...previous,
        images: [],
      };
    });

    if (galleryUploadInputRef.current) {
      galleryUploadInputRef.current.value = '';
    }
  };

  const handleGallerySubmit = async (event) => {
    event.preventDefault();
    setGalleryMessage({ type: '', text: '' });

    const selectedFiles = galleryForm.images.map((item) => item.file).filter(Boolean);

    if (selectedFiles.length > 3) {
      setGalleryMessage({ type: 'error', text: 'Please upload at most 3 images.' });
      return;
    }

    if (!galleryForm.id && selectedFiles.length < 1) {
      setGalleryMessage({ type: 'error', text: 'Please upload at least 1 image.' });
      return;
    }

    setIsSavingGalleryEntry(true);

    try {
      const payload = new FormData();
      payload.append('galleryType', galleryForm.galleryType);
      payload.append('category', galleryForm.category);
      payload.append('placeName', galleryForm.placeName.trim());

      selectedFiles.forEach((file) => {
        payload.append('images', file);
      });

      if (galleryForm.id) {
        await updateAdminGalleryEntry(token, galleryForm.id, payload);
      } else {
        await createAdminGalleryEntry(token, payload);
      }

      resetGalleryForm();
      setGalleryMessage({
        type: 'success',
        text: galleryForm.id ? 'Gallery entry updated successfully.' : 'Gallery entry created successfully.',
      });
      await loadAdminData(token);
    } catch (error) {
      setGalleryMessage({
        type: 'error',
        text: error.message || (galleryForm.id ? 'Could not update gallery entry.' : 'Could not create gallery entry.'),
      });
    } finally {
      setIsSavingGalleryEntry(false);
    }
  };

  const handleEditGalleryEntry = (entry) => {
    setGalleryMessage({ type: '', text: '' });
    setGalleryForm((previous) => {
      revokeGalleryPreviewFiles(previous.images);

      return {
        id: entry.id,
        galleryType: entry.galleryType,
        category: entry.category,
        placeName: entry.placeName,
        images: [],
        existingImages: Array.isArray(entry.images) ? entry.images : [],
      };
    });

    if (galleryUploadInputRef.current) {
      galleryUploadInputRef.current.value = '';
    }
  };

  const handleCancelGalleryEdit = () => {
    resetGalleryForm();
    setGalleryMessage({ type: '', text: '' });
  };

  const handleDeleteGalleryEntry = async (entryId) => {
    const confirmed = window.confirm('Delete this gallery entry and its images?');

    if (!confirmed) {
      return;
    }

    setGalleryMessage({ type: '', text: '' });
    setDeletingGalleryEntryId(entryId);

    try {
      await deleteAdminGalleryEntry(token, entryId);

      if (galleryForm.id === entryId) {
        resetGalleryForm();
      }

      setGalleryMessage({ type: 'success', text: 'Gallery entry deleted successfully.' });
      await loadAdminData(token);
    } catch (error) {
      setGalleryMessage({ type: 'error', text: error.message || 'Could not delete gallery entry.' });
    } finally {
      setDeletingGalleryEntryId(null);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-950 text-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-8 shadow-2xl">
          <h1 className="font-serif text-3xl mb-2">Admin Console</h1>
          <p className="text-gray-300 text-sm mb-6">Sign in to manage newsletter subscriptions, contact inquiries, and journals.</p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(event) => setLoginForm((previous) => ({ ...previous, username: event.target.value }))}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            {authError && <p className="text-red-300 text-sm">{authError}</p>}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-accent text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition-colors disabled:opacity-70"
            >
              {isLoggingIn ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgLight pt-10 sm:pt-12 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-primary text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-gray-300 text-sm">Signed in as {adminUsername}</p>
              <h1 className="font-serif text-3xl sm:text-4xl mt-1">Admin Dashboard</h1>
              <p className="text-gray-300 mt-2 max-w-2xl">
                Manage audience activity and publish premium journal-style articles that appear in the Knowledge Hub.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="self-start lg:self-center bg-white text-primary px-6 py-3 rounded-luxury font-medium"
            >
              Logout
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-300">Newsletter</p>
              <p className="text-3xl font-semibold mt-2">{dashboardCounts.subscriptions}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-300">Contacts</p>
              <p className="text-3xl font-semibold mt-2">{dashboardCounts.contacts}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-300">Articles</p>
              <p className="text-3xl font-semibold mt-2">{dashboardCounts.blogs}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-300">Gallery Entries</p>
              <p className="text-3xl font-semibold mt-2">{dashboardCounts.galleries}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-300">Commercial Projects</p>
              <p className="text-3xl font-semibold mt-2">{dashboardCounts.commercialProjects}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('newsletter')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === 'newsletter' ? 'bg-primary text-white' : 'bg-bgLight text-primary'
              }`}
            >
              Newsletter Subscriptions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === 'contacts' ? 'bg-primary text-white' : 'bg-bgLight text-primary'
              }`}
            >
              Contact Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('blogs')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === 'blogs' ? 'bg-primary text-white' : 'bg-bgLight text-primary'
              }`}
            >
              Write Journals & Blogs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('galleries')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === 'galleries' ? 'bg-primary text-white' : 'bg-bgLight text-primary'
              }`}
            >
              Manage Galleries
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('commercialProjects')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeTab === 'commercialProjects' ? 'bg-primary text-white' : 'bg-bgLight text-primary'
              }`}
            >
              Commercial Developments
            </button>
          </div>

          {isBootstrapping || isLoadingData ? (
            <p className="text-textGrey mt-6">Loading data...</p>
          ) : null}

          {dataError ? <p className="text-red-600 text-sm mt-4">{dataError}</p> : null}

          {activeTab === 'newsletter' && !isLoadingData && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="bg-bgLight text-left">
                    <th className="px-4 py-3 text-sm font-semibold text-primary">Email</th>
                    <th className="px-4 py-3 text-sm font-semibold text-primary">Source</th>
                    <th className="px-4 py-3 text-sm font-semibold text-primary">Subscribed On</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-sm text-primary">{item.email}</td>
                      <td className="px-4 py-3 text-sm text-textGrey">{item.source}</td>
                      <td className="px-4 py-3 text-sm text-textGrey">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!subscriptions.length && <p className="text-textGrey text-sm mt-4">No subscriptions yet.</p>}
            </div>
          )}

          {activeTab === 'contacts' && !isLoadingData && (
            <div className="mt-6 grid gap-4">
              {contacts.map((contact) => (
                <article key={contact.id} className="border border-gray-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="font-semibold text-primary text-lg">{contact.name}</h3>
                    <p className="text-xs sm:text-sm text-textGrey">{formatDateTime(contact.createdAt)}</p>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-textGrey">
                    <p>Phone: {contact.phone || '-'}</p>
                    <p>Email: {contact.email || '-'}</p>
                    <p>Interest: {contact.interest || '-'}</p>
                    <p>Source: {contact.source || '-'}</p>
                  </div>
                  {contact.message ? <p className="mt-3 text-sm text-primary">{contact.message}</p> : null}
                </article>
              ))}
              {!contacts.length && <p className="text-textGrey text-sm">No inquiries yet.</p>}
            </div>
          )}

          {activeTab === 'commercialProjects' && !isLoadingData && (
            <div className="mt-6 grid xl:grid-cols-2 gap-6">
              <form onSubmit={handleCommercialProjectSubmit} className="bg-bgLight rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl text-primary">
                    {commercialProjectForm.id ? 'Edit Commercial Project' : 'Create Commercial Project'}
                  </h3>
                  {commercialProjectForm.id ? (
                    <button
                      type="button"
                      onClick={handleCancelCommercialProjectEdit}
                      className="text-sm text-accent font-medium"
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>

                <p className="text-sm text-textGrey">
                  Manage the projects shown in "Our Commercial Developments" and configure details visible on View Details.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <select
                    value={commercialProjectForm.category}
                    onChange={(event) => {
                      setCommercialProjectForm((previous) => ({ ...previous, category: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Slug (optional)"
                    value={commercialProjectForm.slug}
                    onChange={(event) => {
                      setCommercialProjectForm((previous) => ({ ...previous, slug: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Project name"
                    value={commercialProjectForm.name}
                    onChange={(event) => {
                      setCommercialProjectForm((previous) => ({ ...previous, name: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Location / Place"
                    value={commercialProjectForm.location}
                    onChange={(event) => {
                      setCommercialProjectForm((previous) => ({ ...previous, location: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Land area"
                    value={commercialProjectForm.landArea}
                    onChange={(event) => {
                      setCommercialProjectForm((previous) => ({ ...previous, landArea: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Units"
                    value={commercialProjectForm.units}
                    onChange={(event) => {
                      setCommercialProjectForm((previous) => ({ ...previous, units: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <div className="rounded-2xl border border-primary/15 bg-white p-4">
                  <input
                    ref={commercialProjectUploadInputRef}
                    id="commercial-project-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleCommercialProjectImageSelected}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="commercial-project-image-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-primary bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-opacity-90"
                    >
                      {commercialProjectForm.id ? 'Choose Replacement Cover Image' : 'Choose Cover Image'}
                    </label>
                    {commercialProjectForm.imageFile ? (
                      <span className="text-xs sm:text-sm text-textGrey truncate max-w-[280px]">{commercialProjectForm.imageFile.name}</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-textGrey">No file selected</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-textGrey">
                    {commercialProjectForm.id
                      ? 'Upload a new image only if you want to replace the current cover image. Crop ratio is fixed to 3:2.'
                      : 'Upload one cover image for this project. Crop ratio is fixed to 3:2.'}
                  </p>
                </div>

                {commercialProjectForm.imagePreviewUrl ? (
                  <div>
                    <p className="text-xs text-textGrey mb-2">Selected cover image</p>
                    <img
                      src={commercialProjectForm.imagePreviewUrl}
                      alt="Selected commercial project cover"
                      className="h-40 w-full sm:w-72 rounded-xl object-cover border border-gray-200"
                    />
                  </div>
                ) : null}

                {commercialProjectForm.id && !commercialProjectForm.imagePreviewUrl && commercialProjectForm.existingImageUrl ? (
                  <div>
                    <p className="text-xs text-textGrey mb-2">Current cover image</p>
                    <img
                      src={commercialProjectForm.existingImageUrl}
                      alt="Current commercial project cover"
                      className="h-40 w-full sm:w-72 rounded-xl object-cover border border-gray-200"
                    />
                  </div>
                ) : null}

                <textarea
                  placeholder="Short summary shown on project card (optional)"
                  value={commercialProjectForm.summary}
                  onChange={(event) => {
                    setCommercialProjectForm((previous) => ({ ...previous, summary: event.target.value }));
                  }}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />

                <textarea
                  placeholder="Detailed description shown in View Details"
                  value={commercialProjectForm.details}
                  onChange={(event) => {
                    setCommercialProjectForm((previous) => ({ ...previous, details: event.target.value }));
                  }}
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent resize-y"
                />

                {commercialProjectMessage.text ? (
                  <p className={`text-sm ${commercialProjectMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {commercialProjectMessage.text}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSavingCommercialProject}
                  className="bg-primary text-white px-6 py-3 rounded-luxury font-medium hover:bg-opacity-90 transition-colors disabled:opacity-70"
                >
                  {isSavingCommercialProject
                    ? 'Saving...'
                    : commercialProjectForm.id
                      ? 'Update Commercial Project'
                      : 'Save Commercial Project'}
                </button>
              </form>

              <article className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
                <h3 className="font-serif text-2xl text-primary mb-4">Existing Commercial Projects</h3>
                <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
                  {commercialProjects.map((project) => (
                    <div key={project.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-primary">{project.name}</p>
                          <p className="text-xs text-textGrey mt-1">
                            {project.category === 'completed' ? 'Completed' : 'Ongoing'}
                            {' • '}
                            {project.location}
                            {' • '}
                            {formatDateTime(project.updatedAt || project.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleEditCommercialProject(project)}
                            className="text-sm text-accent font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCommercialProject(project.id)}
                            disabled={deletingCommercialProjectId === project.id}
                            className="text-sm text-red-600 font-medium disabled:opacity-60"
                          >
                            {deletingCommercialProjectId === project.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-textGrey">
                        <p>Land: {project.landArea || '-'}</p>
                        <p>Units: {project.units || '-'}</p>
                      </div>

                      {project.summary ? <p className="mt-3 text-sm text-primary">{project.summary}</p> : null}
                    </div>
                  ))}
                  {!commercialProjects.length ? <p className="text-sm text-textGrey">No commercial projects yet.</p> : null}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'galleries' && !isLoadingData && (
            <div className="mt-6 grid xl:grid-cols-2 gap-6">
              <form onSubmit={handleGallerySubmit} className="bg-bgLight rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl text-primary">
                    {galleryForm.id ? 'Edit Gallery Entry' : 'Create Gallery Entry'}
                  </h3>
                  {galleryForm.id ? (
                    <button
                      type="button"
                      onClick={handleCancelGalleryEdit}
                      className="text-sm text-accent font-medium"
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
                <p className="text-sm text-textGrey">
                  Add one place with 1 to 3 images. Clicking that place in gallery will show only that place's uploaded images.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <select
                    value={galleryForm.galleryType}
                    onChange={(event) => {
                      setGalleryForm((previous) => ({ ...previous, galleryType: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="independent">Independent Residences</option>
                    <option value="commercial">Commercial Projects</option>
                  </select>
                  <select
                    value={galleryForm.category}
                    onChange={(event) => {
                      setGalleryForm((previous) => ({ ...previous, category: event.target.value }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Place name"
                  value={galleryForm.placeName}
                  onChange={(event) => {
                    setGalleryForm((previous) => ({ ...previous, placeName: event.target.value }));
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />

                <div className="rounded-2xl border border-primary/15 bg-white p-4">
                  <input
                    ref={galleryUploadInputRef}
                    id="gallery-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFilesSelected}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="gallery-image-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-primary bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-opacity-90"
                    >
                      {galleryForm.id ? 'Choose Replacement Images' : 'Choose Images'}
                    </label>
                    <span className="text-xs sm:text-sm text-textGrey">
                      {galleryForm.images.length}/3 selected
                    </span>
                    {galleryForm.images.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleClearSelectedGalleryImages}
                        className="text-xs sm:text-sm text-accent font-medium"
                      >
                        Clear All
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-textGrey">
                    {galleryForm.id
                      ? 'You can optionally upload 1 to 3 replacement images. First image is used as cover.'
                      : 'Upload minimum 1 image and maximum 3 images for this place. First image is used as cover.'}
                  </p>
                  {galleryForm.id ? (
                    <p className="mt-1 text-[11px] text-textGrey">
                      If you do not choose new images, existing images will stay unchanged.
                    </p>
                  ) : null}
                </div>

                {galleryForm.id && galleryForm.images.length === 0 && galleryForm.existingImages.length > 0 ? (
                  <div>
                    <p className="text-xs text-textGrey mb-2">Current images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {galleryForm.existingImages.map((imageUrl, imageIndex) => (
                        <img
                          key={`existing-${imageIndex}`}
                          src={imageUrl}
                          alt={galleryForm.placeName || 'Current gallery image'}
                          className="h-24 w-full rounded-xl object-cover border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {galleryForm.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryForm.images.map((item, imageIndex) => (
                      <div key={`${item.name}-${imageIndex}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <img src={item.previewUrl} alt={item.name} className="h-24 w-full object-cover" />
                        <div className="p-2">
                          <p className="text-[11px] text-primary truncate">{item.name}</p>
                          <p className="text-[10px] text-textGrey">{formatFileSize(item.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedGalleryImage(imageIndex)}
                          className="absolute top-1 right-1 bg-black/65 text-white text-[10px] px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {galleryMessage.text ? (
                  <p className={`text-sm ${galleryMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {galleryMessage.text}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSavingGalleryEntry}
                  className="bg-primary text-white px-6 py-3 rounded-luxury font-medium hover:bg-opacity-90 transition-colors disabled:opacity-70"
                >
                  {isSavingGalleryEntry ? 'Saving...' : galleryForm.id ? 'Update Gallery Entry' : 'Save Gallery Entry'}
                </button>
              </form>

              <article className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
                <h3 className="font-serif text-2xl text-primary mb-4">Existing Gallery Entries</h3>
                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                  {galleryEntries.map((entry) => (
                    <div key={entry.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-primary">{entry.placeName}</p>
                          <p className="text-xs text-textGrey mt-1">
                            {entry.galleryType === 'commercial' ? 'Commercial Projects' : 'Independent Residences'}
                            {' • '}
                            {entry.category}
                            {' • '}
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleEditGalleryEntry(entry)}
                            className="text-sm text-accent font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryEntry(entry.id)}
                            disabled={deletingGalleryEntryId === entry.id}
                            className="text-sm text-red-600 font-medium disabled:opacity-60"
                          >
                            {deletingGalleryEntryId === entry.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {entry.images.map((imageUrl, imageIndex) => (
                          <img
                            key={`${entry.id}-${imageIndex}`}
                            src={imageUrl}
                            alt={entry.placeName}
                            className="h-20 w-full rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {!galleryEntries.length ? <p className="text-sm text-textGrey">No gallery entries yet.</p> : null}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'blogs' && !isLoadingData && (
            <div className="mt-6 grid xl:grid-cols-2 gap-6">
              <form onSubmit={handleBlogSubmit} className="bg-bgLight rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl text-primary">{blogForm.id ? 'Edit Article' : 'Write New Article'}</h3>
                  {blogForm.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetBlogForm();
                        setBlogMessage({ type: '', text: '' });
                      }}
                      className="text-sm text-accent font-medium"
                    >
                      New Draft
                    </button>
                  ) : null}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={blogForm.title}
                    onChange={(event) => setBlogForm((previous) => ({ ...previous, title: event.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={blogForm.category}
                    onChange={(event) => setBlogForm((previous) => ({ ...previous, category: event.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Author"
                    value={blogForm.author}
                    onChange={(event) => setBlogForm((previous) => ({ ...previous, author: event.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    placeholder="Slug (optional)"
                    value={blogForm.slug}
                    onChange={(event) => setBlogForm((previous) => ({ ...previous, slug: event.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="rounded-2xl border border-primary/15 bg-white p-4">
                  <input
                    ref={blogUploadInputRef}
                    id="blog-cover-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBlogImageSelected}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="blog-cover-image-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-primary bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-opacity-90"
                    >
                      {blogForm.id ? 'Choose Replacement Cover Image' : 'Choose Cover Image'}
                    </label>
                    {blogForm.imageFile ? (
                      <span className="text-xs sm:text-sm text-textGrey truncate max-w-[280px]">{blogForm.imageFile.name}</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-textGrey">No file selected</span>
                    )}
                    {blogForm.imageFile ? (
                      <button
                        type="button"
                        onClick={handleClearSelectedBlogImage}
                        className="text-xs sm:text-sm text-accent font-medium"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-textGrey">
                    {blogForm.id
                      ? 'Upload a new image only if you want to replace the current cover image. Crop ratio is fixed to 4:3.'
                      : 'Upload one cover image for this article. Crop ratio is fixed to 4:3.'}
                  </p>
                </div>

                {blogForm.imagePreviewUrl ? (
                  <div>
                    <p className="text-xs text-textGrey mb-2">Selected cover image</p>
                    <img
                      src={blogForm.imagePreviewUrl}
                      alt="Selected blog cover"
                      className="h-40 w-full sm:w-72 rounded-xl object-cover border border-gray-200"
                    />
                  </div>
                ) : null}

                {blogForm.id && !blogForm.imagePreviewUrl && blogForm.existingImageUrl ? (
                  <div>
                    <p className="text-xs text-textGrey mb-2">Current cover image</p>
                    <img
                      src={blogForm.existingImageUrl}
                      alt="Current blog cover"
                      className="h-40 w-full sm:w-72 rounded-xl object-cover border border-gray-200"
                    />
                  </div>
                ) : null}

                <input
                  type="datetime-local"
                  value={blogForm.publishedAt}
                  onChange={(event) => setBlogForm((previous) => ({ ...previous, publishedAt: event.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                />

                <textarea
                  placeholder="Short excerpt"
                  value={blogForm.excerpt}
                  onChange={(event) => setBlogForm((previous) => ({ ...previous, excerpt: event.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  required
                />

                <div>
                  <p className="text-sm font-medium text-primary mb-2">Article Content</p>
                  <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={blogForm.content}
                      onChange={(value) => setBlogForm((previous) => ({ ...previous, content: value }))}
                      modules={BLOG_EDITOR_MODULES}
                      formats={BLOG_EDITOR_FORMATS}
                      placeholder="Write your journal content here..."
                      className="admin-blog-editor"
                    />
                  </div>
                </div>

                <p className="text-xs text-textGrey">
                  Use the toolbar to format headings, bold, italic, lists, quotes, links, and alignment like a document editor.
                </p>

                <label className="inline-flex items-center gap-2 text-sm text-primary">
                  <input
                    type="checkbox"
                    checked={blogForm.isPublished}
                    onChange={(event) => setBlogForm((previous) => ({ ...previous, isPublished: event.target.checked }))}
                  />
                  Publish immediately
                </label>

                {blogMessage.text ? (
                  <p className={`text-sm ${blogMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {blogMessage.text}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="bg-primary text-white px-6 py-3 rounded-luxury font-medium hover:bg-opacity-90 transition-colors disabled:opacity-70"
                >
                  {isSavingBlog ? 'Saving...' : blogForm.id ? 'Update Article' : 'Publish Article'}
                </button>
              </form>

              <div className="space-y-6">
                <article className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
                  <h3 className="font-serif text-2xl text-primary mb-4">Live Preview</h3>
                  <h4 className="font-serif text-3xl text-primary leading-tight">{blogForm.title || 'Your title will appear here'}</h4>
                  {blogForm.excerpt ? (
                    <p className="mt-4 text-textGrey border-l-4 border-accent pl-4">{blogForm.excerpt}</p>
                  ) : null}
                  {blogForm.content ? (
                    <div className="mt-6">
                      <JournalContent content={blogForm.content} />
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-textGrey">Start writing to preview your journal formatting.</p>
                  )}
                </article>

                <article className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
                  <h3 className="font-serif text-2xl text-primary mb-4">Existing Articles</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {blogs.map((blog) => (
                      <div key={blog.id} className="border border-gray-100 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-primary">{blog.title}</p>
                            <p className="text-xs text-textGrey mt-1">
                              {blog.category} • {formatDateTime(blog.publishedAt)}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              blog.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {blog.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              resetBlogCropState();
                              setBlogForm((previous) => {
                                revokePreviewUrl(previous.imagePreviewUrl);
                                return mapBlogToForm(blog);
                              });
                              setBlogMessage({ type: '', text: '' });
                            }}
                            className="text-sm text-accent font-medium"
                          >
                            Edit
                          </button>
                          <Link
                            to={`/blog/${blog.slug || blog.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary font-medium"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlog(blog.id)}
                            disabled={deletingBlogId === blog.id}
                            className="text-sm text-red-600 font-medium disabled:opacity-60"
                          >
                            {deletingBlogId === blog.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {!blogs.length ? <p className="text-sm text-textGrey">No articles available.</p> : null}
                  </div>
                </article>
              </div>
            </div>
          )}
        </section>
      </div>

      {isBlogCropOpen ? (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
              <h4 className="font-serif text-2xl text-primary">Crop Blog Cover Image</h4>
              <p className="text-sm text-textGrey mt-1">
                Adjust the crop to match blog card image proportion (4:3).
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="relative w-full rounded-xl overflow-hidden bg-zinc-900" style={{ height: 'min(70vh, 420px)' }}>
                <Cropper
                  image={blogCropSource}
                  crop={blogCropPosition}
                  zoom={blogCropZoom}
                  aspect={BLOG_IMAGE_ASPECT}
                  onCropChange={setBlogCropPosition}
                  onZoomChange={setBlogCropZoom}
                  onCropComplete={(_area, croppedAreaPixels) => setBlogCropAreaPixels(croppedAreaPixels)}
                  objectFit="cover"
                />
              </div>

              <div>
                <label className="block text-sm text-textGrey mb-2">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={blogCropZoom}
                  onChange={(event) => setBlogCropZoom(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelBlogImageCrop}
                  className="px-5 py-2.5 rounded-luxury border border-gray-300 text-textGrey"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBlogImageCrop}
                  disabled={isApplyingBlogCrop}
                  className="px-5 py-2.5 rounded-luxury bg-primary text-white disabled:opacity-70"
                >
                  {isApplyingBlogCrop ? 'Applying...' : 'Apply Crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCommercialCropOpen ? (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
              <h4 className="font-serif text-2xl text-primary">Crop Cover Image</h4>
              <p className="text-sm text-textGrey mt-1">
                Adjust the crop to match commercial project card image proportion (3:2).
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="relative w-full rounded-xl overflow-hidden bg-zinc-900" style={{ height: 'min(70vh, 420px)' }}>
                <Cropper
                  image={commercialCropSource}
                  crop={commercialCropPosition}
                  zoom={commercialCropZoom}
                  aspect={COMMERCIAL_PROJECT_IMAGE_ASPECT}
                  onCropChange={setCommercialCropPosition}
                  onZoomChange={setCommercialCropZoom}
                  onCropComplete={(_area, croppedAreaPixels) => setCommercialCropAreaPixels(croppedAreaPixels)}
                  objectFit="cover"
                />
              </div>

              <div>
                <label className="block text-sm text-textGrey mb-2">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={commercialCropZoom}
                  onChange={(event) => setCommercialCropZoom(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelCommercialImageCrop}
                  className="px-5 py-2.5 rounded-luxury border border-gray-300 text-textGrey"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCommercialImageCrop}
                  disabled={isApplyingCommercialCrop}
                  className="px-5 py-2.5 rounded-luxury bg-primary text-white disabled:opacity-70"
                >
                  {isApplyingCommercialCrop ? 'Applying...' : 'Apply Crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Admin;
