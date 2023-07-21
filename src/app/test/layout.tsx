import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'react-d3-map test',
  description: 'react-d3-map test',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  );
}
