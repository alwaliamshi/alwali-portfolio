import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  apiUrl, clearAdminToken, createProject, deleteDocument, deleteProject, deleteTheme,
  getAdminDocuments,
  getAdminOriginalUrl,
  getAdminProjects,
  getAdminToken,
  getAdminAbout,
  getTheme,
  login,
  setAdminToken,
  updateAbout,
  updateProject,
  uploadDocument,
  uploadTheme
} from '../lib/api';
import Toast from '../components/shared/Toast';

const emptyDocument = { title: '', issuer: '', date: '', category: 'certificate', file: null };
const emptyProject = { id: null, title: '', description: '', tech: '', featured: true, iconUrl: '', iconFile: null, url: '' };

const emptyAbout = {
  name: 'Alwali Umara Amshi',
  role: 'Educator \u2022 Technology Builder \u2022 Community Leader \u2022 Innovator',
  intro: '',
  whoIAm: '',
  educationTeaching: '',
  technology: '',
  communityLeadership: '',
  innovation: '',
  approach: '',
  facts: []
};

const nav = [
  ['dashboard', '▦', 'Dashboard'], ['projects', '◇', 'Projects'], ['certificates', '♙', 'Certificates'],
  ['resume', '▤', 'Resume'], ['about', '◎', 'About'], ['documents', '▧', 'Documents'], ['appearance', '◌', 'Appearance', 'New'], ['settings', '⚙', 'Settings']
];

