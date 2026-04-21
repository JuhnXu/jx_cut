const deckNameInput = document.getElementById("deckName");
const sizePresetInputs = Array.from(document.querySelectorAll("input[name='sizePreset']"));
const customSize = document.getElementById("customSize");
const cardWidthInput = document.getElementById("cardWidth");
const cardHeightInput = document.getElementById("cardHeight");
const copyCountInput = document.getElementById("copyCount");
const pageMarginInput = document.getElementById("pageMargin");
const showBleedInput = document.getElementById("showBleed");
const showSafeInput = document.getElementById("showSafe");
const fitModeInput = document.getElementById("fitMode");
const uploadButton = document.getElementById("uploadButton");
const imageInput = document.getElementById("imageInput");
const uploadPanel = document.getElementById("uploadPanel");
const thumbStrip = document.getElementById("thumbStrip");
const paperDrop = document.getElementById("paperDrop");
const paperPreview = document.getElementById("paperPreview");
const layoutSummary = document.getElementById("layoutSummary");
const clearButton = document.getElementById("clearButton");
const saveButton = document.getElementById("saveButton");

const A4 = {
  width: 210,
  height: 297,
};

const PRESETS = {
  "63x88": { width: 63, height: 88, label: "63 × 88mm" },
  "62x87": { width: 62, height: 87, label: "62 × 87mm" },
  "59x86": { width: 59, height: 86, label: "59 × 86mm" },
};

const state = {
  images: [],
};

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

function getSelectedPreset() {
  return sizePresetInputs.find((input) => input.checked)?.value || "63x88";
}

function getSettings() {
  const preset = getSelectedPreset();
  const presetSize = PRESETS[preset];
  const width = presetSize ? presetSize.width : clampNumber(cardWidthInput.value, 20, 200, 63);
  const height = presetSize ? presetSize.height : clampNumber(cardHeightInput.value, 20, 200, 88);
  const margin = clampNumber(pageMarginInput.value, 0, 30, 8);
  const copies = Math.floor(clampNumber(copyCountInput.value, 1, 300, 1));

  return {
    width,
    height,
    margin,
    copies,
    showBleed: showBleedInput.checked,
    showSafe: showSafeInput.checked,
    cover: fitModeInput.checked,
  };
}

function getLayout(settings) {
  const availableWidth = A4.width - settings.margin * 2;
  const availableHeight = A4.height - settings.margin * 2;
  const columns = Math.max(1, Math.floor(availableWidth / settings.width));
  const rows = Math.max(1, Math.floor(availableHeight / settings.height));
  const perPage = columns * rows;
  const usedWidth = columns * settings.width;
  const usedHeight = rows * settings.height;
  const startX = settings.margin + (availableWidth - usedWidth) / 2;
  const startY = settings.margin + (availableHeight - usedHeight) / 2;

  return {
    columns,
    rows,
    perPage,
    startX,
    startY,
    pages: Math.max(1, Math.ceil(settings.copies / perPage)),
  };
}

function createImageRecord(file) {
  return new Promise((resolve, reject) => {
    const isImage = /^image\/(jpeg|png|bmp|webp)$/.test(file.type) || /\.(jpg|jpeg|png|bmp|webp)$/i.test(file.name);

    if (!isImage) {
      reject(new Error("请选择 jpg、jpeg、png、bmp 或 webp 图片。"));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name: file.name,
        url,
        element: image,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败，请更换文件重试。"));
    };

    image.src = url;
  });
}

async function addFiles(files) {
  const fileList = Array.from(files || []);

  if (!fileList.length) {
    return;
  }

  try {
    const records = await Promise.all(fileList.map(createImageRecord));
    state.images.push(...records);
    render();
  } catch (error) {
    window.alert(error.message);
  }
}

function clearImages() {
  state.images.forEach((image) => URL.revokeObjectURL(image.url));
  state.images = [];
  imageInput.value = "";
  render();
}

function renderThumbs() {
  thumbStrip.replaceChildren();

  if (!state.images.length) {
    const empty = document.createElement("span");
    empty.textContent = "暂无图片";
    thumbStrip.appendChild(empty);
    return;
  }

  state.images.forEach((record, index) => {
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.title = `${index + 1}. ${record.name}`;

    const img = document.createElement("img");
    img.src = record.url;
    img.alt = record.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `删除 ${record.name}`);
    remove.addEventListener("click", () => {
      URL.revokeObjectURL(record.url);
      state.images = state.images.filter((item) => item.id !== record.id);
      render();
    });

    thumb.append(img, remove);
    thumbStrip.appendChild(thumb);
  });
}

function getRepeatedImages(settings) {
  if (!state.images.length) {
    return [];
  }

  return Array.from({ length: settings.copies }, (_, index) => state.images[index % state.images.length]);
}

