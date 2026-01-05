/**
 * Code templates for different problems and languages
 */

import type { Language } from './types';

type TemplateMap = Record<string, Record<Language, string>>;

const templates: TemplateMap = {
  sum_two_numbers: {
    python: `a, b = map(int, input().split())
print(a + b)
`,
    javascript: `const fs = require("fs");
const data = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const a = data[0] || 0;
const b = data[1] || 0;
console.log(a + b);
`
  },
  reverse_string: {
    python: `s = input()
print(s[::-1])
`,
    javascript: `const fs = require("fs");
const s = fs.readFileSync(0, "utf8").replace(/\\r?\\n$/, "");
console.log(s.split("").reverse().join(""));
`
  },
  fibonacci: {
    python: `n = int(input())
# Iterative approach
a, b = 0, 1
for _ in range(n):
    a, b = b, a + b
print(a)
`,
    javascript: `const fs = require("fs");
const n = parseInt(fs.readFileSync(0, "utf8").trim());
// Iterative approach
let a = 0, b = 1;
for (let i = 0; i < n; i++) {
  [a, b] = [b, a + b];
}
console.log(a);
`
  },
  palindrome: {
    python: `s = input().strip().lower()
if s == s[::-1]:
    print("YES")
else:
    print("NO")
`,
    javascript: `const fs = require("fs");
const s = fs.readFileSync(0, "utf8").trim().toLowerCase();
if (s === s.split("").reverse().join("")) {
  console.log("YES");
} else {
  console.log("NO");
}
`
  },
  find_max: {
    python: `n = int(input())
numbers = list(map(int, input().split()))
print(max(numbers))
`,
    javascript: `const fs = require("fs");
const lines = fs.readFileSync(0, "utf8").trim().split("\\n");
const n = parseInt(lines[0]);
const numbers = lines[1].split(" ").map(Number);
console.log(Math.max(...numbers));
`
  },
  count_vowels: {
    python: `s = input().lower()
vowels = "aeiou"
count = sum(1 for c in s if c in vowels)
print(count)
`,
    javascript: `const fs = require("fs");
const s = fs.readFileSync(0, "utf8").toLowerCase();
const vowels = "aeiou";
let count = 0;
for (let c of s) {
  if (vowels.includes(c)) count++;
}
console.log(count);
`
  },
  factorial: {
    python: `n = int(input())
result = 1
for i in range(1, n + 1):
    result *= i
print(result)
`,
    javascript: `const fs = require("fs");
const n = parseInt(fs.readFileSync(0, "utf8").trim());
let result = 1;
for (let i = 1; i <= n; i++) {
  result *= i;
}
console.log(result);
`
  }
};

const defaultTemplates: Record<Language, string> = {
  python: `print("hello")
`,
  javascript: `console.log("hello");
`
};

/**
 * Get template code for a problem and language
 */
export function getTemplate(problemId: string, language: Language): string {
  return templates[problemId]?.[language] ?? defaultTemplates[language];
}

