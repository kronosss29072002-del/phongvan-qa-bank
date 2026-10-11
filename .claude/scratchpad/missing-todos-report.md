# Missing TODOs / Placeholder Tasks Report

**Scanned 10 files from course 07, modules 1-10**
**Date: 2026-09-15**

---

## Summary by File

### 01-git-co-ban.md (Module 1: Git Basics)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |

### 02-github-co-ban.md (Module 2: GitHub Basics)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |

### 03-github-pages.md (Module 3: GitHub Pages)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 139 | `[//]: # (TODO: Thêm diagram flow deploy GitHub Pages)` | Missing diagram |

### 04-actions-co-ban.md (Module 4: GitHub Actions Basics)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 79 | `[//]: # (TODO: Hình minh họa GitHub Actions workflow)` | Missing diagram |
| 122 | `[//]: # (TODO: Hình minh họa flow trigger → job → step)` | Missing diagram |

### 05-actions-advanced.md (Module 5: GitHub Actions Advanced)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 79 | `[//]: # (TODO: So sánh matrix vs strategy với SSH Deploy)` | Missing diagram |
| 148 | `[//]: # (TODO: Hình minh họa OIDC flow)` | Missing diagram |

### 06-terraform-co-ban.md (Module 6: Terraform Basics)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 181 | `[//]: # (TODO: Thêm diagram flow apply Terraform)` | Missing diagram |

### 07-terraform-nang-cao.md (Module 7: Terraform Advanced)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 136 | `[//]: # (TODO: Hình minh họa Remote State + Locking)` | Missing diagram |
| 175 | `[//]: # (TODO: Ví dụ module structure cho project lớn)` | Missing example |

### 08-terraform-aws.md (Module 8: Terraform + AWS)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 183 | `[//]: # (TODO: Hình minh họa architecture EC2 + RDS + ALB trên AWS)` | Missing diagram |

### 09-terraform-security.md (Module 9: Terraform + Security)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 88 | `[//]: # (TODO: Hình minh họa flow Terrascan + tfsec trong CI)` | Missing diagram |

### 10-terraform-testing.md (Module 10: Terraform + Testing)
| Line | Content | Type |
|------|---------|------|
| 19 | `Mô tả: ...` | Placeholder description |
| 138 | `[//]: # (TODO: Hình minh họa pipeline test → validate → plan → apply)` | Missing diagram |
| 170 | `[//]: # (TODO: Hình minh họa Terratest flow)` | Missing diagram |
| 223 | `[//]: # (TODO: So sánh Terratest vs Checkov vs tflint)` | Missing diagram |
| 271 | `[//]: # (TODO: Checklist CI pipeline Terraform)` | Missing checklist |
| 307 | `[//]: # (TODO: Hình minh họa GitLab CI với Terraform)` | Missing diagram |

---

## Total Count

| Category | Count |
|----------|-------|
| Placeholder descriptions (`Mô tả: ...`) | 10 |
| Missing diagrams (`TODO: Hình minh họa...` / `TODO: Thêm diagram...`) | 13 |
| Missing examples (`TODO: Ví dụ...`) | 1 |
| Missing checklists (`TODO: Checklist...`) | 1 |
| **Total TODOs** | **25** |

## Detailed Breakdown by Module

| Module | File | TODOs |
|--------|------|-------|
| 1 - Git Basics | 01-git-co-ban.md | 1 |
| 2 - GitHub Basics | 02-github-co-ban.md | 1 |
| 3 - GitHub Pages | 03-github-pages.md | 2 |
| 4 - GitHub Actions Basic | 04-actions-co-ban.md | 3 |
| 5 - GitHub Actions Advanced | 05-actions-advanced.md | 3 |
| 6 - Terraform Basics | 06-terraform-co-ban.md | 2 |
| 7 - Terraform Advanced | 07-terraform-nang-cao.md | 3 |
| 8 - Terraform + AWS | 08-terraform-aws.md | 2 |
| 9 - Terraform + Security | 09-terraform-security.md | 2 |
| 10 - Terraform + Testing | 10-terraform-testing.md | 6 |

---

## Key Observations

1. **All 10 files have a placeholder `Mô tả: ...` on line 19.** This appears to be an empty metadata field in the frontmatter/header block that was never filled in. It sits between the learning path link and the target audience line.

2. **13 of 25 TODOs are missing diagrams** — all using the `<!-- -->` comment format with `(TODO: Hình minh họa ...)` or `(TODO: Thêm diagram ...)`. These are mermaid diagrams or architecture illustrations that were never created.

3. **Module 10 (terraform-testing.md) has the most TODOs (6)**, including missing comparison tables, CI pipeline checklists, and GitLab CI illustrations.

4. **Module 1 (git-co-ban.md) and Module 2 (github-co-ban.md) are the cleanest** with only 1 TODO each (the placeholder description).

5. **No broken/placeholder code examples were found** — all code blocks contain real, syntactically valid content. The TODOs are exclusively structural gaps (descriptions, diagrams, comparison tables, checklists).
