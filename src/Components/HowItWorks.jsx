import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import './HowItWorks.css';

const HowItWorks = () => {
  const [visibleSteps, setVisibleSteps] = useState([false, false, false, false, false]);

  const steps = [
    {
      number: 1,
      title: 'SignIn/SignUp',
      description: 'Create your account in seconds by providing a few basic details or using your social media login. Once registered, sign in securely to unlock the full potential of our platform.',
    },
    {
      number: 2,
      title: 'Create a Session, Code Your Way',
      description: 'Begin with a session, and choose to work independently or invite collaborators. Experience real-time coding and seamless interaction through audio and video calls.',
    },
    {
      number: 3,
      title: 'Connect with Your Team',
      description: 'Stay connected with your team through high-quality audio and video calls, No matter where your team is located, audio and video calls bring everyone together, making remote collaboration as effective as working side by side.',
    },
    {
      number: 4,
      title: 'Streamlined Code Collaboration',
      description: 'Collaborators can raise pull requests to suggest code changes. The host receives a notification and reviews the request. If the changes align with the project goals, the host can approve and merge the code effortlessly.',
    },
  ];

  const { ref: lineRef, inView: lineInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <section className="how-it-works">
      <h2 className="text-5xl font-bold text-center mb-12">
      <span className="bg-gradient-to-r from-cyan-500 to-white bg-clip-text text-transparent">
              How it Works
            </span>
        </h2>
      <div className="timeline-container">
        <div
          ref={lineRef}
          className={`timeline-line ${lineInView ? 'extended' : ''}`}
        ></div>
        {steps.map((step, index) => {
          const { ref: stepRef, inView: stepInView } = useInView({
            triggerOnce: true,
            threshold: 0.5,
          });

          if (stepInView && !visibleSteps[index]) {
            setVisibleSteps((prev) => {
              const newSteps = [...prev];
              newSteps[index] = true;
              return newSteps;
            });
          }

          return (
            <div
              key={index}
              ref={stepRef}
              className={`step ${visibleSteps[index] ? 'visible' : ''}`}
            >
              <div className="step-circle">{step.number}</div>
              <div
                className={`message-box ${index % 2 === 0 ? 'left' : 'right'}`}
              >
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;