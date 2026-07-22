import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
}

export default function usePageTitle({ title, description, keywords }: SEOProps) {
  useEffect(() => {
    // 1. Set Title
    const baseTitle = 'Trackom';
    document.title = title ? `${title} | ${baseTitle}` : `${baseTitle} - Kenya's Leading Enterprise Bulk SMS & WhatsApp API`;

    // 2. Set Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        metaDesc.setAttribute('content', description);
        document.head.appendChild(metaDesc);
      }

      // Also set Open Graph description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', description);
      }
    }

    // 3. Set Keywords
    if (keywords) {
      let metaKey = document.querySelector('meta[name="keywords"]');
      if (metaKey) {
        metaKey.setAttribute('content', keywords);
      } else {
        metaKey = document.createElement('meta');
        metaKey.setAttribute('name', 'keywords');
        metaKey.setAttribute('content', keywords);
        document.head.appendChild(metaKey);
      }
    }

    // Also set Open Graph title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title ? `${title} | ${baseTitle}` : baseTitle);
    }
  }, [title, description, keywords]);
}
