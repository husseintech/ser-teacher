export type ActionState = {
  ok: boolean;
  message: string;
  email?: string;
  developmentCode?: string | null;
};

export const initialActionState: ActionState = { ok: false, message: "" };