function renderPaper() {
  const settings = getSettings();
  const layout = getLayout(settings);
  const page = document.createElement("div");
  const images = getRepeatedImages(settings);
  const scale = paperPreview.clientWidth / A4.width;
  page.className = "cards-page";

  paperPreview.replaceChildren(page);

  for (let index = 0; index < layout.perPage && index < settings.copies; index += 1) {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    const slot = document.createElement("div");
    slot.className = "card-slot";

    if (!settings.showBleed) {
      slot.classList.add("no-bleed");
    }

    if (!settings.showSafe) {
      slot.classList.add("no-safe");
    }

    if (!settings.cover) {
      slot.classList.add("contain");
    }

    slot.style.left = `${(layout.startX + column * settings.width) * scale}px`;
    slot.style.top = `${(layout.startY + row * settings.height) * scale}px`;
    slot.style.width = `${settings.width * scale}px`;
    slot.style.height = `${settings.height * scale}px`;

    if (images[index]) {
      const image = document.createElement("img");
      image.src = images[index].url;
      image.alt = images[index].name;
      slot.appendChild(image);
    } else {
      const empty = document.createElement("span");
      empty.className = "empty-slot";
      empty.textContent = "拖入图片";
      slot.appendChild(empty);
    }

    page.appendChild(slot);
  }

  layoutSummary.textContent = `${settings.width} × ${settings.height}mm，${settings.copies} 张，预计 ${layout.pages} 页 A4`;
  saveButton.disabled = state.images.length === 0;
}

function render() {
  customSize.hidden = getSelectedPreset() !== "custom";
  renderThumbs();
  renderPaper();
}

function getImageData(record) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = record.element.naturalWidth;
  canvas.height = record.element.naturalHeight;
  context.drawImage(record.element, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function getCardImageData(record, width, height, cover) {
  const pxPerMm = 8;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const canvasWidth = Math.round(width * pxPerMm);
  const canvasHeight = Math.round(height * pxPerMm);
  const imageRatio = record.element.naturalWidth / record.element.naturalHeight;
  const cardRatio = width / height;
  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let drawX = 0;
  let drawY = 0;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  if (cover) {
    if (imageRatio > cardRatio) {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imageRatio;
      drawX = -(drawWidth - canvasWidth) / 2;
    } else {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imageRatio;
      drawY = -(drawHeight - canvasHeight) / 2;
    }
  } else if (imageRatio > cardRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imageRatio;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imageRatio;
    drawX = (canvasWidth - drawWidth) / 2;
  }

  context.drawImage(record.element, drawX, drawY, drawWidth, drawHeight);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function drawImageToPdf(pdf, record, x, y, width, height, cover) {
  pdf.addImage(getCardImageData(record, width, height, cover), "JPEG", x, y, width, height);
}

function savePdf() {
  if (!state.images.length) {
    window.alert("请先上传至少一张图片。");
    return;
  }

  if (!window.jspdf?.jsPDF) {
    window.alert("PDF 组件加载失败，请刷新页面重试。");
    return;
  }

  const settings = getSettings();
  const layout = getLayout(settings);
  const images = getRepeatedImages(settings);
  const pdf = new window.jspdf.jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  saveButton.disabled = true;
  const originalText = saveButton.textContent;
  saveButton.textContent = "生成中...";

  try {
    for (let pageIndex = 0; pageIndex < layout.pages; pageIndex += 1) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      for (let slotIndex = 0; slotIndex < layout.perPage; slotIndex += 1) {
        const imageIndex = pageIndex * layout.perPage + slotIndex;

        if (imageIndex >= images.length) {
          break;
        }

        const column = slotIndex % layout.columns;
        const row = Math.floor(slotIndex / layout.columns);
        const x = layout.startX + column * settings.width;
        const y = layout.startY + row * settings.height;

        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y, settings.width, settings.height, "F");
        drawImageToPdf(pdf, images[imageIndex], x, y, settings.width, settings.height, settings.cover);

        if (settings.showBleed) {
          pdf.setDrawColor(255, 49, 43);
          pdf.setLineWidth(0.35);
          pdf.rect(x, y, settings.width, settings.height);
        }

        if (settings.showSafe) {
          pdf.setDrawColor(255, 138, 44);
          pdf.setLineWidth(0.25);
          pdf.setLineDashPattern([2, 2], 0);
          pdf.rect(x + settings.width * 0.07, y + settings.height * 0.07, settings.width * 0.86, settings.height * 0.86);
          pdf.setLineDashPattern([], 0);
        }
      }
    }

    const safeName = (deckNameInput.value || "cards").replace(/[\\/:*?"<>|]+/g, "-").trim() || "cards";
    pdf.save(`${safeName}-A4-print.pdf`);
  } finally {
    saveButton.textContent = originalText;
    saveButton.disabled = state.images.length === 0;
  }
}

uploadButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", (event) => addFiles(event.target.files));
clearButton.addEventListener("click", clearImages);
saveButton.addEventListener("click", savePdf);

[deckNameInput, cardWidthInput, cardHeightInput, copyCountInput, pageMarginInput, showBleedInput, showSafeInput, fitModeInput].forEach((input) => {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
});

sizePresetInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const preset = PRESETS[input.value];

    if (preset) {
      cardWidthInput.value = preset.width;
      cardHeightInput.value = preset.height;
    }

    render();
  });
});

["dragenter", "dragover"].forEach((eventName) => {
  [paperDrop, uploadPanel].forEach((target) => {
    target.addEventListener(eventName, (event) => {
      event.preventDefault();
      paperDrop.classList.add("is-dragover");
    });
  });
});

["dragleave", "drop"].forEach((eventName) => {
  [paperDrop, uploadPanel].forEach((target) => {
    target.addEventListener(eventName, (event) => {
      event.preventDefault();
      paperDrop.classList.remove("is-dragover");
    });
  });
});

[paperDrop, uploadPanel].forEach((target) => {
  target.addEventListener("drop", (event) => addFiles(event.dataTransfer?.files));
});

window.addEventListener("resize", renderPaper);
render();
