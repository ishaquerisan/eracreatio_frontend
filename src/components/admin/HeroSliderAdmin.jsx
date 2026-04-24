import React, { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { FaArrowDown, FaArrowUp } from "react-icons/fa6";
import {
  createAdminHeroSlide,
  deleteAdminHeroSlide,
  getAdminHeroSlides,
  reorderAdminHeroSlides,
  updateAdminHeroSlide,
} from "../../services/api";

const HERO_SLIDE_IMAGE_ASPECT = 16 / 9;
const HERO_SLIDE_MAX_BYTES = 600 * 1024;
const HERO_SLIDE_IMAGE_MAX_DIMENSION = 1920;
const HERO_SLIDE_IMAGE_QUALITY = 0.82;

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createEmptyHeroSlideForm() {
  return {
    id: null,
    title: "",
    subtitle: "",
    ctaText: "",
    linkUrl: "",
    sortOrder: 0,
    isActive: true,
    imageFile: null,
    imagePreviewUrl: "",
    existingImageUrl: "",
  };
}

function mapHeroSlideToForm(slide) {
  return {
    id: slide.id,
    title: slide.title || "",
    subtitle: slide.subtitle || "",
    ctaText: slide.ctaText || "",
    linkUrl: slide.linkUrl || "",
    sortOrder: Number.isFinite(Number(slide.sortOrder)) ? Number(slide.sortOrder) : 0,
    isActive: Boolean(slide.isActive),
    imageFile: null,
    imagePreviewUrl: "",
    existingImageUrl: slide.imageUrl || "",
  };
}

function getNextSortOrder(items) {
  return (items || []).reduce((highest, item) => {
    const value = Number(item.sortOrder || 0);
    return value > highest ? value : highest;
  }, -1) + 1;
}

function areSlidesSequential(items) {
  return (items || []).every((item, index) => Number(item.sortOrder || 0) === index);
}

function sortHeroSlides(items) {
  return [...(items || [])].sort((left, right) => {
    const sortOrderDiff = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);

    if (sortOrderDiff !== 0) {
      return sortOrderDiff;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });
}

function buildHeroSlidePayload(slide, overrides = {}) {
  const payload = new FormData();
  const nextTitle = (overrides.title ?? slide.title ?? "").trim();
  const nextSubtitle = (overrides.subtitle ?? slide.subtitle ?? "").trim();
  const nextButtonTitle = (overrides.ctaText ?? slide.ctaText ?? "").trim();
  const nextButtonUrl = (overrides.linkUrl ?? slide.linkUrl ?? "").trim();
  const nextSortOrder = Number.isFinite(Number(overrides.sortOrder))
    ? Number(overrides.sortOrder)
    : Number.isFinite(Number(slide.sortOrder))
      ? Number(slide.sortOrder)
      : 0;
  const nextIsActive = Boolean(
    Object.prototype.hasOwnProperty.call(overrides, "isActive")
      ? overrides.isActive
      : slide.isActive,
  );

  payload.append("title", nextTitle);
  payload.append("subtitle", nextSubtitle);
  payload.append("ctaText", nextButtonTitle);
  payload.append("linkUrl", nextButtonUrl);
  payload.append("sortOrder", String(nextSortOrder));
  payload.append("isActive", nextIsActive ? "active" : "inactive");

  if (overrides.imageFile instanceof File) {
    payload.append("image", overrides.imageFile);
  }

  return payload;
}

function revokePreviewUrl(url) {
  if (url && String(url).startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ""));
    };

    reader.onerror = () => {
      reject(new Error("Could not read selected image."));
    };

    reader.readAsDataURL(file);
  });
}

function loadImageElement(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => {
      reject(new Error("Could not process selected image."));
    });
    image.src = imageSrc;
  });
}

