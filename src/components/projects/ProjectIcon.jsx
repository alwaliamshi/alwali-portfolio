export default function ProjectIcon({ type = 'default' }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  };

  switch (type) {
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 3-4 3 2 5-7" />
          <circle cx="7" cy="15" r="1" />
          <circle cx="10" cy="11" r="1" />
          <circle cx="13" cy="13" r="1" />
          <circle cx="18" cy="6" r="1" />
        </svg>
      );

    case 'pointer':
      return (
        <svg {...common}>
          <path d="m5 3 14 9-7 2-3 7-4-18Z" />
        </svg>
      );

    case 'mic':
      return (
        <svg {...common}>
          <rect x="8" y="3" width="8" height="12" rx="4" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
          <path d="M9 21h6" />
        </svg>
      );

    case 'school':
      return (
        <svg {...common}>
          <path d="m3 10 9-6 9 6" />
          <path d="M5 10v9h14v-9" />
          <path d="M9 19v-5h6v5" />
          <path d="M12 7v3" />
          <path d="M10 9h4" />
        </svg>
      );

    case 'pos':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h8" />
          <path d="M8 11h2" />
          <path d="M14 11h2" />
          <path d="M8 15h2" />
          <path d="M14 15h2" />
          <path d="M8 19h8" />
        </svg>
      );

    case 'python':
    case 'series':
      return (
        <svg {...common}>
          <path d="M12 3c-4 0-4 2-4 4v2h5v2H7c-2 0-4 1-4 4s2 4 4 4h2v-3c0-2 1-4 4-4h3c2 0 4-1 4-4s-2-5-4-5h-4Z" />
          <circle cx="9" cy="6" r=".8" fill="currentColor" stroke="none" />
          <circle cx="15" cy="18" r=".8" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'aiim':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="m4.93 4.93 2.12 2.12" />
          <path d="m16.95 16.95 2.12 2.12" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
          <path d="m4.93 19.07 2.12-2.12" />
          <path d="m16.95 7.05 2.12-2.12" />
        </svg>
      );

    case 'portfolio':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 8h18" />
          <path d="M8 4v4" />
          <path d="M16 4v4" />
          <path d="m8 13 2 2 4-4" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <path d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
        </svg>
      );
  }
}