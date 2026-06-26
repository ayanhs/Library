"use client";

import { BookOpen, Drama, Layers, Plus, Trash2, TrendingUp, Users } from "lucide-react";
import { BlueprintSection } from "@/components/blueprint/blueprint-section";
import { BookFormInput, BookFormTextarea } from "@/components/books/form-fields";
import type {
  StoryBlueprint,
  SupportingCharacter,
  ChapterOutlineItem,
} from "@/lib/blueprint/types";
import { cn } from "@/lib/utils";

interface BlueprintEditorProps {
  blueprint: StoryBlueprint;
  onChange: (blueprint: StoryBlueprint) => void;
  disabled?: boolean;
}

export function BlueprintEditor({
  blueprint,
  onChange,
  disabled,
}: BlueprintEditorProps) {
  const update = (partial: Partial<StoryBlueprint>) => {
    onChange({ ...blueprint, ...partial });
  };

  const updateCharacterArc = (phase: keyof StoryBlueprint["characterArc"], value: string) => {
    onChange({
      ...blueprint,
      characterArc: { ...blueprint.characterArc, [phase]: value },
    });
  };

  const updateSupportingCharacter = (
    index: number,
    field: keyof SupportingCharacter,
    value: string
  ) => {
    const updated = [...blueprint.supportingCharacters];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...blueprint, supportingCharacters: updated });
  };

  const addSupportingCharacter = () => {
    onChange({
      ...blueprint,
      supportingCharacters: [
        ...blueprint.supportingCharacters,
        { name: "", role: "", personality: "" },
      ],
    });
  };

  const removeSupportingCharacter = (index: number) => {
    onChange({
      ...blueprint,
      supportingCharacters: blueprint.supportingCharacters.filter(
        (_, i) => i !== index
      ),
    });
  };

  const updateOutlineItem = (
    index: number,
    field: keyof ChapterOutlineItem,
    value: string | number
  ) => {
    const updated = [...blueprint.chapterOutline];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...blueprint, chapterOutline: updated });
  };

  const inputClass = cn(
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm",
    "focus:border-purple/50 focus:outline-none focus:ring-2 focus:ring-purple/20",
    disabled && "opacity-50"
  );

  return (
    <div className="space-y-5">
      <BlueprintSection title="Story Summary" icon={<BookOpen className="h-4 w-4" />}>
        <BookFormTextarea
          value={blueprint.summary}
          onChange={(e) => update({ summary: e.target.value })}
          disabled={disabled}
          className="min-h-[120px]"
        />
      </BlueprintSection>

      <BlueprintSection title="Main Conflict" icon={<Drama className="h-4 w-4" />}>
        <BookFormTextarea
          value={blueprint.conflict}
          onChange={(e) => update({ conflict: e.target.value })}
          disabled={disabled}
          className="min-h-[80px]"
        />
      </BlueprintSection>

      <BlueprintSection title="Character Arc" icon={<TrendingUp className="h-4 w-4" />}>
        <div className="space-y-3">
          {(["beginning", "middle", "ending"] as const).map((phase) => (
            <div key={phase}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-purple-light">
                {phase}
              </label>
              <BookFormTextarea
                value={blueprint.characterArc[phase]}
                onChange={(e) => updateCharacterArc(phase, e.target.value)}
                disabled={disabled}
                className="min-h-[80px]"
              />
            </div>
          ))}
        </div>
      </BlueprintSection>

      <BlueprintSection title="Supporting Characters" icon={<Users className="h-4 w-4" />}>
        <div className="space-y-3">
          {blueprint.supportingCharacters.map((char, i) => (
            <div
              key={i}
              className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex gap-2">
                <BookFormInput
                  placeholder="Name"
                  value={char.name}
                  onChange={(e) => updateSupportingCharacter(i, "name", e.target.value)}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => removeSupportingCharacter(i)}
                  disabled={disabled}
                  className="shrink-0 rounded-lg p-2 text-muted hover:bg-white/5 hover:text-red-400"
                  aria-label="Remove character"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <BookFormInput
                placeholder="Role"
                value={char.role}
                onChange={(e) => updateSupportingCharacter(i, "role", e.target.value)}
                disabled={disabled}
              />
              <BookFormTextarea
                placeholder="Personality"
                value={char.personality}
                onChange={(e) =>
                  updateSupportingCharacter(i, "personality", e.target.value)
                }
                disabled={disabled}
                className="min-h-[60px]"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addSupportingCharacter}
            disabled={disabled}
            className="inline-flex items-center gap-2 text-sm text-purple-light hover:text-purple-light/80"
          >
            <Plus className="h-4 w-4" />
            Add character
          </button>
        </div>
      </BlueprintSection>

      <BlueprintSection title="Chapter Outline" icon={<Layers className="h-4 w-4" />}>
        <div className="space-y-3">
          {blueprint.chapterOutline.map((chapter, i) => (
            <div
              key={chapter.chapterNumber}
              className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple/15 text-sm font-bold text-purple-light">
                {chapter.chapterNumber}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className={inputClass}
                  value={chapter.title}
                  onChange={(e) => updateOutlineItem(i, "title", e.target.value)}
                  disabled={disabled}
                  placeholder="Chapter title"
                />
                <textarea
                  className={cn(inputClass, "min-h-[60px] resize-y")}
                  value={chapter.summary}
                  onChange={(e) => updateOutlineItem(i, "summary", e.target.value)}
                  disabled={disabled}
                  placeholder="Chapter summary"
                />
              </div>
            </div>
          ))}
        </div>
      </BlueprintSection>
    </div>
  );
}
