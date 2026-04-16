import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import {
  createAdminVilla,
  deleteAdminVilla,
  getAdminVillas,
  updateAdminVilla,
} from '../../services/api';
import 'leaflet/dist/leaflet.css';
import {
  FaBook,
  FaCar,
  FaChargingStation,
  FaCheck,
  FaChild,
  FaCube,
  FaDumbbell,
  FaLeaf,
  FaLightbulb,
  FaLocationDot,
  FaMagnifyingGlass,
  FaMapLocationDot,
  FaPersonWalking,
  FaRoad,
  FaShoePrints,
  FaShieldHalved,
  FaSun,
  FaTree,
  FaUsers,
  FaVideo,
  FaXmark,
} from 'react-icons/fa6';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const WIZARD_STEPS = [
  { id: 'basic', title: 'Basic Data', helper: 'Identity, location, and banner image' },
  { id: 'detailed', title: 'Detailed Info', helper: 'Status, brochure, description, and video' },
  { id: 'gallery', title: 'Gallery', helper: 'Exterior and interior images' },
  { id: 'highlights', title: 'Project Highlights', helper: 'Short selling points' },
  { id: 'details', title: 'Project Details', helper: 'Structured specs for the public page' },
  { id: 'amenities', title: 'Amenities & Features', helper: 'Custom amenity rows' },
  { id: 'availability', title: 'Availability Chart', helper: 'PDF upload' },
  { id: 'location', title: 'Location & Legal', helper: 'Map link, advantages, and charges' },
  { id: 'review', title: 'Review', helper: 'Check everything before saving' },
];

const EMPTY_PROJECT_DETAIL = {
  projectName: '',
  location: '',
  totalLandArea: '',
  totalUnits: '',
  configuration: '',
  price: '',
  status: 'draft',
  reraNumber: '',
};

const EMPTY_AMENITY = {
  title: '',
  desc: '',
  icon: '',
};

const DEFAULT_MAP_CENTER = [11.8745, 75.3704];

const AMENITY_ICON_OPTIONS = [
  { key: 'solar', label: 'Solar', Icon: FaSun },
  { key: 'fitness', label: 'Fitness', Icon: FaDumbbell },
  { key: 'lounge', label: 'Community', Icon: FaUsers },
  { key: 'jogging', label: 'Walking', Icon: FaPersonWalking },
  { key: 'children', label: 'Children', Icon: FaChild },
  { key: 'recreation', label: 'Park', Icon: FaTree },
  { key: 'landscape', label: 'Landscape', Icon: FaLeaf },
  { key: 'gathering', label: 'Gathering', Icon: FaUsers },
  { key: 'pathway', label: 'Pathway', Icon: FaShoePrints },
  { key: 'parking', label: 'Parking', Icon: FaCar },
  { key: 'security', label: 'Security', Icon: FaShieldHalved },
  { key: 'cctv', label: 'CCTV', Icon: FaVideo },
  { key: 'compound', label: 'Compound', Icon: FaCube },
  { key: 'roads', label: 'Roads', Icon: FaRoad },
  { key: 'lighting', label: 'Lighting', Icon: FaLightbulb },
  { key: 'ev', label: 'EV', Icon: FaChargingStation },
  { key: 'library', label: 'Library', Icon: FaBook },
];

function getAmenityIconOption(iconKey) {
  return AMENITY_ICON_OPTIONS.find((option) => option.key === iconKey) || null;
}

function filterAmenityIconOptions(searchValue) {
  const normalizedSearch = String(searchValue || '').trim().toLowerCase();

  if (!normalizedSearch) {
    return AMENITY_ICON_OPTIONS;
  }

  return AMENITY_ICON_OPTIONS.filter((option) => {
    return [option.key, option.label]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function buildMapUrl(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function parseMapCoordinates(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return null;
  }

  const googleQueryMatch = rawValue.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (googleQueryMatch) {
    return [Number(googleQueryMatch[1]), Number(googleQueryMatch[2])];
  }

  const googleAtMatch = rawValue.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (googleAtMatch) {
    return [Number(googleAtMatch[1]), Number(googleAtMatch[2])];
  }

  const plainMatch = rawValue.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (plainMatch) {
    return [Number(plainMatch[1]), Number(plainMatch[2])];
  }

  return null;
}

function MapViewport({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function MapEvents({ position, onChange }) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng]);
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(event) {
          const marker = event.target.getLatLng();
          onChange([marker.lat, marker.lng]);
        },
      }}
    >
      <Popup>Selected villa location</Popup>
    </Marker>
  ) : null;
}

function MapLocationPicker({ value, onChange, searchValue, onSearchValueChange, searchStatus, onSearch, isSearching }) {
  const parsedCoordinates = parseMapCoordinates(value);
  const [position, setPosition] = useState(parsedCoordinates || DEFAULT_MAP_CENTER);

  useEffect(() => {
    const nextCoordinates = parseMapCoordinates(value);

    if (nextCoordinates) {
      setPosition(nextCoordinates);
    }
  }, [value]);

  const handleSelectPosition = (nextPosition) => {
    setPosition(nextPosition);
    onChange(buildMapUrl(nextPosition[0], nextPosition[1]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-primary">
        <FaMapLocationDot className="text-accent" />
        Pin the exact villa location
      </div>
      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
        <input
          type="text"
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
          placeholder="Search a place and pin it on the map"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={isSearching}
          className="px-5 py-3 rounded-xl bg-primary text-white disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <FaMagnifyingGlass />
            {isSearching ? 'Searching...' : 'Search & Pin'}
          </span>
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <MapContainer center={position} zoom={15} scrollWheelZoom className="h-[360px] w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport center={position} />
          <MapEvents position={position} onChange={handleSelectPosition} />
        </MapContainer>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-textGrey">
        <span>
          Selected pin: <span className="text-primary">{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
        </span>
        <span>{searchStatus || 'Click the map or drag the pin to update the project location.'}</span>
      </div>

      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-accent text-sm"
        >
          <FaLocationDot /> Open selected pin in Maps
        </a>
      ) : null}
    </div>
  );
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

function createPreviewEntry(file) {
  return {
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name || 'file',
    size: file.size || 0,
  };
}

function loadImageElement(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not process selected image.')));
    image.src = imageSrc;
  });
}

