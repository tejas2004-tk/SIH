import re
from typing import Dict, List, Tuple, Optional
from difflib import SequenceMatcher
import math


class PlagiarismDetector:
    """Optimized plagiarism detection with fast similarity and cross-file comparison."""

    KNOWN_SOURCES = {
        "wikipedia": {
            "snippets": [
                "climate change is a long-term shift in global temperatures",
                "global warming refers to the long-term warming",
                "anthropogenic climate change is primarily caused",
                "the greenhouse effect traps heat in the atmosphere",
                "carbon dioxide is a greenhouse gas",
                "renewable energy sources include solar wind and hydroelectric",
                "biodiversity loss threatens ecosystem stability worldwide",
            ],
            "weight": 0.6,
            "trustworthiness": 0.85,
        },
        "arxiv": {
            "snippets": [
                "machine learning models are trained on large datasets",
                "neural networks consist of interconnected layers",
                "deep learning has revolutionized artificial intelligence",
                "convolutional networks are effective for image processing",
                "transformer models have achieved state-of-the-art results",
                "gradient descent optimizes model parameters iteratively",
                "attention mechanisms allow models to focus on relevant inputs",
            ],
            "weight": 0.7,
            "trustworthiness": 0.9,
        },
        "nature_journal": {
            "snippets": [
                "scientific research requires rigorous methodology",
                "peer review ensures research quality",
                "empirical evidence supports our hypothesis",
                "statistical analysis reveals significant patterns",
                "our findings contribute to the field of knowledge",
                "the experimental results demonstrate a clear correlation",
                "further investigation is warranted to validate these claims",
            ],
            "weight": 0.75,
            "trustworthiness": 0.95,
        },
        "medium": {
            "snippets": [
                "introduction to web development",
                "getting started with python",
                "understanding javascript promises",
                "guide to react hooks",
                "best practices for coding",
                "building scalable applications with modern frameworks",
            ],
            "weight": 0.5,
            "trustworthiness": 0.6,
        },
        "academic_common": {
            "snippets": [
                "in recent years there has been growing interest",
                "this study aims to investigate the relationship",
                "the purpose of this research is to examine",
                "according to previous studies",
                "the results of this study indicate that",
                "limitations of this study include",
            ],
            "weight": 0.55,
            "trustworthiness": 0.7,
        },
    }

    def normalize_text(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"[^\w\s]", "", text)
        return text

    def _word_set(self, text: str) -> set:
        return set(self.normalize_text(text).split())

    def _word_list(self, text: str) -> List[str]:
        return self.normalize_text(text).split()

    def _quick_similarity(self, words_a: List[str], words_b: List[str]) -> float:
        """Fast bidirectional similarity. Checks how much B is covered by A and vice versa."""
        if not words_a or not words_b:
            return 0.0
        set_a = set(words_a)
        set_b = set(words_b)
        intersection = len(set_a & set_b)
        if intersection == 0:
            return 0.0
        # Bidirectional: best of (A covers B) and (B covers A) and Jaccard
        cov_a = intersection / len(set_b) * 100  # how much of B is in A
        cov_b = intersection / len(set_a) * 100  # how much of A is in B
        jaccard = intersection / len(set_a | set_b) * 100
        return round(max(cov_a, cov_b, jaccard), 2)

    def calculate_similarity(self, text1: str, text2: str) -> float:
        words_a = self._word_list(text1)
        words_b = self._word_list(text2)
        return self._quick_similarity(words_a, words_b)

    def ngram_overlap_score(self, text1: str, text2: str, n: int = 5) -> float:
        words_a = self._word_list(text1)
        words_b = self._word_list(text2)
        if len(words_a) < n or len(words_b) < n:
            return self._quick_similarity(words_a, words_b)
        ngrams_a = set()
        for i in range(len(words_a) - n + 1):
            ngrams_a.add(tuple(words_a[i:i + n]))
        ngrams_b = set()
        for i in range(len(words_b) - n + 1):
            ngrams_b.add(tuple(words_b[i:i + n]))
        if not ngrams_a or not ngrams_b:
            return 0.0
        overlap = len(ngrams_a & ngrams_b)
        union = len(ngrams_a | ngrams_b)
        return round((overlap / union) * 100, 2) if union else 0.0

    def find_chunk_matches(self, submitted_text: str, source_text: str, min_len: int = 20) -> List[Dict]:
        """Fast chunk matching — uses word-set pre-screening instead of SequenceMatcher on every pair."""
        words_sub = self._word_list(submitted_text)
        words_src = self._word_list(source_text)
        if len(words_sub) < 5 or len(words_src) < 5:
            return []

        matches = []
        seen = set()
        window = min(10, len(words_sub), len(words_src))

        for i in range(len(words_sub) - window + 1):
            chunk_words = words_sub[i:i + window]
            chunk_text = " ".join(chunk_words)
            if len(chunk_text) < min_len or chunk_text in seen:
                continue

            chunk_set = set(chunk_words)
            best_j = -1
            best_sim = 0.0

            for j in range(len(words_src) - window + 1):
                src_words = words_src[j:j + window]
                src_set = set(src_words)
                overlap = len(chunk_set & src_set)
                if overlap < window * 0.4:
                    continue
                sim = overlap / len(chunk_set | src_set) * 100 if (chunk_set | src_set) else 0
                if sim > best_sim:
                    best_sim = sim
                    best_j = j

            if best_sim >= 70 and best_j >= 0:
                seen.add(chunk_text)
                matches.append({
                    "chunk": chunk_text[:120],
                    "similarity": round(best_sim, 1),
                    "window_size": window,
                })
                if len(matches) >= 5:
                    break

        return matches

    def find_external_matches(self, submitted_text: str, min_similarity: float = 20) -> List[Dict]:
        matches = []
        sub_words = self._word_list(submitted_text)
        sub_set = set(sub_words)

        for source_name, source_data in self.KNOWN_SOURCES.items():
            for snippet in source_data["snippets"]:
                src_words = self._word_list(snippet)
                src_set = set(src_words)

                overlap = len(sub_set & src_set)
                if overlap == 0:
                    continue

                # Bidirectional coverage check
                cov_sub = overlap / len(src_set) * 100  # how much of snippet is in submitted
                jaccard = overlap / len(sub_set | src_set) * 100
                quick_sim = max(cov_sub, jaccard)

                if quick_sim < min_similarity * 0.3:
                    continue

                ngram_sim = self.ngram_overlap_score(submitted_text, snippet, n=5)
                similarity = max(quick_sim, ngram_sim)

                if similarity >= min_similarity:
                    chunks = self.find_chunk_matches(submitted_text, snippet)
                    confidence = self._calculate_match_confidence(
                        similarity, source_data["trustworthiness"], source_data["weight"], len(chunks)
                    )
                    matches.append({
                        "source": source_name.replace("_", " ").title(),
                        "source_type": "external",
                        "similarity": round(similarity, 1),
                        "confidence": confidence,
                        "matched_text": snippet[:150] + ("..." if len(snippet) > 150 else ""),
                        "trustworthiness": round(source_data["trustworthiness"] * 100, 1),
                        "chunks": chunks,
                    })

        matches.sort(key=lambda x: x["confidence"], reverse=True)
        return matches[:8]

    def compare_documents(self, doc_a: str, doc_b: str, name_a: str, name_b: str) -> Dict:
        words_a = self._word_list(doc_a)
        words_b = self._word_list(doc_b)
        set_a = set(words_a)
        set_b = set(words_b)
        overlap = len(set_a & set_b)
        union = len(set_a | set_b)
        quick_sim = (overlap / union * 100) if union else 0

        if quick_sim < 5:
            return {
                "file_a": name_a, "file_b": name_b,
                "similarity": round(quick_sim, 1),
                "sequence_similarity": round(quick_sim, 1),
                "ngram_similarity": 0.0,
                "confidence": 90.0,
                "risk_level": self._risk_level(quick_sim),
                "matched_chunks": [],
                "is_suspicious": False,
            }

        ngram_sim = self.ngram_overlap_score(doc_a, doc_b, n=5)
        combined = round(quick_sim * 0.5 + ngram_sim * 0.5, 1)

        chunks = []
        if combined >= 15:
            chunks = self.find_chunk_matches(doc_a, doc_b)

        confidence = self._calculate_cross_file_confidence(combined, len(chunks), len(doc_a), len(doc_b))

        return {
            "file_a": name_a, "file_b": name_b,
            "similarity": combined,
            "sequence_similarity": round(quick_sim, 1),
            "ngram_similarity": ngram_sim,
            "confidence": confidence,
            "risk_level": self._risk_level(combined),
            "matched_chunks": chunks,
            "is_suspicious": combined >= 25,
        }

    def compare_batch(self, documents: List[Dict]) -> Dict:
        pairs = []
        matrix = {}

        for i in range(len(documents)):
            for j in range(i + 1, len(documents)):
                doc_a = documents[i]
                doc_b = documents[j]
                comparison = self.compare_documents(
                    doc_a["text"], doc_b["text"], doc_a["filename"], doc_b["filename"]
                )
                pairs.append(comparison)
                key = f"{doc_a['filename']}||{doc_b['filename']}"
                matrix[key] = comparison["similarity"]

        pairs.sort(key=lambda x: x["similarity"], reverse=True)
        suspicious = [p for p in pairs if p["is_suspicious"]]

        overall_cross_score = round(
            sum(p["similarity"] for p in pairs[:3]) / min(len(pairs), 3), 1
        ) if pairs else 0

        batch_confidence = self._calculate_batch_confidence(pairs, len(documents))

        return {
            "total_files": len(documents),
            "total_comparisons": len(pairs),
            "suspicious_pairs": len(suspicious),
            "overall_cross_similarity": overall_cross_score,
            "batch_confidence": batch_confidence,
            "risk_level": self._risk_level(overall_cross_score),
            "pairs": pairs,
            "matrix": matrix,
            "top_matches": pairs[:5],
        }

    def _calculate_match_confidence(self, similarity, trustworthiness, weight, chunk_count):
        sim_factor = similarity / 100
        chunk_boost = min(chunk_count * 0.05, 0.15)
        raw = (sim_factor * weight * trustworthiness) + chunk_boost
        return round(min(raw * 100, 98), 1)

    def _calculate_cross_file_confidence(self, similarity, chunk_count, len_a, len_b):
        base = 55 + (similarity * 0.35)
        chunk_boost = min(chunk_count * 4, 20)
        length_factor = min(len_a, len_b) / max(len_a, len_b, 1)
        length_boost = length_factor * 10
        return round(min(base + chunk_boost + length_boost, 97), 1)

    def _calculate_batch_confidence(self, pairs, file_count):
        if not pairs:
            return 95.0 if file_count == 1 else 88.0
        avg_conf = sum(p["confidence"] for p in pairs) / len(pairs)
        agreement = len([p for p in pairs if p["similarity"] < 15]) / len(pairs)
        return round(min(avg_conf * 0.6 + agreement * 40, 96), 1)

    def _calculate_overall_score(self, matches, cross_batch=None):
        if not matches and (not cross_batch or cross_batch.get("overall_cross_similarity", 0) == 0):
            return 0.0, 94.0

        external_score = 0.0
        if matches:
            total_weight = 0
            weighted_sum = 0
            for i, match in enumerate(matches[:5]):
                weight = 1 / (i + 1)
                weighted_sum += match["similarity"] * weight
                total_weight += weight
            external_score = weighted_sum / total_weight if total_weight else 0

        cross_score = cross_batch.get("overall_cross_similarity", 0) if cross_batch else 0
        overall = round(external_score * 0.55 + cross_score * 0.45, 1)

        high_conf_matches = len([m for m in matches if m.get("confidence", 0) > 65])
        suspicious_pairs = cross_batch.get("suspicious_pairs", 0) if cross_batch else 0

        signal_count = high_conf_matches + suspicious_pairs + (1 if overall > 20 else 0)
        confidence = min(96, 62 + signal_count * 5 + (10 if len(matches) > 2 else 0))

        if overall < 5:
            confidence = max(confidence, 91)

        return overall, round(confidence, 1)

    def _risk_level(self, score):
        if score < 10: return "Low"
        if score < 25: return "Moderate"
        if score < 45: return "High"
        return "Critical"

    def _get_recommendation(self, score, cross_batch=None):
        cross_note = ""
        if cross_batch and cross_batch.get("suspicious_pairs", 0) > 0:
            cross_note = f" {cross_batch['suspicious_pairs']} suspicious cross-file match(es) found."
        if score < 10:
            return f"Original content — no significant plagiarism detected.{cross_note}"
        if score < 20:
            return f"Minor similarity detected — review citations recommended.{cross_note}"
        if score < 35:
            return f"Moderate plagiarism indicators — manual review required.{cross_note}"
        if score < 50:
            return f"Significant plagiarism detected — investigation recommended.{cross_note}"
        return f"Critical plagiarism level — immediate action required.{cross_note}"

    def analyze(self, submitted_text, cross_batch=None):
        if not submitted_text or not submitted_text.strip():
            return {"status": "error", "message": "Empty text submitted"}

        matches = self.find_external_matches(submitted_text)
        overall_score, confidence = self._calculate_overall_score(matches, cross_batch)

        return {
            "status": "success",
            "overall_score": overall_score,
            "confidence": confidence,
            "confidence_tier": self._confidence_tier(confidence),
            "matches": matches,
            "cross_file_analysis": cross_batch,
            "recommendation": self._get_recommendation(overall_score, cross_batch),
            "risk_level": self._risk_level(overall_score),
            "originality_score": round(100 - overall_score, 1),
            "analysis": {
                "matches_found": len(matches),
                "high_confidence_matches": len([m for m in matches if m.get("confidence", 0) > 70]),
                "analysis_type": "Multi-Source + Cross-File Similarity Detection",
                "methods": ["word_set_similarity", "ngram_overlap", "chunk_detection", "cross_file_matrix"],
            },
        }

    def _confidence_tier(self, confidence):
        if confidence >= 85: return "Very High"
        if confidence >= 72: return "High"
        if confidence >= 58: return "Moderate"
        return "Low"
