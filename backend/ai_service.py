import re
from typing import Dict, Tuple, List
import math


class AIDetector:
    """Advanced AI-generated content detector with multi-signal confidence scoring."""

    AI_MARKERS = {
        "structural": {
            "features": [
                r"^in conclusion",
                r"^to summarize",
                r"^the purpose of this",
                r"as mentioned above",
                r"in summary",
                r"this paper discusses",
                r"it is important to note",
                r"in today's world",
                r"plays a crucial role",
                r"in the realm of",
            ],
            "weight": 0.12,
            "description": "Structural markers common in AI text",
        },
        "vocabulary": {
            "features": [
                "provide comprehensive analysis",
                "essential aspect",
                "significant importance",
                "furthermore",
                "therefore",
                "in addition",
                "enhanced understanding",
                "optimal solution",
                "multifaceted approach",
                "delve into",
                "landscape of",
                "tapestry of",
                "it is worth noting",
                "robust framework",
                "leverage",
                "utilize",
                "facilitate",
                "paramount",
                "myriad",
                "plethora",
            ],
            "weight": 0.18,
            "description": "Academic/AI vocabulary patterns",
        },
        "hedging": {
            "features": [
                "it seems that",
                "it appears that",
                "one might argue",
                "could potentially",
                "may suggest",
                "it is possible that",
                "generally speaking",
                "to some extent",
            ],
            "weight": 0.10,
            "description": "Hedging language overuse",
        },
        "formatting": {
            "features": [
                r"\b(Table|Figure|Graph)\s+\d+",
                r"\[citations?\]",
                r"\(source\)",
                r"References:",
                r"Bibliography:",
            ],
            "weight": 0.08,
            "description": "Excessive formatting elements",
        },
        "lack_of_personal": {
            "features": [],
            "weight": 0.12,
            "description": "Absence of personal voice",
        },
        "repetition": {
            "features": [],
            "weight": 0.10,
            "description": "Repetitive word usage",
        },
    }

    HUMAN_MARKERS = [
        r"\bI\b", r"\bwe\b", r"\bmy\b", r"\bour\b",
        r"!", r"\?", r"honestly", r"personally", r"in my experience",
    ]

    def normalize_text(self, text: str) -> str:
        return text.lower().strip()

    def count_marker_occurrences(self, text: str, markers: list) -> Tuple[int, float]:
        count = 0
        text_lower = text.lower()
        for marker in markers:
            try:
                if marker.startswith("^") or "\\b" in marker or "(" in marker:
                    matches = re.findall(marker, text_lower, re.MULTILINE | re.IGNORECASE)
                    count += len(matches)
                else:
                    count += text_lower.count(marker)
            except Exception:
                pass
        score = min(count * 8, 100)
        return count, score

    def analyze_vocabulary_diversity(self, text: str) -> Tuple[float, str]:
        words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
        if len(words) < 20:
            return 50.0, "Insufficient text for diversity analysis"
        unique_words = set(words)
        diversity = (len(unique_words) / len(words)) * 100
        label = "Natural diversity" if diversity > 55 else "Low diversity (AI-like)"
        return round(diversity, 1), label

    def analyze_sentence_length_variance(self, text: str) -> Tuple[float, str]:
        sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip() and len(s.split()) > 2]
        if len(sentences) < 4:
            return 50.0, "Insufficient sentences"
        lengths = [len(s.split()) for s in sentences]
        mean = sum(lengths) / len(lengths)
        variance = sum((x - mean) ** 2 for x in lengths) / len(lengths)
        std_dev = math.sqrt(variance)
        burstiness = std_dev / mean if mean > 0 else 0
        variance_score = min(burstiness * 100, 100)
        label = "Natural burstiness" if variance_score > 35 else "Uniform sentences (AI-like)"
        return round(variance_score, 1), label

    def check_repetitive_patterns(self, text: str) -> Tuple[float, int]:
        words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
        if len(words) < 15:
            return 50.0, 0
        word_freq = {}
        for word in words:
            if len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        repetitive = [w for w, f in word_freq.items() if f > max(3, len(words) * 0.04)]
        repetition_score = min((len(repetitive) / max(len(word_freq), 1)) * 200, 100)
        return round(repetition_score, 1), len(repetitive)

    def analyze_transition_words(self, text: str) -> float:
        transition_words = [
            "furthermore", "moreover", "therefore", "thus", "hence",
            "in addition", "additionally", "however", "nevertheless",
            "consequently", "as a result", "subsequently", "meanwhile",
            "on the other hand", "in contrast", "notably", "importantly",
        ]
        text_lower = text.lower()
        count = sum(text_lower.count(w) for w in transition_words)
        words_total = len(text.split())
        if words_total == 0:
            return 50.0
        frequency = (count / words_total) * 100
        return round(min((frequency / 0.025) * 100, 100), 1)

    def analyze_personal_voice(self, text: str) -> Tuple[float, int]:
        """Low personal voice suggests AI-generated content."""
        count = 0
        for marker in self.HUMAN_MARKERS:
            count += len(re.findall(marker, text, re.IGNORECASE))
        words = len(text.split())
        if words < 50:
            return 50.0, count
        ratio = count / words * 100
        personal_score = max(0, 100 - ratio * 30)
        return round(personal_score, 1), count

    def analyze_perplexity_proxy(self, text: str) -> Tuple[float, str]:
        """Proxy for text predictability — AI text tends to be more predictable."""
        words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
        if len(words) < 30:
            return 50.0, "Insufficient data"
        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)]
        unique_bigrams = len(set(bigrams))
        predictability = (unique_bigrams / len(bigrams)) * 100
        ai_likelihood = max(0, 100 - predictability)
        label = "Predictable patterns" if ai_likelihood > 55 else "Varied word patterns"
        return round(ai_likelihood, 1), label

    def analyze_punctuation_variance(self, text: str) -> Tuple[float, str]:
        sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
        if len(sentences) < 5:
            return 50.0, "Insufficient data"
        punct_counts = [len(re.findall(r"[,;:—-]", s)) for s in sentences]
        mean = sum(punct_counts) / len(punct_counts)
        variance = sum((x - mean) ** 2 for x in punct_counts) / len(punct_counts)
        score = min(math.sqrt(variance) * 25, 100)
        label = "Natural punctuation variance" if score > 30 else "Uniform punctuation"
        return round(score, 1), label

    def detect(self, text: str) -> Dict:
        if not text or not text.strip():
            return {"status": "error", "message": "Empty text submitted"}

        word_count = len(text.split())
        category_scores: Dict[str, float] = {}
        markers_found: List[Dict] = []

        for category, data in self.AI_MARKERS.items():
            if category == "repetition":
                score, count = self.check_repetitive_patterns(text)
                markers_found.append({
                    "category": "Repetitive Patterns",
                    "score": score,
                    "count": count,
                    "weight": data["weight"],
                    "description": data["description"],
                })
                category_scores[category] = score
            elif category == "lack_of_personal":
                score, count = self.analyze_personal_voice(text)
                markers_found.append({
                    "category": "Personal Voice Absence",
                    "score": score,
                    "count": count,
                    "weight": data["weight"],
                    "description": data["description"],
                })
                category_scores[category] = score
            else:
                count, score = self.count_marker_occurrences(text, data["features"])
                markers_found.append({
                    "category": category.replace("_", " ").title(),
                    "score": score,
                    "count": count,
                    "weight": data["weight"],
                    "description": data["description"],
                })
                category_scores[category] = score

        diversity_score, diversity_msg = self.analyze_vocabulary_diversity(text)
        variance_score, variance_msg = self.analyze_sentence_length_variance(text)
        transition_score = self.analyze_transition_words(text)
        perplexity_score, perplexity_msg = self.analyze_perplexity_proxy(text)
        punct_score, punct_msg = self.analyze_punctuation_variance(text)

        category_scores["vocabulary_diversity"] = diversity_score
        category_scores["sentence_variance"] = variance_score
        category_scores["transition_words"] = transition_score
        category_scores["perplexity_proxy"] = perplexity_score
        category_scores["punctuation_variance"] = punct_score

        overall_score, confidence, confidence_breakdown = self._calculate_overall_score(
            category_scores, word_count
        )

        return {
            "status": "success",
            "ai_score": overall_score,
            "confidence": confidence,
            "confidence_tier": self._confidence_tier(confidence),
            "human_score": round(100 - overall_score, 1),
            "classification": self._classify_ai_content(overall_score),
            "risk_level": self._risk_level(overall_score),
            "markers": sorted(markers_found, key=lambda x: x["score"], reverse=True)[:8],
            "confidence_breakdown": confidence_breakdown,
            "analysis": {
                "vocabulary_diversity": diversity_score,
                "vocabulary_label": diversity_msg,
                "sentence_burstiness": variance_score,
                "burstiness_label": variance_msg,
                "transition_word_usage": transition_score,
                "perplexity_proxy": perplexity_score,
                "perplexity_label": perplexity_msg,
                "punctuation_variance": punct_score,
                "punctuation_label": punct_msg,
                "word_count": word_count,
                "total_markers_found": len([m for m in markers_found if m["score"] > 15]),
                "detection_model": "Multi-Signal Linguistic Analysis v2.1",
            },
        }

    def _calculate_overall_score(
        self, scores: Dict[str, float], word_count: int
    ) -> Tuple[float, float, Dict]:
        weights = {
            "vocabulary_diversity": 0.14,
            "sentence_variance": 0.14,
            "transition_words": 0.12,
            "perplexity_proxy": 0.14,
            "punctuation_variance": 0.08,
            "structural": 0.10,
            "vocabulary": 0.12,
            "hedging": 0.06,
            "lack_of_personal": 0.08,
            "repetition": 0.06,
            "formatting": 0.06,
        }

        invert_keys = {"vocabulary_diversity", "sentence_variance", "punctuation_variance"}

        total_score = 0.0
        total_weight = 0.0
        signal_values: List[float] = []

        for key, weight in weights.items():
            if key in scores:
                value = scores[key]
                if key in invert_keys:
                    value = 100 - value
                total_score += value * weight
                total_weight += weight
                signal_values.append(value)

        overall_score = total_score / total_weight if total_weight else 50.0

        if word_count < 100:
            overall_score = overall_score * 0.7 + 50 * 0.3

        std_dev = 0.0
        if len(signal_values) > 1:
            mean = sum(signal_values) / len(signal_values)
            std_dev = math.sqrt(sum((v - mean) ** 2 for v in signal_values) / len(signal_values))

        agreement = max(0, 100 - std_dev * 2)
        marker_strength = len([v for v in signal_values if v > 40]) / max(len(signal_values), 1) * 100
        text_length_factor = min(word_count / 300, 1) * 20

        confidence = min(97, 58 + agreement * 0.25 + marker_strength * 0.15 + text_length_factor)
        if word_count < 50:
            confidence = max(45, confidence - 25)

        confidence_breakdown = {
            "signal_agreement": round(agreement, 1),
            "marker_strength": round(marker_strength, 1),
            "text_length_factor": round(text_length_factor, 1),
            "signals_analyzed": len(signal_values),
        }

        return round(overall_score, 1), round(confidence, 1), confidence_breakdown

    def _confidence_tier(self, confidence: float) -> str:
        if confidence >= 85:
            return "Very High"
        if confidence >= 72:
            return "High"
        if confidence >= 58:
            return "Moderate"
        return "Low"

    def _risk_level(self, score: float) -> str:
        if score < 20:
            return "Low"
        if score < 40:
            return "Moderate"
        if score < 65:
            return "High"
        return "Critical"

    def _classify_ai_content(self, score: float) -> str:
        if score < 15:
            return "Likely Human-Written"
        if score < 30:
            return "Probably Human-Written"
        if score < 45:
            return "Mixed / Uncertain"
        if score < 60:
            return "Likely AI-Assisted"
        if score < 75:
            return "Likely AI-Generated"
        return "Highly Likely AI-Generated"
