export type ActionState = {
  ok: boolean;
  message: string;
  email?: string;
};

export const initialActionState: ActionState = { ok: false, message: "" };
