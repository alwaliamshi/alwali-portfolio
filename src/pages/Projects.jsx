import { useEffect, useState } from 'react';
import { getProjects } from '../lib/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  useEffect(() => { getProjects().then(setProjects).catch(() => setProjects([])); }, []);
  return <div className="page"><div className="section-heading"><div><span className="eyebrow">Selected work</span><h1>Projects</h1></div></div>
    {projects.length === 0 ? <div className="glass empty-state"><strong>No projects available yet.</strong><p>Projects added from the Admin panel will appear here.</p></div> :
      <div className="project-grid">{projects.map((project) => <article key={project.id} className="glass project-card"><div className="project-icon">{project.icon || '✦'}</div><div className="project-content"><div className="project-title-row"><h2>{project.title}</h2>{project.url && <a href={project.url} target="_blank" rel="noreferrer">↗</a>}</div><p>{project.description}</p><div className="tags">{project.tech.map((tech) => <span key={tech}>{tech}</span>)}</div></div></article>)}</div>}
  </div>;
}
