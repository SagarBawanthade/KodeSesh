import React from "react";

const Footer = () => {
  return (
    <footer
      className="w-full py-12 backdrop-blur-sm"
      style={{
        background: "linear-gradient(to right, #000000, #0f172a, #155e75)",
      }} 
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-white">
          {/* Website Name (Left) */}
          <div className="flex items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">KodeSesh</h1>
              <p className="text-sm text-gray-300 mt-6">
                Your one-stop destination to code, collaborate and connect.
              </p>
            </div>
          </div>

          {/* About Section (Middle) */}
          <div className="flex justify-center md:justify-start lg:justify-center">
            <div>
              <h2 className="text-lg font-semibold mb-4">ABOUT</h2>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-cyan-400">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-cyan-400">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-cyan-400">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-cyan-400">
                    Terms and conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-cyan-400">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Section (Right) */}
          <div className="flex justify-center md:justify-end lg:justify-end">
            <div>
              <div className="flex flex-col md:flex-row lg:flex-row items-start md:space-x-8 lg:space-x-8">
                {/* Contact Details */}
                <div className="mb-6 md:mb-0 lg:mb-0">
                  <h2 className="text-lg font-semibold mb-4">CONTACT US</h2>
                  <p className="text-gray-300">Pune, Maharashtra</p>
                  <p className="text-gray-300 mt-2">Email: contact@kodesesh.com</p>
                  <p className="text-gray-300 mt-2">Phone: +91 12345 67890</p>
                </div>

                {/* Social Media Icons (Beside Contact) */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">FOLLOW US</h2>
                  <div className="flex space-x-4">
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="https://img.icons8.com/ios-glyphs/30/ffffff/github.png"
                        alt="GitHub"
                        className="hover:opacity-75"
                      />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="https://img.icons8.com/ios-glyphs/30/ffffff/linkedin.png"
                        alt="LinkedIn"
                        className="hover:opacity-75"
                      />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="https://img.icons8.com/ios-glyphs/30/ffffff/twitter.png"
                        alt="Twitter"
                        className="hover:opacity-75"
                      />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="https://img.icons8.com/ios-glyphs/30/ffffff/instagram-new.png"
                        alt="Instagram"
                        className="hover:opacity-75"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;