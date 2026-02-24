import React from 'react';
import '../styles/Terms.css';

function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-header">
        <h1>⚖️ Terms & Guidelines</h1>
      </div>

      <div className="terms-container">
        <section className="terms-section">
          <h2>1. Introduction</h2>
          <p>
            Valiant Picks is an independent virtual betting platform designed for entertainment purposes. 
            By using this platform, you agree to these Terms of Service and our commitment to responsible use.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Eligibility</h2>
          <p>
            Users must be at least 13 years old to create an account. Parents or guardians of users under 18 
            are responsible for supervising their child's use of the platform. No real money is involved—all bets 
            use virtual Valiant Bucks.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Virtual Currency</h2>
          <p>
            Valiant Bucks are virtual currency with no real monetary value. They cannot be exchanged for cash, 
            transferred outside the platform, or used for any transaction outside of Valiant Picks. All balances 
            are subject to platform management and may be reset or adjusted.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. User Accounts & Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to use 
            your account only for lawful purposes and in accordance with these Terms. Any unauthorized access or use 
            of your account should be reported immediately.
          </p>
          <p>
            <strong>Security Commitment:</strong> Valiant Picks uses industry-standard encryption to protect your password 
            and personal data. Passwords are securely hashed and cannot be accessed by anyone, including the platform 
            administrator or creator. The platform employs multiple security measures to prevent unauthorized access and 
            ensure your data remains private and protected.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Betting Rules</h2>
          <p>
            All bets must be placed before the game begins. Once a game concludes, the system will automatically 
            calculate results. Admin users reserve the right to manually resolve bets if necessary due to disputed 
            outcomes. Bets cannot be refunded or reversed except in cases of administrative error.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Platform Purpose & Intent</h2>
          <p>
            Valiant Picks is created purely for entertainment and community engagement. The platform has absolutely 
            <strong> zero intentions of causing harm, making fun of anyone, or being disrespectful in any way</strong>. 
            This is a fun, inclusive space designed to bring our community together and increase engagement with sports.
          </p>
          <p>
            The platform celebrates athletes, teams, and the joy of sports. Any use of the platform for mockery, 
            bullying, or harmful purposes is strictly prohibited and may result in immediate account termination.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Conduct & Restrictions</h2>
          <p>
            Users agree not to:
          </p>
          <ul>
            <li>Harass, abuse, or disrespect other users or individuals</li>
            <li>Make fun of, mock, or target any person or group</li>
            <li>Attempt to gain unauthorized access to the platform</li>
            <li>Use the platform for commercial purposes without permission</li>
            <li>Post illegal, defamatory, hateful, or offensive content</li>
            <li>Manipulate game results or engage in fraudulent activity</li>
            <li>Violate any local, state, or federal laws</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. No Affiliation</h2>
          <p>
            Valiant Picks is an independent platform and is <strong>not affiliated with, endorsed by, or associated with 
            Valley Catholic, SSMO, any school, organization, or any other institution</strong>. The platform is created for 
            entertainment and community engagement purposes only and operates independently.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Data Privacy & Protection</h2>
          <p>
            Your personal data is protected with industry-standard security measures. We do not sell, share, or distribute 
            your information to third parties. Your data is used solely to operate and improve the platform. You have the 
            right to request information about your data or request account deletion at any time.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Limitation of Liability</h2>
          <p>
            Valiant Picks is provided "as is" without warranties. We are not liable for technical issues, data loss, 
            interruptions, or any indirect damages. Use the platform at your own risk.
          </p>
        </section>

        <section className="terms-section">
          <h2>11. Changes to Terms</h2>
          <p>
            We may update these Terms of Service at any time. Continued use of the platform constitutes acceptance 
            of the updated Terms. We recommend reviewing this page periodically.
          </p>
        </section>

        <section className="terms-section">
          <h2>12. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful behavior. 
            Accounts may also be removed for inactivity or at the user's request.
          </p>
        </section>

        <section className="terms-section final-section">
          <h2>Questions?</h2>
          <p>
            If you have questions about these Terms, please reach out directly. We're committed to maintaining a 
            safe, enjoyable platform for everyone.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Terms;
