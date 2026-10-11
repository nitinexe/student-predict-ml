export const QUESTION_BANK = [
  { id: "alg-1", subject: "Mathematics", topic: "Algebra", prompt: "Solve for x: 3x − 7 = 11.", options: ["4", "6", "8", "18"], answer: 1, explanation: "Add 7 to both sides, then divide by 3: x = 6." },
  { id: "alg-2", subject: "Mathematics", topic: "Algebra", prompt: "Factor x² − 9.", options: ["(x − 9)(x + 1)", "(x − 3)(x + 3)", "(x − 3)²", "x(x − 9)"], answer: 1, explanation: "This is a difference of squares: a² − b² = (a − b)(a + b)." },
  { id: "alg-3", subject: "Mathematics", topic: "Algebra", prompt: "If 2y + 5 = 17, what is y?", options: ["5", "6", "11", "12"], answer: 1, explanation: "Subtract 5, then divide 12 by 2." },
  { id: "geo-1", subject: "Mathematics", topic: "Geometry", prompt: "A triangle has angles 48° and 67°. What is the third angle?", options: ["55°", "65°", "75°", "85°"], answer: 1, explanation: "Interior angles sum to 180°: 180 − 48 − 67 = 65°." },
  { id: "geo-2", subject: "Mathematics", topic: "Geometry", prompt: "What is the area of a circle with radius 3?", options: ["3π", "6π", "9π", "12π"], answer: 2, explanation: "Area = πr² = 9π square units." },
  { id: "geo-3", subject: "Mathematics", topic: "Geometry", prompt: "A right triangle has legs 5 and 12. What is its hypotenuse?", options: ["13", "15", "17", "25"], answer: 0, explanation: "By Pythagoras, √(5² + 12²) = 13." },
  { id: "frac-1", subject: "Mathematics", topic: "Number skills", prompt: "What is 3/4 + 2/3?", options: ["5/7", "17/12", "13/12", "1/12"], answer: 1, explanation: "Use denominator 12: 9/12 + 8/12 = 17/12." },
  { id: "frac-2", subject: "Mathematics", topic: "Number skills", prompt: "What is 15% of 240?", options: ["24", "30", "36", "40"], answer: 2, explanation: "0.15 × 240 = 36." },
  { id: "frac-3", subject: "Mathematics", topic: "Number skills", prompt: "Simplify the ratio 18:24.", options: ["2:3", "3:4", "4:5", "6:8"], answer: 1, explanation: "Divide both values by their greatest common divisor, 6." },
  { id: "stat-1", subject: "Mathematics", topic: "Statistics", prompt: "What is the mean of 4, 6, 8, and 10?", options: ["6", "7", "8", "28"], answer: 1, explanation: "The sum is 28; divide by 4 values to get 7." },
  { id: "stat-2", subject: "Mathematics", topic: "Statistics", prompt: "Find the median of 2, 3, 9, 12, 15.", options: ["3", "9", "10.5", "12"], answer: 1, explanation: "The middle value of the ordered list is 9." },
  { id: "stat-3", subject: "Mathematics", topic: "Statistics", prompt: "A fair six-sided die is rolled. What is the chance of rolling an even number?", options: ["1/6", "1/3", "1/2", "2/3"], answer: 2, explanation: "Three of the six outcomes are even, so the probability is 3/6 = 1/2." },
];

export function getWeekStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start.toISOString().slice(0, 10);
}

export function getPerformance(questions, answers) {
  const topics = {};
  questions.forEach((question, index) => {
    const topic = topics[question.topic] ?? { correct: 0, total: 0 };
    topic.total += 1;
    if (Number(answers[index]) === question.answer) topic.correct += 1;
    topics[question.topic] = topic;
  });
  return Object.entries(topics).map(([topic, result]) => ({
    topic,
    ...result,
    accuracy: Math.round((result.correct / result.total) * 100),
  })).sort((a, b) => a.accuracy - b.accuracy);
}

export function createStudyTasks(performance, profile, weekStart) {
  const hours = Number(profile?.study_hours_per_week);
  const minutesPerWeek = Number.isFinite(hours) && hours > 0
    ? Math.min(600, Math.max(60, Math.round((hours * 60) / 3)))
    : 90;
  const focus = performance.filter((topic) => topic.accuracy < 80).slice(0, 3);
  const selected = focus.length ? focus : performance.slice(0, 2);
  return selected.flatMap(({ topic, accuracy }) => [
    { id: `${weekStart}-${topic}-review`, topic, title: `Review ${topic.toLowerCase()} foundations`, detail: `Work through one focused lesson and 3 examples. Recent accuracy: ${accuracy}%.`, minutes: Math.round(minutesPerWeek / Math.max(selected.length, 1) / 2), done: false },
    { id: `${weekStart}-${topic}-practice`, topic, title: `Practice ${topic.toLowerCase()} questions`, detail: "Solve a short set, then check each step against the worked solutions.", minutes: Math.round(minutesPerWeek / Math.max(selected.length, 1) / 2), done: false },
  ]);
}
