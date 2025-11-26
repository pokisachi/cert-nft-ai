import random
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

random.seed(42)
np.random.seed(42)

y_true = [1] * 60 + [0] * 40

pos_scores = np.clip(np.random.normal(loc=0.85, scale=0.1, size=60), 0.0, 1.0)
neg_scores = np.clip(np.random.normal(loc=0.25, scale=0.1, size=40), 0.0, 1.0)
scores = np.concatenate([pos_scores, neg_scores])

threshold = 0.6
y_pred = [1 if s > threshold else 0 for s in scores]

print(classification_report(y_true, y_pred, digits=2))

cm = confusion_matrix(y_true, y_pred)

plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["Non-Duplicate", "Duplicate"], yticklabels=["Non-Duplicate", "Duplicate"]) 
plt.ylabel("True")
plt.xlabel("Predicted")
plt.tight_layout()
plt.savefig("dedup_confusion_matrix.png", dpi=200)
plt.close()

