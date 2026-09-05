import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl, getDocuments, getProjects } from '../lib/api';

export default function Resume() {
  const [resume, setResume] = useState('');
  const [certs, setCerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([getDocuments(), getProjects()])
      .then(([documentsResult, projectsResult]) => {
        if (!mounted) return;

        if (documentsResult.status === 'fulfilled') {
          const docs = Array.isArray(documentsResult.value)
            ? documentsResult.value
            : [];

          const latestResume = docs.find(
            (document) => document.category === 'resume'
          );

          setCerts(
            docs.filter((document) => document.category === 'certificate')
          );

          if (latestResume) {
            const resumeUrl = latestResume.publicUrl || latestResume.url;

            setResume(apiUrl(resumeUrl));
            setUpdatedAt(latestResume.createdAt || null);
          } else {
            setResume('/resume/resume.pdf');
          }
        } else {
          setResume('/resume/resume.pdf');
        }

        if (projectsResult.status === 'fulfilled') {
          setProjects(
            Array.isArray(projectsResult.value)
              ? projectsResult.value
              : []
          );
        } else {
          setProjects([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="resume-page page">
        <section className="resume-loading glass">
          <span className="resume-loading-dot" aria-hidden="true" />
          <p>Loading Resume...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="resume-page page">

      {/* =========================
          HERO
      ========================== */}
      <section className="resume-hero">
        <div className="resume-hero-content">
          <span className="eyebrow">Curriculum Vitae</span>

          <h1>Resume</h1>

          <p className="resume-intro">
            A snapshot of my professional journey, education, experience,
            certifications, projects, and the work I continue to build.
          </p>

          <div className="resume-hero-actions">
            {resume && (
              <a
                className="btn primary"
                href={resume}
                download
              >
                ⇩&nbsp; Download Resume
              </a>
            )}

            <Link className="btn secondary" to="/about">
              About Me
            </Link>
          </div>
        </div>
      </section>

      {/* =========================
          RESUME PREVIEW
      ========================== */}
      <section className="resume-preview-section">
        <div className="resume-section-heading">
          <div>
            <span className="eyebrow">Professional Profile</span>
            <h2>Resume Preview</h2>
            <p>
              View my latest resume directly from the portfolio.
            </p>
          </div>
        </div>

        {updatedAt && (
          <div className="resume-updated">
            <span>Latest version</span>
            <strong>
              {new Date(updatedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </strong>
          </div>
        )}

        <div className="resume-viewer glass">
          {resume ? (
            <iframe
              title="Alwali Umara Amshi Resume"
              src={resume}
            />
          ) : (
            <div className="resume-empty">
              <span>Resume unavailable</span>
              <p>
                The latest resume has not been uploaded yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================
          CREDENTIALS
      ========================== */}
      {certs.length > 0 && (
        <section className="resume-content-section">
          <div className="resume-section-heading">
            <div>
              <span className="eyebrow">Professional Credentials</span>
              <h2>Certifications</h2>
              <p>
                Selected credentials and professional development records.
              </p>
            </div>

            <Link className="text-link" to="/certificates">
              View all certificates →
            </Link>
          </div>

          <div className="resume-certificate-grid">
            {certs.map((cert, index) => (
              <article
                className="resume-info-card glass"
                key={cert.id}
              >
                <div className="resume-card-number">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="resume-card-accent" aria-hidden="true" />

                <div className="resume-card-content">
                  <span className="resume-card-label">
                    Certificate
                  </span>

                  <h3>{cert.title}</h3>

                  {cert.issuer && (
                    <p className="resume-card-issuer">
                      {cert.issuer}
                    </p>
                  )}

                  {cert.date && (
                    <span className="resume-card-date">
                      {cert.date}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================
          PROJECTS
      ========================== */}
      {projects.length > 0 && (
        <section className="resume-content-section">
          <div className="resume-section-heading">
            <div>
              <span className="eyebrow">Selected Work</span>
              <h2>Projects</h2>
              <p>
                Practical solutions built across education, technology,
                data, and innovation.
              </p>
            </div>

            <Link className="text-link" to="/projects">
              Explore projects →
            </Link>
          </div>

          <div className="resume-project-grid">
            {projects.map((project, index) => (
              <article
                className="resume-project-card glass"
                key={project.id}
              >
                <div className="resume-project-top">
                  <span className="resume-project-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="resume-project-icon">
                    {project.icon || '✦'}
                  </span>
                </div>

                <div className="resume-card-accent" aria-hidden="true" />

                <h3>{project.title}</h3>

                <p>{project.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================
          CLOSING CTA
      ========================== */}
      <section className="resume-cta glass">
        <div>
          <span className="eyebrow">Keep Exploring</span>
          <h2>There is more behind the resume.</h2>
          <p>
            Explore my background, projects, and the ideas I am turning
            into useful solutions.
          </p>
        </div>

        <div className="resume-cta-actions">
          <Link className="btn primary" to="/about">
            About Me
          </Link>

          <Link className="btn secondary" to="/projects">
            View Projects
          </Link>
        </div>
      </section>

    </main>
  );
}