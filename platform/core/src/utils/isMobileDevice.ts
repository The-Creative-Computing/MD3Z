/**
 * Detecta si el usuario está accediendo desde un dispositivo móvil
 * @returns {boolean} true si es móvil, false si es desktop
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Detectar por User Agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  // Detectar por tamaño de pantalla (menor a 768px se considera móvil)
  const isSmallScreen = window.innerWidth < 768;

  // Detectar por capacidad táctil
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return mobileRegex.test(userAgent) || (isSmallScreen && isTouchDevice);
}

export default isMobileDevice;
