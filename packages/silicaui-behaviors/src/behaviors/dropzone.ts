import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

function matches(file: File, accept: string[] | null, maxSize: number | null): boolean {
  if (accept && accept.length) {
    const ok = accept.some((pattern) =>
      pattern.startsWith(".")
        ? file.name.toLowerCase().endsWith(pattern.toLowerCase())
        : pattern.endsWith("/*")
          ? file.type.startsWith(pattern.slice(0, -1))
          : file.type === pattern,
    );
    if (!ok) return false;
  }
  if (maxSize != null && file.size > maxSize) return false;
  return true;
}

/**
 * `dropzone` — a drag-counted drop target (dragleave fires on every child
 * hover, so a depth counter is required, not optional) plus a hidden file
 * `input`. `params.accept`/`params.maxSize` filter; matched files are
 * announced via a `sui:file` CustomEvent per file. When a `list` part is
 * present (FileUpload, not bare Dropzone), each accepted file also gets a
 * managed row appended there (thumbnail for images, name, remove button) —
 * this is the ONE place a behavior owns real create-your-own-markup state,
 * same precedent as `carousel` building its own track/dots.
 */
export const dropzone: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const input = (ownParts(root, "input")[0] ?? root.querySelector('input[type="file"]')) as HTMLInputElement | null;
  const list = ownParts(root, "list")[0];
  const bag = new DisposeBag();
  if (!input) return () => bag.dispose();

  const accept = typeof params.accept === "string" ? params.accept.split(",").map((s) => s.trim()) : null;
  const maxSize = typeof params.maxSize === "number" ? params.maxSize : null;
  const objectUrls: string[] = [];

  const addFiles = (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!matches(file, accept, maxSize)) continue;
      root.dispatchEvent(new CustomEvent("sui:file", { detail: { file }, bubbles: true }));
      if (!list) continue;

      const row = document.createElement("div");
      row.className = "dropzone-file";
      if (file.type.startsWith("image/") && typeof URL !== "undefined" && URL.createObjectURL) {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        const img = document.createElement("img");
        img.src = url;
        img.className = "dropzone-file-thumb";
        row.appendChild(img);
      }
      const name = document.createElement("span");
      name.className = "dropzone-file-name";
      name.textContent = file.name;
      row.appendChild(name);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "dropzone-file-remove";
      remove.setAttribute("aria-label", `Remove ${file.name}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => row.remove());
      row.appendChild(remove);
      list.appendChild(row);
    }
  };

  let depth = 0;
  bag.listen(root, "dragenter", (ev) => {
    ev.preventDefault();
    depth++;
    root.setAttribute("data-dragging", "");
  });
  bag.listen(root, "dragover", (ev) => ev.preventDefault());
  bag.listen(root, "dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (depth === 0) root.removeAttribute("data-dragging");
  });
  bag.listen(root, "drop", (ev) => {
    ev.preventDefault();
    depth = 0;
    root.removeAttribute("data-dragging");
    const dt = (ev as DragEvent).dataTransfer;
    if (dt?.files?.length) addFiles(dt.files);
  });
  bag.listen(root, "click", (ev) => {
    if (ev.target !== input) input.click();
  });
  bag.listen(root, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });
  bag.listen(input, "change", () => {
    if (input.files) addFiles(input.files);
    input.value = "";
  });

  bag.add(() => {
    for (const url of objectUrls) URL.revokeObjectURL(url);
  });

  return () => bag.dispose();
};
