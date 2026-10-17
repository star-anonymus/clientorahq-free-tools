export interface ToastDetail { message: string; type: "success" | "error" | "info" }

function emit(message: string, type: ToastDetail["type"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>("cq-toast", { detail: { message, type } }));
}

export const toast = {
  success: (m: string) => emit(m, "success"),
  error: (m: string) => emit(m, "error"),
  info: (m: string) => emit(m, "info"),
};
