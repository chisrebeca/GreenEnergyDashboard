export const number = (value: number) => new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 }).format(value);
export const date = (value: string) => new Date(value).toLocaleString("ro-RO");
export const allowedLocation = (selectedLocation: string, id: number) => selectedLocation === "all" || id === Number(selectedLocation);
