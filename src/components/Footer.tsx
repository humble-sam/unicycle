import { Link } from "react-router-dom";
import { Shield, Users, Heart, Phone, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/unicycle-logo.svg?v=2"
                alt="UniCycle"
                className="w-9 h-9 rounded-xl"
              />
              <span className="text-xl font-bold text-primary-foreground tracking-tight">
                UniCycle
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-2">
              The trusted marketplace for students. Buy and sell within your campus community.
            </p>
            <p className="text-sm text-secondary font-medium italic">
              "From One Student to Another"
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary-foreground">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/browse" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-primary-foreground">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/safety" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link to="/ambassadors" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Campus Ambassadors
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  About UniCycle
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-primary-foreground">Get in Touch</h4>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Have questions? We're here to help.
            </p>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+918726629803"
                  className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  +91 87266 29803
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/918726629803"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@unicycle.digital"
                  className="text-sm text-secondary hover:text-secondary/80 transition-colors font-medium"
                >
                  hello@unicycle.digital
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-8 flex items-center justify-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} UniCycle. All rights reserved. v4
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
