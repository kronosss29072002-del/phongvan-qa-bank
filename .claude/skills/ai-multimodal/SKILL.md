---
name: ai-multimodal
description: Process and generate multimedia via Google Gemini API: analyze audio (transcription, summarization, 9.5h), images (captioning, OCR, object detection, segmentation), videos (scene detection, Q&A, 6h, YouTube), documents (PDF tables/forms/charts); generate images (Imagen 4) and videos (Veo 3, 8s with audio). Gemini 3/2.5, 2M token context. Not for local media encoding (use media-processing).
license: MIT
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# AI Multimodal

Process audio, images, videos, documents, and generate images/videos using Google Gemini's multimodal API.

## Setup

```bash
export GEMINI_API_KEY="your-key"  # Get from https://aistudio.google.com/apikey
pip install google-genai python-dotenv pillow
```

## Quick Start

**Analyze media**: `python scripts/gemini_batch_process.py --files <file> --task <analyze|transcribe|extract>`

**Generate content**: `python scripts/gemini_batch_process.py --task <generate|generate-video> --prompt "description"`

## Models

**Image generation**: `imagen-4.0-generate-001` (standard), `imagen-4.0-ultra-generate-001` (quality), `imagen-4.0-fast-generate-001` (speed)
**Video generation**: `veo-3.1-generate-preview` (8s clips with audio)
**Analysis**: `gemini-2.5-flash` (recommended), `gemini-2.5-pro` (advanced)

## Scripts

**gemini_batch_process.py**: Process audio/image/video/PDF, generate images/videos
**media_optimizer.py**: Compress/resize/convert media for API limits
**document_converter.py**: Convert DOCX/XLSX/PPTX to PDF

Use `--help` for options.

## References

Load for detailed guidance:

| Topic | File |
|-------|------|
| Audio | `references/audio-processing.md` |
| Images | `references/vision-understanding.md` |
| Image Gen | `references/image-generation.md` |
| Video | `references/video-analysis.md` |
| Video Gen | `references/video-generation.md` |

## Limits

**Formats**: Audio (WAV/MP3/AAC, 9.5h), Images (PNG/JPEG/WEBP, 3.6k), Video (MP4/MOV, 6h), PDF (1k pages)
**Size**: 20MB inline, 2GB File API

**Resources**: [API Docs](https://ai.google.dev/gemini-api/docs/) | [Pricing](https://ai.google.dev/pricing)
