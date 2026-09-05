import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
    }, 5000);

    event.target.reset();
  }

  return (
    <main className="contact-page page">
      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="eyebrow">Get In Touch</span>

          <h1>Let's Connect</h1>

          <p className="contact-intro">
            Have an idea, a project, a collaboration opportunity, or simply
            want to start a conversation? I'd be glad to hear from you.
          </p>
        </div>
      </section>

      <section className="contact-content">
        <div className="contact-grid">

          <div className="contact-info">
            <div className="contact-section-heading">
              <span className="eyebrow">Reach Out</span>

              <h2>Let's start a conversation.</h2>

              <p>
                I am interested in meaningful conversations around education,
                technology, data, innovation, leadership, and practical
                digital solutions.
              </p>
            </div>

            <div className="contact-cards">

              <a
                href="https://github.com/alwaliamshi"
                target="_blank"
                rel="noreferrer"
                className="contact-card glass"
              >
                <div className="contact-card-icon">
                  <svg
                    width="22"
                    height="22"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>

                <div>
                  <span>GitHub</span>
                  <strong>View my projects</strong>
                </div>

                <span className="contact-card-arrow">↗</span>
              </a>

              <div className="contact-card glass">
                <div className="contact-card-icon">
                  <span aria-hidden="true">✉</span>
                </div>

                <div>
                  <span>Email</span>
                  <strong>Use the message form</strong>
                </div>

                <span className="contact-card-arrow">→</span>
              </div>

              <div className="contact-card glass">
                <div className="contact-card-icon">
                  <span aria-hidden="true">◎</span>
                </div>

                <div>
                  <span>Professional Network</span>
                  <strong>Let's connect professionally</strong>
                </div>

                <span className="contact-card-arrow">→</span>
              </div>

            </div>
          </div>

          <div className="contact-form-wrapper glass">

            <div className="contact-form-heading">
              <span className="eyebrow">Send A Message</span>

              <h2>Tell me what you're building.</h2>

              <p>
                Share a little about your idea, question, or opportunity.
              </p>
            </div>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >

              <div className="contact-form-row">

                <div className="contact-field">
                  <label htmlFor="contact-name">
                    Your Name
                  </label>

                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-email">
                    Email Address
                  </label>

                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>

              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">
                  Subject
                </label>

                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder="What would you like to discuss?"
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-message">
                  Message
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows="7"
                  placeholder="Tell me a little about it..."
                  required
                />
              </div>

              <button
                type="submit"
                className="btn primary contact-submit"
              >
                Send Message <span>→</span>
              </button>

              {submitted && (
                <div
                  className="contact-success"
                  role="status"
                >
                  <strong>Message received.</strong>

                  <span>
                    Your message has been captured successfully.
                  </span>
                </div>
              )}

            </form>
          </div>

        </div>

        <section className="contact-cta glass">

          <div>
            <span className="eyebrow">Keep Exploring</span>

            <h2>
              Let's turn ideas into useful solutions.
            </h2>

            <p>
              Explore the work, experience, and ideas behind the portfolio.
            </p>
          </div>

          <div className="contact-cta-actions">

            <Link
              className="btn primary"
              to="/projects"
            >
              View Projects
            </Link>

            <Link
              className="btn secondary"
              to="/about"
            >
              About Me
            </Link>

          </div>

        </section>

      </section>
    </main>
  );
}