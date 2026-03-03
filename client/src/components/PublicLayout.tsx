import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Programs", href: "/programs-public" },
    { name: "Membership", href: "/membership" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-foreground">GOLF</span>
              <span className="text-2xl font-bold text-primary">VX</span>
            </div>
            <span className="hidden text-sm text-muted-foreground md:inline-block">
              Arlington Heights
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <Link href="/trial-session">
              <Button>Book Free Trial</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-4 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link href="/trial-session">
                <Button className="w-full mt-4" onClick={() => setMobileMenuOpen(false)}>
                  Book Free Trial
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-xl font-bold text-foreground">GOLF</span>
                <span className="text-xl font-bold text-primary">VX</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Arlington Heights' ultimate indoor golf playground. Swing, sip, and socialize.
              </p>
            </div>

            {/* Programs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Programs</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/trial-session" className="hover:text-primary">Free Trial Session</Link>
                </li>
                <li>
                  <Link href="/sunday-clinic" className="hover:text-primary">Sunday Clinics</Link>
                </li>
                <li>
                  <Link href="/winter-clinic" className="hover:text-primary">PBGA Winter Clinics</Link>
                </li>
                <li>
                  <Link href="/junior-camp" className="hover:text-primary">Junior Summer Camp</Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary">About Us</Link>
                </li>
                <li>
                  <Link href="/membership" className="hover:text-primary">Membership</Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">Contact</Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Arlington Heights, IL</li>
                <li>
                  <a href="https://www.instagram.com/golfvxarlingtonheights" className="hover:text-primary">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://linktr.ee/golfvx_arlingtonheights" className="hover:text-primary">
                    Linktree
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Golf VX Arlington Heights. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
