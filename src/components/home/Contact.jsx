export default function Contact() {
  return (
    <section
      className="glass"
      style={{
        marginTop: "60px",
        padding: "40px",
        textAlign: "center"
      }}
    >
      <h2>Let's Build Something</h2>

      <p
        style={{
          opacity: 0.75,
          maxWidth: "700px",
          margin: "20px auto"
        }}
      >
        Interested in collaboration, projects,
        opportunities, or just saying hello?
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          flexWrap: "wrap"
        }}
      >
        <button className="btn">
          Email Me
        </button>

        <button className="btn">
          View GitHub
        </button>
      </div>
    </section>
  );
}