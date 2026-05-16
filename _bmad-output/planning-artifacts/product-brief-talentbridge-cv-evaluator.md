---
title: "Product Brief: TalentBridge CV Evaluator"
status: "draft"
created: "2026-05-16"
updated: "2026-05-16"
inputs:
  - docs/00-plan-de-accion.md
  - docs/01-analisis-tecnico.md
  - docs/02-arquitectura-y-ux.md
  - docs/03-propuestas-de-mejora.md
  - frontend/src/App.tsx
  - .claude/context/project-context.md
  - market research: AI-powered CV screening tools, 2024–2026
---

# Product Brief: TalentBridge CV Evaluator

## Executive Summary

Hiring managers at small and mid-size companies spend 6–8 hours evaluating a single batch of 20 candidates — a process that is inconsistent, exhausting, and impossible to audit. Enterprise ATS tools (HireVue, Greenhouse, Skillate) solve the volume problem but introduce a worse one: opaque, uncontrollable AI that nobody on the team can explain or defend.

TalentBridge CV Evaluator takes a different bet. Instead of automating the recruiter out of the loop, it puts them back in control at the moment that matters most: *defining what matters*. In two minutes, a hiring manager extracts evaluation criteria from a job description, adjusts their weights, and runs a full batch evaluation — getting transparent, evidence-backed rankings they can stand behind. The AI does the work; the human owns the decision.

The timing is right. AI adoption in HR jumped from 58% to 72% in a single year (2024–2025), yet the tools SMB hiring managers can actually afford and use remain either primitive or paywalled. TalentBridge enters as a commercial SaaS targeting this underserved majority — with a long-term vision to expand from CV screening into the full hiring workflow.

---

## The Problem

A hiring manager at a 50-person company posts a senior engineer role and receives 40 applications. No ATS. No HR department. Just them, a spreadsheet, and a Sunday afternoon.

They spend 45 minutes per candidate trying to hold a consistent mental model across resumes: *Does this person have the system design experience I care about? How strong is their leadership track? Is this gap in their history a red flag or explainable?* By candidate 15, they're pattern-matching on logos. By candidate 30, they can't remember why candidate 8 was better than candidate 22.

Current alternatives all fail in the same direction:

- **Enterprise ATS platforms** are priced for HR departments and require IT setup, administrator training, and vendor integration. A 10-person startup or a team lead with budget authority has no practical path in.
- **Generic AI tools** (ChatGPT, etc.) require the user to hand-craft evaluation prompts, manually paste CVs one at a time, and mentally track results across conversations — replacing one form of fatigue with another.
- **Fully automated screeners** score candidates without explaining the criteria — creating liability risk and no mechanism for the hiring manager to express what *this specific role* needs.

The result: the most consequential decisions in a company's growth — who gets hired — are made under cognitive overload, inconsistently, and without a defensible paper trail.

---

## The Solution

TalentBridge CV Evaluator is a browser-based SaaS tool that guides hiring managers through a structured 4-step evaluation workflow:

1. **Extract** — Paste a job description; AI extracts weighted evaluation criteria (hard skills, soft skills, cultural fit signals)
2. **Adjust** — Review and tune the criteria weights before any CV is scored (human judgment before AI execution)
3. **Evaluate** — Paste up to 20 CVs (separated by `---`); AI evaluates each against the criteria with structured evidence
4. **Review** — Receive a ranked shortlist with per-candidate scores, strengths, gaps, red flags, and a top-3 executive summary

The key design decision — placing criteria editing *before* batch evaluation — means the AI is executing the hiring manager's explicitly stated priorities, not guessing. Every score links back to criteria the user reviewed and approved.

---

## What Makes This Different

**Criteria control before execution.** Every other AI screening tool evaluates first, then shows you a score. TalentBridge forces criteria definition and weighting *before* any candidate is scored. This single design choice eliminates the "why did it score that way?" problem at the source.

**Transparent evidence trail.** Each candidate result includes scored strengths, gaps, red flags, and the textual evidence from their CV — not just a number. Hiring managers can defend every shortlist decision.

**Zero setup, zero integration.** No ATS required. No admin configuration. No IT ticket. A hiring manager with a JD and a folder of CVs can run a full evaluation in under 10 minutes from a fresh browser tab.

**Regulatory alignment as a feature.** The EU AI Act classifies CV screening as high-risk AI (compliance required August 2026). TalentBridge's transparent criteria + human-in-the-loop approval is structurally the lowest-risk architecture available — a selling point, not just a design preference.

**SMB-native pricing model.** Enterprise tools charge per seat, per integration, or per hire — economics that only work at scale. TalentBridge's SaaS model is designed around the individual hiring manager and small team.

---

## Who This Serves

**Primary: SMB hiring managers and team leads**
Founders, engineering managers, and department heads at companies of 10–200 people who own hiring decisions without a dedicated recruiter. They have high-stakes judgment to apply and no time to apply it carefully. Success looks like: confident shortlist, defensible ranking, two hours instead of eight.

**Secondary: Boutique recruitment agencies and independent headhunters**
Technical recruiters who run 5–10 concurrent searches and need a lightweight screening layer before human review. They bring repeat volume and word-of-mouth distribution. Success looks like: faster candidate triage, better brief delivery to clients, differentiated methodology.

---

## Success Criteria

**User success signals:**
- Time-to-shortlist reduced by ≥ 60% vs manual review
- Hiring managers report confidence in shortlist ranking (qualitative)
- Repeat usage: ≥ 3 evaluations per active user per month

**Business objectives (Year 1):**
- 500 monthly active users (paid tier)
- Net Revenue Retention > 100% (expansion from individual to team plans)
- < 5% churn for users who complete ≥ 3 evaluations

**Leading indicators:**
- Evaluation completion rate ≥ 80% (started → ranked results)
- CSV export rate (proxy for "used this in a real decision")

---

## Scope

**In scope (v1):**
- 4-step evaluation wizard (JD → Criteria → CVS → Results)
- AI criteria extraction and weighted scoring via Google Gemini
- Batch evaluation up to 20 CVs per session
- Per-candidate evidence trail (strengths, gaps, red flags, recommendation)
- Executive summary (top 3, key differentiator)
- CSV export of ranked results
- Session persistence (in-browser, no auth required for MVP)

**Explicitly out of scope (v1):**
- ATS integrations (LinkedIn, Greenhouse, Workday)
- PDF/file upload for CVs (paste-only for v1)
- Team collaboration or shared evaluations
- Candidate communication or outreach tooling
- Interview scheduling or pipeline tracking

---

## Vision

If TalentBridge succeeds at CV screening for SMB hiring managers, it becomes the **lightweight hiring OS** for growing companies — the tool that sits between "we need to hire" and "offer accepted."

In 2–3 years:
- **Expanded workflow coverage:** JD writing assistance → criteria extraction → CV screening → interview guide generation → structured scorecard → hiring decision documentation
- **Role-specific criteria libraries:** pre-built, community-curated criteria templates by role type (senior engineer, product manager, head of sales) that users can adapt and publish
- **Team plans with shared evaluations:** hiring manager + founder + HR business partner all reviewing the same ranked shortlist with individual comment threads
- **ATS integrations:** push shortlists directly into Greenhouse, Lever, or Ashby for companies ready to grow into full ATS workflows

The long-term defensibility is the **criteria layer**: a growing library of expert-defined, role-specific evaluation frameworks that get better with every search run — and that no enterprise tool will productize for the SMB segment.
