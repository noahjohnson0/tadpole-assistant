import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TadpoleIconProps {
  className?: string;
  size?: number;
}

export function TadpoleIcon({ className = '', size = 24 }: TadpoleIconProps) {
  return (
    <Image
      src="/tadpole.png"
      alt="Tadpole logo"
      width={size}
      height={size}
      className={cn('object-contain dark:invert', className)}
      style={{ width: size, height: size }}
      priority
    />
  );
}
