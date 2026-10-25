export const estadoCivilOptions = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión civil"] as const;

export const estadoCivilToApi: Record<string, "single" | "married" | "divorced" | "widowed" | "civil_union"> = {
  "Soltero/a": "single",
  "Casado/a": "married",
  "Divorciado/a": "divorced",
  "Viudo/a": "widowed",
  "Unión civil": "civil_union",
};

export const estadoCivilFromApi: Record<string, string> = {
  single: "Soltero/a",
  married: "Casado/a",
  divorced: "Divorciado/a",
  widowed: "Viudo/a",
  civil_union: "Unión civil",
};
