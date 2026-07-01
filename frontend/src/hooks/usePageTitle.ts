import { useEffect } from 'react';

export default function usePageTitle(title: string) {
  useEffect(() => {
    const baseTitle = 'Trackom';
    document.title = title ? `${title} | ${baseTitle}` : `${baseTitle} — Enterprise Bulk SMS & Communications API`;
  }, [title]);
}
