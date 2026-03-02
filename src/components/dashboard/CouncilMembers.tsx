"use client";

import { ExternalLink, Mail } from "lucide-react";

interface CouncilMember {
  name: string;
  role: "Mayor" | "Councillor";
  email: string;
}

const COUNCIL_MEMBERS: CouncilMember[] = [
  { name: "Tom Dyas", role: "Mayor", email: "tdyas@kelowna.ca" },
  { name: "Mohini Singh", role: "Councillor", email: "msingh@kelowna.ca" },
  { name: "Rick Webber", role: "Councillor", email: "rwebber@kelowna.ca" },
  { name: "Luke Stack", role: "Councillor", email: "lstack@kelowna.ca" },
  { name: "Loyal Wooldridge", role: "Councillor", email: "lwooldridge@kelowna.ca" },
  { name: "Gord Lovegrove", role: "Councillor", email: "glovegrove@kelowna.ca" },
  { name: "Charlie Hodge", role: "Councillor", email: "chodge@kelowna.ca" },
  { name: "Ron Cannan", role: "Councillor", email: "rcannan@kelowna.ca" },
];

export function CouncilMembers() {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">City Council</h3>
        <a
          href="https://www.kelowna.ca/city-hall/mayor-council"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          kelowna.ca <ExternalLink size={10} />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {COUNCIL_MEMBERS.map((member) => (
          <div
            key={member.name}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
              member.role === "Mayor"
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-[var(--surface)] border-[var(--card-border)]"
            }`}
          >
            <div>
              <p className="text-sm text-[var(--text-primary)]">{member.name}</p>
              <p
                className={`text-xs ${
                  member.role === "Mayor" ? "text-amber-400" : "text-[var(--text-secondary)]"
                }`}
              >
                {member.role}
              </p>
            </div>
            <a
              href={`mailto:${member.email}`}
              className="p-1.5 rounded-md hover:bg-[var(--card-hover)] transition-colors"
              title={member.email}
            >
              <Mail size={14} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
