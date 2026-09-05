import { useEffect, useState } from 'react';
import { getAdminToken } from '../../lib/api';

export default function VisitorStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const token = getAdminToken();

        if (!token) return;

        const response = await fetch('/api/admin/visitors', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load visitor statistics.');
        }

        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="glass admin-card visitor-stats-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Analytics</span>
            <h2>Visitor Tracker</h2>
          </div>
        </div>
        <p className="visitor-error">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass admin-card visitor-stats-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Analytics</span>
            <h2>Visitor Tracker</h2>
          </div>
        </div>
        <p className="visitor-loading">Loading visitor statistics…</p>
      </div>
    );
  }

  const daily = Object.entries(stats.dailyVisits || {})
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  const pages = Object.entries(stats.pageViews || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="glass admin-card visitor-stats-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Analytics</span>
          <h2>Visitor Tracker</h2>
          <p>Anonymous portfolio traffic overview.</p>
        </div>
        <span className="visitor-live-pill">● Live</span>
      </div>

      <div className="visitor-metrics">
        <div className="visitor-metric">
          <span>Total Visits</span>
          <strong>{stats.totalVisits}</strong>
        </div>

        <div className="visitor-metric">
          <span>Unique Visitors</span>
          <strong>{stats.uniqueVisitors}</strong>
        </div>

        <div className="visitor-metric">
          <span>Today</span>
          <strong>{stats.todayVisits}</strong>
        </div>
      </div>

      <div className="visitor-columns">
        <div className="visitor-section">
          <h3>Last 7 Days</h3>

          {daily.length === 0 ? (
            <p className="visitor-muted">No visits recorded yet.</p>
          ) : (
            <div className="visitor-list">
              {daily.map(([date, count]) => (
                <div className="visitor-row" key={date}>
                  <span>{date}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="visitor-section">
          <h3>Popular Pages</h3>

          {pages.length === 0 ? (
            <p className="visitor-muted">No page views recorded yet.</p>
          ) : (
            <div className="visitor-list">
              {pages.map(([page, count]) => (
                <div className="visitor-row" key={page}>
                  <span>{page}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.lastVisit && (
        <div className="visitor-last">
          Last visit: {new Date(stats.lastVisit).toLocaleString()}
        </div>
      )}
    </div>
  );
}
