import type { ClientInput } from "@/lib/clients-api";
import { sanitizeContactNumberInput } from "@/lib/contact-number-input";
import * as XLSX from "xlsx";

export type ClientImportRow = {
  rowNumber: number;
  name: string;
  email: string;
  contact: string;
  location: string;
  errors: string[];
};

export type ClientImportParseResult = {
  rows: ClientImportRow[];
  validRows: ClientInput[];
  errorCount: number;
};

const HEADER_ALIASES: Record<string, keyof ClientInput> = {
  name: "name",
  "client name": "name",
  client: "name",
  email: "email",
  "e-mail": "email",
  contact: "contact",
  phone: "contact",
  mobile: "contact",
  tel: "contact",
  telephone: "contact",
  location: "location",
  city: "location",
  address: "location",
};

const CLIENT_IMPORT_EXTENSIONS = [".csv", ".xlsx"] as const;

export function isClientImportFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return CLIENT_IMPORT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function validateRow(row: Omit<ClientImportRow, "errors">): string[] {
  const errors: string[] = [];
  if (!row.name.trim()) errors.push("Name is required.");
  if (!row.contact.trim()) errors.push("Contact number is required.");
  if (!row.location.trim()) errors.push("Location is required.");
  if (row.email.trim() && !row.email.includes("@")) errors.push("Email looks invalid.");
  return errors;
}

function rowToInput(row: ClientImportRow): ClientInput {
  return {
    name: row.name.trim(),
    email: row.email.trim(),
    contact: row.contact.trim(),
    location: row.location.trim(),
  };
}

function parseClientImportMatrix(matrix: string[][]): ClientImportParseResult {
  const rows: string[][] = matrix
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (rows.length === 0) {
    return { rows: [], validRows: [], errorCount: 0 };
  }

  const headerCells = rows[0]!;
  const columnMap = headerCells.map((cell) => HEADER_ALIASES[normalizeHeader(cell)] ?? null);
  const hasMappedHeader = columnMap.some(Boolean);
  const dataRows = hasMappedHeader ? rows.slice(1) : rows;
  const parsedRows: ClientImportRow[] = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const cells = dataRows[index]!;
    const rowNumber = hasMappedHeader ? index + 2 : index + 1;

    const draft = {
      rowNumber,
      name: "",
      email: "",
      contact: "",
      location: "",
    };

    if (hasMappedHeader) {
      columnMap.forEach((field, colIndex) => {
        if (!field) return;
        const raw = cells[colIndex]?.trim() ?? "";
        draft[field] = field === "contact" ? sanitizeContactNumberInput(raw) : raw;
      });
    } else {
      draft.name = cells[0]?.trim() ?? "";
      draft.email = cells[1]?.trim() ?? "";
      draft.contact = sanitizeContactNumberInput(cells[2]?.trim() ?? "");
      draft.location = cells[3]?.trim() ?? "";
    }

    const errors = validateRow(draft);
    parsedRows.push({ ...draft, errors });
  }

  const validRows = parsedRows.filter((row) => row.errors.length === 0).map(rowToInput);
  const errorCount = parsedRows.filter((row) => row.errors.length > 0).length;

  return { rows: parsedRows, validRows, errorCount };
}

export function parseClientImportCsv(text: string): ClientImportParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], validRows: [], errorCount: 0 };
  }

  const matrix = lines.map((line) => parseCsvLine(line));
  return parseClientImportMatrix(matrix);
}

export function parseClientImportXlsx(buffer: ArrayBuffer): ClientImportParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], validRows: [], errorCount: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { rows: [], validRows: [], errorCount: 0 };
  }

  const matrix = XLSX.utils
    .sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    })
    .map((row) => (Array.isArray(row) ? row.map(cellToString) : []));

  return parseClientImportMatrix(matrix);
}

export async function parseClientImportFile(file: File): Promise<ClientImportParseResult> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx")) {
    return parseClientImportXlsx(await file.arrayBuffer());
  }
  if (lower.endsWith(".csv")) {
    return parseClientImportCsv(await file.text());
  }
  throw new Error("Unsupported file type");
}

export function clientImportTemplateCsv(): string {
  return [
    "name,email,contact,location",
    "Jane Doe,jane@example.com,555-0100,Accra",
    "John Smith,,555-0101,Kumasi",
  ].join("\n");
}

export function downloadClientImportTemplate(): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["name", "email", "contact", "location"],
    ["Jane Doe", "jane@example.com", "555-0100", "Accra"],
    ["John Smith", "", "555-0101", "Kumasi"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Clients");
  XLSX.writeFile(workbook, "clients-import-template.xlsx");
}
