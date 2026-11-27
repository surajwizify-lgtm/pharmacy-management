'use client';

import { store } from '@/store';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux'

export function Providers({ children }: { children: ReactNode }) {
  return <Provider store={store}>
    <SessionProvider>{children}</SessionProvider>
  </Provider>;
}
