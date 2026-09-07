import { useEffect, useState } from 'react';
import { apiUrl, getDocuments } from '../lib/api';

function getPdfPreviewUrl(publicUrl) {
  if (!publicUrl) return '';

  const url = apiUrl(publicUrl);

  return url
    .replace('/image/upload/', '/image/upload/pg_1/')
    .replace(/\.pdf$/i, '.jpg');
}

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    let mounted = true;

    getDocuments()
      .then((docs) => {
        if (!mounted) return;

        setCertificates(
          docs.filter(
            (doc) =>
              doc.category === 'certificate' &&
              doc.published !== false &&
              doc.publicUrl
          )
        );
      })
      .catch(() => {
        if (mounted) setCertificates([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCertificate) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedCertificate(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCertificate]);

  const openCertificate = (certificate) => {
    setSelectedCertificate(certificate);
  };

  const closeCertificate = () => {
    setSelectedCertificate(null);
  };

  return (
    <>
      <section className="container certificates-page">
        <div className="certificates-page-header">
          <span className="eyebrow">Credentials</span>

          <h1 className="section-title">Certificates</h1>

          <p className="certificates-page-subtitle">
            Professional development, training and verified achievements.
          </p>
        </div>

        {loading ? (
          <div className="certificates-status glass">
            <div className="certificate-loading-spinner" />
            <strong>Loading certificates&#8230;</strong>
            <p>Retrieving your professional credentials.</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="certificates-status glass">
            <div className="certificate-icon-box">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>

            <h3 className="cert-heading">No certificates available.</h3>

            <p className="cert-subtext">
              Add your certificates from the admin panel to display them here.
            </p>
          </div>
        ) : (
          <div className="certificates-gallery">
            {certificates.map((certificate) => {
              const publicUrl = apiUrl(certificate.publicUrl);
              const isImage =
                certificate.publicMimeType?.startsWith('image/');

              return (
                <article
                  key={certificate.id}
                  className="certificate-gallery-card glass"
                >
                  <div className="certificate-thumbnail">
                    {isImage ? (
                      <img
                        src={`${publicUrl}?v=${encodeURIComponent(
                          certificate.createdAt || ''
                        )}`}
                        alt={`${certificate.title} certificate`}
                        loading="lazy"
                      />
                    ) : (
                      <img
                        src={getPdfPreviewUrl(certificate.publicUrl)}
                        alt={`${certificate.title} certificate`}
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="certificate-card-content">
                    <div className="certificate-meta-top">
                      <span className="certificate-category">
                        {certificate.category || 'Certificate'}
                      </span>

                      {certificate.date && (
                        <span className="certificate-date">
                          {certificate.date}
                        </span>
                      )}
                    </div>

                    <h2>{certificate.title || 'Certificate'}</h2>

                    {certificate.issuer && (
                      <p className="certificate-issuer">
                        {certificate.issuer}
                      </p>
                    )}

                    <button
                      type="button"
                      className="btn primary certificate-view-button"
                      onClick={() => openCertificate(certificate)}
                    >
                      View Certificate
                      <span aria-hidden="true">&#8599;</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedCertificate && (
        <div
          className="certificate-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCertificate();
            }
          }}
        >
          <div
            className="certificate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="certificate-modal-title"
          >
            <div className="certificate-modal-header">
              <div>
                <span className="eyebrow">Public Certificate</span>
                <h2 id="certificate-modal-title">
                  {selectedCertificate.title || 'Certificate'}
                </h2>
              </div>

              <button
                type="button"
                className="certificate-modal-close"
                onClick={closeCertificate}
                aria-label="Close certificate viewer"
              >
                &#10005;
              </button>
            </div>

            <div className="certificate-modal-viewer">
              {selectedCertificate.publicMimeType?.startsWith('image/') ? (
                <img
                  src={apiUrl(selectedCertificate.publicUrl)}
                  alt={`${selectedCertificate.title} certificate`}
                />
               ) : (
                <img
                  src={getPdfPreviewUrl(selectedCertificate.publicUrl)}
                  alt={`${selectedCertificate.title} certificate`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
