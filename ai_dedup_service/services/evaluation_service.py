from typing import List, Tuple, Dict

from sklearn.metrics import f1_score, precision_score, recall_score, accuracy_score, confusion_matrix


def calculate_dedup_metrics(y_true: List[int], y_pred: List[int]) -> Dict[str, object]:
    f1 = f1_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)
    accuracy = accuracy_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)
    tn = int(cm[0, 0])
    fp = int(cm[0, 1])
    fn = int(cm[1, 0])
    tp = int(cm[1, 1])
    return {
        "f1_score": round(f1 * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "accuracy": round(accuracy * 100, 2),
        "confusion_matrix": {"TP": tp, "FP": fp, "FN": fn, "TN": tn},
    }


def mock_evaluation_data() -> Tuple[List[int], List[int]]:
    y_true = [1] * 60 + [0] * 40
    y_pred = ([1] * 58 + [0] * 2) + ([0] * 36 + [1] * 4)
    return y_true, y_pred


def save_confusion_heatmap(y_true: List[int], y_pred: List[int], out_path: str = "dedup_confusion_matrix.png") -> str:
    import matplotlib.pyplot as plt
    import numpy as np

    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    ax.figure.colorbar(im, ax=ax)
    classes = ["Không trùng lặp", "Trùng lặp"]
    ax.set(xticks=np.arange(cm.shape[1]), yticks=np.arange(cm.shape[0]), xticklabels=classes, yticklabels=classes, ylabel="Thực tế", xlabel="Dự đoán")
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], "d"), ha="center", va="center", color="white" if cm[i, j] > thresh else "black")
    fig.tight_layout()
    plt.savefig(out_path, dpi=200)
    plt.close(fig)
    return out_path
