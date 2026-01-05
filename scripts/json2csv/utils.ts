/**
 * @fileoverview
 * This file contains utility functions shared across the json2csv scripts.
 */

/**
 * Cleans a string value by removing a numeric prefix (e.g., "[123]Value" -> "Value").
 * @param val The string to clean.
 * @returns The cleaned string.
 */
export const cleanValue = (val: string): string => {
  if (!val) return "";
  const match = /^\[-?\d+\](.*)$/.exec(val);
  return match ? match[1] : val;
};

/**
 * Cleans text by removing HTML-like tags and newlines.
 * @param val The text to clean.
 * @returns The cleaned text.
 */
export const cleanText = (val: string): string => {
  if (!val) return "";
  // Remove HTML tags and newlines
  return val.replace(/<[^>]*>/g, "").replace(/[\r\n]+/g, "");
};

/**
 * Escapes a field for CSV format by wrapping it in double quotes
 * and escaping any internal double quotes.
 * @param field The value to escape.
 * @returns The CSV-escaped string.
 */
export const escapeCsv = (field: string | number | boolean): string => {
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
};
