import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, X, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  masterPassword: string;
}

export const PasswordModal = ({ isOpen, onClose, onSuccess, masterPassword }: PasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password === masterPassword) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      // Vibration effect triggered by Framer Motion below
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-on-background/40 backdrop-blur-xl" 
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              x: error ? [0, -10, 10, -10, 10, 0] : 0 
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
                x: { duration: 0.4, ease: "easeInOut" },
                scale: { type: "spring", damping: 20 }
            }}
            className="relative bg-surface w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden border border-outline-variant/10 p-8 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
              <Shield size={32} />
            </div>

            <div>
              <h3 className="text-xl font-headline font-extrabold text-primary tracking-tight">Acceso Restringido</h3>
              <p className="text-[11px] text-outline font-bold uppercase tracking-widest mt-1">Perfil de Arquitecto (Admin)</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/40">
                  <Lock size={18} />
                </div>
                <input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa PIN Maestro..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-surface-container-low border-2 rounded-2xl p-4 pl-12 pr-12 text-sm font-bold text-primary transition-all focus:ring-0 ${error ? 'border-error ring-2 ring-error/10' : 'border-outline-variant/10 focus:border-primary/40'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-error text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-200">
                  <AlertCircle size={12} />
                  <span>Contraseña Incorrecta</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-surface-container-low text-primary rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-surface-container-high transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Desbloquear
                </button>
              </div>
            </form>

            <p className="text-[9px] text-outline font-medium">
                Esta acción quedará registrada en el log de auditoría.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
