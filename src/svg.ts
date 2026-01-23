import type { ContributionDay, YearContributions } from "./fetch.js";

const COLORS: Record<ContributionDay["contributionLevel"], string> = {
  NONE: "#161b22",
  FIRST_QUARTILE: "#0e4429",
  SECOND_QUARTILE: "#006d32",
  THIRD_QUARTILE: "#26a641",
  FOURTH_QUARTILE: "#39d353",
};

const CELL_SIZE = 10;
const CELL_GAP = 2;
const YEAR_LABEL_WIDTH = 40;
const YEAR_GAP = 20;

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
}

function generateYearGrid(yearData: YearContributions, yOffset: number): string {
  const cells: string[] = [];
  const daysByDate = new Map<string, ContributionDay>();

  for (const day of yearData.days) {
    daysByDate.set(day.date, day);
  }

  // Generate grid for the entire year
  const year = yearData.year;
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // Find the first Sunday on or before Jan 1
  const firstSunday = new Date(startDate);
  firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

  let currentDate = new Date(firstSunday);
  let weekIndex = 0;

  while (currentDate <= endDate || weekIndex < 53) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const day = daysByDate.get(dateStr);

      // Only render if within the year
      if (currentDate.getFullYear() === year && day) {
        const x = YEAR_LABEL_WIDTH + weekIndex * (CELL_SIZE + CELL_GAP);
        const y = yOffset + dayOfWeek * (CELL_SIZE + CELL_GAP);
        const color = COLORS[day.contributionLevel];

        cells.push(
          `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" fill="${color}" rx="2">` +
            `<title>${dateStr}: ${day.contributionCount} contribution${day.contributionCount !== 1 ? "s" : ""}</title>` +
            `</rect>`
        );
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weekIndex++;
    if (weekIndex >= 53) break;
  }

  // Year label
  const labelY = yOffset + 3.5 * (CELL_SIZE + CELL_GAP) + 4;
  cells.push(
    `<text x="0" y="${labelY}" fill="#8b949e" font-size="10" font-family="sans-serif">${year}</text>`
  );

  return cells.join("\n    ");
}

export function generateSVG(contributions: YearContributions[]): string {
  const yearHeight = 7 * (CELL_SIZE + CELL_GAP);
  const totalHeight = contributions.length * (yearHeight + YEAR_GAP) - YEAR_GAP + 20;
  const totalWidth = YEAR_LABEL_WIDTH + 53 * (CELL_SIZE + CELL_GAP) + 10;

  const reversed = [...contributions].reverse();
  const yearGrids = reversed.map((yearData, index) => {
    const yOffset = index * (yearHeight + YEAR_GAP) + 10;
    return generateYearGrid(yearData, yOffset);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="100%" height="100%" fill="#0d1117"/>
  <g>
    ${yearGrids.join("\n    ")}
  </g>
</svg>`;
}
