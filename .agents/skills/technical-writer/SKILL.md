---
name: technical-writer
description: "Use this skill when creating technical documentation, API references, installation guides, README files, or any content that explains how a system, tool, or process works to a technical audience. Trigger phrases: 'document this API', 'write a README', 'create a setup guide'. Do NOT use for marketing copy about a product or non-technical how-to content aimed at general audiences."
version: 1.0.0
author: community
tags: [writing, technical, documentation, api]
license: MIT
---

# Technical Writer

## Overview
This skill produces clear, accurate, and immediately usable technical documentation—from API endpoint references and SDK guides to installation walkthroughs and troubleshooting sections. It applies documentation best practices: active voice, precise language, consistent structure, and code examples that actually run. The output is calibrated to the technical level of the audience, so a developer guide reads differently from an ops runbook or a user-facing setup wizard.

## When to Use
- Writing or improving README files for code repositories
- Documenting REST APIs, GraphQL schemas, or SDK methods
- Creating installation, configuration, or deployment guides
- Writing troubleshooting guides and FAQ sections
- Producing internal runbooks, SOPs, or architecture decision records
- Documenting CLI tools and their flags/options
- Writing release notes and changelogs

## When NOT to Use
- Marketing copy about a product's features (use `copywriter` skill)
- General audience how-to content without code or system-specific steps
- Blog posts that happen to be about technical topics (use `blog-post` skill)
- Legal or compliance documentation requiring specific certified language

## Quick Reference
| Task | Approach |
|------|----------|
| Structure | Overview → Prerequisites → Steps → Code Examples → Troubleshooting |
| Voice | Active: "Run the command" not "The command should be run" |
| Code blocks | Always specify language, always include a working example |
| Prerequisites | List exact versions, dependencies, and access requirements |
| API docs | Method, endpoint, parameters (name/type/required), request example, response example, errors |
| Audience calibration | Beginner: explain why; Intermediate: explain what; Expert: show code first |
| Troubleshooting | Error message → likely cause → fix |

## Instructions

1. **Define the document type and audience.** Before writing, identify: What type of doc is this (guide, reference, tutorial, explanation)? Who is the reader (junior dev, DevOps engineer, end user)? What do they need to DO after reading it—not just know, but do?

2. **Choose the right document structure.**
   - **Tutorial:** Learning-oriented. Walk through a concrete example. Success = reader can reproduce it.
   - **How-to Guide:** Task-oriented. Steps to accomplish a specific goal. No detours.
   - **Reference:** Information-oriented. API docs, CLI flags, config options. Completeness over narrative.
   - **Explanation:** Understanding-oriented. Architecture docs, concept overviews. Answers "why."

3. **Write the document skeleton first:**
   ```
   # Document Title
   ## Overview (what this does and why it matters)
   ## Prerequisites (exact versions, tools, access)
   ## [Main Sections / Steps]
   ## Troubleshooting
   ## Related Resources
   ```

4. **Write in active voice.** Always.
   - ❌ "The configuration file can be edited to change the timeout value."
   - ✅ "Edit the configuration file to change the timeout value."
   - ❌ "It is recommended that users restart the service after changes."
   - ✅ "Restart the service after making changes."

5. **Format code examples correctly.**
   - Always use fenced code blocks with the language specified
   - Show a real, runnable command or snippet—not pseudocode unless explicitly diagramming
   - For terminal commands, use `bash` or `shell` as the language identifier
   - For multi-step processes, number the commands and show expected output where helpful

6. **Document API endpoints using this structure:**
   ```
   ## POST /endpoint-path

   Brief description of what this endpoint does.

   ### Request

   **Headers:**
   | Header | Value |
   |--------|-------|
   | Content-Type | application/json |
   | Authorization | Bearer {token} |

   **Parameters:**
   | Name | Type | Required | Description |
   |------|------|----------|-------------|
   | param | string | Yes | What it does |

   **Example Request:**
   ```json
   { ... }
   ```

   ### Response

   **Success (200):**
   ```json
   { ... }
   ```

   **Errors:**
   | Code | Meaning |
   |------|---------|
   | 400 | Bad request – missing required field |
   | 401 | Unauthorized – invalid or expired token |
   ```

7. **Write prerequisites precisely.** Don't say "you'll need Python." Say "Python 3.10 or higher (`python --version` to check)."

8. **Add a Troubleshooting section** for any procedural doc. Structure: exact error message or symptom → likely cause → fix. Users search for error text—match it exactly.

9. **Calibrate jargon to audience.** Beginner: define terms on first use. Intermediate: define only uncommon terms. Expert: skip definitions, show code first.

## Best Practices
- Write for the reader who will search for your docs in a moment of frustration—make every section findable
- Test every code example before publishing; broken examples destroy trust instantly
- Use admonition blocks (`> **Note:**`, `> **Warning:**`) to call out gotchas and important caveats
- Keep reference docs and tutorial docs separate—mixing them creates confusion
- Version your docs alongside your code; stale docs are worse than no docs
- Use consistent terminology throughout—pick one word for a concept and stick to it
