export type Language = "en" | "np";

export interface Job {
  id: string;
  title: string;
  npTitle: string;
  category: string; // e.g. "delivery", "agriculture", "education", "transport", "general"
  type: string;     // e.g. "Full-time", "Part-time", "Contract"
  location: string;
  npLocation: string;
  salary: string;
  description: string;
  npDescription: string;
}

export interface EstimatorResult {
  from: string;
  to: string;
  distanceKm: number;
  estimatedFeeNpr: number;
  estimatedMinutes: number;
  formula: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface ComingSoonItem {
  emoji: string;
  name: string;
  npName: string;
  desc: string;
  npDesc: string;
  year: string;
  category: string;
}

export interface TimelineEvent {
  year: string;
  npYear: string;
  title: string;
  npTitle: string;
  desc: string;
  npDesc: string;
  dotColorClass: string;
  tags: string[];
}