async function createCroppedImageBlob(imageSrc, cropAreaPixels, options = {}) {
  const {
    maxDimension = HERO_SLIDE_IMAGE_MAX_DIMENSION,
    quality = HERO_SLIDE_IMAGE_QUALITY,
    maxBytes = HERO_SLIDE_MAX_BYTES,
  } = options;

  const image = await loadImageElement(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not open image editor.");
  }

  const targetWidth = Math.max(1, Math.round(cropAreaPixels.width));
  const targetHeight = Math.max(1, Math.round(cropAreaPixels.height));
  const scale = Math.min(
    1,
    maxDimension / targetWidth,
    maxDimension / targetHeight,
  );
  const outputWidth = Math.max(1, Math.round(targetWidth * scale));
  const outputHeight = Math.max(1, Math.round(targetHeight * scale));

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  context.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const createBlob = (sourceCanvas, encoderQuality) =>
    new Promise((resolve, reject) => {
      sourceCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not crop selected image."));
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        encoderQuality,
      );
    });

  let workingCanvas = canvas;
  let width = outputWidth;
  let height = outputHeight;
  let currentQuality = Math.min(0.92, Math.max(0.45, quality));
  let lastBlob = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    lastBlob = await createBlob(workingCanvas, currentQuality);

    if (lastBlob.size <= maxBytes) {
      return lastBlob;
    }

    if (currentQuality > 0.55) {
      currentQuality = Math.max(0.45, currentQuality - 0.12);
      continue;
    }

    if (width <= 960 && height <= 960) {
      break;
    }

    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));

    const nextCanvas = document.createElement("canvas");
    nextCanvas.width = width;
    nextCanvas.height = height;
    const nextContext = nextCanvas.getContext("2d");

    if (!nextContext) {
      break;
    }

    nextContext.drawImage(canvas, 0, 0, width, height);
    workingCanvas = nextCanvas;
    currentQuality = Math.max(0.45, currentQuality - 0.05);
  }

  if (lastBlob && lastBlob.size <= maxBytes) {
    return lastBlob;
  }

  throw new Error("Could not compress selected image below 600 KB. Please choose a smaller image.");
}

