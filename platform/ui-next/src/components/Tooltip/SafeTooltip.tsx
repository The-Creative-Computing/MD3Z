import * as React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';

/**
 * SafeTooltip - Wrapper que deshabilita tooltips en móviles
 * para evitar errores de platform.detectOverflow
 */

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

interface SafeTooltipProps {
  children: React.ReactNode;
  content?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  asChild?: boolean;
}

export const SafeTooltip: React.FC<SafeTooltipProps> = ({
  children,
  content,
  side = 'bottom',
  sideOffset = 4,
  asChild = true,
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // En móviles, solo renderizar el children sin tooltip
  if (isMobile || !content) {
    return <>{children}</>;
  }

  // En desktop, renderizar el tooltip normal
  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
};

export default SafeTooltip;
