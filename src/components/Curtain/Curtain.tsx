import { useState, type FormEvent } from 'react';
import './Curtain.css';

/**
 * Utility to hash strings using SHA-256.
 * Note: Since this is client-side, it's not 100% impenetrable, but
 * it hides the actual password from the source code.
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface CurtainProps {
  isOpen: boolean;
  onUnlock: () => void;
}

/**
 * Fullscreen overlay that blocks the scene until the correct password is entered.
 */
export function Curtain({ isOpen, onUnlock }: CurtainProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const inputHash = await hashString(value.trim().toLowerCase());
    const targetHash = import.meta.env.VITE_CURTAIN_HASH;

    if (inputHash === targetHash) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  };

  return (
    <div
      className="curtain-overlay"
      data-open={isOpen}
      inert={isOpen ? true : undefined}
    >
      <div className="curtain-content">
        <p className="curtain-subtitle">Escribe la palabra mágica</p>

        <form className="curtain-form" onSubmit={handleSubmit}>
          <input
            id="curtain-password"
            className={`curtain-input${error ? ' error' : ''}`}
            type="password"
            placeholder="Escribela aquí"
            autoComplete="off"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" className="curtain-btn">
            Entrar
          </button>
        </form>

        <p className="curtain-error" role="alert">
          {error ? 'Contraseña incorrecta' : ''}
        </p>
      </div>
    </div>
  );
}
