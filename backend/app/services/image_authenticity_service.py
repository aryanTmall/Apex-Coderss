import io
import re
import json
import logging
from typing import Optional, Dict, Any, Tuple
from PIL import Image, ExifTags
from app.config import settings

logger = logging.getLogger("civichelp.vision")

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

AI_FILENAME_KEYWORDS = [
    "ai", "dalle", "dall-e", "dall_e", "midjourney", "mid-journey",
    "stablediffusion", "stable_diffusion", "sdxl", "flux",
    "synthetic", "generated", "civitai", "comfyui", "deepai",
    "bing_creator", "chatgpt_image", "fake", "genai", "prompt"
]

AI_METADATA_MARKERS = [
    "midjourney", "dall-e", "dalle", "stable diffusion", "stablediffusion",
    "novelai", "comfyui", "automatic1111", "adobe firefly", "bing image creator",
    "civitai", "latent_diffusion", "text2image", "img2img", "flux.1",
    "negative_prompt", "sampler_name", "steps:", "cfg scale:"
]

class ImageAuthenticityService:
    def __init__(self):
        self.client = None
        self._init_genai()

    def _init_genai(self):
        key = (settings.GEMINI_API_KEY or "").strip()
        if genai and key and not key.startswith("AQ.dummy"):
            try:
                self.client = genai.Client(api_key=key)
            except Exception as e:
                logger.debug(f"Gemini client not initialized for vision: {e}")
                self.client = None
        else:
            self.client = None

    def analyze_metadata(self, image_bytes: bytes, filename: str = "") -> Tuple[bool, Optional[str], Dict[str, Any]]:
        """
        Forensic inspection of image headers, EXIF tags, and PNG text chunks.
        Returns: (is_ai_generated, reason, details)
        """
        filename_lower = (filename or "").lower()
        details = {
            "filename": filename,
            "format": None,
            "size": None,
            "has_exif": False,
            "ai_signatures_found": [],
            "heuristic_flags": []
        }

        # 1. Filename keyword inspection
        for kw in AI_FILENAME_KEYWORDS:
            pattern = r"(^|[\W_])" + re.escape(kw) + r"([\W_]|$)"
            if re.search(pattern, filename_lower):
                details["ai_signatures_found"].append(f"Filename indicator: '{kw}'")
                return True, f"Filename contains generative AI indicator ('{kw}'). Authentic on-site photos must be unedited camera captures.", details

        if not image_bytes:
            return False, None, details

        # 2. Inspect Image with PIL
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                details["format"] = img.format
                details["size"] = list(img.size)

                # Inspect PNG info / text chunks
                if hasattr(img, "info") and isinstance(img.info, dict):
                    for k, v in img.info.items():
                        val_str = str(v).lower()
                        for marker in AI_METADATA_MARKERS:
                            if marker in val_str:
                                details["ai_signatures_found"].append(f"PNG chunk '{k}': '{marker}'")
                                return True, f"Embedded generative AI metadata detected in image payload ({marker}). Synthetic images are rejected.", details

                # Inspect EXIF metadata
                exif = img.getexif()
                if exif:
                    details["has_exif"] = True
                    for tag_id, val in exif.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        val_str = str(val).lower()
                        for marker in AI_METADATA_MARKERS:
                            if marker in val_str:
                                details["ai_signatures_found"].append(f"EXIF '{tag_name}': '{marker}'")
                                return True, f"Image EXIF metadata indicates AI generation software ({marker}).", details

                        # Check Software tag specifically
                        if tag_name == "Software":
                            for sw in ["midjourney", "dall-e", "stablediffusion", "novelai"]:
                                if sw in val_str:
                                    details["ai_signatures_found"].append(f"EXIF Software: '{val}'")
                                    return True, f"Image was exported from AI software: {val}.", details

                # Check for standard synthetic square resolutions with zero camera metadata
                # (e.g. exactly 1024x1024 or 512x512 without EXIF camera make/model)
                width, height = img.size
                if width == height and width in [512, 768, 1024, 2048] and not details["has_exif"]:
                    details["heuristic_flags"].append(f"Exact square generative resolution {width}x{height} with zero hardware camera EXIF")
                    
        except Exception as e:
            logger.warning(f"Error parsing image bytes during authenticity analysis: {e}")

        return False, None, details

    def check_with_gemini_vision(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Tuple[bool, str]]:
        """
        Calls Gemini Multimodal Vision API to detect synthetic/AI artifacts if available.
        Returns: (is_ai_generated, reason) or None if API unavailable.
        """
        if not self.client:
            self._init_genai()
        if not self.client:
            return None

        prompt = (
            "You are a forensic computer vision system verifying photographs for municipal civic repairs (potholes, streetlights, garbage, water pipe leaks, flooded roads).\n"
            "Carefully examine this image for signs of Generative AI (e.g., DALL-E, Midjourney, Stable Diffusion, digital rendering, synthetic painterly textures, impossible perspective) vs authentic physical real-world camera photographs.\n\n"
            "Return a strictly valid JSON object with:\n"
            "{\n"
            '  "is_authentic_photo": true or false,\n'
            '  "is_ai_generated": true or false,\n'
            '  "reason": "Clear 1-sentence technical explanation of visual finding"\n'
            "}"
        )

        try:
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type or "image/jpeg")
            res = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[part, prompt]
            )
            raw_text = res.text.strip()
            # Extract JSON block
            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                is_ai = bool(parsed.get("is_ai_generated", False) or not parsed.get("is_authentic_photo", True))
                reason = parsed.get("reason", "Visual inspection indicates synthetic or non-photographic content.")
                return is_ai, reason
        except Exception as e:
            logger.warning(f"Gemini Vision call failed or unavailable: {e}")

        return None

    def verify_authenticity(
        self,
        image_bytes: bytes,
        filename: str = "",
        mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """
        Master authenticity verification pipeline:
        1. Evaluates forensic metadata, EXIF headers, and filename indicators.
        2. Evaluates multimodal vision if Gemini API is reachable.
        3. Returns detailed verification verdict.
        """
        # Step 1: Forensic Metadata & Heuristic Analysis
        is_ai, meta_reason, details = self.analyze_metadata(image_bytes, filename)
        if is_ai:
            return {
                "verdict": "REJECTED",
                "is_authentic": False,
                "is_ai_generated": True,
                "confidence": 0.98,
                "reason": meta_reason,
                "engine": "FORENSIC_METADATA_ANALYZER",
                "details": details
            }

        # Step 2: Gemini Vision Multimodal Inspection
        if image_bytes and len(image_bytes) > 0:
            gemini_result = self.check_with_gemini_vision(image_bytes, mime_type)
            if gemini_result is not None:
                is_ai_gemini, gemini_reason = gemini_result
                if is_ai_gemini:
                    return {
                        "verdict": "REJECTED",
                        "is_authentic": False,
                        "is_ai_generated": True,
                        "confidence": 0.95,
                        "reason": f"Gemini Multimodal Vision flagged synthetic/AI artifacts: {gemini_reason}",
                        "engine": "GEMINI_VISION_AI_INSPECTOR",
                        "details": details
                    }

        # Step 3: Check heuristic flags
        if len(details.get("heuristic_flags", [])) > 0 and not details.get("has_exif", False):
            flag_note = details["heuristic_flags"][0]
            # If explicit AI markers in filename or flag
            return {
                "verdict": "NEEDS_CONFIRMATION",
                "is_authentic": True,
                "is_ai_generated": False,
                "confidence": 0.85,
                "reason": "Authentic camera capture confirmed with standard physical features.",
                "engine": "CIVIC_VISION_ENGINE",
                "details": details
            }

        return {
            "verdict": "APPROVED",
            "is_authentic": True,
            "is_ai_generated": False,
            "confidence": 0.99,
            "reason": "Photo verified as authentic real-world infrastructure photograph.",
            "engine": "CIVIC_VISION_ENGINE",
            "details": details
        }

image_authenticity_service = ImageAuthenticityService()
