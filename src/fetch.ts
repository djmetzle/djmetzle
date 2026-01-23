import { execSync } from "node:child_process";

export interface ContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionsCollection {
  contributionCalendar: {
    weeks: ContributionWeek[];
  };
}

interface GraphQLResponse {
  user: {
    contributionsCollection: ContributionsCollection;
  };
}

function ghGraphQL<T>(query: string, variables: Record<string, unknown>): T {
  const args = Object.entries(variables)
    .map(([key, value]) => `-f ${key}=${value}`)
    .join(" ");

  const result = execSync(`gh api graphql -f query='${query}' ${args}`, {
    encoding: "utf-8",
  });

  const parsed = JSON.parse(result) as { data: T };
  return parsed.data;
}

function fetchContributionsForYear(username: string, year: number): ContributionDay[] {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  const result = ghGraphQL<GraphQLResponse>(query, { username, from, to });
  const weeks = result.user.contributionsCollection.contributionCalendar.weeks;
  return weeks.flatMap((week) => week.contributionDays);
}

export interface YearContributions {
  year: number;
  days: ContributionDay[];
}

const START_YEAR = 2016;

export function fetchAllContributions(username: string): YearContributions[] {
  const currentYear = new Date().getFullYear();
  const years: YearContributions[] = [];

  for (let year = START_YEAR; year <= currentYear; year++) {
    console.log(`Fetching contributions for ${year}...`);
    const days = fetchContributionsForYear(username, year);
    years.push({ year, days });
  }

  return years;
}
