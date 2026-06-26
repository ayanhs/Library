import type { StoryBibleData } from "@/lib/story-bible/types";

export function formatStoryBibleForPrompt(data: StoryBibleData): string {
  const sections: string[] = [];

  if (data.characters.length > 0) {
    const lines = data.characters.map((c) => {
      const parts = [
        c.name && `Name: ${c.name}`,
        c.age && `Age: ${c.age}`,
        c.personality && `Personality: ${c.personality}`,
        c.appearance && `Appearance: ${c.appearance}`,
        c.goals && `Goals: ${c.goals}`,
        c.fears && `Fears: ${c.fears}`,
        c.relationships && `Relationships: ${c.relationships}`,
      ].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    });
    sections.push(`CHARACTERS:\n${lines.join("\n")}`);
  }

  if (data.locations.length > 0) {
    const lines = data.locations.map(
      (l) =>
        `- ${l.name}: ${l.description}${l.importance ? ` (Importance: ${l.importance})` : ""}`
    );
    sections.push(`LOCATIONS:\n${lines.join("\n")}`);
  }

  if (data.worldRules.length > 0) {
    const lines = data.worldRules.map(
      (r) => `- [${r.category}] ${r.rule}`
    );
    sections.push(`WORLD RULES:\n${lines.join("\n")}`);
  }

  if (data.timelineEvents.length > 0) {
    const lines = data.timelineEvents.map(
      (e) => `${e.event_order}. ${e.title}: ${e.description}`
    );
    sections.push(`TIMELINE (chronological):\n${lines.join("\n")}`);
  }

  if (sections.length === 0) {
    return "No Story Bible entries yet.";
  }

  return sections.join("\n\n");
}
