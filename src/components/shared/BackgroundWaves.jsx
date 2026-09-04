export default function BackgroundWaves() {
  return (
    <div className="background-waves" aria-hidden="true">
      <svg viewBox="0 0 1670 610" preserveAspectRatio="none">
        <defs>
          <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="red-line" x1="0" x2="1"><stop stopColor="#ff173f"/><stop offset=".55" stopColor="#ff244e"/><stop offset="1" stopColor="#ff173f"/></linearGradient>
          <linearGradient id="blue-line" x1="0" x2="1"><stop stopColor="#176fff"/><stop offset=".55" stopColor="#2a8cff"/><stop offset="1" stopColor="#176fff"/></linearGradient>
        </defs>
        <path d="M-120 85 C 35 55, 105 82, 205 170 S 370 335, 525 290 S 705 225, 850 330" fill="none" stroke="url(#red-line)" strokeWidth="3" filter="url(#glow-red)"/>
        <path d="M-110 160 C 55 110, 135 145, 260 250 S 425 390, 585 350 S 720 295, 865 370" fill="none" stroke="#ff2b52" strokeWidth="1.25" opacity=".52"/>
        <path d="M-80 28 C 60 18, 145 58, 245 150" fill="none" stroke="#ff173f" strokeWidth="1" opacity=".22"/>
        <path d="M1790 85 C 1635 55, 1565 82, 1465 170 S 1300 335, 1145 290 S 965 225, 820 330" fill="none" stroke="url(#blue-line)" strokeWidth="3" filter="url(#glow-blue)"/>
        <path d="M1780 160 C 1615 110, 1535 145, 1410 250 S 1245 390, 1085 350 S 950 295, 805 370" fill="none" stroke="#2a8cff" strokeWidth="1.25" opacity=".52"/>
        <path d="M1750 28 C 1610 18, 1525 58, 1425 150" fill="none" stroke="#176fff" strokeWidth="1" opacity=".22"/>
      </svg>
    </div>
  );
}