async function compressImageFile(file, options = {}) {
  const { maxDimension = 1920, quality = 0.82 } = options;
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageElement(objectUrl);
    const scale = Math.min(1, maxDimension / image.width, maxDimension / image.height);
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not process selected image.');
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Could not compress selected image.'));
          return;
        }

        resolve(result);
      }, 'image/jpeg', quality);
    });

    const baseName = String(file.name || 'image').replace(/\.[^/.]+$/, '') || 'image';
    return new File([blob], `${baseName}-compressed.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function revokePreviewEntry(entry) {
  if (entry?.previewUrl && String(entry.previewUrl).startsWith('blob:')) {
    URL.revokeObjectURL(entry.previewUrl);
  }
}

function revokePreviewEntryList(entries) {
  for (const entry of entries || []) {
    revokePreviewEntry(entry);
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

function normalizeArrayValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item || '').trim()).filter(Boolean);
  }

  return [];
}

function normalizeSlugValue(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createSafeVillaSlug(slugValue, fallbackValue) {
  const normalizedSlug = normalizeSlugValue(slugValue);
  const normalizedFallback = normalizeSlugValue(fallbackValue);
  const baseSlug = normalizedSlug || normalizedFallback || `villa-${Date.now()}`;

  return /^\d+$/.test(baseSlug) ? `villa-${baseSlug}` : baseSlug;
}

function isVillaSlugTaken(slugValue, villas, currentVillaId = null) {
  const normalizedSlug = normalizeSlugValue(slugValue);

  if (!normalizedSlug) {
    return false;
  }

  return (villas || []).some((villa) => {
    if (currentVillaId !== null && String(villa.id) === String(currentVillaId)) {
      return false;
    }

    return normalizeSlugValue(villa.slug) === normalizedSlug;
  });
}

function createEmptyVillaForm() {
  return {
    id: null,
    slug: '',
    name: '',
    location: '',
    acres: '',
    totalVillas: '',
    status: 'draft',
    description: '',
    overviewTitle: '',
    overviewDescription: '',
    overviewTotalLand: '',
    overviewTotalUnits: '',
    configuration: '',
    startingPrice: '',
    reraNumber: '',
    mapLocationUrl: '',
    otherCharges: '',
    projectDetails: { ...EMPTY_PROJECT_DETAIL },
    projectHighlights: [''],
    locationAdvantages: [''],
    amenities: [{ ...EMPTY_AMENITY }],
    bannerImageFile: null,
    bannerImagePreviewUrl: '',
    existingBannerImageUrl: '',
    brochurePdfFile: null,
    brochurePdfName: '',
    existingBrochurePdfUrl: '',
    walkthroughVideoFile: null,
    walkthroughVideoName: '',
    existingWalkthroughVideoUrl: '',
    availabilityChartPdfFile: null,
    availabilityChartPdfName: '',
    existingAvailabilityChartPdfUrl: '',
    exteriorImages: [],
    existingExteriorImages: [],
    interiorImages: [],
    existingInteriorImages: [],
  };
}

function mapVillaToForm(villa) {
  const projectDetails = villa.projectDetails && typeof villa.projectDetails === 'object'
    ? villa.projectDetails
    : {};

  const exteriorImages = Array.isArray(villa.images?.exterior) ? villa.images.exterior : [];
  const interiorImages = Array.isArray(villa.images?.interior) ? villa.images.interior : [];

  return {
    ...createEmptyVillaForm(),
    id: villa.id,
    slug: normalizeSlugValue(villa.slug),
    name: villa.name || '',
    location: villa.location || '',
    acres: villa.acres || '',
    totalVillas: villa.totalVillas || '',
    status: villa.status || 'draft',
    description: villa.description || '',
    overviewTitle: villa.overviewTitle || '',
    overviewDescription: villa.overviewDescription || '',
    overviewTotalLand: villa.overviewTotalLand || '',
    overviewTotalUnits: villa.overviewTotalUnits || '',
    configuration: villa.configuration || '',
    startingPrice: villa.startingPrice || villa.price || '',
    reraNumber: villa.reraNumber || projectDetails.reraNumber || '',
    mapLocationUrl: villa.mapLocationUrl || '',
    otherCharges: villa.otherCharges || '',
    projectDetails: {
      projectName: projectDetails.projectName || villa.name || '',
      location: projectDetails.location || villa.location || '',
      totalLandArea: projectDetails.totalLandArea || villa.acres || '',
      totalUnits: projectDetails.totalUnits || villa.totalVillas || '',
      configuration: projectDetails.configuration || villa.configuration || '',
      price: projectDetails.price || villa.startingPrice || villa.price || '',
      status: projectDetails.status || villa.status || 'draft',
      reraNumber: projectDetails.reraNumber || villa.reraNumber || '',
    },
    projectHighlights: normalizeArrayValue(villa.highlights).concat(['']).slice(0, Math.max(1, normalizeArrayValue(villa.highlights).length + 1)),
    locationAdvantages: normalizeArrayValue(villa.locationAdvantages).concat(['']).slice(0, Math.max(1, normalizeArrayValue(villa.locationAdvantages).length + 1)),
    amenities: Array.isArray(villa.amenities) && villa.amenities.length > 0
      ? villa.amenities.map((item) => ({
        title: String(item.title || '').trim(),
        desc: String(item.desc || '').trim(),
        icon: String(item.icon || '').trim(),
      }))
      : [{ ...EMPTY_AMENITY }],
    existingBannerImageUrl: villa.bannerImage || villa.image || '',
    existingBrochurePdfUrl: villa.brochurePdfUrl || '',
    existingWalkthroughVideoUrl: villa.walkthroughVideoUrl || '',
    existingAvailabilityChartPdfUrl: villa.availabilityChartPdfUrl || '',
    existingExteriorImages: exteriorImages,
    existingInteriorImages: interiorImages,
  };
}

function cleanArray(values) {
  return values.map((item) => String(item || '').trim()).filter(Boolean);
}

function cleanAmenities(values) {
  return values
    .map((item) => ({
      title: String(item.title || '').trim(),
      desc: String(item.desc || '').trim(),
      icon: String(item.icon || '').trim(),
    }))
    .filter((item) => item.title || item.desc || item.icon);
}

function isBasicVillaFormComplete(form) {
  return Boolean(
    String(form.name || '').trim()
    && String(form.location || '').trim()
    && String(form.acres || '').trim()
    && String(form.totalVillas || '').trim()
    && (form.bannerImageFile || form.existingBannerImageUrl)
  );
}

function getNextStepIndex(currentStepIndex) {
  return Math.min(WIZARD_STEPS.length - 1, currentStepIndex + 1);
}

function isBasicOnlyVilla(form) {
  return String(form.status || '').trim().toLowerCase() === 'upcoming';
}

function isEnterKeyOnFormField(event) {
  const target = event.target;

  if (!target || target.isContentEditable) {
    return false;
  }

  const tagName = String(target.tagName || '').toLowerCase();
  if (tagName === 'textarea') {
    return false;
  }

  return tagName === 'input' || tagName === 'select';
}

function VillaProjectsAdmin({ token }) {
  const [villas, setVillas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingVillaId, setDeletingVillaId] = useState(null);
  const [form, setForm] = useState(createEmptyVillaForm());
  const [amenityIconSearches, setAmenityIconSearches] = useState({});
  const [mapSearchValue, setMapSearchValue] = useState('');
  const [mapSearchStatus, setMapSearchStatus] = useState('');
  const [isMapSearching, setIsMapSearching] = useState(false);
  const bannerInputRef = useRef(null);
  const brochureInputRef = useRef(null);
  const walkthroughVideoInputRef = useRef(null);
  const availabilityInputRef = useRef(null);
  const exteriorInputRef = useRef(null);
  const interiorInputRef = useRef(null);
  const bannerPreviewRef = useRef('');
  const exteriorPreviewRef = useRef([]);
  const interiorPreviewRef = useRef([]);

  useEffect(() => {
    let mounted = true;

    async function loadVillas() {
      if (!token) {
        return;
      }

      setIsLoading(true);

      try {
        const data = await getAdminVillas(token);

        if (!mounted) {
          return;
        }

        setVillas(data.villas || []);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMessage({ type: 'error', text: error.message || 'Could not load villas.' });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadVillas();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    bannerPreviewRef.current = form.bannerImagePreviewUrl;
  }, [form.bannerImagePreviewUrl]);

  useEffect(() => () => {
    revokePreviewEntry({ previewUrl: bannerPreviewRef.current });
  }, []);

  useEffect(() => {
    exteriorPreviewRef.current = form.exteriorImages;
  }, [form.exteriorImages]);

  useEffect(() => () => {
    revokePreviewEntryList(exteriorPreviewRef.current);
  }, []);

  useEffect(() => {
    interiorPreviewRef.current = form.interiorImages;
  }, [form.interiorImages]);

  useEffect(() => () => {
    revokePreviewEntryList(interiorPreviewRef.current);
  }, []);

  const resetUploadInputs = () => {
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }

    if (brochureInputRef.current) {
      brochureInputRef.current.value = '';
    }

    if (walkthroughVideoInputRef.current) {
      walkthroughVideoInputRef.current.value = '';
    }

    if (availabilityInputRef.current) {
      availabilityInputRef.current.value = '';
    }

    if (exteriorInputRef.current) {
      exteriorInputRef.current.value = '';
    }

    if (interiorInputRef.current) {
      interiorInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setForm((previous) => {
      revokePreviewEntry({ previewUrl: previous.bannerImagePreviewUrl });
      revokePreviewEntryList(previous.exteriorImages);
      revokePreviewEntryList(previous.interiorImages);
      return createEmptyVillaForm();
    });
    setAmenityIconSearches({});
    setMapSearchValue('');
    setMapSearchStatus('');
    resetUploadInputs();
    setActiveStep(0);
  };

  const openNewForm = () => {
    resetForm();
    setMessage({ type: '', text: '' });
    setShowForm(true);
  };

  const closeForm = () => {
    resetForm();
    setMessage({ type: '', text: '' });
    setShowForm(false);
  };

  const editVilla = (villa) => {
    setForm((previous) => {
      revokePreviewEntry({ previewUrl: previous.bannerImagePreviewUrl });
      revokePreviewEntryList(previous.exteriorImages);
      revokePreviewEntryList(previous.interiorImages);
      return mapVillaToForm(villa);
    });
    setAmenityIconSearches({});
    setMapSearchValue('');
    setMapSearchStatus('');
    resetUploadInputs();
    setMessage({ type: '', text: '' });
    setActiveStep(0);
    setShowForm(true);
  };

  const updateArrayField = (field, index, value) => {
    setForm((previous) => {
      const nextValues = [...previous[field]];
      nextValues[index] = value;
      return { ...previous, [field]: nextValues };
    });
  };

  const addArrayRow = (field, emptyValue) => {
    setForm((previous) => ({
      ...previous,
      [field]: [...previous[field], emptyValue],
    }));
  };

  const removeArrayRow = (field, index) => {
    setForm((previous) => {
      const nextValues = [...previous[field]];
      const removed = nextValues.splice(index, 1)[0];
      revokePreviewEntry(removed);
      return {
        ...previous,
        [field]: nextValues.length > 0 ? nextValues : [field === 'amenities' ? { ...EMPTY_AMENITY } : ''],
      };
    });
  };

  const handleBannerSelection = async (event) => {
    const selectedFile = event.target.files && event.target.files[0] ? event.target.files[0] : null;

    if (!selectedFile) {
      return;
    }

    if (!String(selectedFile.type || '').startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed.' });
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
      return;
    }

    try {
      const compressedFile = await compressImageFile(selectedFile);
      const nextPreviewUrl = URL.createObjectURL(compressedFile);

      setForm((previous) => {
        revokePreviewEntry({ previewUrl: previous.bannerImagePreviewUrl });
        return {
          ...previous,
          bannerImageFile: compressedFile,
          bannerImagePreviewUrl: nextPreviewUrl,
        };
      });

      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not compress selected image.' });
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const handleSingleFileSelection = (field, nameField, event) => {
    const selectedFile = event.target.files && event.target.files[0] ? event.target.files[0] : null;

    if (!selectedFile) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: selectedFile,
      [nameField]: selectedFile.name || 'selected file',
    }));
  };

  const handleMultiImageSelection = async (field, event) => {
    const incomingFiles = Array.from(event.target.files || []);

    if (!incomingFiles.length) {
      return;
    }

    const selectedFiles = incomingFiles.slice(0, 20);

    if (selectedFiles.some((file) => !String(file.type || '').startsWith('image/'))) {
      setMessage({ type: 'error', text: 'Only image files are allowed.' });
      if (field === 'exteriorImages' && exteriorInputRef.current) {
        exteriorInputRef.current.value = '';
      }
      if (field === 'interiorImages' && interiorInputRef.current) {
        interiorInputRef.current.value = '';
      }
      return;
    }

    try {
      const compressedFiles = await Promise.all(selectedFiles.map((file) => compressImageFile(file)));
      const previews = compressedFiles.map(createPreviewEntry);

      setForm((previous) => {
        revokePreviewEntryList(previous[field]);
        return {
          ...previous,
          [field]: previews,
        };
      });

      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not compress selected images.' });
    }
  };

  const clearMultiImages = (field) => {
    setForm((previous) => {
      revokePreviewEntryList(previous[field]);
      return {
        ...previous,
        [field]: [],
      };
    });

    if (field === 'exteriorImages' && exteriorInputRef.current) {
      exteriorInputRef.current.value = '';
    }

    if (field === 'interiorImages' && interiorInputRef.current) {
      interiorInputRef.current.value = '';
    }
  };

  const handleFormKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (!isEnterKeyOnFormField(event)) {
      return;
    }

    if (!isBasicOnly && activeStep < WIZARD_STEPS.length - 1) {
      event.preventDefault();
      setActiveStep((previous) => Math.min(WIZARD_STEPS.length - 1, previous + 1));
    }
  };

  const submitVilla = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.name.trim() || !form.location.trim()) {
      setMessage({ type: 'error', text: 'Project name and location are required.' });
      return;
    }

    setIsSaving(true);

    try {
      const nextStepIndex = getNextStepIndex(activeStep);
      const safeSlug = createSafeVillaSlug(form.slug, form.name);
      const payload = new FormData();
      payload.append('slug', safeSlug);
      payload.append('name', form.name.trim());
      payload.append('location', form.location.trim());
      payload.append('acres', form.acres.trim());
      payload.append('totalVillas', form.totalVillas.trim());
      payload.append('status', form.status);
      payload.append('description', form.description.trim());
      payload.append('overviewTitle', form.overviewTitle.trim());
      payload.append('overviewDescription', form.overviewDescription.trim());
      payload.append('overviewTotalLand', form.overviewTotalLand.trim());
      payload.append('overviewTotalUnits', form.overviewTotalUnits.trim());
      payload.append('configuration', form.configuration.trim());
      payload.append('startingPrice', form.startingPrice.trim());
      payload.append('reraNumber', form.reraNumber.trim());
      payload.append('mapLocationUrl', form.mapLocationUrl.trim());
      payload.append('otherCharges', form.otherCharges.trim());
      payload.append('projectDetails', JSON.stringify({
        projectName: form.name.trim(),
        location: form.location.trim(),
        totalLandArea: form.acres.trim(),
        totalUnits: form.totalVillas.trim(),
        configuration: form.configuration.trim(),
        price: form.startingPrice.trim(),
        status: form.status,
        reraNumber: form.reraNumber.trim(),
      }));
      payload.append('projectHighlights', JSON.stringify(cleanArray(form.projectHighlights)));
      payload.append('locationAdvantages', JSON.stringify(cleanArray(form.locationAdvantages)));
      payload.append('amenities', JSON.stringify(cleanAmenities(form.amenities)));

      if (form.bannerImageFile) {
        payload.append('bannerImage', form.bannerImageFile);
      }

      if (form.brochurePdfFile) {
        payload.append('brochurePdf', form.brochurePdfFile);
      }

      if (form.walkthroughVideoFile) {
        payload.append('walkthroughVideo', form.walkthroughVideoFile);
      }

      if (form.availabilityChartPdfFile) {
        payload.append('availabilityChartPdf', form.availabilityChartPdfFile);
      }

      form.exteriorImages.forEach((item) => {
        if (item.file) {
          payload.append('exteriorImages', item.file);
        }
      });

      form.interiorImages.forEach((item) => {
        if (item.file) {
          payload.append('interiorImages', item.file);
        }
      });

      const saveResponse = form.id
        ? await updateAdminVilla(token, form.id, payload)
        : await createAdminVilla(token, payload);

      const savedVilla = saveResponse?.villa;

      if (savedVilla) {
        setForm((previous) => {
          revokePreviewEntry({ previewUrl: previous.bannerImagePreviewUrl });
          revokePreviewEntryList(previous.exteriorImages);
          revokePreviewEntryList(previous.interiorImages);
          return mapVillaToForm(savedVilla);
        });
      }

      setMessage({
        type: 'success',
        text: form.id ? 'Villa updated successfully.' : 'Villa created successfully.',
      });

      if (!isBasicOnly && nextStepIndex > activeStep) {
        setActiveStep(nextStepIndex);
      }

      const data = await getAdminVillas(token);
      setVillas(data.villas || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not save villa.' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVilla = async (villaId) => {
    const confirmed = window.confirm('Delete this villa and all uploaded assets?');

    if (!confirmed) {
      return;
    }

    setDeletingVillaId(villaId);
    setMessage({ type: '', text: '' });

    try {
      await deleteAdminVilla(token, villaId);

      if (form.id === villaId) {
        closeForm();
      }

      const data = await getAdminVillas(token);
      setVillas(data.villas || []);
      setMessage({ type: 'success', text: 'Villa deleted successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not delete villa.' });
    } finally {
      setDeletingVillaId(null);
    }
  };

  const currentStep = WIZARD_STEPS[activeStep] || WIZARD_STEPS[0];
  const isEditMode = Boolean(form.id);
  const isBasicComplete = isEditMode || isBasicVillaFormComplete(form);
  const isBasicOnly = isBasicOnlyVilla(form);
  const visibleSteps = isBasicOnly ? WIZARD_STEPS.slice(0, 1) : WIZARD_STEPS;
  const saveButtonLabel = isBasicOnly || activeStep === visibleSteps.length - 1 ? 'Save' : 'Save and Next';
  const effectiveSlug = createSafeVillaSlug(form.slug, form.name);
  const isSlugDuplicate = isVillaSlugTaken(effectiveSlug, villas, form.id);

  useEffect(() => {
    if (isBasicOnly && activeStep !== 0) {
      setActiveStep(0);
    }
  }, [activeStep, isBasicOnly]);

  if (!token) {
    return null;
  }

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Project name"
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
              <input
                type="text"
                placeholder="Project ID"
                value={form.slug}
                onChange={(event) => setForm((previous) => ({
                  ...previous,
                  slug: normalizeSlugValue(event.target.value),
                }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {isSlugDuplicate ? (
                <p className="sm:col-span-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This project ID is already in use. A unique version will be saved.
                </p>
              ) : null}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(event) => setForm((previous) => ({ ...previous, location: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
              <input
                type="text"
                placeholder="Acres (land)"
                value={form.acres}
                onChange={(event) => setForm((previous) => ({ ...previous, acres: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Total villas"
                value={form.totalVillas}
                onChange={(event) => setForm((previous) => ({ ...previous, totalVillas: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-primary mb-2">Status</p>
                <select
                  value={form.status}
                  onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="draft">Draft</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-white p-4">
                <input
                  ref={bannerInputRef}
                  id="villa-banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelection}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="villa-banner-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-primary bg-[#C6A769] text-white px-4 py-2 text-sm hover:bg-opacity-90"
                  >
                    {form.id ? 'Replace Banner Image' : 'Choose Banner Image'}
                  </label>
                  {form.bannerImageFile ? (
                    <span className="text-xs sm:text-sm text-textGrey truncate max-w-[280px]">{form.bannerImageFile.name}</span>
                  ) : form.existingBannerImageUrl ? (
                    <span className="text-xs sm:text-sm text-textGrey truncate max-w-[280px]">Current banner image is set</span>
                  ) : (
                    <span className="text-xs sm:text-sm text-textGrey">No file selected</span>
                  )}
                </div>
              </div>
            </div>
            {form.bannerImagePreviewUrl ? (
              <img src={form.bannerImagePreviewUrl} alt="Banner preview" className="h-48 w-full rounded-xl object-cover border border-gray-200" />
            ) : form.existingBannerImageUrl ? (
              <img src={form.existingBannerImageUrl} alt="Current banner" className="h-48 w-full rounded-xl object-cover border border-gray-200" />
            ) : null}

            {isBasicOnly ? (
              <p className="text-sm text-textGrey">
                Upcoming villas only need the Basic Data section. You can save now and return later to add the rest.
              </p>
            ) : null}
          </div>
        );
      case 'detailed':
        return (
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr] items-start">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-primary mb-2">Brochure PDF</p>
                <input
                  ref={brochureInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => handleSingleFileSelection('brochurePdfFile', 'brochurePdfName', event)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                />
                <p className="mt-2 text-sm text-textGrey">{form.brochurePdfName || (form.existingBrochurePdfUrl ? 'Current brochure is set' : 'No file selected')}</p>
              </div> 
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-primary mb-2">Walkthrough Video</p>
                  <input
                    ref={walkthroughVideoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(event) => handleSingleFileSelection('walkthroughVideoFile', 'walkthroughVideoName', event)}
                    className="w-full text-sm"
                  />
                  <p className="mt-2">{form.walkthroughVideoName || (form.existingWalkthroughVideoUrl ? 'Current walkthrough is set' : 'No file selected')}</p>
                </div> 
            </div>


            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Overview title"
                value={form.overviewTitle}
                onChange={(event) => setForm((previous) => ({ ...previous, overviewTitle: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="Starting price / Sq.Ft"
                value={form.startingPrice}
                onChange={(event) => setForm((previous) => ({ ...previous, startingPrice: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <textarea
              placeholder="Overview description"
              value={form.overviewDescription}
              onChange={(event) => setForm((previous) => ({ ...previous, overviewDescription: event.target.value }))}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Overview total land"
                value={form.overviewTotalLand}
                onChange={(event) => setForm((previous) => ({ ...previous, overviewTotalLand: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="Overview total units"
                value={form.overviewTotalUnits}
                onChange={(event) => setForm((previous) => ({ ...previous, overviewTotalUnits: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Configuration"
                value={form.configuration}
                onChange={(event) => setForm((previous) => ({ ...previous, configuration: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="RERA number"
                value={form.reraNumber}
                onChange={(event) => setForm((previous) => ({ ...previous, reraNumber: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        );
      case 'gallery':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/15 bg-white p-4">
              <input
                ref={exteriorInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleMultiImageSelection('exteriorImages', event)}
                className="hidden"
                id="villa-exterior-upload"
              />
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="villa-exterior-upload" className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-primary bg-[#C6A769] text-white px-4 py-2 text-sm hover:bg-opacity-90">Choose Exterior Images</label>
                <button type="button" onClick={() => clearMultiImages('exteriorImages')} className="text-sm text-accent">Clear</button>
              </div>
              {form.exteriorImages.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.exteriorImages.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={item.previewUrl} alt={item.name} className="h-24 w-full object-cover" />
                      <div className="p-2">
                        <p className="text-[11px] text-primary truncate">{item.name}</p>
                        <p className="text-[10px] text-textGrey">{formatFileSize(item.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : form.existingExteriorImages.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.existingExteriorImages.map((src, index) => (
                    <img key={`${src}-${index}`} src={src} alt={`Exterior ${index + 1}`} className="h-24 w-full rounded-xl object-cover border border-gray-200" />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-primary/15 bg-white p-4">
              <input
                ref={interiorInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleMultiImageSelection('interiorImages', event)}
                className="hidden"
                id="villa-interior-upload"
              />
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="villa-interior-upload" className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-primary bg-[#C6A769] text-white px-4 py-2 text-sm hover:bg-opacity-90">Choose Interior Images</label>
                <button type="button" onClick={() => clearMultiImages('interiorImages')} className="text-sm text-accent">Clear</button>
              </div>
              {form.interiorImages.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.interiorImages.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={item.previewUrl} alt={item.name} className="h-24 w-full object-cover" />
                      <div className="p-2">
                        <p className="text-[11px] text-primary truncate">{item.name}</p>
                        <p className="text-[10px] text-textGrey">{formatFileSize(item.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : form.existingInteriorImages.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.existingInteriorImages.map((src, index) => (
                    <img key={`${src}-${index}`} src={src} alt={`Interior ${index + 1}`} className="h-24 w-full rounded-xl object-cover border border-gray-200" />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      case 'highlights':
        return (
          <div className="space-y-3">
            {form.projectHighlights.map((highlight, index) => (
              <div key={`highlight-${index}`} className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Highlight ${index + 1}`}
                  value={highlight}
                  onChange={(event) => updateArrayField('projectHighlights', index, event.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button type="button" onClick={() => removeArrayRow('projectHighlights', index)} className="px-4 py-3 rounded-xl border border-gray-300 text-sm text-red-600">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => addArrayRow('projectHighlights', '')} className="text-sm text-accent">Add highlight</button>
          </div>
        );
      case 'details':
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Project name</p>
                <p className="mt-1 text-primary">{form.name || 'Not set'}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Location</p>
                <p className="mt-1 text-primary">{form.location || 'Not set'}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Total land</p>
                <p className="mt-1 text-primary">{form.acres || 'Not set'}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Total units</p>
                <p className="mt-1 text-primary">{form.totalVillas || 'Not set'}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Configuration</p>
                <p className="mt-1 text-primary">{form.configuration || 'Not set'}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Starting price</p>
                <p className="mt-1 text-primary">{form.startingPrice || 'Not set'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-textGrey">Description</p>
              <p className="mt-1 text-primary">{form.description || 'Not set'}</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-textGrey">RERA number</p>
              <p className="mt-1 text-primary">{form.reraNumber || 'Not set'}</p>
            </div>
          </div>
        );
      case 'amenities':
        return (
          <div className="space-y-4">
            {form.amenities.map((item, index) => (
              <div key={`amenity-${index}`} className="rounded-2xl border border-gray-200 bg-bgLight/40 p-4 space-y-4">
                <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-start">
                  <input
                    type="text"
                    placeholder="Title"
                    value={item.title}
                    onChange={(event) => setForm((previous) => {
                      const nextValues = [...previous.amenities];
                      nextValues[index] = { ...nextValues[index], title: event.target.value };
                      return { ...previous, amenities: nextValues };
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.desc}
                    onChange={(event) => setForm((previous) => {
                      const nextValues = [...previous.amenities];
                      nextValues[index] = { ...nextValues[index], desc: event.target.value };
                      return { ...previous, amenities: nextValues };
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button type="button" onClick={() => removeArrayRow('amenities', index)} className="px-4 py-3 rounded-xl border border-gray-300 text-sm text-red-600">Remove</button>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative flex-1">
                      <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-textGrey" />
                      <input
                        type="text"
                        value={amenityIconSearches[index] || ''}
                        onChange={(event) => setAmenityIconSearches((previous) => ({ ...previous, [index]: event.target.value }))}
                        placeholder="Search icons"
                        className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      {amenityIconSearches[index] ? (
                        <button
                          type="button"
                          onClick={() => setAmenityIconSearches((previous) => ({ ...previous, [index]: '' }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-textGrey hover:text-primary"
                          aria-label="Clear icon search"
                        >
                          <FaXmark />
                        </button>
                      ) : null}
                    </div>
                    {getAmenityIconOption(item.icon) ? (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-primary">
                        {(() => {
                          const SelectedIcon = getAmenityIconOption(item.icon)?.Icon;
                          return SelectedIcon ? <SelectedIcon className="text-accent" /> : null;
                        })()}
                        <span>{getAmenityIconOption(item.icon)?.label}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-textGrey px-1 py-3">No icon selected</div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {filterAmenityIconOptions(amenityIconSearches[index] || '').map((option) => {
                      const SelectedIcon = option.Icon;
                      const isSelected = item.icon === option.key;

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setForm((previous) => {
                            const nextValues = [...previous.amenities];
                            nextValues[index] = { ...nextValues[index], icon: option.key };
                            return { ...previous, amenities: nextValues };
                          })}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${isSelected ? 'border-accent bg-accent/10' : 'border-gray-200 bg-white hover:border-accent/50'}`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <SelectedIcon className="shrink-0 text-accent" />
                            <span className="truncate text-sm text-primary">{option.label}</span>
                          </span>
                          {isSelected ? <FaCheck className="shrink-0 text-accent" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addArrayRow('amenities', { ...EMPTY_AMENITY })} className="text-sm text-accent">Add amenity</button>
          </div>
        );
      case 'availability':
        return (
          <div className="rounded-2xl border border-primary/15 bg-white p-4 space-y-3">
            <input
              ref={availabilityInputRef}
              type="file"
              accept="application/pdf"
              onChange={(event) => handleSingleFileSelection('availabilityChartPdfFile', 'availabilityChartPdfName', event)}
              className="w-full text-sm"
            />
            <p className="text-sm text-textGrey">{form.availabilityChartPdfName || (form.existingAvailabilityChartPdfUrl ? 'Current availability chart is set' : 'No file selected')}</p>
          </div>
        );
      case 'location':
        return (
          <div className="space-y-4">
            <MapLocationPicker
              value={form.mapLocationUrl}
              searchValue={mapSearchValue}
              onSearchValueChange={setMapSearchValue}
              searchStatus={mapSearchStatus}
              isSearching={isMapSearching}
              onChange={(nextValue) => setForm((previous) => ({ ...previous, mapLocationUrl: nextValue }))}
              onSearch={async () => {
                const query = mapSearchValue.trim();

                if (!query) {
                  setMapSearchStatus('Enter a place, area, or landmark to search.');
                  return;
                }

                setIsMapSearching(true);
                setMapSearchStatus('Searching for the location...');

                try {
                  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`);
                  const results = await response.json();
                  const result = Array.isArray(results) ? results[0] : null;

                  if (!result) {
                    setMapSearchStatus('No matching location found. Try a more specific search.');
                    return;
                  }

                  const latitude = Number(result.lat);
                  const longitude = Number(result.lon);
                  const nextValue = buildMapUrl(latitude, longitude);

                  setForm((previous) => ({ ...previous, mapLocationUrl: nextValue }));
                  setMapSearchStatus(`Pinned ${result.display_name || 'the selected location'}.`);
                } catch (_error) {
                  setMapSearchStatus('Could not search the map right now. Try again later.');
                } finally {
                  setIsMapSearching(false);
                }
              }}
            />
            <textarea
              placeholder="Other charges"
              value={form.otherCharges}
              onChange={(event) => setForm((previous) => ({ ...previous, otherCharges: event.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            {form.locationAdvantages.map((item, index) => (
              <div key={`advantage-${index}`} className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Location advantage ${index + 1}`}
                  value={item}
                  onChange={(event) => updateArrayField('locationAdvantages', index, event.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button type="button" onClick={() => removeArrayRow('locationAdvantages', index)} className="px-4 py-3 rounded-xl border border-gray-300 text-sm text-red-600">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => addArrayRow('locationAdvantages', '')} className="text-sm text-accent">Add location advantage</button>
          </div>
        );
      case 'review':
      default:
        return (
          <div className="space-y-4 text-sm text-textGrey">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Project</p>
                <p className="mt-1 text-primary">{form.name || 'Unnamed villa'}</p>
                <p>{form.location || 'No location set'}</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-textGrey">Status</p>
                <p className="mt-1 text-primary">{form.status}</p>
                <p>{createSafeVillaSlug(form.slug, form.name) || 'Slug will be generated from name'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-textGrey mb-2">Highlights</p>
              <p>{cleanArray(form.projectHighlights).length || 0} items</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-textGrey mb-2">Amenities</p>
              <p>{cleanAmenities(form.amenities).length || 0} items</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl text-primary">Villa Projects</h3>
        </div>
        {!showForm ? (
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center justify-center rounded-full bg-[#C6A769] text-white px-4 py-2 text-sm hover:bg-opacity-90"
          >
            Add New Villa
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={submitVilla} onKeyDown={handleFormKeyDown} className="bg-bgLight rounded-2xl p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl text-primary">
                {form.id
                  ? `Edit ${form.name.trim() ? `${form.name.trim()}` : 'Villa'}`
                  : `Create ${form.name.trim() ? `${form.name.trim()}` : 'Villa'}`}
              </h3>
            </div>
            <button type="button" onClick={closeForm} className="text-sm text-accent">Close</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleSteps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (index > 0 && !isBasicComplete) {
                    return;
                  }

                  setActiveStep(index);
                }}
                disabled={index > 0 && !isBasicComplete}
                className={`rounded-full px-3 py-2 text-xs transition-colors ${activeStep === index
                    ? 'bg-[#C6A769] text-white'
                    : index > 0 && !isBasicComplete
                      ? 'bg-white text-primary border border-gray-200 opacity-45 cursor-not-allowed'
                      : 'bg-white text-primary border border-gray-200'
                  }`}
              >
                {index + 1}. {step.title}
              </button>
            ))}
          </div>

          {!isBasicComplete && !isBasicOnly ? (
            <p className="text-sm text-textGrey">
              Complete the Basic Data section to unlock the remaining steps.
            </p>
          ) : null}

          {isBasicOnly ? (
            <p className="text-sm text-textGrey">
              This villa is marked as upcoming, so only Basic Data is required.
            </p>
          ) : null}

          <div className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-6">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Step {activeStep + 1}</p>
              <h4 className="text-2xl text-primary mt-1">{currentStep.title}</h4>
              <p className="text-sm text-textGrey mt-1">{currentStep.helper}</p>
            </div>

            {renderStepContent()}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep((previous) => Math.max(0, previous - 1))}
                  disabled={activeStep === 0}
                  className="px-4 py-2 rounded-luxury border border-gray-300 text-sm text-textGrey disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep((previous) => Math.min(visibleSteps.length - 1, previous + 1))}
                  disabled={visibleSteps.length === 1 || activeStep === visibleSteps.length - 1 || (!isBasicComplete && activeStep === 0)}
                  className="px-4 py-2 rounded-luxury border border-gray-300 text-sm text-textGrey disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="bg-primary text-white px-6 py-3 rounded-luxury hover:bg-opacity-90 transition-colors disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : saveButtonLabel}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {message.text ? (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="bg-bgLight text-left">
              <th className="px-4 py-3 text-sm text-primary">Villa</th>
              <th className="px-4 py-3 text-sm text-primary">Status</th>
              <th className="px-4 py-3 text-sm text-primary">Location</th>
              <th className="px-4 py-3 text-sm text-primary">Slug</th>
              <th className="px-4 py-3 text-sm text-primary">Updated</th>
              <th className="px-4 py-3 text-sm text-primary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {villas.map((villa) => (
              <tr key={villa.id} className="border-b border-gray-100">
                <td className="px-4 py-3 text-sm text-primary">
                  <p>{villa.name}</p>
                  <p className="text-xs text-textGrey">{villa.acres || '-'} land</p>
                </td>
                <td className="px-4 py-3 text-sm text-textGrey capitalize">{villa.status || '-'}</td>
                <td className="px-4 py-3 text-sm text-textGrey">{villa.location || '-'}</td>
                <td className="px-4 py-3 text-sm text-textGrey truncate">{villa.slug || '-'}</td>
                <td className="px-4 py-3 text-sm text-textGrey">{formatDateTime(villa.updatedAt || villa.createdAt)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Link to={`/villa/${villa.slug || villa.id}`} className="text-sm text-primary">
                      View
                    </Link>
                    <button type="button" onClick={() => editVilla(villa)} className="text-sm text-accent">Edit</button>
                    <button type="button" onClick={() => deleteVilla(villa.id)} disabled={deletingVillaId === villa.id} className="text-sm text-red-600 disabled:opacity-60">
                      {deletingVillaId === villa.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && villas.length === 0 ? <p className="text-sm text-textGrey mt-3">No villas yet.</p> : null}
      </div>
    </div>
  );
}

export default VillaProjectsAdmin;
