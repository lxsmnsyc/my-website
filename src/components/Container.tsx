import React, { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode
}

export default function Container({ children }: ContainerProps): JSX.Element {
  return (
    <div className="w-screen h-screen bg-black relative">
      {children}
    </div>
  );
}
