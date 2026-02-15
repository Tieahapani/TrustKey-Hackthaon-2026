import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const teamMembers = [
  { name: "Tiea Hapani", linkedin: "https://www.linkedin.com/in/tiea-hapani-1849ba283/" },
  { name: "Princy Ramani", linkedin: "https://www.linkedin.com/in/princy-ramani" },
  { name: "Abhishek Rangani", linkedin: "https://www.linkedin.com/in/abhishek-rangani/" },
  { name: "Ayush Rangrej", linkedin: "https://www.linkedin.com/in/ayush-rangrej/" },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20" style={{ background: "linear-gradient(135deg, hsla(270, 65%, 50%, 0.08), hsla(320, 60%, 55%, 0.06), hsla(30, 85%, 60%, 0.04), hsla(0, 0%, 100%, 0.9))" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center space-y-10"
      >
        {/* Logo & Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              TrustKey <span className="text-primary">for CRS</span>
            </h1>
          </div>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg text-muted-foreground leading-relaxed"
        >
          TrustKey for CRS is an AI-powered housing marketplace designed to revolutionize the rental and real estate experience. 
          With instant credit screening, smart property assistants, and a seamless search experience, 
          TrustKey connects buyers and sellers through a trusted, transparent platform — making finding your perfect home effortless and secure.
        </motion.p>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-6"
        >
          <h2 className="font-display text-2xl font-semibold text-foreground">Built by</h2>
          <div className="grid grid-cols-2 gap-4">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className="rounded-xl border border-primary/15 bg-card/80 backdrop-blur-sm p-4 shadow-sm"
              >
                {member.linkedin ? (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{member.name}</a>
                ) : (
                  <p className="font-medium text-foreground">{member.name}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
