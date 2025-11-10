import hashlib
import random


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def simhash64(text: str) -> int:
    """Sinh simhash 64-bit"""
    import re
    words = re.findall(r'\w+', text.lower())
    hash_bits = [0] * 64
    for w in words:
        h = int(hashlib.sha1(w.encode('utf-8')).hexdigest(), 16)
        for i in range(64):
            bitmask = 1 << i
            hash_bits[i] += 1 if h & bitmask else -1
    fingerprint = 0
    for i in range(64):
        if hash_bits[i] > 0:
            fingerprint |= 1 << i
    return fingerprint


def minhash_signature(text: str, k: int = 128) -> list[int]:
    """Tạo chữ ký MinHash (k giá trị băm nhỏ nhất)"""
    import re
    words = re.findall(r'\w+', text.lower())
    seed = 42
    hashes = []
    for i in range(k):
        random.seed(seed + i)
        a = random.randint(1, 2**32 - 1)
        b = random.randint(0, 2**32 - 1)
        min_hash = min((a * hash(w) + b) % (2**32) for w in words) if words else 0
        hashes.append(min_hash)
    return hashes


def jaccard_estimate(sig1: list[int], sig2: list[int]) -> float:
    """Ước lượng độ tương đồng giữa 2 chữ ký MinHash"""
    if not sig1 or not sig2:
        return 0.0
    matches = sum(1 for a, b in zip(sig1, sig2) if a == b)
    return matches / len(sig1)


def hamming_distance(a: int, b: int) -> int:
    """Tính Hamming distance giữa 2 simhash"""
    return bin(a ^ b).count("1")
