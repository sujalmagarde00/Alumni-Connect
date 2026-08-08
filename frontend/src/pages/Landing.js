import { useNavigate } from 'react-router-dom';
import heroImg from "../img/college.jpeg"; 
import mentorImg from "../img/mentor.png";
import eventImg from "../img/event.png";
import opportunityImg from "../img/opportunity.png";

function Landing({ isLoggedIn }) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) navigate('/feed');
    else navigate('/register');
  };

  const handleConnect = () => {
    if (isLoggedIn) navigate('/chat');
    else navigate('/register');
  };

  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-text">
          <h1>Connect. Learn. Grow.</h1>
          <p>
            Alumni Connect bridges the gap between students and alumni
            through mentorship, events, and opportunities.
          </p>

          <div className="hero-buttons">
            <button onClick={handleGetStarted}>Get Started</button>
            
          </div>
        </div>

        <div className="hero-image">
          <div className="image-placeholder">
            <img src={heroImg} alt="Hero" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="feature-cards">
        <div className="feature-card">
          <img src={mentorImg} alt="Mentorship" />
          <h3>Mentorship</h3>
          <p>Connect with experienced alumni for career guidance.</p>
        </div>

        <div className="feature-card dark">
          <img src={eventImg} alt="Events" />
          <h3>Events</h3>
          <p>Participate in alumni-led workshops and meetups.</p>
        </div>

        <div className="feature-card light">
          <img src={opportunityImg} alt="Opportunities" />
          <h3>Opportunities</h3>
          <p>Discover jobs and internships shared by alumni.</p>
        </div>
      </section>

      {/* INFO SECTION */}
      <section className="info">
        <div className="info-text">
          <h2>Why Alumni Connect?</h2>
          <p>
            This platform helps students gain real-world insights and
            alumni give back to their institution.
          </p>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="testimonial">
        <p>
          “Alumni Connect helped me connect with seniors and find the right
          career path.”
        </p>
        <span>— Alumni Member</span>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Connect Now</h2>
        <p>Join the alumni network and grow together.</p>
        <button onClick={handleConnect}>Connect</button>
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2025 Alumni Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;