const HeroSliderAdmin = ({ token }) => {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSlideId, setDeletingSlideId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(createEmptyHeroSlideForm());
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState("");
  const [cropFileName, setCropFileName] = useState("");
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] = useState(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [reorderingSlideId, setReorderingSlideId] = useState(null);
  const imagePreviewRef = useRef("");
  const uploadInputRef = useRef(null);

  async function loadSlides() {
    if (!token) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await getAdminHeroSlides(token);
      const nextSlides = sortHeroSlides(Array.isArray(response.slides) ? response.slides : []);
      setSlides(nextSlides);

      if (nextSlides.length > 0 && !areSlidesSequential(nextSlides)) {
        await reorderAdminHeroSlides(token, nextSlides.map((slide) => slide.id));
        setSlides(nextSlides.map((slide, index) => ({
          ...slide,
          sortOrder: index,
        })));
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not load hero slides." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSlides();
  }, [token]);

  useEffect(() => {
    imagePreviewRef.current = form.imagePreviewUrl;
  }, [form.imagePreviewUrl]);

  useEffect(
    () => () => {
      revokePreviewUrl(imagePreviewRef.current);
      revokePreviewUrl(form.imagePreviewUrl);
      revokePreviewUrl(cropSource);
    },
    [],
  );

  const resetCropState = () => {
    setIsCropOpen(false);
    setCropSource("");
    setCropFileName("");
    setCropPosition({ x: 0, y: 0 });
    setCropZoom(1);
    setCropAreaPixels(null);
    setIsApplyingCrop(false);
  };

  const resetForm = () => {
    setForm((previous) => {
      revokePreviewUrl(previous.imagePreviewUrl);
      return createEmptyHeroSlideForm();
    });
    resetCropState();
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setMessage({ type: "", text: "" });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleEditSlide = (slide) => {
    resetForm();
    setForm(mapHeroSlideToForm(slide));
    setMessage({ type: "", text: "" });
    setShowForm(true);
  };

  const handleMoveSlide = async (slideId, direction) => {
    const currentIndex = slides.findIndex((slide) => slide.id === slideId);

    if (currentIndex < 0) {
      return;
    }

    const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (neighborIndex < 0 || neighborIndex >= slides.length) {
      return;
    }

    const nextSlides = [...slides];
    const [movedSlide] = nextSlides.splice(currentIndex, 1);
    nextSlides.splice(neighborIndex, 0, movedSlide);

    setReorderingSlideId(slideId);
    setMessage({ type: "", text: "" });

    try {
      await reorderAdminHeroSlides(token, nextSlides.map((slide) => slide.id));
      setSlides(nextSlides.map((slide, index) => ({
        ...slide,
        sortOrder: index,
      })));

      setMessage({
        type: "success",
        text: direction === "up" ? "Slide moved up." : "Slide moved down.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not update slide order." });
    } finally {
      setReorderingSlideId(null);
    }
  };

  const handleCancelCrop = () => {
    resetCropState();
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleApplyCrop = async () => {
    if (!cropSource || !cropAreaPixels) {
      setMessage({ type: "error", text: "Please choose an image first." });
      return;
    }

    setIsApplyingCrop(true);

    try {
      const croppedBlob = await createCroppedImageBlob(
        cropSource,
        cropAreaPixels,
        { maxBytes: HERO_SLIDE_MAX_BYTES },
      );
      const croppedFileName = cropFileName.replace(/\.[^/.]+$/, "") || "hero-slide";
      const croppedFile = new File([croppedBlob], `${croppedFileName}.jpg`, {
        type: "image/jpeg",
      });
      const previewUrl = URL.createObjectURL(croppedFile);

      setForm((previous) => {
        revokePreviewUrl(previous.imagePreviewUrl);
        return {
          ...previous,
          imageFile: croppedFile,
          imagePreviewUrl: previewUrl,
        };
      });

      setMessage({ type: "", text: "" });
      handleCancelCrop();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not crop hero image." });
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleImageSelected = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
      return;
    }

    try {
      const source = await readFileAsDataUrl(selectedFile);
      setMessage({ type: "", text: "" });
      setCropFileName(selectedFile.name || "hero-slide.jpg");
      setCropSource(source);
      setCropPosition({ x: 0, y: 0 });
      setCropZoom(1);
      setCropAreaPixels(null);
      setIsCropOpen(true);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not load selected image." });
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm("Delete this hero slide?")) {
      return;
    }

    setDeletingSlideId(slideId);
    setMessage({ type: "", text: "" });

    try {
      await deleteAdminHeroSlide(token, slideId);
      const nextSlides = slides
        .filter((slide) => slide.id !== slideId)
        .map((slide, index) => ({
          ...slide,
          sortOrder: index,
        }));
      if (nextSlides.length > 0) {
        await reorderAdminHeroSlides(token, nextSlides.map((slide) => slide.id));
      }
      setSlides(nextSlides);
      setMessage({ type: "success", text: "Hero slide deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not delete hero slide." });
    } finally {
      setDeletingSlideId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!form.title.trim()) {
      setMessage({ type: "error", text: "Title is required." });
      return;
    }

    if (!form.id && !form.imageFile) {
      setMessage({ type: "error", text: "Please upload a hero image." });
      return;
    }

    setIsSaving(true);

    try {
      const nextSortOrder = form.id ? form.sortOrder : getNextSortOrder(slides);
      const payload = buildHeroSlidePayload(form, {
        imageFile: form.imageFile,
        sortOrder: nextSortOrder,
      });

      if (form.id) {
        const response = await updateAdminHeroSlide(token, form.id, payload);
        const nextSlides = sortHeroSlides(
          slides.map((slide) => (slide.id === response.slide.id ? response.slide : slide)),
        );
        await reorderAdminHeroSlides(token, nextSlides.map((slide) => slide.id));
        setSlides(nextSlides.map((slide, index) => ({
          ...slide,
          sortOrder: index,
        })));
        setMessage({ type: "success", text: "Hero slide updated successfully." });
      } else {
        const response = await createAdminHeroSlide(token, payload);
        const nextSlides = sortHeroSlides([response.slide, ...slides]);
        await reorderAdminHeroSlides(token, nextSlides.map((slide) => slide.id));
        setSlides(nextSlides.map((slide, index) => ({
          ...slide,
          sortOrder: index,
        })));
        setMessage({ type: "success", text: "Hero slide created successfully." });
      }

      handleCloseForm();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not save hero slide." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl text-primary">Home Slider</h3>
          {/* <p className="text-sm text-textGrey mt-1">
            Manage the homepage hero slides, upload cropped images, and keep the order in sync with the public slider.
          </p> */}
        </div>
        {!showForm ? (
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center justify-center rounded-full bg-[#EF1C22] text-white px-4 py-2 text-sm hover:bg-opacity-90"
          >
            Add New Slide
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="bg-bgLight rounded-2xl p-4 sm:p-6 space-y-6"
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-2xl text-primary">
                {form.id ? "Edit Hero Slide" : "Create Hero Slide"}
              </h3>
              <p className="text-sm text-textGrey mt-1">
                Fill the content on the left and preview the image on the right.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-sm text-accent whitespace-nowrap"
            >
              {form.id ? "Cancel Edit" : "Close"}
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-primary mb-2">
                    Image title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter image title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-primary mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Enter slide description"
                    value={form.subtitle}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        subtitle: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Button title
                  </label>
                  <input
                    type="text"
                    placeholder="Explore Villas"
                    value={form.ctaText}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        ctaText: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Button URL
                  </label>
                  <input
                    type="text"
                    placeholder="/villa-projects"
                    value={form.linkUrl}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        linkUrl: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-white px-4 py-3">
                <input
                  id="hero-slide-is-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="hero-slide-is-active" className="text-sm text-primary">
                  Publish slide on the homepage
                </label>
              </div>

              {message.text ? (
                <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {message.text}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#EF1C22] text-white px-6 py-3 rounded-luxury hover:bg-opacity-90 transition-colors disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : form.id ? "Update Slide" : "Save Slide"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/15 bg-white p-4 sm:p-5 h-full">
                <input
                  ref={uploadInputRef}
                  id="hero-slide-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelected}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-primary">Image upload</p>
                    <p className="text-xs text-textGrey mt-1">
                      Crop is fixed to the hero ratio and uploads are compressed below 600 KB.
                    </p>
                  </div>
                  <label
                    htmlFor="hero-slide-image-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-primary bg-[#EF1C22] text-white px-4 py-2 text-sm hover:bg-opacity-90"
                  >
                    {form.id ? "Replace image" : "Choose image"}
                  </label>
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm text-textGrey truncate">
                      {form.imageFile ? form.imageFile.name : "No file selected"}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-textGrey">
                      16:9
                    </span>
                  </div>
                </div>

                {form.imagePreviewUrl ? (
                  <div className="mt-4">
                    <p className="text-xs text-textGrey mb-2">Selected slide image</p>
                    <img
                      src={form.imagePreviewUrl}
                      alt="Selected hero slide"
                      className="h-56 w-full rounded-xl object-cover border border-gray-200"
                    />
                  </div>
                ) : form.id && form.existingImageUrl ? (
                  <div className="mt-4">
                    <p className="text-xs text-textGrey mb-2">Current slide image</p>
                    <img
                      src={form.existingImageUrl}
                      alt="Current hero slide"
                      className="h-56 w-full rounded-xl object-cover border border-gray-200"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-textGrey">
                    Image preview will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse">
          <thead>
            <tr className="bg-bgLight text-left">
              <th className="px-4 py-3 text-sm text-primary">Slide</th>
              <th className="px-4 py-3 text-sm text-primary">Status</th>
              <th className="px-4 py-3 text-sm text-primary">Priority</th>
              <th className="px-4 py-3 text-sm text-primary">Button</th>
              <th className="px-4 py-3 text-sm text-primary">Updated</th>
              <th className="px-4 py-3 text-sm text-primary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((slide) => (
              <tr key={slide.id} className="border-b border-gray-100 align-top">
                <td className="px-4 py-3 text-sm text-primary">
                  <div className="flex items-start gap-3">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="h-16 w-24 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{slide.title}</p>
                      <p className="text-xs text-textGrey truncate max-w-[280px]">
                        {slide.subtitle || "No subtitle"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`text-xs px-2 py-1 rounded-full ${slide.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {slide.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-textGrey">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slide.id, "up")}
                        disabled={reorderingSlideId === slide.id || slides[0]?.id === slide.id}
                        className="p-1 text-accent disabled:opacity-30"
                        aria-label={`Move ${slide.title} up`}
                      >
                        <FaArrowUp />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slide.id, "down")}
                        disabled={reorderingSlideId === slide.id || slides[slides.length - 1]?.id === slide.id}
                        className="p-1 text-accent disabled:opacity-30"
                        aria-label={`Move ${slide.title} down`}
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-textGrey">
                  <p className="truncate max-w-[220px]">{slide.ctaText || "-"}</p>
                  <p className="truncate max-w-[220px] text-xs text-textGrey">
                    {slide.linkUrl || "-"}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-textGrey">
                  {formatDateTime(slide.updatedAt || slide.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleEditSlide(slide)}
                      className="text-sm text-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      disabled={deletingSlideId === slide.id || reorderingSlideId === slide.id}
                      className="text-sm text-red-600 disabled:opacity-60"
                    >
                      {deletingSlideId === slide.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && !slides.length ? (
          <p className="text-sm text-textGrey mt-3">No hero slides yet.</p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-textGrey mt-3">Loading hero slides...</p>
        ) : null}
      </div>

      {isCropOpen ? (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
              <h4 className="text-2xl text-primary">Crop Hero Slide Image</h4>
              <p className="text-sm text-textGrey mt-1">
                Adjust the crop so the image fits the homepage slider cleanly.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div
                className="relative w-full rounded-xl overflow-hidden bg-zinc-900"
                style={{ height: "min(70vh, 420px)" }}
              >
                <Cropper
                  image={cropSource}
                  crop={cropPosition}
                  zoom={cropZoom}
                  aspect={HERO_SLIDE_IMAGE_ASPECT}
                  onCropChange={setCropPosition}
                  onZoomChange={setCropZoom}
                  onCropComplete={(_area, croppedAreaPixels) =>
                    setCropAreaPixels(croppedAreaPixels)
                  }
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
                  value={cropZoom}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className="px-5 py-2.5 rounded-luxury border border-gray-300 text-textGrey"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isApplyingCrop}
                  className="px-5 py-2.5 rounded-luxury bg-[#EF1C22] text-white disabled:opacity-70"
                >
                  {isApplyingCrop ? "Applying..." : "Apply Crop"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HeroSliderAdmin;
