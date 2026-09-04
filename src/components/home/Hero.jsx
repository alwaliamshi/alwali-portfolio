import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero-section" id="about" aria-label="Introduction">
      <p className="hero-eyebrow">
        SOFTWARE DEVELOPER <span className="dot">•</span> BUILDER{" "}
        <span className="dot">•</span> 3MTT FELLOW
      </p>

      <h1 className="hero-name">
        <span className="underlined-name">
          Alwali Umara Amshi
          <span className="name-underline" aria-hidden="true">
            <span className="underline-dot left-dot" />
            <span className="underline-dot right-dot" />
          </span>
        </span>
      </h1>

      <p className="hero-tagline">
        I build systems that turn ideas into functional digital products.
      </p>

      <div className="hero-actions">
        <Link className="btn primary" to="/projects">
          View Projects
        </Link>

        <Link className="btn secondary" to="/resume">
          View Resume
        </Link>
      </div>
    </section>
  );
}