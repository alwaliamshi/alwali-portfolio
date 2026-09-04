import { useEffect, useState } from 'react';
import { apiUrl, getTheme } from '../../lib/api';

export default function ThemeManager() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    let active = true;
    getTheme().then((data) => {
      if (active) setTheme(data);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme?.url) {
      root.style.setProperty('--portfolio-wallpaper', `url("${apiUrl(theme.url)}?v=${encodeURIComponent(theme.updatedAt || '')}")`);
      root.classList.add('has-wallpaper');
    } else {
      root.style.removeProperty('--portfolio-wallpaper');
      root.classList.remove('has-wallpaper');
    }
  }, [theme]);

  return null;
}
