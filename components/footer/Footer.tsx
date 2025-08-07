import { SiDiscord, SiGithub, SiX } from "@icons-pack/react-simple-icons";
import Image from "next/image";

const footerLinks = [
  { name: "About", href: "#" },
  { name: "Help", href: "#" },
  { name: "Developers", href: "#" },
  { name: "Privacy", href: "#" },
  { name: "Terms", href: "#" },
];

const socialLinks = [
  {
    name: "Twitter",
    href: "#",
    icon: <SiX size={18} />,
  },
  {
    name: "Discord",
    href: "#",
    icon: <SiDiscord size={18} />,
  },
  {
    name: "GitHub",
    href: "#",
    icon: <SiGithub size={18} />,
  },
];

export function Footer() {
  return (
    <footer className="w-full border-t bg-white px-4 md:px-8 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        {/* Left: Logo and Brand */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <Image
            src="/chains-icons/canopy-logo.svg"
            alt="Canopy Swap Logo"
            width={28}
            height={28}
            className="rounded-full"
            priority
          />
          <span className="font-semibold text-base tracking-tight text-gray-900">
            Canopy Swap
          </span>
        </div>
        {/* Center: Footer Links */}
        <nav className="flex gap-4 flex-wrap justify-center text-sm text-muted-foreground">
          {footerLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-black transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>
        {/* Right: Social Icons */}
        <div className="flex items-center gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              aria-label={social.name}
              className="text-muted-foreground hover:text-black transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>
      {/* Bottom: Copyright */}
      <div className="text-xs text-muted-foreground text-center mt-2">
        © 2025 Canopy Protocol. All rights reserved.
      </div>
    </footer>
  );
}
