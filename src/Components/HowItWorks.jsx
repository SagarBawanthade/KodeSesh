import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import './HowItWorks.css';

const HowItWorks = () => {
  const [visibleSteps, setVisibleSteps] = useState([false, false, false, false, false]);

  const steps = [
    {
      number: 1,
      title: 'Sign Up',
      description: 'Create an account to get started. It’s quick and easy!',
    },
    {
      number: 2,
      title: 'Set Up Your Profile',
      description: 'Add your details and preferences to personalize your experience.',
    },
    {
      number: 3,
      title: 'Explore Features',
      description: 'Discover all the tools and features available to you.',
    },
    {
      number: 4,
      title: 'Start Using',
      description: 'Begin using the platform to achieve your goals.',
    },
    {
      number: 5,
      title: 'Get Results',
      description: 'See the benefits and results of using our platform.',
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