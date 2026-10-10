
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Button from "../components/Button";
import FeatureCard from "../components/FeatureCard";
import DashboardPreview from "../components/DashboardPreveiw";
import Footer from "../components/Footer";

const features = [
  {
    icon: BrainCircuit,
    number: "01",
    title: "Machine learning predictions",
    description:
      "Estimate student performance from academic and behavioral indicators using your trained ML model.",
  },
  {
    icon: Target,
    number: "02",
    title: "Early-warning indicators",
    description:
      "Highlight potentially at-risk predictions so educators can identify students who may need support.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "03",
    title: "Clear analytics",
    description:
      "Turn submitted predictions into understandable summaries, charts, and performance trends.",
  },
];

const steps = [
  {
    number: "01",
    title: "Enter student details",
    description:
      "Provide the available academic and behavioral information.",
  },
  {
    number: "02",
    title: "Generate a prediction",
    description:
      "Your trained machine-learning model estimates the final grade.",
  },
  {
    number: "03",
    title: "Explore insights",
    description:
      "Review the prediction and use the dashboard to explore trends.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="announcement">
                <span className="announcement-icon">
                  <Sparkles size={14} />
                </span>
                <span>Smarter insights. Better learning.</span>
                <ArrowRight size={14} />
              </div>

              <h1>
                See potential.
                <br />
                <span>Support progress.</span>
              </h1>

              <p className="hero-description">
                Use machine learning to understand student performance,
                identify potential risks, and make more informed
                educational decisions.
              </p>

              <div className="hero-actions">
                <Button href="/signup">
                  Explore the platform
                </Button>
                <Button href="#how-it-works" variant="secondary">
                  See how it works
                </Button>
              </div>

              <div className="hero-note">
                <ShieldCheck size={17} />
                <span>Built for data-informed educational support</span>
              </div>
            </div>

            <div className="hero-visual">
              <DashboardPreview />
            </div>
          </div>

          <div className="hero-bottom container">
            <span>ONE PLATFORM</span>
            <div className="hero-bottom-line" />
            <span>PREDICTIONS · INSIGHTS · PROGRESS</span>
          </div>
        </section>

        <section className="features-section section-padding" id="features">
          <div className="container">
            <div className="section-heading">
              <span className="section-label">WHAT YOU CAN DO</span>
              <h2>
                Turn student data into
                <br className="desktop-break" /> meaningful insights.
              </h2>
              <p>
                A practical machine-learning tool designed to make
                performance patterns easier to understand.
              </p>
            </div>

            <div className="features-grid">
              {features.map((feature) => (
                <FeatureCard key={feature.number} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section
          className="workflow-section section-padding"
          id="how-it-works"
        >
          <div className="container workflow-grid">
            <div className="workflow-intro">
              <span className="section-label">HOW IT WORKS</span>
              <h2>
                From student details
                <br /> to actionable insights.
              </h2>
              <p>
                A straightforward workflow connects your input form,
                trained model, and analytics interface.
              </p>

              <Button href="/signup">
                Get started <ArrowRight size={17} />
              </Button>
            </div>

            <div className="steps-list">
              {steps.map((step) => (
                <article className="step-item" key={step.number}>
                  <span className="step-number">{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  <ArrowRight className="step-arrow" size={19} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section section-padding" id="about">
          <div className="container">
            <div className="cta-card">
              <div className="cta-icon">
                <Sparkles size={24} />
              </div>
              <h2>
                Better understanding starts
                <br className="desktop-break" /> with better insights.
              </h2>
              <p>
                Explore a practical application of machine learning
                in student performance analysis.
              </p>
              <Button href="/signup">
                Get started <ArrowRight size={17} />
              </Button>
              <span className="cta-decoration decoration-one" />
              <span className="cta-decoration decoration-two" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}