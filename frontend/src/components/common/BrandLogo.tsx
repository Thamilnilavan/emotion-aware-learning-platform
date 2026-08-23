import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  showName?: boolean;
  className?: string;
  imageClassName?: string;
  nameClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  showName = true,
  className,
  imageClassName,
  nameClassName,
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/images/logo.png"
        alt="Eduvo logo"
        width={64}
        height={64}
        priority={priority}
        className={cn('h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(83,180,255,0.3)]', imageClassName)}
      />
      {showName && (
        <span className={cn('font-bold tracking-tight', nameClassName)}>Eduvo</span>
      )}
    </span>
  );
}
