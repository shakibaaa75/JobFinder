// src/contexts/ToastContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  addToast: (
    message: string,
    type?: "success" | "error" | "info",
    duration?: number,
  ) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" = "info",
      duration: number = 3000,
    ) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    [],
  );

  const success = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast],
  );
  const error = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast],
  );
  const info = useCallback(
    (message: string) => addToast(message, "info"),
    [addToast],
  );

  const value: ToastContextType = { addToast, success, error, info, toasts };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
          } text-white min-w-[200px] max-w-[300px]`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
