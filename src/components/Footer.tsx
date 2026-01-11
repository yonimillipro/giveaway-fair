import { useNavigate } from "react-router-dom";
import { Gift, Twitter, Instagram, Facebook, Mail, Send, Users } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  const footerLinks = {
    product: [
      { name: "Giveaways", href: "/" },
      { name: "Promotions", href: "/promotions" },
      { name: "How it Works", href: "/how-it-works" },
      { name: "FAQ", href: "/faq" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Careers", href: "/careers" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  return (
    <footer className="w-full border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 mb-4"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary">
                <Gift className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">GiveawayHub</span>
            </button>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Join exciting giveaways from top brands. Enter for free and win
              incredible prizes!
            </p>
            {/* Social Links */}
            <div className="flex gap-2 mb-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Telegram Community Banner */}
            <a
              href="https://t.me/GiveawayHubCommunity"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(200,80%,50%)]/10 hover:bg-[hsl(200,80%,50%)]/20 border border-[hsl(200,80%,50%)]/20 hover:border-[hsl(200,80%,50%)]/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(200,80%,50%)] text-white group-hover:scale-110 transition-transform">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground group-hover:text-[hsl(200,80%,45%)] transition-colors">
                  Join Our Community
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  Connect on Telegram
                </span>
              </div>
            </a>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      if (link.href !== "#") {
                        e.preventDefault();
                        navigate(link.href);
                      }
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.href);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.href);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GiveawayHub. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for giveaway enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
