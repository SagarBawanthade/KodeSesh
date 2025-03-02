import React, { useState, useEffect } from 'react';

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "John Doe",
      role: "Developer",
      content: "This product has transformed our business operations. The efficiency gains have been remarkable, and our team couldn't be happier.",
      image: "/images/Test01.jpg" // Placeholder image URL
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "Full Stack developer",
      content: "The level of customer support we've received has been exceptional. Every interaction has been prompt and professional.",
      image: "/images/Test02.jpg" // Placeholder image URL
    },
    {
      id: 3,
      name: "Mike Johnson",
      role: "Lead Developer",
      content: "The integration process was seamless. The documentation was clear, and we were up and running in no time.",
      image: "/images/Test03.jpg" // Placeholder image URL
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const getCardPosition = (index) => {
    const position = (index - currentIndex + testimonials.length) % testimonials.length;
    if (position === 0) return 'left-0';
    if (position === 1) return 'left-1/3';
    return 'left-2/3';
  };

  const getCardStyle = (index) => {
    const position = (index - currentIndex + testimonials.length) % testimonials.length;
    const isCentered = position === 1;
    
    return `
      absolute w-80 p-6 rounded-lg shadow-lg bg-slate-950
      transition-all duration-500 ease-in-out
      ${isCentered ? 'border-2 border-cyan-400 shadow-cyan-400/50 z-20 scale-105' : 'border-2 border-gray-200 z-10'}
    `;
  };

  return (
    <div className="flex flex-col items-center h-60vh bg-black py-12 ">
      <h1 className="text-4xl font-bold mb-16 bg-gradient-to-r from-cyan-500 to-white bg-clip-text text-transparent">
        What Our Clients Say
      </h1>
      
      <div className="relative w-full max-w-5xl h-96 ">
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className={`${getCardStyle(index)} ${getCardPosition(index)}`}
          >
            {/* Circular Image */}
            <div className="flex justify-center -mt-16 mb-4">
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            </div>
            <p className="text-white mb-4">{testimonial.content}</p>
            <div className="mt-4">
              <p className="font-semibold text-white">{testimonial.name}</p>
              <p className="text-gray-300 text-sm">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsCarousel;