const VISITOR_ID_KEY = 'alwali_portfolio_visitor_id';

function getVisitorId() {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return visitorId;
  } catch {
    return null;
  }
}

export async function trackVisitor() {
  try {
    const visitorId = getVisitorId();

    if (!visitorId) return;

    await fetch('/api/visitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        visitorId,
        path: window.location.pathname
      }),
      keepalive: true
    });
  } catch {
    // Visitor tracking must never interfere with the portfolio.
  }
}
