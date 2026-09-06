import { ru } from "chrono-node";
import { toDateKey } from "./tasks";

const recurrencePatterns = [
  { pattern: /\bкажд(?:ый|ое)\s+день\b/i, value: "daily" },
  { pattern: /\bпо\s+будням\b/i, value: "weekdays" },
  { pattern: /\bкаждую\s+недел(?:ю|и)\b/i, value: "weekly" },
];

export const parseNaturalTaskInput = (value, referenceDate = new Date()) => {
  let text = String(value || "").trim();
  let recurrence = "none";

  recurrencePatterns.forEach(({ pattern, value: recurrenceValue }) => {
    if (pattern.test(text)) {
      recurrence = recurrenceValue;
      text = text.replace(pattern, " ");
    }
  });

  const result = ru.parse(text, referenceDate, { forwardDate: true })[0];
  if (!result) {
    return {
      text: text.replace(/\s+/g, " ").trim(),
      dueDate: recurrence === "none" ? "" : toDateKey(referenceDate),
      dueTime: "",
      recurrence,
    };
  }

  const date = result.start.date();
  const hasTime = result.start.isCertain("hour");
  text = `${text.slice(0, result.index)} ${text.slice(result.index + result.text.length)}`;

  return {
    text: text.replace(/[,.]\s*$/g, "").replace(/\s+/g, " ").trim(),
    dueDate: toDateKey(date),
    dueTime: hasTime
      ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
      : "",
    recurrence,
  };
};