const Icon = ({ children }) => <span className="side-icon">{children}</span>;

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(Boolean(getAdminToken()));
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [about, setAbout] = useState(emptyAbout);
  const [documentForm, setDocumentForm] = useState(emptyDocument);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [projectEditorOpen, setProjectEditorOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState(null);
  const [themeFile, setThemeFile] = useState(null);
  const [themeBusy, setThemeBusy] = useState(false);
  const [activePanel, setActivePanel] = useState('dashboard');

  const notify = useCallback((message, type = 'success') => setToast({ message, type, id: Date.now() }), []);
  const loadAll = useCallback(async () => {
    try {
      const [docs, projectItems, currentTheme, currentAbout] = await Promise.all([
        getAdminDocuments(),
        getAdminProjects(),
        getTheme(),
        getAdminAbout()
      ]);
      setDocuments(docs);
      setProjects(projectItems);
      setTheme(currentTheme);
      setAbout(currentAbout);
    } catch (e) {
      setError(e.message); clearAdminToken(); setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
  if (!authenticated) return;

  const load = async () => {
    await loadAll();
  };

  load();
}, [authenticated, loadAll]);
  
const handleAboutSubmit = async (event) => {
  event.preventDefault();

  setBusy(true);
  setError('');

  try {
    const saved = await updateAbout(about);

    setAbout(saved);

    setToast({
      type: 'success',
      message: 'About section updated successfully.'
    });
  } catch (err) {
    setError(err.message || 'Could not update About section.');
  } finally {
    setBusy(false);
  }
};

  async function handleLogin(e) {
  e.preventDefault();
  setBusy(true);
  setError('');

  try {
    const result = await login(
      credentials.username.trim(),
      credentials.password
    );

    setAdminToken(result.token);
    setAuthenticated(true);
    notify('Signed in successfully.');
  } catch (e) {
    setError(e.message);
  } finally {
    setBusy(false);
  }
}

  async function handleUpload(e) {
    e.preventDefault(); setError('');
    if (!documentForm.file) return setError('Choose a document first.');
    setBusy(true);
    try {
      const data = new FormData();
      data.append('file', documentForm.file); data.append('title', documentForm.title); data.append('issuer', documentForm.issuer); data.append('date', documentForm.date); data.append('category', documentForm.category);
      await uploadDocument(data);
      setDocumentForm(emptyDocument); e.target.reset(); setUploadOpen(false); notify('Document uploaded successfully.'); await loadAll();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleDeleteDocument(id) {
    if (!window.confirm('Delete this document permanently?')) return;
    try { await deleteDocument(id); setDocuments((items) => items.filter((item) => item.id !== id)); notify('Document deleted.'); }
    catch (e) { setError(e.message); }
  }

  async function handleProjectSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    const tech = projectForm.tech.split(',').map((x) => x.trim()).filter(Boolean);
    try {
      const formData = new FormData();
      formData.append('title', projectForm.title);
      formData.append('description', projectForm.description);
      formData.append('tech', JSON.stringify(tech));
      formData.append('featured', projectForm.featured);
      formData.append('url', projectForm.url);
      if (projectForm.iconFile) formData.append('icon', projectForm.iconFile);
      
      if (projectForm.id) { 
        const updated = await updateProject(projectForm.id, formData); 
        setProjects((items) => items.map((p) => p.id === updated.id ? updated : p)); 
        notify('Project updated successfully.'); 
      } else { 
        const created = await createProject(formData); 
        setProjects((items) => [...items, created]); 
        notify('Project added successfully.'); 
      }
      setProjectForm(emptyProject); setProjectEditorOpen(false);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleDeleteProject(id) {
    if (!window.confirm('Delete this project permanently?')) return;
    try { await deleteProject(id); setProjects((items) => items.filter((p) => p.id !== id)); notify('Project deleted.'); }
    catch (e) { setError(e.message); }
  }

  const stats = useMemo(() => ({
    projects: projects.length,
    certificates: documents.filter((d) => d.category === 'certificate').length,
    docs: documents.length,
    downloads: 0
  }), [projects, documents]);

  const openUpload = (category = 'document') => {
    setActivePanel('documents'); setDocumentForm({ ...emptyDocument, category }); setUploadOpen(true); setUploadMenuOpen(false);
  };

  const openDashboardUpload = () => {
    if (uploadMenuOpen) setUploadMenuOpen(false);
    else setUploadMenuOpen(true);
  };

  if (!authenticated) return (
    <div className="admin-login-page">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="admin-login-wrapper">
        <div className="glass admin-login-card">
          <div className="login-header">
            <div className="admin-brand-mark">◈</div>
            <span className="eyebrow">Portfolio Management</span>
            <h1>Admin Login</h1>
            <p className="login-subtitle">Sign in to manage your portfolio</p>
          </div>

          {error && (
            <div className="alert error">
              <span>✕</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="Enter your username"
                autoComplete="username"
                className="form-input"
                required
                disabled={busy}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="form-input"
                required
                disabled={busy}
              />
            </div>

            <button type="submit" className="btn primary login-btn" disabled={busy}>
              {busy ? (
                <>
                  <span className="btn-spinner">⟳</span>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-hint">Use your administrator credentials to access the admin panel</p>
          </div>
        </div>

        <div className="login-background-decoration" />
      </div>
    </div>
  );

  const currentTitle = nav.find(([key]) => key === activePanel)?.[2] || 'Dashboard';

  return (
    <div className="admin-shell">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand"><span>◈</span><strong>Portfolio Admin</strong></div>
        <nav>{nav.map(([key, icon, label, badge]) => <button key={key} className={activePanel === key ? 'active' : ''} onClick={() => setActivePanel(key)}><Icon>{icon}</Icon>{label}{badge && <span className="new-badge">{badge}</span>}</button>)}</nav>
        <button className="logout-btn" onClick={() => { clearAdminToken(); setAuthenticated(false); }}>↪&nbsp; Logout</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><h1>{currentTitle}</h1><p>Manage your portfolio content</p></div>
          <div className="admin-user"><span className="notify-bell">♧</span><span className="user-avatar">A</span><span>Administrator⌄</span></div>
        </header>
        {error && <div className="alert error">{error}<button onClick={() => setError('')}>×</button></div>}

        {activePanel === 'dashboard' && (
          <section className="dashboard-view">
            <div className="stats-grid">
              {[['Projects', stats.projects, 'Total Projects', '▦'], ['Certificates', stats.certificates, 'Total Certificates', '♙'], ['Documents', stats.docs, 'Total Documents', '▤'], ['Downloads', stats.downloads, 'Total Resume Downloads', '⇩']].map(([label, value, sub, icon]) => <div className="glass stat-card" key={label}><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div><b>{icon}</b></div>)}
            </div>
            <div className="dashboard-columns">
              <div className="glass admin-card quick-actions">
                <div className="section-heading"><div><h2>Quick Actions</h2></div></div>
                <button onClick={() => { setActivePanel('projects'); setProjectForm(emptyProject); setProjectEditorOpen(true); }}><span className="qa-green">＋</span><div><strong>Add New Project</strong><small>Add a new project to showcase</small></div><b>›</b></button>
                <button onClick={() => openUpload('certificate')}><span className="qa-gold">♙</span><div><strong>Upload Certificate</strong><small>Add a new certificate</small></div><b>›</b></button>
                <button onClick={() => openUpload('resume')}><span className="qa-purple">▤</span><div><strong>Upload Resume</strong><small>Upload or update resume</small></div><b>›</b></button>
                <button onClick={() => openUpload('document')}><span className="qa-blue">▧</span><div><strong>Upload Document</strong><small>Upload other documents</small></div><b>›</b></button>
                <button onClick={() => setActivePanel('appearance')}><span className="qa-cyan">◌</span><div><strong>Appearance Settings</strong><small>Change website wallpaper/theme</small></div><b>›</b></button>
              </div>

              <div className="glass admin-card activity-card">
                <div className="section-heading"><div><h2>Recent Activity</h2></div></div>
                <div className="empty-state"><span className="empty-icon">◷</span><strong>No recent activity.</strong><p>Add or update content to see activity here.</p></div>
              </div>

              <div className="glass admin-card site-appearance">
                <div className="section-heading"><div><h2>Site Appearance</h2></div></div>
                <div className="appearance-mini"><div className="default-theme-preview"><span>Alwali</span></div></div>
                <div className="appearance-mini-meta"><span>Current Theme</span><span className="status-pill">{theme?.url ? 'Custom' : 'Default Dark'}</span></div>
                <button className="btn primary" onClick={() => setActivePanel('appearance')}>Manage Appearance</button>
              </div>

              <div className="glass admin-card dashboard-upload-card">
                <div className="dashboard-upload-inner">
                  <div className="dashboard-upload-heading"><strong>Upload a Document</strong><small>Add documents to your portfolio</small></div>
                  <button className="upload-document-menu-btn" onClick={openDashboardUpload}>＋&nbsp; Upload Document <span>{uploadMenuOpen ? '⌃' : '⌄'}</span></button>
                  {uploadMenuOpen && <div className="dashboard-upload-menu">
                    <button onClick={() => openUpload('certificate')}><span>♙</span><div><strong>Certificate</strong><small>Add a new certificate</small></div></button>
                    <button onClick={() => openUpload('resume')}><span>▤</span><div><strong>Resume</strong><small>Upload or update resume</small></div></button>
                    <button onClick={() => openUpload('document')}><span>▧</span><div><strong>Other Document</strong><small>Upload other documents</small></div></button>
                  </div>}
                </div>
              </div>
            </div>
          </section>
        )}

        {activePanel === 'projects' && <section className="glass admin-card"><div className="section-heading"><div><span className="eyebrow">Showcase</span><h2>Projects</h2><p>Featured projects on the public homepage are managed here.</p></div><button className="btn primary" onClick={() => { setProjectForm(emptyProject); setProjectEditorOpen(true); }}>＋ Add New Project</button></div>
          {projectEditorOpen && <form onSubmit={handleProjectSubmit} className="project-editor"><div className="form-grid two-col"><label>Project title<input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required /></label><label className="file-field">Project icon<input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" onChange={(e) => { const file = e.target.files?.[0] || null; setProjectForm({ ...projectForm, iconFile: file, iconUrl: file ? URL.createObjectURL(file) : projectForm.iconUrl }); }} />{projectForm.iconUrl && <img src={projectForm.iconUrl} alt="Icon preview" style={{width: '40px', height: '40px', borderRadius: '6px', marginTop: '8px', objectFit: 'contain', background: 'rgba(255,255,255,.05)', padding: '4px'}} />}</label><label className="span-two">Description<textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} required /></label><label>Technologies<input value={projectForm.tech} onChange={(e) => setProjectForm({ ...projectForm, tech: e.target.value })} placeholder="React, Python, UI/UX" /></label><label>Project URL<input value={projectForm.url} onChange={(e) => setProjectForm({ ...projectForm, url: e.target.value })} placeholder="https://..." /></label></div><label className="toggle-row"><input type="checkbox" checked={projectForm.featured} onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })} /> Show in Featured Projects</label><div className="editor-actions"><button type="button" className="btn secondary" onClick={() => { setProjectForm(emptyProject); setProjectEditorOpen(false); }}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : projectForm.id ? 'Save changes' : 'Add project'}</button></div></form>}
          <div className="admin-project-list">{projects.length === 0 ? <div className="empty-state"><strong>No projects yet.</strong><p>Add your first project above.</p></div> : projects.map((project) => <article className="project-admin-row" key={project.id}>{project.iconUrl ? <img src={project.iconUrl} alt="Project icon" style={{width: '34px', height: '34px', borderRadius: '6px', objectFit: 'contain'}} /> : <span className="project-icon small">✦</span>}<div className="project-admin-info"><strong>{project.title}</strong><p>{project.description}</p><div className="tags">{(project.tech || []).map((tech) => <span key={tech}>{tech}</span>)}</div></div><span className={project.featured ? 'status-pill live' : 'status-pill'}>{project.featured ? 'Featured' : 'Hidden'}</span><div className="row-actions"><button className="text-link" onClick={() => { setProjectForm({ ...project, tech: (project.tech || []).join(', '), iconFile: null }); setProjectEditorOpen(true); }}>Edit</button><button className="danger-btn" onClick={() => handleDeleteProject(project.id)}>Delete</button></div></article>)}</div>
        </section>}

        {activePanel === 'documents' && <section className="documents-view"><div className="glass upload-launcher"><button className="upload-launch-btn" onClick={() => setUploadOpen((v) => !v)}><div><strong>Upload a Document</strong><small>Add documents to your portfolio</small></div><b>{uploadOpen ? '⌃' : '⌄'}</b></button>{uploadOpen && <UploadForm documentForm={documentForm} setDocumentForm={setDocumentForm} handleUpload={handleUpload} busy={busy} setUploadOpen={setUploadOpen} />}</div><div className="glass admin-card"><div className="section-heading"><div><h2>Documents</h2><p>Manage your uploaded portfolio documents.</p></div><span>{documents.length} item{documents.length === 1 ? '' : 's'}</span></div><div className="document-list">{documents.length === 0 ? <div className="empty-state"><strong>No uploaded documents yet.</strong><p>Use Upload a Document above.</p></div> : documents.map((doc) => <div className="document-row" key={doc.id}><div><strong>{doc.title}</strong><p>{doc.category} · {doc.originalName} · {Math.max(1, Math.round(doc.size / 1024))} KB{doc.hasPublicVersion ? ' · public copy ready' : ''}</p></div><div className="row-actions"><button className="text-link" onClick={async () => { try { const url = await getAdminOriginalUrl(doc.id); window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { setError(e.message); } }}>View original</button>{doc.publicUrl && <a className="text-link" href={apiUrl(doc.publicUrl)} target="_blank" rel="noreferrer">View public</a>}<button className="danger-btn" onClick={() => handleDeleteDocument(doc.id)}>Delete</button></div></div>)}</div></div></section>}

        {activePanel === 'certificates' && <section className="glass admin-card"><div className="section-heading"><div><span className="eyebrow">Credentials</span><h2>Certificates</h2><p>Certificates uploaded here are automatically processed into public-safe copies.</p></div><button className="btn primary" onClick={() => openUpload('certificate')}>Upload Certificate</button></div><div className="admin-project-list">{documents.filter((d) => d.category === 'certificate').map((doc) => <div className="document-row" key={doc.id}><div><strong>{doc.title}</strong><p>{doc.issuer} · {doc.date}</p></div><div className="row-actions">{doc.publicUrl && <a className="text-link" href={apiUrl(doc.publicUrl)} target="_blank" rel="noreferrer">View public</a>}<button className="danger-btn" onClick={() => handleDeleteDocument(doc.id)}>Delete</button></div></div>)}{documents.filter((d) => d.category === 'certificate').length === 0 && <div className="empty-state"><span className="empty-icon">♙</span><strong>No certificates yet.</strong><p>Upload a certificate to display it on the public portfolio.</p></div>}</div></section>}

        {activePanel === 'resume' && <section className="glass admin-card"><div className="section-heading"><div><span className="eyebrow">Curriculum Vitae</span><h2>Resume</h2><p>The latest uploaded resume is automatically used on the public Resume page.</p></div><button className="btn primary" onClick={() => openUpload('resume')}>Upload / Update Resume</button></div><div className="document-list">{documents.filter((d) => d.category === 'resume').length === 0 ? <div className="empty-state"><strong>No resume uploaded.</strong><p>Upload your latest resume to make it available publicly.</p></div> : documents.filter((d) => d.category === 'resume').map((doc) => <div className="document-row" key={doc.id}><div><strong>{doc.title || 'Resume'}</strong><p>{doc.originalName} · {new Date(doc.createdAt).toLocaleDateString()}</p></div><div className="row-actions"><a className="text-link" href={apiUrl(doc.url)} target="_blank" rel="noreferrer">View resume</a><button className="danger-btn" onClick={() => handleDeleteDocument(doc.id)}>Delete</button></div></div>)}</div></section>}

        {activePanel === 'about' && (
  <section className="glass admin-card">
    <div className="admin-card-header">
      <div>
        <p className="eyebrow">PORTFOLIO CONTENT</p>
        <h2>About Section</h2>
        <p>
          Edit the information displayed on your public About page.
        </p>
      </div>
    </div>

    <form onSubmit={handleAboutSubmit}>
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input
            type="text"
            value={about.name}
            onChange={(e) =>
              setAbout({ ...about, name: e.target.value })
            }
            required
          />
        </label>

        <label>
          <span>Role / Identity</span>
          <input
            type="text"
            value={about.role}
            onChange={(e) =>
              setAbout({ ...about, role: e.target.value })
            }
          />
        </label>
      </div>

      <label>
        <span>Introduction</span>
        <textarea
          rows="4"
          value={about.intro}
          onChange={(e) =>
            setAbout({ ...about, intro: e.target.value })
          }
          required
        />
      </label>

      <label>
        <span>Who I Am</span>
        <textarea
          rows="6"
          value={about.whoIAm}
          onChange={(e) =>
            setAbout({ ...about, whoIAm: e.target.value })
          }
        />
      </label>

      <label>
        <span>Education & Teaching</span>
        <textarea
          rows="6"
          value={about.educationTeaching}
          onChange={(e) =>
            setAbout({ ...about, educationTeaching: e.target.value })
          }
        />
      </label>

      <label>
        <span>Technology</span>
        <textarea
          rows="6"
          value={about.technology}
          onChange={(e) =>
            setAbout({ ...about, technology: e.target.value })
          }
        />
      </label>

      <label>
        <span>Community & Leadership</span>
        <textarea
          rows="6"
          value={about.communityLeadership}
          onChange={(e) =>
            setAbout({ ...about, communityLeadership: e.target.value })
          }
        />
      </label>

      <label>
        <span>Innovation</span>
        <textarea
          rows="6"
          value={about.innovation}
          onChange={(e) =>
            setAbout({ ...about, innovation: e.target.value })
          }
        />
      </label>

      <label>
        <span>Approach</span>
        <textarea
          rows="6"
          value={about.approach}
          onChange={(e) =>
            setAbout({ ...about, approach: e.target.value })
          }
        />
      </label>

      <label>
        <span>Key Facts</span>
        <textarea
          rows="7"
          value={about.facts.join('\n')}
          onChange={(e) =>
            setAbout({
              ...about,
              facts: e.target.value
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean)
            })
          }
          placeholder="One fact per line"
        />
        <small>
          Enter one key fact per line.
        </small>
      </label>

      <div className="admin-actions">
        <button
          type="submit"
          className="btn primary"
          disabled={busy}
        >
          {busy ? 'Saving...' : 'Save About'}
        </button>
      </div>
    </form>
  </section>
)}
        
        {activePanel === 'appearance' && <section className="glass admin-card"><div className="section-heading"><div><span className="eyebrow">Site appearance</span><h2>Default Theme & Wallpaper</h2><p>The reference red/blue design is the permanent fallback. Wallpaper is optional.</p></div><span className="status-pill">{theme?.url ? 'Custom wallpaper' : 'Default Dark'}</span></div><div className="appearance-preview"><div className="default-theme-preview"><span>Alwali</span></div>{theme?.url ? <img src={`${apiUrl(theme.url)}?v=${encodeURIComponent(theme.updatedAt || '')}`} alt="Current wallpaper" /> : <div className="theme-placeholder"><strong>No custom wallpaper</strong><span>Default theme is active</span></div>}</div><div className="form-grid two-col appearance-form"><label className="file-field">Choose wallpaper<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => setThemeFile(e.target.files?.[0] || null)} /></label><div className="theme-actions"><button className="btn primary" disabled={themeBusy || !themeFile} onClick={async () => { if (!themeFile) return; setThemeBusy(true); setError(''); try { const data = new FormData(); data.append('file', themeFile); const next = await uploadTheme(data); setTheme(next); setThemeFile(null); notify('Wallpaper updated successfully.'); } catch (e) { setError(e.message); } finally { setThemeBusy(false); } }}>{themeBusy ? 'Updating…' : 'Apply wallpaper'}</button>{theme?.url && <button className="btn secondary" disabled={themeBusy} onClick={async () => { setThemeBusy(true); setError(''); try { await deleteTheme(); setTheme({ url: null, updatedAt: new Date().toISOString() }); notify('Wallpaper removed.'); } catch (e) { setError(e.message); } finally { setThemeBusy(false); } }}>Remove wallpaper</button>}</div></div></section>}

        {activePanel === 'settings' && <section className="glass admin-card"><div className="section-heading"><div><span className="eyebrow">Account</span><h2>Settings</h2><p>Basic account and portfolio controls.</p></div></div><div className="settings-list"><div><strong>Administrator</strong><span>Signed in as the portfolio administrator.</span></div><div><strong>Public theme</strong><span>{theme?.url ? 'Custom wallpaper active' : 'Default red/blue theme active'}</span></div><div><strong>Security</strong><span>Keep your administrator password private and use a strong password in production.</span></div></div></section>}
      </main>
    </div>
  );
}

function UploadForm({ documentForm, setDocumentForm, handleUpload, busy, setUploadOpen }) {
  return <form onSubmit={handleUpload} className="upload-dropdown">
    <div className="upload-hint">Certificates are automatically processed into a clearly identifiable public copy with likely certificate numbers, verification IDs and QR codes redacted. Only the safe copy is public.</div>
    <div className="form-grid two-col">
      <label>Document title<input value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} /></label>
      <label>Category<select value={documentForm.category} onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value })}><option value="certificate">Certificate</option><option value="resume">Resume</option><option value="document">Other document</option></select></label>
      <label>Issuer / organization<input value={documentForm.issuer} onChange={(e) => setDocumentForm({ ...documentForm, issuer: e.target.value })} /></label>
      <label>Date<input value={documentForm.date} onChange={(e) => setDocumentForm({ ...documentForm, date: e.target.value })} /></label>
      <label className="file-field span-two">Choose file<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })} required /></label>
    </div>
    <div className="editor-actions"><button type="button" className="btn secondary" onClick={() => setUploadOpen(false)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload document'}</button></div>
  </form>;
}
