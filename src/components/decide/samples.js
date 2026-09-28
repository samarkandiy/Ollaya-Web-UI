/**
 * Prebuilt Decide scenarios that showcase choice / score / noul questions
 * across common product surfaces. Each sample is small enough to run against
 * laya:en (context 512).
 *
 * Icons are named after lucide-react exports so the dialog can look them up
 * without pulling everything into this data module.
 */

export const SAMPLES = [
  {
    id: "support-ticket",
    title: "Support ticket triage",
    subtitle: "Route by team, gauge urgency, catch refund requests.",
    icon: "LifeBuoy",
    accent: "sky",
    state:
      "I was charged twice for my subscription this month. Please refund the second charge.",
    questions: [
      {
        id: "department",
        type: "choice",
        instructions: "Which team should handle this ticket?",
        criteria: [
          { key: "billing", desc: "Payments, invoices and refunds" },
          { key: "technical", desc: "Bugs, errors and outages" },
          { key: "account", desc: "Login, profile and settings" },
        ],
      },
      {
        id: "urgency",
        type: "score",
        instructions: "How urgent is this ticket?",
        criteria: [
          "Can wait",
          "Needs attention this week",
          "Needs attention today",
        ],
      },
      {
        id: "refund",
        type: "noul",
        instructions: "The customer asks for money back.",
        noul: {
          yes: "Asks for a refund",
          no: "Does not ask for a refund",
        },
      },
    ],
  },
  {
    id: "email-triage",
    title: "Email inbox triage",
    subtitle: "Bucket incoming email, gauge priority, flag replies.",
    icon: "Mail",
    accent: "blue",
    state:
      "Subject: Q3 board deck review\n\nHi team — can someone circulate the latest Q3 board deck by EOD Friday? I want to read it before Monday's meeting.\n\n— Jane",
    questions: [
      {
        id: "bucket",
        type: "choice",
        instructions: "Which inbox bucket does this email belong to?",
        criteria: [
          { key: "work", desc: "Colleagues, projects, meetings" },
          { key: "personal", desc: "Friends, family, personal life" },
          { key: "newsletter", desc: "Digests, updates, subscriptions" },
          { key: "promotional", desc: "Deals, marketing, sales" },
          { key: "spam", desc: "Unsolicited or suspicious" },
        ],
      },
      {
        id: "priority",
        type: "score",
        instructions: "How high-priority is this email?",
        criteria: ["Low", "Medium", "High"],
      },
      {
        id: "needs_reply",
        type: "noul",
        instructions: "The email expects a response from me.",
        noul: {
          yes: "Expects a reply",
          no: "Informational only",
        },
      },
    ],
  },
  {
    id: "bug-triage",
    title: "Bug report triage",
    subtitle: "Classify area, severity, and whether it warrants a hotfix.",
    icon: "Bug",
    accent: "rose",
    state:
      "Users on Safari 17 report that clicking 'Sign in with Google' redirects to a blank page. Started after the deploy at 14:30 UTC. Affects roughly 8% of daily signups.",
    questions: [
      {
        id: "area",
        type: "choice",
        instructions: "Which subsystem does this bug live in?",
        criteria: [
          { key: "auth", desc: "Sign-in, sessions, SSO" },
          { key: "payments", desc: "Checkout, billing, invoices" },
          { key: "ui", desc: "Frontend rendering and interaction" },
          { key: "infra", desc: "Deploys, servers, availability" },
          { key: "other", desc: "None of the above" },
        ],
      },
      {
        id: "severity",
        type: "score",
        instructions: "How severe is the impact?",
        criteria: [
          "Trivial — cosmetic only",
          "Minor — small workaround exists",
          "Major — blocks a core flow",
          "Critical — production outage",
        ],
      },
      {
        id: "needs_hotfix",
        type: "noul",
        instructions: "This should ship as an out-of-cycle hotfix.",
        noul: {
          yes: "Warrants a hotfix",
          no: "Can wait for the next release",
        },
      },
    ],
  },
  {
    id: "content-moderation",
    title: "Content moderation",
    subtitle: "Categorise user posts and decide whether to auto-hide.",
    icon: "ShieldAlert",
    accent: "amber",
    state:
      "Just got my new gpu and it's fire 🔥 — running LLaMA 70B locally, totally blew away my expectations. Anyone else on the 4090 wagon?",
    questions: [
      {
        id: "policy",
        type: "choice",
        instructions: "Which moderation policy category best fits this post?",
        criteria: [
          { key: "safe", desc: "No policy concerns" },
          { key: "spam", desc: "Unsolicited promotion" },
          { key: "hate", desc: "Attacks a protected group" },
          { key: "harassment", desc: "Targets an individual" },
          { key: "self_harm", desc: "Encourages self-harm" },
          { key: "adult", desc: "Sexual or explicit content" },
        ],
      },
      {
        id: "severity",
        type: "score",
        instructions: "How severe is any policy violation?",
        criteria: ["None", "Borderline", "Clear violation"],
      },
      {
        id: "auto_hide",
        type: "noul",
        instructions: "Auto-hide this post pending human review.",
        noul: {
          yes: "Hide immediately",
          no: "Leave visible",
        },
      },
    ],
  },
  {
    id: "product-review",
    title: "Product review analysis",
    subtitle: "Sentiment, intensity, and whether the review needs a reply.",
    icon: "Star",
    accent: "yellow",
    state:
      "Battery lasts way less than advertised. Charged to full at 9am, dead by 3pm with just email and Slack. Screen is beautiful though, and the keyboard is the best I've used. Considering a return.",
    questions: [
      {
        id: "sentiment",
        type: "choice",
        instructions: "Overall sentiment of the review.",
        criteria: [
          { key: "positive", desc: "Mostly praise" },
          { key: "neutral", desc: "Balanced or informational" },
          { key: "negative", desc: "Mostly complaints" },
          { key: "mixed", desc: "Both strong praise and strong complaints" },
        ],
      },
      {
        id: "intensity",
        type: "score",
        instructions: "How strongly does the reviewer feel?",
        criteria: ["Mild", "Moderate", "Strong"],
      },
      {
        id: "needs_response",
        type: "noul",
        instructions: "This review warrants a public reply from the brand.",
        noul: {
          yes: "Reply needed",
          no: "No response required",
        },
      },
    ],
  },
  {
    id: "lead-qualification",
    title: "Sales lead qualification",
    subtitle: "Segment inbound leads and detect buying intent.",
    icon: "TrendingUp",
    accent: "emerald",
    state:
      "Hi — I run engineering at a 200-person fintech. We currently pay $80k/yr for a competing tool. Looking to switch in Q1 if pricing is competitive. Can someone from sales reach out this week?",
    questions: [
      {
        id: "segment",
        type: "choice",
        instructions: "Which segment does this lead fall into?",
        criteria: [
          { key: "individual", desc: "Solo developer or hobbyist" },
          { key: "smb", desc: "Small business (under 50 people)" },
          { key: "mid_market", desc: "Mid-market (50–500 people)" },
          { key: "enterprise", desc: "Enterprise (500+ people)" },
        ],
      },
      {
        id: "intent",
        type: "score",
        instructions: "How ready-to-buy does the lead sound?",
        criteria: ["Cold", "Warm", "Hot"],
      },
      {
        id: "route_to_sales",
        type: "noul",
        instructions: "Route this to a live salesperson right away.",
        noul: {
          yes: "Route to sales",
          no: "Nurture with marketing",
        },
      },
    ],
  },
  {
    id: "pr-router",
    title: "Pull request router",
    subtitle: "Classify PRs and detect risk before assigning reviewers.",
    icon: "GitPullRequest",
    accent: "violet",
    state:
      "PR #4821: Bump lodash from 4.17.20 to 4.17.21 in /web. Fixes CVE-2021-23337 (command injection in template). Only touches package-lock.json and package.json. Dependabot auto-generated.",
    questions: [
      {
        id: "change_type",
        type: "choice",
        instructions: "What kind of change is this PR?",
        criteria: [
          { key: "feat", desc: "New feature" },
          { key: "fix", desc: "Bug fix" },
          { key: "refactor", desc: "Internal refactor, no behaviour change" },
          { key: "chore", desc: "Housekeeping" },
          { key: "docs", desc: "Documentation only" },
          { key: "deps", desc: "Dependency bump" },
          { key: "test", desc: "Tests only" },
        ],
      },
      {
        id: "risk",
        type: "score",
        instructions: "How risky is merging this PR?",
        criteria: ["Low", "Medium", "High"],
      },
      {
        id: "safe_to_automerge",
        type: "noul",
        instructions: "Safe to auto-merge once CI is green.",
        noul: {
          yes: "Auto-merge OK",
          no: "Needs a human reviewer",
        },
      },
    ],
  },
  {
    id: "meeting-request",
    title: "Meeting request handler",
    subtitle: "Decide whether to accept, decline, or reschedule.",
    icon: "Calendar",
    accent: "orange",
    state:
      "Hey — can we grab 30 min tomorrow to sync on the API redesign? Any time between 10 and 4 works for me.\n\n— Ravi",
    questions: [
      {
        id: "action",
        type: "choice",
        instructions: "How should I respond to this meeting request?",
        criteria: [
          { key: "accept", desc: "Accept as proposed" },
          { key: "propose_other_time", desc: "Suggest an alternative time" },
          { key: "delegate", desc: "Ask someone else to take it" },
          { key: "decline", desc: "Decline entirely" },
        ],
      },
      {
        id: "urgency",
        type: "score",
        instructions: "How time-sensitive is this meeting?",
        criteria: ["Can wait a week+", "Sometime this week", "Today or tomorrow"],
      },
      {
        id: "blocks_priorities",
        type: "noul",
        instructions: "Accepting would block my deep-work priorities today.",
        noul: {
          yes: "Would block priorities",
          no: "Fits fine around my work",
        },
      },
    ],
  },
  {
    id: "language-router",
    title: "Language router",
    subtitle: "Pick a translation target and flag urgent messages.",
    icon: "Languages",
    accent: "cyan",
    state:
      "Bonjour, notre serveur de production est tombé il y a 20 minutes. Les utilisateurs européens ne peuvent plus se connecter. Pouvez-vous escalader immédiatement ?",
    questions: [
      {
        id: "source_language",
        type: "choice",
        instructions: "What language is this message written in?",
        criteria: [
          { key: "english", desc: "English" },
          { key: "french", desc: "French" },
          { key: "spanish", desc: "Spanish" },
          { key: "german", desc: "German" },
          { key: "other", desc: "Something else" },
        ],
      },
      {
        id: "urgency",
        type: "score",
        instructions: "How urgent is the message?",
        criteria: ["Informational", "Needs a reply", "Critical incident"],
      },
      {
        id: "page_oncall",
        type: "noul",
        instructions: "Page the on-call engineer right now.",
        noul: {
          yes: "Page immediately",
          no: "Handle in normal queue",
        },
      },
    ],
  },
]

/**
 * Return a sample by id with fresh `uid`s on every question, ready to drop
 * into the DecidePage form state.
 */
export function loadSample(id) {
  const sample = SAMPLES.find((s) => s.id === id)
  if (!sample) return null
  return {
    ...sample,
    questions: sample.questions.map((q) => ({
      ...q,
      uid: crypto.randomUUID(),
      // Ensure the shape QuestionEditor expects is intact — every branch keeps
      // its own field, so we don't accidentally mutate any of them.
      criteria: q.criteria ? structuredClone(q.criteria) : undefined,
      noul: q.noul ? { ...q.noul } : undefined,
    })),
  }
}
