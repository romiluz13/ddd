# Agent Skills Specification
# Source: https://agentskills.io/specification
# Retrieved: 2026-08-30T00:00:00Z

## Directory structure

A skill is a directory containing, at minimum, a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

## SKILL.md format

The `SKILL.md` file must contain YAML frontmatter followed by Markdown content.

### Frontmatter

| Field | Required | Constraints |
| --- | --- | --- |
| `name` | Yes | Max 64 characters. Lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen. |
| `description` | Yes | Max 1024 characters. Non-empty. Describes what the skill does and when to use it. |
| `license` | No | License name or reference to a bundled license file. |
| `compatibility` | No | Max 500 characters. Indicates environment requirements. |
| `metadata` | No | Arbitrary key-value mapping for additional metadata. |
| `allowed-tools` | No | Space-separated string of pre-approved tools. (Experimental) |

### name field

- Must be 1-64 characters
- May only contain unicode lowercase alphanumeric characters (a-z, 0-9) and hyphens (-)
- Must not start or end with a hyphen (-)
- Must not contain consecutive hyphens (--)
- Must match the parent directory name

### description field

- Must be 1-1024 characters
- Should describe both what the skill does and when to use it
- Should include specific keywords that help agents identify relevant tasks

## Progressive disclosure

1. Metadata (~100 tokens): name and description loaded at startup
2. Instructions (< 5000 tokens recommended): full SKILL.md body loaded when activated
3. Resources (as needed): files in scripts/, references/, assets/ loaded only when required

Keep your main SKILL.md under 500 lines. Move detailed reference material to separate files.

## Validation

Use skills-ref to validate: `skills-ref validate ./my-skill`
