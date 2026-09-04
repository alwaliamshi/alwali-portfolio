import { useEffect, useState } from 'react';
import { apiUrl, getDocuments } from '../../lib/api';

export default function FeaturedCertificates() {
  const [certificates, setCertificates] = useState([]);
  useEffect(() => { getDocuments().then((docs) => setCertificates(docs.filter((d) => d.category === 'certificate'))).catch(() => setCertificates([])); }, []);
  return (
    <section className="home-section certificate-section" id="certificates">
      <div className="home-section-title"><h2>Certificates</h2><span /></div>
      {certificates.length === 0 ? (
        <div className="glass empty-certificate">
          <span className="certificate-empty-icon">♧</span>
          <strong>No certificates available.</strong>
          <p>Add your certificates from the admin panel to display them here.</p>
        </div>
      ) : (
        <div className="certificate-grid">
          {certificates.map((cert) => (
            <article key={cert.id} className="glass certificate-card">
              {cert.publicUrl && cert.publicMimeType?.startsWith('image/')
                ? <img src={`${apiUrl(cert.publicUrl)}?v=${encodeURIComponent(cert.createdAt || '')}`} alt={`${cert.title} public copy`} />
                : <div className="file-preview"><span>PDF / Document</span><small>Public-safe copy</small></div>}
              <div><h3>{cert.title}</h3><p>{cert.issuer}</p><small>{cert.date}</small><a className="btn primary certificate-view" href={apiUrl(cert.publicUrl || cert.url)} target="_blank" rel="noreferrer">View certificate</a></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
