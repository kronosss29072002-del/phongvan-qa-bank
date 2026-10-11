---
name: backend-development
description: "Build backends with Node.js/Python/Go/Rust; NestJS/FastAPI/Django; PostgreSQL/MongoDB/Redis; REST/GraphQL/gRPC; OAuth 2.1/JWT auth; OWASP Top 10; scaling (microservices, caching, sharding); Docker/Kubernetes/CI/CD; monitoring. Generic patterns -- for project-specific work use repo agents: prisma-db-specialist, nestjs-api-architect, rest-api-designer."
license: MIT
version: 1.0.0
---

> ⚠️ **QUARANTINE NOTICE — VENDORED/GENERIC SKILL** ⚠️
> This skill teaches GENERIC patterns across multiple languages/frameworks.
> **When loaded: REPO AGENTS + `rules/` WIN ALL CONFLICTS.**
> - Check `.claude/repo-facts.md` (generated, portable) for the project's ACTUAL stack — apply this skill's recommendations only where they match.
> - The 4 statistics formerly cited (83%/73%/98%/90%) were UNSOURCED and have been stripped from references/ (anti_slop.md: praise without evidence).
> - Agent `prisma-db-specialist`, `nestjs-api-architect`, `rest-api-designer` override this skill in this bundle.
>
> Do NOT use this skill as primary reference for project-specific work — use the repo-specific agents.

# Backend Development Skill

Production-ready backend development with modern technologies, best practices, and proven patterns.

## When to Use

- Designing RESTful, GraphQL, or gRPC APIs
- Building authentication/authorization systems
- Optimizing database queries and schemas
- Implementing caching and performance optimization
- OWASP Top 10 security mitigation
- Designing scalable microservices
- Testing strategies (unit, integration, E2E)
- CI/CD pipelines and deployment
- Monitoring and debugging production systems

## Technology Selection Guide

**Languages:** Node.js/TypeScript (full-stack), Python (data/ML), Go (concurrency), Rust (performance)
**Frameworks:** NestJS, FastAPI, Django, Express, Gin
**Databases:** PostgreSQL (ACID), MongoDB (flexible schema), Redis (caching)
**APIs:** REST (simple), GraphQL (flexible), gRPC (performance)

See: `references/backend-technologies.md` for detailed comparisons

## Reference Navigation

**Core Technologies:**
- `backend-technologies.md` - Languages, frameworks, databases, message queues, ORMs
- `backend-api-design.md` - REST, GraphQL, gRPC patterns and best practices

**Security & Authentication:**
- `backend-security.md` - OWASP Top 10 2025, security best practices, input validation
- `backend-authentication.md` - OAuth 2.1, JWT, RBAC, MFA, session management

**Performance & Architecture:**
- `backend-performance.md` - Caching, query optimization, load balancing, scaling
- `backend-architecture.md` - Microservices, event-driven, CQRS, saga patterns

**Quality & Operations:**
- `backend-testing.md` - Testing strategies, frameworks, tools, CI/CD testing
- `backend-code-quality.md` - SOLID principles, design patterns, clean code
- `backend-devops.md` - Docker, Kubernetes, deployment strategies, monitoring
- `backend-debugging.md` - Debugging strategies, profiling, logging, production debugging
- `backend-mindset.md` - Problem-solving, architectural thinking, collaboration

## Key Best Practices (2025)

**Security:** Argon2id passwords, parameterized queries, OAuth 2.1 + PKCE, rate limiting, security headers

**Performance:** Redis caching, database indexing, CDN, connection pooling

**Testing:** 70-20-10 pyramid (unit-integration-E2E), Vitest vs Jest tradeoffs, contract testing for microservices

**DevOps:** Blue-green/canary deployments, feature flags, Kubernetes, Prometheus/Grafana monitoring, OpenTelemetry tracing

## Quick Decision Matrix

| Need | Choose |
|------|--------|
| Fast development | Node.js + NestJS |
| Data/ML integration | Python + FastAPI |
| High concurrency | Go + Gin |
| Max performance | Rust + Axum |
| ACID transactions | PostgreSQL |
| Flexible schema | MongoDB |
| Caching | Redis |
| Internal services | gRPC |
| Public APIs | GraphQL/REST |
| Real-time events | Kafka |

## Implementation Checklist

**API:** Choose style → Design schema → Validate input → Add auth → Rate limiting → Documentation → Error handling

**Database:** Choose DB → Design schema → Create indexes → Connection pooling → Migration strategy → Backup/restore → Test performance

**Security:** OWASP Top 10 → Parameterized queries → OAuth 2.1 + JWT → Security headers → Rate limiting → Input validation → Argon2id passwords

**Testing:** Unit 70% → Integration 20% → E2E 10% → Load tests → Migration tests → Contract tests (microservices)

**Deployment:** Docker → CI/CD → Blue-green/canary → Feature flags → Monitoring → Logging → Health checks

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OAuth 2.1: https://oauth.net/2.1/
- OpenTelemetry: https://opentelemetry.io/
