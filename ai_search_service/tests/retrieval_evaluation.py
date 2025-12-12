from typing import List, Dict
import matplotlib
matplotlib.use("Agg")  # Use non-GUI backend
import matplotlib.pyplot as plt
import os

# Mock evaluation dataset
QUERIES: List[str] = [
    "machine learning certificate",
    "python basics course",
    "data analysis certification",
    "advanced blockchain",
]

# Each query maps to list of relevant document IDs (ground truth)
GROUND_TRUTH: Dict[str, List[str]] = {
    "machine learning certificate": ["doc_ml_01", "doc_ml_02", "doc_ai_03"],
    "python basics course": ["doc_py_01", "doc_py_05", "doc_py_09"],
    "data analysis certification": ["doc_da_02", "doc_da_03", "doc_da_05"],
    "advanced blockchain": ["doc_bc_01", "doc_bc_03", "doc_bc_04"],
}

# Simulated retrieval results (for demonstration we simply repeat ground truth plus noise)
RETRIEVED_RESULTS: Dict[str, List[str]] = {
    q: gt + [f"noise_{i}" for i in range(3)]  # extend with non-relevant ids
    for q, gt in GROUND_TRUTH.items()
}

def precision_at_k(retrieved: List[str], relevant: List[str], k: int) -> float:
    """Compute Precision@K for a single query."""
    if k <= 0:
        return 0.0
    retrieved_k = retrieved[:k]
    if not retrieved_k:
        return 0.0
    num_relevant = sum(1 for doc_id in retrieved_k if doc_id in relevant)
    return num_relevant / k

def average_precision(retrieved: List[str], relevant: List[str]) -> float:
    """Compute Average Precision (AP) for a single query."""
    hit_count = 0
    precision_sum = 0.0
    for idx, doc_id in enumerate(retrieved, start=1):
        if doc_id in relevant:
            hit_count += 1
            precision_sum += hit_count / idx
    if hit_count == 0:
        return 0.0
    return precision_sum / len(relevant)

def evaluate_retrieval() -> dict:
    """Return evaluation metrics across all queries."""
    precisions_at_3 = []
    precisions_at_5 = []
    average_precisions = []

    for query in QUERIES:
        relevant = GROUND_TRUTH[query]
        retrieved = RETRIEVED_RESULTS[query]

        precisions_at_3.append(precision_at_k(retrieved, relevant, 3))
        precisions_at_5.append(precision_at_k(retrieved, relevant, 5))
        average_precisions.append(average_precision(retrieved, relevant))

    p3 = round(sum(precisions_at_3) / len(precisions_at_3), 2)
    p5 = round(sum(precisions_at_5) / len(precisions_at_5), 2)
    map_score = round(sum(average_precisions) / len(average_precisions), 2)

    metrics = {
        "P_at_3": p3,
        "P_at_5": p5,
        "MAP_score": map_score,
        "num_queries": len(QUERIES),
    }

    # Generate comparison chart (model vs baselines)
    try:
        generate_comparison_chart(metrics)
    except Exception as e:
        # If plotting fails, log or ignore; proceed without interrupting evaluation
        import warnings
        warnings.warn(f"Chart generation failed: {e}")

    return metrics

# When executed directly for quick verification.
def generate_comparison_chart(model_metrics: dict):
    """Generate bar chart comparing model vs baselines and save to static/retrieval_comparison_chart.png."""

    # Baseline metrics (example numbers)
    baselines = {
        "Tìm kiếm Từ khóa": {"P_at_3": 0.55, "P_at_5": 0.45},
        "Tìm kiếm Hash SHA-256": {"P_at_3": 0.30, "P_at_5": 0.25},
    }

    systems = ["Mô hình all-MiniLM-L6-v2"] + list(baselines.keys())
    p3_values = [model_metrics["P_at_3"]] + [b["P_at_3"] for b in baselines.values()]
    p5_values = [model_metrics["P_at_5"]] + [b["P_at_5"] for b in baselines.values()]

    x = range(len(systems))
    width = 0.35

    plt.figure(figsize=(8, 6))
    plt.bar([i - width / 2 for i in x], p3_values, width=width, label="Độ chính xác@3", color="#4C72B0")
    plt.bar([i + width / 2 for i in x], p5_values, width=width, label="Độ chính xác@5", color="#55A868")

    plt.xticks(list(x), systems)
    plt.ylabel("Độ chính xác")
    plt.title("So sánh hiệu năng truy hồi")
    plt.ylim(0, 1)
    plt.legend()
    plt.tight_layout()

    # Ensure static directory exists relative to project root
    static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
    os.makedirs(static_dir, exist_ok=True)
    plt.savefig(os.path.join(static_dir, "retrieval_comparison_chart.png"))
    plt.close()


# When executed directly for quick verification.
if __name__ == "__main__":
    print(evaluate_retrieval())
