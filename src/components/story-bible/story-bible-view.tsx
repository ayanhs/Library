"use client";

import {
  Clock,
  Globe,
  MapPin,
  RefreshCw,
  ScrollText,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import { BookFormInput } from "@/components/books/form-fields";
import { BibleEntryCard } from "@/components/story-bible/bible-entry-card";
import { BibleSection } from "@/components/story-bible/bible-section";
import { StoryBibleLoading } from "@/components/story-bible/story-bible-loading";
import {
  deleteCharacter,
  deleteLocation,
  deleteTimelineEvent,
  deleteWorldRule,
  generateStoryBible,
  saveCharacter,
  saveLocation,
  saveTimelineEvent,
  saveWorldRule,
} from "@/lib/story-bible/actions";
import type {
  StoryBibleCharacter,
  StoryBibleData,
  StoryBibleLocation,
  StoryBibleTimelineEvent,
  StoryBibleWorldRule,
} from "@/lib/story-bible/types";
import { cn } from "@/lib/utils";

interface StoryBibleViewProps {
  bookId: string;
  initialData: StoryBibleData;
  hasBlueprint: boolean;
}

const SAVE_DELAY_MS = 600;

export function StoryBibleView({
  bookId,
  initialData,
  hasBlueprint,
}: StoryBibleViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const markSaving = (id: string, saving: boolean) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (saving) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const debouncedSave = useCallback(
    (key: string, saveFn: () => Promise<void>) => {
      const existing = saveTimers.current.get(key);
      if (existing) clearTimeout(existing);
      saveTimers.current.set(
        key,
        setTimeout(async () => {
          markSaving(key, true);
          try {
            await saveFn();
          } finally {
            markSaving(key, false);
          }
        }, SAVE_DELAY_MS)
      );
    },
    []
  );

  const handleGenerate = () => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await generateStoryBible(bookId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setData(result.data!.storyBible);
      setSuccess("Story Bible generated and saved.");
      router.refresh();
    });
  };

  const updateCharacter = (id: string, patch: Partial<StoryBibleCharacter>) => {
    setData((prev) => {
      const characters = prev.characters.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      const character = characters.find((c) => c.id === id)!;
      debouncedSave(`char-${id}`, async () => {
        const result = await saveCharacter(bookId, character);
        if (result.success) {
          setData((p) => ({
            ...p,
            characters: p.characters.map((c) =>
              c.id === id ? result.data!.character : c
            ),
          }));
        }
      });
      return { ...prev, characters };
    });
  };

  const addCharacter = async () => {
    markSaving("new-char", true);
    const result = await saveCharacter(bookId, { name: "New Character" });
    markSaving("new-char", false);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        characters: [...prev.characters, result.data!.character],
      }));
    } else {
      setError(result.message);
    }
  };

  const removeCharacter = async (id: string) => {
    const result = await deleteCharacter(bookId, id);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        characters: prev.characters.filter((c) => c.id !== id),
      }));
    }
  };

  const updateLocation = (id: string, patch: Partial<StoryBibleLocation>) => {
    setData((prev) => {
      const locations = prev.locations.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      );
      const location = locations.find((l) => l.id === id)!;
      debouncedSave(`loc-${id}`, async () => {
        const result = await saveLocation(bookId, location);
        if (result.success) {
          setData((p) => ({
            ...p,
            locations: p.locations.map((l) =>
              l.id === id ? result.data!.location : l
            ),
          }));
        }
      });
      return { ...prev, locations };
    });
  };

  const addLocation = async () => {
    markSaving("new-loc", true);
    const result = await saveLocation(bookId, { name: "New Location" });
    markSaving("new-loc", false);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        locations: [...prev.locations, result.data!.location],
      }));
    } else {
      setError(result.message);
    }
  };

  const removeLocation = async (id: string) => {
    const result = await deleteLocation(bookId, id);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        locations: prev.locations.filter((l) => l.id !== id),
      }));
    }
  };

  const updateWorldRule = (id: string, patch: Partial<StoryBibleWorldRule>) => {
    setData((prev) => {
      const worldRules = prev.worldRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      );
      const worldRule = worldRules.find((r) => r.id === id)!;
      debouncedSave(`rule-${id}`, async () => {
        const result = await saveWorldRule(bookId, worldRule);
        if (result.success) {
          setData((p) => ({
            ...p,
            worldRules: p.worldRules.map((r) =>
              r.id === id ? result.data!.worldRule : r
            ),
          }));
        }
      });
      return { ...prev, worldRules };
    });
  };

  const addWorldRule = async () => {
    markSaving("new-rule", true);
    const result = await saveWorldRule(bookId, {
      category: "Society",
      rule: "",
    });
    markSaving("new-rule", false);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        worldRules: [...prev.worldRules, result.data!.worldRule],
      }));
    } else {
      setError(result.message);
    }
  };

  const removeWorldRule = async (id: string) => {
    const result = await deleteWorldRule(bookId, id);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        worldRules: prev.worldRules.filter((r) => r.id !== id),
      }));
    }
  };

  const updateTimelineEvent = (
    id: string,
    patch: Partial<StoryBibleTimelineEvent>
  ) => {
    setData((prev) => {
      const timelineEvents = prev.timelineEvents.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      );
      const event = timelineEvents.find((e) => e.id === id)!;
      debouncedSave(`event-${id}`, async () => {
        const result = await saveTimelineEvent(bookId, event);
        if (result.success) {
          setData((p) => ({
            ...p,
            timelineEvents: p.timelineEvents.map((e) =>
              e.id === id ? result.data!.timelineEvent : e
            ),
          }));
        }
      });
      return { ...prev, timelineEvents };
    });
  };

  const addTimelineEvent = async () => {
    const order =
      data.timelineEvents.length > 0
        ? Math.max(...data.timelineEvents.map((e) => e.event_order)) + 1
        : 1;
    markSaving("new-event", true);
    const result = await saveTimelineEvent(bookId, {
      title: "New Event",
      description: "",
      event_order: order,
    });
    markSaving("new-event", false);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        timelineEvents: [...prev.timelineEvents, result.data!.timelineEvent],
      }));
    } else {
      setError(result.message);
    }
  };

  const removeTimelineEvent = async (id: string) => {
    const result = await deleteTimelineEvent(bookId, id);
    if (result.success) {
      setData((prev) => ({
        ...prev,
        timelineEvents: prev.timelineEvents.filter((e) => e.id !== id),
      }));
    }
  };

  const isEmpty =
    data.characters.length === 0 &&
    data.locations.length === 0 &&
    data.worldRules.length === 0 &&
    data.timelineEvents.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Story Bible</h1>
          <p className="mt-1 text-sm text-muted">
            Permanent memory for your book — used automatically when writing
            chapters.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || !hasBlueprint}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
            "bg-gradient-to-r from-purple to-blue hover:shadow-lg hover:shadow-purple/25",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Story Bible
        </button>
      </div>

      {!hasBlueprint && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Generate a story blueprint on the Project tab first — the AI uses it
          to build your Story Bible.
        </div>
      )}

      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <BookFormInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search characters, locations, rules, events…"
          className="pl-10"
        />
      </div>

      {isPending && <StoryBibleLoading />}

      {!isPending && isEmpty && (
        <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
          <ScrollText className="mx-auto mb-3 h-10 w-10 text-muted/40" />
          <p className="font-medium text-foreground/80">No Story Bible yet</p>
          <p className="mt-1 text-sm text-muted">
            Generate from your blueprint or add entries manually.
          </p>
        </div>
      )}

      {!isPending && !isEmpty && (
        <div className="space-y-4">
          <BibleSection
            title="Characters"
            icon={<Users className="h-4 w-4" />}
            count={data.characters.length}
            onAdd={addCharacter}
            addLabel="Add character"
          >
            {data.characters.map((c) => (
              <BibleEntryCard
                key={c.id}
                title={c.name || "Untitled character"}
                subtitle={c.personality}
                searchQuery={search}
                isSaving={savingIds.has(`char-${c.id}`)}
                isNew={false}
                fields={[
                  { key: "name", label: "Name", placeholder: "Character name" },
                  { key: "age", label: "Age", placeholder: "e.g. 28" },
                  {
                    key: "personality",
                    label: "Personality",
                    type: "textarea",
                  },
                  {
                    key: "appearance",
                    label: "Appearance",
                    type: "textarea",
                  },
                  { key: "goals", label: "Goals", type: "textarea" },
                  { key: "fears", label: "Fears", type: "textarea" },
                  {
                    key: "relationships",
                    label: "Relationships",
                    type: "textarea",
                  },
                ]}
                values={{
                  name: c.name,
                  age: c.age,
                  personality: c.personality,
                  appearance: c.appearance,
                  goals: c.goals,
                  fears: c.fears,
                  relationships: c.relationships,
                }}
                onChange={(key, value) =>
                  updateCharacter(c.id, { [key]: value })
                }
                onDelete={() => removeCharacter(c.id)}
                onSave={() => {}}
              />
            ))}
          </BibleSection>

          <BibleSection
            title="Locations"
            icon={<MapPin className="h-4 w-4" />}
            count={data.locations.length}
            onAdd={addLocation}
            addLabel="Add location"
          >
            {data.locations.map((l) => (
              <BibleEntryCard
                key={l.id}
                title={l.name || "Untitled location"}
                subtitle={l.importance}
                searchQuery={search}
                isSaving={savingIds.has(`loc-${l.id}`)}
                isNew={false}
                fields={[
                  { key: "name", label: "Name" },
                  { key: "description", label: "Description", type: "textarea" },
                  { key: "importance", label: "Importance", type: "textarea" },
                ]}
                values={{
                  name: l.name,
                  description: l.description,
                  importance: l.importance,
                }}
                onChange={(key, value) =>
                  updateLocation(l.id, { [key]: value })
                }
                onDelete={() => removeLocation(l.id)}
                onSave={() => {}}
              />
            ))}
          </BibleSection>

          <BibleSection
            title="World Rules"
            icon={<Globe className="h-4 w-4" />}
            count={data.worldRules.length}
            onAdd={addWorldRule}
            addLabel="Add world rule"
          >
            {data.worldRules.map((r) => (
              <BibleEntryCard
                key={r.id}
                title={r.category || "Rule"}
                subtitle={r.rule}
                searchQuery={search}
                isSaving={savingIds.has(`rule-${r.id}`)}
                isNew={false}
                fields={[
                  {
                    key: "category",
                    label: "Category",
                    placeholder: "Magic, Technology, Society…",
                  },
                  { key: "rule", label: "Rule", type: "textarea" },
                ]}
                values={{ category: r.category, rule: r.rule }}
                onChange={(key, value) =>
                  updateWorldRule(r.id, { [key]: value })
                }
                onDelete={() => removeWorldRule(r.id)}
                onSave={() => {}}
              />
            ))}
          </BibleSection>

          <BibleSection
            title="Timeline"
            icon={<Clock className="h-4 w-4" />}
            count={data.timelineEvents.length}
            onAdd={addTimelineEvent}
            addLabel="Add timeline event"
          >
            {[...data.timelineEvents]
              .sort((a, b) => a.event_order - b.event_order)
              .map((e) => (
                <BibleEntryCard
                  key={e.id}
                  title={`${e.event_order}. ${e.title || "Untitled event"}`}
                  subtitle={e.description}
                  searchQuery={search}
                  isSaving={savingIds.has(`event-${e.id}`)}
                  isNew={false}
                  fields={[
                    { key: "title", label: "Title" },
                    { key: "description", label: "Description", type: "textarea" },
                    { key: "event_order", label: "Order", type: "number" },
                  ]}
                  values={{
                    title: e.title,
                    description: e.description,
                    event_order: e.event_order,
                  }}
                  onChange={(key, value) =>
                    updateTimelineEvent(e.id, { [key]: value })
                  }
                  onDelete={() => removeTimelineEvent(e.id)}
                  onSave={() => {}}
                />
              ))}
          </BibleSection>
        </div>
      )}
    </div>
  );
}
