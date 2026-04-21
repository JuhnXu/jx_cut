const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");
const previewFrame = document.getElementById("previewFrame");
const previewEmpty = document.getElementById("previewEmpty");
const sourceImage = document.getElementById("sourceImage");
const gridOverlay = document.getElementById("gridOverlay");
const tileMarkers = document.getElementById("tileMarkers");
const columnsInput = document.getElementById("columnsInput");
const rowsInput = document.getElementById("rowsInput");
const resetButton = document.getElementById("resetButton");
const downloadButton = document.getElementById("downloadButton");
const imageSize = document.getElementById("imageSize");
const tileCount = document.getElementById("tileCount");

const state = {
  imageName: "",
  imageObjectUrl: "",
  imageElement: null,
  naturalWidth: 0,
  naturalHeight: 0,
};

const MAX_SPLITS = 50;

function clampSplit(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(MAX_SPLITS, Math.max(1, Math.floor(value)));
}

function getSplitCounts() {
  const columns = clampSplit(Number(columnsInput.value));
  const rows = clampSplit(Number(rowsInput.value));

  if (String(columns) !== columnsInput.value) {
    columnsInput.value = columns;
  }

  if (String(rows) !== rowsInput.value) {
    rowsInput.value = rows;
  }

  return { columns, rows };
}

function updateMeta() {
  const { columns, rows } = getSplitCounts();

  if (state.naturalWidth && state.naturalHeight) {
    imageSize.textContent = `${state.naturalWidth} × ${state.naturalHeight}`;
    tileCount.textContent = String(columns * rows);
  } else {
    imageSize.textContent = "未上传";
    tileCount.textContent = "0";
  }
}

function syncOverlayBounds() {
  if (sourceImage.hidden || !state.imageElement) {
    gridOverlay.style.display = "none";
    tileMarkers.style.display = "none";
    return null;
  }

  const frameRect = previewFrame.getBoundingClientRect();
  const imageRect = sourceImage.getBoundingClientRect();
  const bounds = {
    left: imageRect.left - frameRect.left,
    top: imageRect.top - frameRect.top,
    width: imageRect.width,
    height: imageRect.height,
  };

  [gridOverlay, tileMarkers].forEach((layer) => {
    layer.style.display = "block";
    layer.style.left = `${bounds.left}px`;
    layer.style.top = `${bounds.top}px`;
    layer.style.width = `${bounds.width}px`;
    layer.style.height = `${bounds.height}px`;
  });

  return bounds;
}

function renderOverlay() {
  const bounds = syncOverlayBounds();
  gridOverlay.replaceChildren();
  tileMarkers.replaceChildren();

  if (!bounds) {
    updateMeta();
    return;
  }

  const { columns, rows } = getSplitCounts();

  for (let column = 1; column < columns; column += 1) {
    const line = document.createElement("div");
    line.className = "grid-line vertical";
    line.style.left = `${(column / columns) * 100}%`;
    gridOverlay.appendChild(line);
  }

  for (let row = 1; row < rows; row += 1) {
    const line = document.createElement("div");
    line.className = "grid-line horizontal";
    line.style.top = `${(row / rows) * 100}%`;
    gridOverlay.appendChild(line);
  }

  let index = 1;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const marker = document.createElement("div");
      marker.className = "marker";
      marker.textContent = String(index);
      marker.style.left = `${((column + 0.5) / columns) * 100}%`;
      marker.style.top = `${((row + 0.5) / rows) * 100}%`;
      tileMarkers.appendChild(marker);
      index += 1;
    }
  }

  updateMeta();
}

function setImageFromFile(file) {
  if (!file) {
    return;
  }

  const isImage = /^image\/(jpeg|png|bmp|webp)$/.test(file.type) || /\.(jpg|jpeg|png|bmp|webp)$/i.test(file.name);

  if (!isImage) {
    window.alert("请选择 jpg、jpeg、png、bmp 或 webp 图片。");
    return;
  }

  if (state.imageObjectUrl) {
    URL.revokeObjectURL(state.imageObjectUrl);
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    state.imageObjectUrl = objectUrl;
    state.imageElement = image;
    state.imageName = file.name.replace(/\.[^.]+$/, "");
    state.naturalWidth = image.naturalWidth;
    state.naturalHeight = image.naturalHeight;

    sourceImage.src = objectUrl;
    sourceImage.hidden = false;
    previewEmpty.hidden = true;
    downloadButton.disabled = false;

    renderOverlay();
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    window.alert("图片加载失败，请更换文件重试。");
  };

  image.src = objectUrl;
}

function clearImage() {
  if (state.imageObjectUrl) {
    URL.revokeObjectURL(state.imageObjectUrl);
  }

  state.imageName = "";
  state.imageObjectUrl = "";
  state.imageElement = null;
  state.naturalWidth = 0;
  state.naturalHeight = 0;

  sourceImage.removeAttribute("src");
  sourceImage.hidden = true;
  previewEmpty.hidden = false;
  downloadButton.disabled = true;
  fileInput.value = "";

  gridOverlay.replaceChildren();
  tileMarkers.replaceChildren();
  gridOverlay.style.display = "none";
  tileMarkers.style.display = "none";

  updateMeta();
}

function getTileDimensions(size, count, index) {
  const start = Math.round((size * index) / count);
  const end = Math.round((size * (index + 1)) / count);
  return { start, length: end - start };
}

async function downloadZip() {
  if (!state.imageElement) {
    window.alert("请先上传图片。");
    return;
  }

  if (typeof JSZip === "undefined") {
    window.alert("ZIP 组件加载失败，请检查网络后刷新重试。");
    return;
  }

  const { columns, rows } = getSplitCounts();
  const zip = new JSZip();
  const extension = "png";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    window.alert("浏览器不支持画布导出。");
    return;
  }

  downloadButton.disabled = true;
  const originalText = downloadButton.textContent;
  downloadButton.textContent = "打包中...";

  let index = 1;

  for (let row = 0; row < rows; row += 1) {
    const { start: sy, length: sh } = getTileDimensions(state.naturalHeight, rows, row);

    for (let column = 0; column < columns; column += 1) {
      const { start: sx, length: sw } = getTileDimensions(state.naturalWidth, columns, column);
      canvas.width = sw;
      canvas.height = sh;
      context.clearRect(0, 0, sw, sh);
      context.drawImage(state.imageElement, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

      if (!blob) {
        downloadButton.disabled = false;
        downloadButton.textContent = originalText;
        window.alert("切片导出失败，请重试。");
        return;
      }

      const fileName = `${state.imageName || "slice"}-${String(index).padStart(2, "0")}.${extension}`;
      zip.file(fileName, blob);
      index += 1;
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${state.imageName || "image-slices"}-${columns}x${rows}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);

  downloadButton.disabled = false;
  downloadButton.textContent = originalText;
}

["dragenter", "dragover"].forEach((eventName) => {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.remove("is-dragover");
  });
});

uploadBox.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer?.files || [];
  setImageFromFile(file);
});

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files || [];
  setImageFromFile(file);
});

[columnsInput, rowsInput].forEach((input) => {
  input.addEventListener("input", () => {
    updateMeta();
    renderOverlay();
  });
});

sourceImage.addEventListener("load", renderOverlay);
window.addEventListener("resize", renderOverlay);
resetButton.addEventListener("click", clearImage);
downloadButton.addEventListener("click", downloadZip);

updateMeta();
clearImage();
