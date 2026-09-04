import { useEffect, useState } from 'react';
import { getProjects } from '../../lib/api';

function getTagClass(tag) {
  const normalized = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const tagColors = {
    react: 'tag-react',
    'data-systems': 'tag-data',
    'ui-ux': 'tag-uiux',
    javascript: 'tag-javascript',
    fastapi: 'tag-fastapi',
    python: 'tag-python',
    ai: 'tag-ai',
  };

  return tagColors[normalized] || 'tag-default';
}

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getProjects()
      .then((items) => {
        const featured = items.filter((project) => project.featured);

        setProjects(featured);
      })
      .catch(() => setProjects([]));
  }, []);

  return (
    <section className="container">
      <h2 className="section-title">Featured Projects</h2>

      {projects.length === 0 ? (
        <div className="projects-empty">
          <p>No featured projects available yet.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const CardContent = (
              <>
                <div>
                  <div className="project-header">
                    <div className="project-icon-box">
                      {project.iconUrl ? (
                        <img
                          src={project.iconUrl}
                          alt=""
                          className="project-home-icon"
                        />
                      ) : (
                        <span className="project-fallback-icon">✦</span>
                      )}
                    </div>

                    <span className="card-arrow">↗</span>
                  </div>

                  <h3 className="project-title">{project.title}</h3>

                  <p className="project-desc">
                    {project.description}
                  </p>
                </div>

                <div className="project-tags">
                  {(project.tech || []).map((tag) => (
                    <span
                      className={`tag ${getTagClass(tag)}`}
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            );

            return project.url ? (
              <a
                className="project-card project-card-link"
                href={project.url}
                target="_blank"
                rel="noreferrer"
                key={project.id}
                aria-label={`Open ${project.title}`}
              >
                {CardContent}
              </a>
            ) : (
              <article
                className="project-card"
                key={project.id}
              >
                {CardContent}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}