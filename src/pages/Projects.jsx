import { useEffect, useState } from 'react';
import { getProjects } from '../lib/api';
import ProjectIcon from '../components/projects/ProjectIcon';

function getTagClass(tag) {
  const normalized = String(tag)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const tagColors = {
    react: 'tag-react',
    'data-systems': 'tag-data',
    'ui-ux': 'tag-uiux',
    javascript: 'tag-javascript',
    fastapi: 'tag-fastapi',
    python: 'tag-python',
    ai: 'tag-ai',
    css: 'tag-css',
    vite: 'tag-vite',
    'node-js': 'tag-node',
    'rest-api': 'tag-api',
    'react-router': 'tag-router',
    authentication: 'tag-auth',
    whisper: 'tag-whisper',
    'faster-whisper': 'tag-whisper',
    ffmpeg: 'tag-ffmpeg',
    'data-visualization': 'tag-data',
    'data-management': 'tag-data',
    'instructional-design': 'tag-education',
    'inquiry-based-learning': 'tag-education',
    'educational-technology': 'tag-education',
    tkinter: 'tag-python'
  };

  return tagColors[normalized] || 'tag-default';
}

function getProjectIcon(project) {
  if (project.icon) {
    return project.icon;
  }

  const title = String(project.title || '').toLowerCase();

  if (title.includes('school')) return 'school';
  if (title.includes('pos')) return 'pos';
  if (title.includes('series')) return 'series';
  if (title.includes('aiim')) return 'aiim';
  if (title.includes('portfolio')) return 'portfolio';

  return 'default';
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getProjects()
      .then((items) => {
        if (mounted) {
          setProjects(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (mounted) {
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
      <main className="projects-page page">
        <section className="projects-loading glass">
          <span className="projects-loading-dot" aria-hidden="true" />
          <p>Loading projects...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="projects-page page">
      <section className="projects-hero">
        <div className="projects-hero-content">
          <span className="eyebrow">Selected Work</span>

          <h1>Projects</h1>

          <p>
            A collection of digital products, experiments, and practical
            solutions built across education, technology, data, and AI.
          </p>
        </div>
      </section>

      <section
        className="projects-content"
        aria-label="Projects and digital work"
      >
        {projects.length === 0 ? (
          <div className="glass projects-empty-card">
            <strong>No projects available yet.</strong>
            <p>
              Projects added from the Admin panel will appear here.
            </p>
          </div>
        ) : (
          <div className="projects-showcase">
            {projects.map((project, index) => {
              const cardContent = (
                <>
                  <div className="projects-card-top">
                    <div className="projects-icon-box">
                      <ProjectIcon type={getProjectIcon(project)} />
                    </div>

                    <span className="projects-card-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="projects-card-body">
                    <div className="projects-title-row">
                      <h2>{project.title}</h2>

                      {project.url && (
                        <span
                          className="projects-link-icon"
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      )}
                    </div>

                    <p className="projects-description">
                      {project.description}
                    </p>
                  </div>

                  <div className="projects-card-footer">
                    <div className="project-tags">
                      {(project.tech || []).map((tech) => (
                        <span
                          className={`tag ${getTagClass(tech)}`}
                          key={tech}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              );

              return project.url ? (
                <a
                  key={project.id}
                  className="projects-showcase-card projects-showcase-link"
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${project.title}`}
                >
                  {cardContent}
                </a>
              ) : (
                <article
                  key={project.id}
                  className="projects-showcase-card"
                >
                  {cardContent}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}