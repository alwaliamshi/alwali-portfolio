import { useEffect, useState } from 'react';
import { apiUrl, getDocuments, getProjects } from '../lib/api';

export default function Resume() {
  const [resume, setResume] = useState('/resume/resume.pdf');
  const [certs, setCerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  useEffect(() => {
    Promise.all([getDocuments(), getProjects()]).then(([docs, projectItems]) => {
      const latest = docs.find((d) => d.category === 'resume');
      setCerts(docs.filter((d) => d.category === 'certificate'));
      setProjects(projectItems);
      if (latest) { setResume(apiUrl(latest.url)); setUpdatedAt(latest.createdAt); }
    }).catch(() => {});
  }, []);
  return <div className="page narrow-page"><div className="section-heading"><div><span className="eyebrow">Curriculum Vitae</span><h1>Resume</h1><p className="muted">Your latest uploaded resume is used automatically. Portfolio credentials and projects are synced here.</p></div><a className="btn primary" href={resume} download>⇩&nbsp; Download Resume</a></div>
    {updatedAt && <p className="muted">Latest uploaded resume: {new Date(updatedAt).toLocaleDateString()}</p>}
    <div className="glass resume-card"><iframe title="Resume" src={resume} /><p className="muted">If the preview does not load, use the download button above.</p></div>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">Automatically synced</span><h2>Credentials</h2></div></div><div className="certificate-grid">{certs.map((cert) => <article className="glass certificate-card compact-card" key={cert.id}><div><h3>{cert.title}</h3><p>{cert.issuer}</p><small>{cert.date}</small></div></article>)}</div></section>
    <section className="content-section"><div className="section-heading"><div><span className="eyebrow">Selected work</span><h2>Projects</h2></div></div><div className="project-grid">{projects.map((project) => <article className="glass project-card" key={project.id}><div className="project-icon">{project.icon || '✦'}</div><div className="project-content"><h3>{project.title}</h3><p>{project.description}</p></div></article>)}</div></section>
  </div>;
}
