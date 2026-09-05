import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAbout } from '../lib/api';

const fallbackAbout = {
  name: 'Alwali Umara Amshi',
  role: 'Educator - Technology Builder - Community Leader - Innovator',
  intro: 'I build practical digital solutions that connect education, technology, data, and community impact.',
  whoIAm: '',
  educationTeaching: '',
  technology: '',
  communityLeadership: '',
  innovation: '',
  approach: '',
  facts: []
};

export default function About() {
  const [about, setAbout] = useState(fallbackAbout);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getAbout()
      .then((data) => {
        if (mounted) {
          setAbout({
            ...fallbackAbout,
            ...data,
            facts: Array.isArray(data?.facts) ? data.facts : []
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setAbout(fallbackAbout);
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
      <main className="about-page page">
        <section className="about-loading glass">
          <span className="about-loading-dot" aria-hidden="true" />
          <p>Loading About...</p>
        </section>
      </main>
    );
  }

  const contentSections = [
    {
      title: 'Who I Am',
      text: about.whoIAm,
      className: 'about-card about-card-wide'
    },
    {
      title: 'Education & Teaching',
      text: about.educationTeaching,
      className: 'about-card'
    },
    {
      title: 'Technology',
      text: about.technology,
      className: 'about-card'
    },
    {
      title: 'Community & Leadership',
      text: about.communityLeadership,
      className: 'about-card'
    },
    {
      title: 'Innovation',
      text: about.innovation,
      className: 'about-card'
    }
  ];

  return (
    <main className="about-page page">
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="eyebrow">About Me</span>

          <h1>{about.name}</h1>

          <p className="about-role">{about.role}</p>

          <p className="about-intro">{about.intro}</p>
        </div>
      </section>

      <section className="about-content" aria-label="About information">
        <div className="about-section-grid">
          {contentSections.map(
            (section) =>
              section.text && (
                <article
                  key={section.title}
                  className={section.className}
                >
                  <div className="about-card-accent" aria-hidden="true" />
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </article>
              )
          )}
        </div>

        {about.approach && (
          <article className="about-approach glass">
            <div className="about-approach-heading">
              <span className="about-number">01</span>

              <div>
                <span className="eyebrow">My Philosophy</span>
                <h2>My Approach</h2>
              </div>
            </div>

            <p>{about.approach}</p>
          </article>
        )}

        {about.facts.length > 0 && (
          <section className="about-facts-section">
            <div className="about-subheading">
              <span className="eyebrow">At a Glance</span>
              <h2>Key Facts</h2>
            </div>

            <div className="about-facts">
              {about.facts.map((fact, index) => (
                <div
                  className="about-fact glass"
                  key={`${fact}-${index}`}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{fact}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="about-cta glass">
          <div>
            <span className="eyebrow">Explore My Work</span>

            <h2>Ideas are meant to become useful solutions.</h2>

            <p>
              Explore the projects I have built and the experience behind
              them.
            </p>
          </div>

          <div className="about-cta-actions">
            <Link className="btn primary" to="/projects">
              View Projects
            </Link>

            <Link className="btn secondary" to="/resume">
              View Resume
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}