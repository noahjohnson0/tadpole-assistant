export interface TrackedActivity {
  id: string;
  name: string;
  active: boolean;
  keywords?: string[]; // Keywords to listen for (e.g., ["pushup", "push-ups", "push ups"])
}

export interface TrackedActivityData {
  name: string;
  active: boolean;
  keywords?: string[];
}
