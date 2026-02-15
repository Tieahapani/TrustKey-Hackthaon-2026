import { motion } from "framer-motion";
import { ArrowLeft, Linkedin, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const teamMembers = [
  { name: "Tiea Hapani", linkedin: "https://www.linkedin.com/in/tiea-hapani-1849ba283/" },
  { name: "Princy Ramani", linkedin: "https://www.linkedin.com/in/princy-ramani" },
  { name: "Abhishek Rangani", linkedin: "https://www.linkedin.com/in/abhishek-rangani/" },
  { name: "Ayush Rangrej", linkedin: "https://www.linkedin.com/in/ayush-rangrej/" },
];

export default function About() {
  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Info className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            About TrustKey
          </h1>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          AI-powered housing marketplace built for CRS.
        </p>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8"
        >
          <Card className="border-border/60 card-shadow">
            <CardContent className="p-6">
              <p className="text-base leading-relaxed text-muted-foreground">
                TrustKey for CRS is an AI-powered housing marketplace designed to
                revolutionize the rental and real estate experience. With instant
                credit screening, smart property assistants, and a seamless search
                experience, TrustKey connects buyers and sellers through a trusted,
                transparent platform — making finding your perfect home effortless
                and secure.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8"
        >
          <h2 className="font-display text-xl font-semibold text-foreground">
            Built by
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
              >
                <Card className="border-border/60 card-shadow hover:border-primary/20 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium text-foreground">
                      {member.name}
                    </span>
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
