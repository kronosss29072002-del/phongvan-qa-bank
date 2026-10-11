#!/usr/bin/env python3
"""
Scan .claude/skills directory and extract skill metadata.
"""

import re
from pathlib import Path
from typing import Dict, List
import yaml

def extract_frontmatter(content: str) -> Dict:
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except:
            return {}
    return {}

def extract_first_paragraph(content: str) -> str:
    """Extract first meaningful paragraph after frontmatter."""
    # Remove frontmatter
    content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)

    # Find first paragraph (after headings)
    lines = content.split('\n')
    paragraph = []

    for line in lines:
        line = line.strip()
        # Skip headings and empty lines
        if line.startswith('#') or not line:
            if paragraph:  # If we've started collecting, stop
                break
            continue

        paragraph.append(line)

        # Stop after first paragraph
        if line.endswith('.') and len(' '.join(paragraph)) > 50:
            break

    return ' '.join(paragraph)[:200]

def scan_skills(base_path: Path) -> List[Dict]:
    """Scan all skill files and extract metadata."""
    skills = []
    skills_root = base_path.resolve()
    doc_names = ('SKILL.md', 'skill.md', 'README.md')

    # Mọi dir chứa file mô tả skill (SKILL.md > skill.md > README.md)
    candidate_dirs = set()
    for doc_name in doc_names:
        for doc_path in skills_root.rglob(doc_name):
            # README.md ở chính skills_root là tài liệu repo, không phải skill
            if doc_path.parent == skills_root:
                continue
            rel_parts = doc_path.relative_to(skills_root).parts[:-1]
            # Bỏ qua scripts/ và references/ của skill khác — đó không phải skill entry
            if 'scripts' in rel_parts or 'references' in rel_parts:
                continue
            candidate_dirs.add(doc_path.parent)

    for skill_dir in sorted(candidate_dirs):
        skill_name = skill_dir.name

        # Skip template
        if skill_name == 'template-skill':
            continue

        # Tìm file ưu tiên SKILL.md, rồi skill.md, rồi README.md
        skill_file = None
        for doc_name in doc_names:
            candidate = skill_dir / doc_name
            if candidate.exists():
                skill_file = candidate
                break

        if skill_file is None:
            print(f"Warning: No skill file found in {skill_dir}")
            continue

        # Handle nested skills (e.g. document-skills/* if the upstream bundle is vendored)
        if skill_dir.parent.name != 'skills':
            parent_name = skill_dir.parent.name
            skill_name = f"{parent_name}/{skill_name}"

        try:
            content = skill_file.read_text()
            frontmatter = extract_frontmatter(content)

            description = frontmatter.get('description', '')
            if not description:
                description = extract_first_paragraph(content)

            # Categorize based on content/name
            category = categorize_skill(skill_name, description, content)

            skills.append({
                'name': skill_name,
                'path': str(skill_file.relative_to(skills_root)),
                'description': description,
                'category': category,
                'has_scripts': (skill_dir / 'scripts').exists(),
                'has_references': (skill_dir / 'references').exists()
            })
        except Exception as e:
            print(f"Error processing {skill_file}: {e}")

    return skills

def categorize_skill(name: str, description: str, content: str) -> str:
    """Categorize skill based on name and content."""
    lower_name = name.lower()
    lower_desc = description.lower()
    lower_content = content[:500].lower()

    # AI/ML
    if any(x in lower_name for x in ['ai-', 'gemini', 'multimodal', 'adk']):
        return 'ai-ml'

    # Frontend
    if any(x in lower_name for x in ['frontend', 'ui', 'design', 'aesthetic', 'threejs']):
        return 'frontend'

    # Backend
    if any(x in lower_name for x in ['backend', 'auth', 'payment']):
        return 'backend'

    # Infrastructure
    if any(x in lower_name for x in ['devops', 'docker', 'cloudflare', 'gcloud']):
        return 'infrastructure'

    # Database
    if any(x in lower_name for x in ['database', 'mongodb', 'postgresql', 'sql']):
        return 'database'

    # Development Tools
    if any(x in lower_name for x in ['mcp', 'skill-creator', 'claude-code', 'repomix', 'docs-seeker']):
        return 'dev-tools'

    # Multimedia
    if any(x in lower_name for x in ['media', 'chrome-devtools', 'document-skills']):
        return 'multimedia'

    # Frameworks
    if any(x in lower_name for x in ['web-frameworks', 'mobile', 'shopify']):
        return 'frameworks'

    # Utilities
    if any(x in lower_name for x in ['debug', 'problem', 'code-review', 'planning', 'research', 'sequential']):
        return 'utilities'

    return 'other'

def group_by_category(skills: List[Dict]) -> Dict[str, List[Dict]]:
    """Group skills by category."""
    categories = {}

    for skill in skills:
        category = skill['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(skill)

    return categories

def main():
    """Main execution."""
    # Resolve skills dir tuyệt đối từ file location, không phụ thuộc cwd
    base_path = Path(__file__).parent.parent / 'skills'

    if not base_path.exists():
        print(f"Error: {base_path} not found")
        return

    print("Scanning skills...")
    skills = scan_skills(base_path)

    print(f"\nFound {len(skills)} skills\n")

    # Group by category
    categories = group_by_category(skills)

    category_names = {
        'ai-ml': 'AI & Machine Learning',
        'frontend': 'Frontend & Design',
        'backend': 'Backend Development',
        'infrastructure': 'Infrastructure & DevOps',
        'database': 'Database & Storage',
        'dev-tools': 'Development Tools',
        'multimedia': 'Multimedia & Processing',
        'frameworks': 'Frameworks & Platforms',
        'utilities': 'Utilities & Helpers',
        'other': 'Other'
    }

    for category, skills_list in sorted(categories.items()):
        print(f"\n{category_names.get(category, category.upper())}:")
        for skill in skills_list:
            scripts = '📦' if skill['has_scripts'] else '  '
            refs = '📚' if skill['has_references'] else '  '
            print(f"  {scripts}{refs} {skill['name']:30} {skill['description'][:80]}")

    # Output JSON + YAML cho generate_catalogs.py
    import json
    output_path = Path(__file__).parent / 'skills_data.json'
    output_path.write_text(json.dumps(skills, indent=2))
    print(f"\n✓ Saved metadata to {output_path}")

    yaml_path = Path(__file__).parent / 'skills_data.yaml'
    yaml_path.write_text(yaml.dump(skills, allow_unicode=True, sort_keys=False, default_flow_style=False))
    print(f"✓ Saved metadata to {yaml_path}")

if __name__ == '__main__':
    main()
