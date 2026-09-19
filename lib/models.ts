export interface Model {
  id: string;
  label: string;
  desc: string;
}

export interface ModelGroup {
  label: string;
  models: Model[];
}

export const MODEL_GROUPS: ModelGroup[] = [
  {
    label: "Anthropic",
    models: [
      { id: "claude-opus-4-7",   label: "Opus 4.7",       desc: "Best"     },
      { id: "claude-sonnet-4-6", label: "Sonnet 4.6",     desc: "Powerful" },
      { id: "claude-haiku-4-5",  label: "Haiku 4.5",      desc: "Fast"     },
    ],
  },
  {
    label: "Google",
    models: [
      { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro", desc: "Pro"  },
      { id: "gemini-3-flash", label: "Gemini Flash",   desc: "Fast" },
    ],
  },
  {
    label: "OpenAI",
    models: [
      { id: "gpt-5-2", label: "GPT 5.2", desc: "Latest" },
    ],
  },
  {
    label: "Azure",
    models: [
      { id: "azure-auto", label: "Azure Auto", desc: "Router" },
    ],
  },
  {
    label: "Zhipu AI",
    models: [
      { id: "glm-5.3-flash", label: "GLM-5.3-Flash", desc: "Fast multimodal" },
    ],
  },
];

export const MODELS: Model[] = MODEL_GROUPS.flatMap(g => g.models);
export type ModelId = string;

export type TextModelCredential = "kie" | "azure" | "zhipu";

export function textModelCredential(modelId: string): TextModelCredential {
  if (modelId === "azure-auto") return "azure";
  if (modelId === "glm-5.3-flash") return "zhipu";
  return "kie";
}
