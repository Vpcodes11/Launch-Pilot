import Link from "next/link";
import { Rocket, Heart, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/50 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">LaunchPilot</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automated launch preparation and human-powered distribution for bootstrappers and indie hackers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/submit" className="hover:text-white transition-colors">
                  Submit Product
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Founder Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link href="/#platforms" className="hover:text-white transition-colors">
                  Platforms Directory (35)
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://news.ycombinator.com/showhn.html"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Show HN Guidelines <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.producthunt.com/launch"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Product Hunt Guide <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Launch Checklist
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Indie Dev */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Indie Friendly</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Built with Next.js 14, Supabase, Tailwind, and OpenAI. Zero spam, zero fake testimonials. Genuine launches only.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span>for makers worldwide</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} LaunchPilot. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white">Privacy Policy</Link>
            <Link href="/" className="hover:text-white">Terms of Service</Link>
            <Link href="/admin" className="hover:text-white">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
