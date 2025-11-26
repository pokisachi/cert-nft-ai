import itertools
import logging
import math
import random
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple

from models import (
    Course,
    Teacher,
    Room,
    Enrollment,
    ScheduledClass,
    ScheduledEnrollment,
    ScheduleResult,
)
from config import settings

logger = logging.getLogger(__name__)

HARD_PENALTY = 500000
VIOLATION_PENALTY = 20000
ASSIGNED_REWARD = 1000
UNASSIGNED_PENALTY = 2000
UNASSIGNED_HARD_PENALTY = 50000
GHOST_CLASS_PENALTY = 5000
VALID_SCHEDULE_BONUS = 50000
BASELINE_SCORE = 1_000_000
UNQUALIFIED_PENALTY = 5000
CAPACITY_PENALTY_UNIT = 50000
SOFT_AVAIL_MATCH_REWARD = 50


@dataclass
class ClassAssignment:
    teacher_id: str
    room_id: str
    slots: Tuple[str, ...]
    student_ids: Set[int] = field(default_factory=set)


@dataclass
class Individual:
    classes: List[ClassAssignment]
    unassigned_students: Set[int] = field(default_factory=set)


def genetic_algorithm(
    course: Course,
    teachers: List[Teacher],
    rooms: List[Room],
    enrollments: List[Enrollment],
) -> ScheduleResult:
    if not teachers:
        raise ValueError("Khong co giao vien nao kha dung.")
    if not rooms:
        raise ValueError("Khong co phong hoc nao kha dung.")
    if not enrollments:
        raise ValueError("Khong co hoc vien nao dang ky.")

    max_capacity = max(room.capacity for room in rooms)
    positive_capacities = [room.capacity for room in rooms if room.capacity > 0]
    min_capacity = min(positive_capacities) if positive_capacities else max_capacity
    base_class_count = max(1, math.ceil(len(enrollments) / max_capacity))
    min_based_count = (
        max(1, math.ceil(len(enrollments) / min_capacity)) if min_capacity else base_class_count
    )
    num_classes = max(base_class_count, min_based_count)
    lessons_per_week = getattr(course, "structure_lessons_per_week", 3)

    teachers_by_id: Dict[str, Teacher] = {t.id: t for t in teachers}
    rooms_by_id: Dict[str, Room] = {r.id: r for r in rooms}
    enrollments_by_id: Dict[int, Enrollment] = {e.id: e for e in enrollments}
    enrollment_slot_sets: Dict[int, Set[str]] = {
        e.id: set(e.availableSlots) for e in enrollments
    }

    slot_pool: List[str] = sorted(
        set(slot for teacher in teachers for slot in teacher.availability)
        | set(slot for room in rooms for slot in room.availability)
        | set(slot for enrollment in enrollments for slot in enrollment.availableSlots)
    )
    slot_pool_set: Set[str] = set(slot_pool)

    if not slot_pool:
        raise ValueError("Khong tim thay bat ky time slot nao de lap lich.")

    student_combo_map: Dict[int, List[Tuple[str, ...]]] = {}
    combo_student_map: Dict[Tuple[str, ...], Set[int]] = {}

    for enrollment in enrollments:
        student_slots = sorted(slot_pool_set & set(enrollment.availableSlots))
        if len(student_slots) < lessons_per_week:
            continue
        combos = set(itertools.combinations(student_slots, lessons_per_week))
        if not combos:
            continue
        student_combo_map[enrollment.id] = list(combos)
        for combo in combos:
            combo_student_map.setdefault(combo, set()).add(enrollment.id)

    def teacher_supports_course(teacher: Teacher) -> bool:
        if not course.requirement_qualification:
            return True
        return any(
            course.requirement_qualification in qual for qual in teacher.qualifications
        )

    qualified_teachers = [t for t in teachers if teacher_supports_course(t)]
    qualification_enforced = len(qualified_teachers) > 0
    if not qualified_teachers:
        qualified_teachers = teachers

    max_classes_possible = settings.MAX_CLASSES_PER_TEACHER * max(
        1, len(qualified_teachers)
    )
    num_classes = max(1, min(num_classes, max_classes_possible))

    template_candidate_students: Dict[
        Tuple[str, str, Tuple[str, ...]], Set[int]
    ] = {}
    combo_templates: Dict[Tuple[str, ...], List[Tuple[str, str, Tuple[str, ...]]]] = {}

    for teacher in qualified_teachers:
        teacher_slots = set(teacher.availability)
        if not teacher_slots:
            continue
        for room in rooms:
            room_slots = set(room.availability) if room.availability else slot_pool_set
            if not room_slots:
                room_slots = slot_pool_set
            for combo, students_for_combo in combo_student_map.items():
                combo_set = set(combo)
                if not combo_set.issubset(teacher_slots):
                    continue
                if not combo_set.issubset(room_slots):
                    continue
                template = (teacher.id, room.id, combo)
                template_candidate_students[template] = set(students_for_combo)
                combo_templates.setdefault(combo, []).append(template)

    if template_candidate_students:
        valid_templates = list(template_candidate_students.keys())
        feasible_combos = {tpl[2] for tpl in valid_templates}
        combo_student_map = {
            combo: combo_student_map[combo] for combo in feasible_combos
        }
        for student_id, combos in list(student_combo_map.items()):
            filtered = [combo for combo in combos if combo in feasible_combos]
            student_combo_map[student_id] = filtered
    else:
        valid_templates = []
        for teacher in qualified_teachers:
            teacher_slots = set(teacher.availability)
            if not teacher_slots:
                continue
            for room in rooms:
                room_slots = set(room.availability) if room.availability else slot_pool_set
                shared_slots = sorted(teacher_slots & room_slots)
                if len(shared_slots) < lessons_per_week:
                    continue
                for combo in itertools.combinations(shared_slots, lessons_per_week):
                    template = (teacher.id, room.id, combo)
                    valid_templates.append(template)
                    template_candidate_students.setdefault(template, set())
                    combo_templates.setdefault(combo, []).append(template)

    if not valid_templates:
        raise ValueError("Khong the tao lop hoc vi thieu ket hop giao vien/phong/slot.")

    template_weights = [
        max(1, len(template_candidate_students.get(template, set())))
        for template in valid_templates
    ]

    student_templates: Dict[int, List[Tuple[str, str, Tuple[str, ...]]]] = {}
    for student_id, slots in enrollment_slot_sets.items():
        options = [
            template
            for template in valid_templates
            if set(template[2]).issubset(slots)
        ]
        student_templates[student_id] = options

    def has_conflict(
        template: Tuple[str, str, Tuple[str, ...]], existing: List[ClassAssignment]
    ) -> bool:
        teacher_id, room_id, slots = template
        slot_set = set(slots)
        for cls in existing:
            other_slots = set(cls.slots)
            if cls.teacher_id == teacher_id and slot_set & other_slots:
                return True
            if cls.room_id == room_id and slot_set & other_slots:
                return True
        return False

    def create_random_class(existing: List[ClassAssignment]) -> ClassAssignment:
        available_templates = valid_templates[:]
        available_weights = template_weights[:]
        attempts = 0

        while available_templates and attempts < len(valid_templates) * 2:
            template = random.choices(
                available_templates, weights=available_weights, k=1
            )[0]
            idx = available_templates.index(template)
            if not has_conflict(template, existing):
                teacher_id, room_id, slots = template
                return ClassAssignment(
                    teacher_id=teacher_id,
                    room_id=room_id,
                    slots=tuple(sorted(slots)),
                    student_ids=set(),
                )
            # Loai bo template bi xung dot va thu lai
            available_templates.pop(idx)
            available_weights.pop(idx)
            attempts += 1

        teacher_id, room_id, slots = random.choice(valid_templates)
        return ClassAssignment(
            teacher_id=teacher_id,
            room_id=room_id,
            slots=tuple(sorted(slots)),
            student_ids=set(),
        )

    def create_targeted_class(
        student_id: int, existing: List[ClassAssignment]
    ) -> ClassAssignment | None:
        combos = student_combo_map.get(student_id, [])
        if not combos:
            return None
        shuffled_combos = combos[:]
        random.shuffle(shuffled_combos)

        for combo in shuffled_combos:
            templates = combo_templates.get(combo, [])
            if not templates:
                continue
            shuffled_templates = templates[:]
            random.shuffle(shuffled_templates)
            for template in shuffled_templates:
                if has_conflict(template, existing):
                    continue
                teacher_id, room_id, slots = template
                return ClassAssignment(
                    teacher_id=teacher_id,
                    room_id=room_id,
                    slots=tuple(sorted(slots)),
                    student_ids={student_id},
                )
        return None

    def build_complete_assignment_via_backtracking() -> List[ClassAssignment]:
        for student_id, options in student_templates.items():
            if not options:
                raise ValueError(
                    f"Khong the tao lop hop le cho hoc vien {student_id} vi thieu ket hop slot/phong/giao vien."
                )

        ordered_students = sorted(
            student_templates.keys(), key=lambda sid: len(student_templates[sid])
        )

        classes_map: Dict[Tuple[str, str, Tuple[str, ...]], Set[int]] = {}
        teacher_slot_usage: Dict[
            Tuple[str, str], Tuple[str, str, Tuple[str, ...]]
        ] = {}
        room_slot_usage: Dict[Tuple[str, str], Tuple[str, str, Tuple[str, ...]]] = {}
        teacher_class_count: Dict[str, int] = defaultdict(int)

        def assign(student_index: int) -> bool:
            if student_index >= len(ordered_students):
                return True

            student_id = ordered_students[student_index]
            template_options = []

            for template in student_templates[student_id]:
                teacher_id, room_id, slots = template
                assigned_set = classes_map.get(template, set())
                room_capacity = rooms_by_id[room_id].capacity

                if len(assigned_set) >= room_capacity:
                    continue

                if not assigned_set and teacher_class_count[teacher_id] >= settings.MAX_CLASSES_PER_TEACHER:
                    continue

                conflict = False
                for slot in slots:
                    if (teacher_id, slot) in teacher_slot_usage and teacher_slot_usage[(teacher_id, slot)] != template:
                        conflict = True
                        break
                    if (room_id, slot) in room_slot_usage and room_slot_usage[(room_id, slot)] != template:
                        conflict = True
                        break
                if conflict:
                    continue

                template_options.append(template)

            if not template_options:
                return False

            template_options.sort(
                key=lambda tpl: (
                    len(classes_map.get(tpl, set())),
                    len(template_candidate_students.get(tpl, set())),
                    rooms_by_id[tpl[1]].capacity,
                ),
                reverse=True,
            )

            for template in template_options:
                teacher_id, room_id, slots = template
                assigned_set = classes_map.get(template)
                is_new_class = assigned_set is None or len(assigned_set) == 0

                if assigned_set is None:
                    classes_map[template] = set()
                classes_map[template].add(student_id)

                if is_new_class:
                    teacher_class_count[teacher_id] += 1
                    for slot in slots:
                        teacher_slot_usage[(teacher_id, slot)] = template
                        room_slot_usage[(room_id, slot)] = template

                if assign(student_index + 1):
                    return True

                classes_map[template].remove(student_id)
                if is_new_class:
                    teacher_class_count[teacher_id] -= 1
                    for slot in slots:
                        teacher_slot_usage.pop((teacher_id, slot), None)
                        room_slot_usage.pop((room_id, slot), None)
                    classes_map.pop(template, None)
                elif not classes_map[template]:
                    classes_map.pop(template, None)

            return False

        if not assign(0):
            raise ValueError("Khong the lap lich thoa man cho tat ca hoc vien.")

        result_classes = [
            ClassAssignment(
                teacher_id=template[0],
                room_id=template[1],
                slots=tuple(sorted(template[2])),
                student_ids=set(students),
            )
            for template, students in classes_map.items()
        ]

        return result_classes

    def clone_individual(individual: Individual) -> Individual:
        return Individual(
            classes=[
                ClassAssignment(
                    teacher_id=cls.teacher_id,
                    room_id=cls.room_id,
                    slots=cls.slots,
                    student_ids=set(cls.student_ids),
                )
                for cls in individual.classes
            ],
            unassigned_students=set(individual.unassigned_students),
        )

    def assign_students_greedily(individual: Individual) -> None:
        unassigned = set(enrollments_by_id.keys())
        class_candidates = []

        for cls in individual.classes:
            template_key = (cls.teacher_id, cls.room_id, cls.slots)
            candidates = template_candidate_students.get(template_key, set()).copy()
            class_candidates.append((cls, candidates))

        class_candidates.sort(key=lambda item: len(item[1]), reverse=True)

        for cls, candidates in class_candidates:
            capacity = rooms_by_id[cls.room_id].capacity
            for student_id in list(candidates):
                if student_id not in unassigned:
                    continue
                student_slots = enrollment_slot_sets.get(student_id)
                if not student_slots or not set(cls.slots).issubset(student_slots):
                    continue
                cls.student_ids.add(student_id)
                unassigned.discard(student_id)
                if len(cls.student_ids) >= capacity:
                    break

        for student_id in list(unassigned):
            slots = enrollment_slot_sets.get(student_id)
            if not slots:
                continue
            candidates = [
                cls
                for cls in individual.classes
                if len(cls.student_ids) < rooms_by_id[cls.room_id].capacity
                and set(cls.slots).issubset(slots)
            ]
            if not candidates:
                continue
            candidates.sort(
                key=lambda c: len(c.student_ids) / max(1, rooms_by_id[c.room_id].capacity),
                reverse=True,
            )
            selected = candidates[0]
            selected.student_ids.add(student_id)
            unassigned.discard(student_id)

        individual.unassigned_students = unassigned

    def create_random_individual() -> Individual:
        classes: List[ClassAssignment] = []
        for _ in range(num_classes):
            classes.append(create_random_class(classes))
        individual = Individual(classes=classes, unassigned_students=set())
        assign_students_greedily(individual)
        return individual

    def enforce_resource_conflicts(individual: Individual) -> None:
        teacher_usage: Dict[str, Set[str]] = {}
        room_usage: Dict[str, Set[str]] = {}

        for idx, cls in enumerate(individual.classes):
            attempts = 0
            while True:
                conflict = False
                slot_set = set(cls.slots)
                for used_slot in slot_set:
                    if used_slot in teacher_usage.get(cls.teacher_id, set()):
                        conflict = True
                        break
                    if used_slot in room_usage.get(cls.room_id, set()):
                        conflict = True
                        break
                if not conflict:
                    teacher_usage.setdefault(cls.teacher_id, set()).update(slot_set)
                    room_usage.setdefault(cls.room_id, set()).update(slot_set)
                    break
                attempts += 1
                replacement = create_random_class(
                    [individual.classes[i] for i in range(len(individual.classes)) if i != idx]
                )
                cls.teacher_id = replacement.teacher_id
                cls.room_id = replacement.room_id
                cls.slots = replacement.slots
                cls.student_ids.clear()
                if attempts > 100:
                    break

    def normalize_students(individual: Individual) -> None:
        assigned: Set[int] = set()
        leftovers: Set[int] = set()
        for cls in individual.classes:
            room_capacity = rooms_by_id[cls.room_id].capacity
            valid_students: Set[int] = set()
            for student_id in list(cls.student_ids):
                slots = enrollment_slot_sets.get(student_id)
                if not slots or not set(cls.slots).issubset(slots):
                    leftovers.add(student_id)
                    continue
                if student_id in assigned:
                    leftovers.add(student_id)
                    continue
                if len(valid_students) >= room_capacity:
                    leftovers.add(student_id)
                    continue
                valid_students.add(student_id)
                assigned.add(student_id)
            cls.student_ids = valid_students

        all_students = set(enrollment_slot_sets.keys())
        leftovers.update(all_students - assigned)
        individual.unassigned_students = leftovers

    def fill_from_unassigned(individual: Individual) -> None:
        if not individual.unassigned_students:
            return
        remaining = list(individual.unassigned_students)
        random.shuffle(remaining)
        still_unassigned = set(individual.unassigned_students)

        for student_id in remaining:
            slots = enrollment_slot_sets[student_id]
            feasible = [
                cls
                for cls in individual.classes
                if len(cls.student_ids) < rooms_by_id[cls.room_id].capacity
                and set(cls.slots).issubset(slots)
            ]
            if not feasible:
                targeted_class = create_targeted_class(
                    student_id, individual.classes
                )
                if targeted_class:
                    individual.classes.append(targeted_class)
                    still_unassigned.discard(student_id)
                continue
            feasible.sort(
                key=lambda c: len(c.student_ids) / max(1, rooms_by_id[c.room_id].capacity),
                reverse=True,
            )
            target = feasible[0]
            target.student_ids.add(student_id)
            still_unassigned.discard(student_id)

        individual.unassigned_students = still_unassigned

    def repair_individual(individual: Individual) -> None:
        enforce_resource_conflicts(individual)
        normalize_students(individual)
        if individual.unassigned_students and random.random() < 0.7:
            fill_from_unassigned(individual)

    def create_feasible_individual() -> Individual:
        classes: List[ClassAssignment] = []
        sorted_templates = sorted(
            valid_templates,
            key=lambda tpl: len(template_candidate_students.get(tpl, set())),
            reverse=True,
        )
        for tpl in sorted_templates:
            if len(classes) >= num_classes:
                break
            if has_conflict(tpl, classes):
                continue
            t_id, r_id, slots = tpl
            classes.append(
                ClassAssignment(
                    teacher_id=t_id,
                    room_id=r_id,
                    slots=tuple(sorted(slots)),
                    student_ids=set(),
                )
            )
        individual = Individual(classes=classes, unassigned_students=set())
        assign_students_greedily(individual)
        repair_individual(individual)
        return individual

    current_gen = -1
    gamma_H1 = UNQUALIFIED_PENALTY
    gamma_H2 = CAPACITY_PENALTY_UNIT
    gamma_H3 = VIOLATION_PENALTY
    from collections import deque
    K = 5
    violation_history = {
        "H1": deque(maxlen=K),
        "H2": deque(maxlen=K),
        "H3": deque(maxlen=K),
    }

    def fitness_with_stats(individual: Individual) -> Tuple[int, Dict[str, int]]:
        teacher_usage: Dict[str, Set[str]] = {}
        room_usage: Dict[str, Set[str]] = {}
        assigned_students: Set[int] = set()
        score = ASSIGNED_REWARD * len(enrollments_by_id)
        total_penalty = 0
        hard_penalty_count = 0
        violation_penalty_count = 0
        invalid_student_slot_count = 0
        duplicate_student_assignment_count = 0
        ghost_class_count = 0
        hard_missing_resource_count = 0
        hard_capacity_overflow_count = 0
        hard_unqualified_teacher_count = 0
        h1_count = 0
        h2_overflow = 0
        h3_count = 0

        for cls in individual.classes:
            room = rooms_by_id.get(cls.room_id)
            teacher = teachers_by_id.get(cls.teacher_id)

            if room is None or teacher is None:
                total_penalty += HARD_PENALTY
                hard_penalty_count += 1
                hard_missing_resource_count += 1
                continue

            if course.requirement_qualification and not teacher_supports_course(teacher):
                total_penalty += gamma_H1
                hard_unqualified_teacher_count += 1
                h1_count += 1

            if len(cls.student_ids) > room.capacity:
                overflow = len(cls.student_ids) - room.capacity
                total_penalty += gamma_H2 * overflow
                hard_penalty_count += 1
                hard_capacity_overflow_count += 1
                h2_overflow += overflow

            slot_set = set(cls.slots)
            violated = False
            for slot in slot_set:
                if slot not in teacher.availability or slot not in room.availability:
                    total_penalty += gamma_H3
                    violation_penalty_count += 1
                    violated = True
                if slot in teacher_usage.get(cls.teacher_id, set()):
                    total_penalty += gamma_H3
                    violation_penalty_count += 1
                    violated = True
                if slot in room_usage.get(cls.room_id, set()):
                    total_penalty += gamma_H3
                    violation_penalty_count += 1
                    violated = True
            if not violated:
                teacher_usage.setdefault(cls.teacher_id, set()).update(slot_set)
                room_usage.setdefault(cls.room_id, set()).update(slot_set)
            else:
                h3_count += 1

            for student_id in cls.student_ids:
                student_slots = enrollment_slot_sets.get(student_id)
                if not student_slots or not slot_set.issubset(student_slots):
                    total_penalty += UNASSIGNED_HARD_PENALTY
                    invalid_student_slot_count += 1
                if student_id in assigned_students:
                    total_penalty += UNASSIGNED_PENALTY
                    duplicate_student_assignment_count += 1
                assigned_students.add(student_id)
                if slot_set.issubset(student_slots) and set(slot_set).issubset(set(teacher.availability)):
                    score += SOFT_AVAIL_MATCH_REWARD

            if not cls.student_ids:
                total_penalty += GHOST_CLASS_PENALTY
                ghost_class_count += 1

            if room and room.capacity > 0 and cls.student_ids:
                fill_ratio = len(cls.student_ids) / room.capacity
                if fill_ratio > 0.85:
                    score += 500
                elif fill_ratio < 0.4:
                    total_penalty += 500

        total_students = set(enrollment_slot_sets.keys())
        missing = total_students - assigned_students
        total_penalty += UNASSIGNED_PENALTY * len(missing)

        final_score = BASELINE_SCORE + score - total_penalty
        if total_penalty < 1000:
            final_score += VALID_SCHEDULE_BONUS
        if current_gen == 0:
            logger.info(
                "GA diag g=%d | score=%d | hard=%d | hard_missing=%d | hard_capacity=%d | hard_unqualified=%d | viol=%d | invalid_slot=%d | dup_assign=%d | ghost=%d | missing=%d",
                current_gen,
                final_score,
                hard_penalty_count,
                hard_missing_resource_count,
                hard_capacity_overflow_count,
                hard_unqualified_teacher_count,
                violation_penalty_count,
                invalid_student_slot_count,
                duplicate_student_assignment_count,
                ghost_class_count,
                len(missing),
            )
        return final_score, {"H1": h1_count, "H2": h2_overflow, "H3": h3_count, "soft": score, "hard": total_penalty}

    def fitness(individual: Individual) -> int:
        return fitness_with_stats(individual)[0]

    def crossover(p1: Individual, p2: Individual) -> Individual:
        if not p1.classes and not p2.classes:
            return clone_individual(p1)
        if random.random() > settings.CROSSOVER_RATE:
            return clone_individual(random.choice([p1, p2]))
        max_len = max(len(p1.classes), len(p2.classes))
        child_classes: List[ClassAssignment] = []
        for i in range(max_len):
            if i < len(p1.classes) and i < len(p2.classes):
                source = p1.classes[i] if random.random() < 0.5 else p2.classes[i]
            elif i < len(p1.classes):
                source = p1.classes[i]
            else:
                source = p2.classes[i]
            child_classes.append(
                ClassAssignment(
                    teacher_id=source.teacher_id,
                    room_id=source.room_id,
                    slots=source.slots,
                    student_ids=set(source.student_ids),
                )
            )
        child = Individual(classes=child_classes, unassigned_students=set())
        repair_individual(child)
        if random.random() < 0.3:
            mutate(child)
        return child

    def mutation_insert_unassigned(individual: Individual) -> bool:
        if not individual.unassigned_students:
            return False
        student_id = random.choice(list(individual.unassigned_students))
        slots = enrollment_slot_sets[student_id]
        candidates = [
            cls
            for cls in individual.classes
            if len(cls.student_ids) < rooms_by_id[cls.room_id].capacity
            and set(cls.slots).issubset(slots)
        ]
        if candidates:
            target = random.choice(candidates)
            target.student_ids.add(student_id)
            individual.unassigned_students.discard(student_id)
            return True
        targeted_class = create_targeted_class(student_id, individual.classes)
        if targeted_class:
            individual.classes.append(targeted_class)
            individual.unassigned_students.discard(student_id)
            return True
        return False

    def mutation_move_student(individual: Individual) -> bool:
        populated = [cls for cls in individual.classes if cls.student_ids]
        if not populated:
            return False
        source = random.choice(populated)
        student_id = random.choice(list(source.student_ids))
        slots = enrollment_slot_sets[student_id]
        candidates = [
            cls
            for cls in individual.classes
            if cls is not source
            and len(cls.student_ids) < rooms_by_id[cls.room_id].capacity
            and set(cls.slots).issubset(slots)
        ]
        if not candidates:
            return False
        target = random.choice(candidates)
        source.student_ids.remove(student_id)
        target.student_ids.add(student_id)
        return True

    def mutation_swap_students(individual: Individual) -> bool:
        populated = [cls for cls in individual.classes if len(cls.student_ids) >= 1]
        if len(populated) < 2:
            return False
        class_a, class_b = random.sample(populated, 2)
        student_a = random.choice(list(class_a.student_ids))
        student_b = random.choice(list(class_b.student_ids))

        slots_a = enrollment_slot_sets[student_a]
        slots_b = enrollment_slot_sets[student_b]

        if not set(class_b.slots).issubset(slots_a):
            return False
        if not set(class_a.slots).issubset(slots_b):
            return False

        class_a.student_ids.remove(student_a)
        class_b.student_ids.remove(student_b)
        class_a.student_ids.add(student_b)
        class_b.student_ids.add(student_a)
        return True

    def mutation_reconfigure_class(individual: Individual) -> bool:
        if not individual.classes:
            return False
        target = random.choice(individual.classes)
        dropped = set(target.student_ids)
        replacement = create_random_class(
            [cls for cls in individual.classes if cls is not target]
        )
        target.teacher_id = replacement.teacher_id
        target.room_id = replacement.room_id
        target.slots = replacement.slots
        target.student_ids.clear()
        individual.unassigned_students.update(dropped)
        return True

    mut_rate = settings.MUTATION_RATE

    def mutate(individual: Individual) -> Individual:
        mutated = False
        operations = [
            mutation_insert_unassigned,
            mutation_move_student,
            mutation_swap_students,
            mutation_reconfigure_class,
        ]
        random.shuffle(operations)
        for op in operations:
            if random.random() < mut_rate:
                mutated = op(individual) or mutated
        if mutated:
            repair_individual(individual)
        return individual

    def tournament_select(scored: List[Tuple[Individual, int]], size: int = 3) -> Individual:
        pool = random.sample(scored, min(size, len(scored)))
        pool.sort(key=lambda item: item[1], reverse=True)
        return pool[0][0]

    def individual_similarity(a: Individual, b: Individual) -> float:
        set_a = set((c.teacher_id, c.room_id, c.slots) for c in a.classes)
        set_b = set((c.teacher_id, c.room_id, c.slots) for c in b.classes)
        if not set_a and not set_b:
            return 1.0
        inter = len(set_a & set_b)
        union = len(set_a | set_b) or 1
        return inter / union

    def local_search(individual: Individual) -> None:
        enforce_resource_conflicts(individual)
        normalize_students(individual)
        if individual.unassigned_students:
            fill_from_unassigned(individual)

    population: List[Individual] = []
    feasible_share = max(1, int(settings.POPULATION_SIZE * 0.6))
    for _ in range(min(feasible_share, settings.POPULATION_SIZE)):
        population.append(create_feasible_individual())
    for _ in range(max(0, settings.POPULATION_SIZE - len(population))):
        population.append(create_random_individual())
    fitness_history: List[int] = []
    avg_history: List[int] = []
    best_soft_history: List[int] = []
    best_hard_history: List[int] = []
    avg_soft_history: List[int] = []
    avg_hard_history: List[int] = []

    stagnation = 0
    prev_best: int | None = None

    for gen in range(settings.GENERATIONS):
        current_gen = gen
        scored = [(ind, fitness(ind)) for ind in population]
        scored.sort(key=lambda item: item[1], reverse=True)
        fitness_history.append(scored[0][1] if scored else 0)

        elite_count = max(2, int(settings.POPULATION_SIZE * 0.15))
        new_population: List[Individual] = [
            clone_individual(ind) for ind, _ in scored[:elite_count]
        ]

        while len(new_population) < settings.POPULATION_SIZE:
            p1 = tournament_select(scored, size=3)
            p2 = tournament_select(scored, size=3)
            c1 = crossover(p1, p2)
            c2 = crossover(p2, p1)
            mutate(c1)
            mutate(c2)

            # DC: mỗi con chỉ cạnh tranh với cha mẹ giống nó nhất
            sim_c1_p1 = individual_similarity(c1, p1)
            sim_c1_p2 = individual_similarity(c1, p2)
            parent_c1 = p1 if sim_c1_p1 >= sim_c1_p2 else p2
            sim_c2_p1 = individual_similarity(c2, p1)
            sim_c2_p2 = individual_similarity(c2, p2)
            parent_c2 = p1 if sim_c2_p1 >= sim_c2_p2 else p2

            if len(new_population) < settings.POPULATION_SIZE:
                new_population.append(c1 if fitness(c1) >= fitness(parent_c1) else clone_individual(parent_c1))
            if len(new_population) < settings.POPULATION_SIZE:
                new_population.append(c2 if fitness(c2) >= fitness(parent_c2) else clone_individual(parent_c2))

        population = new_population

        best_score = scored[0][1] if scored else 0
        top_pool = scored[: max(1, int(len(scored) * 0.4))]
        agg = {"H1": 0, "H2": 0, "H3": 0}
        for ind, _ in top_pool:
            _, s = fitness_with_stats(ind)
            agg["H1"] += s["H1"]
            agg["H2"] += s["H2"]
            agg["H3"] += s["H3"]
        for k in ["H1","H2","H3"]:
            violation_history[k].append(agg[k])
            if len(violation_history[k]) == K:
                w = list(violation_history[k])
                any_decrease = any(w[i] < w[i-1] for i in range(1, K))
                if not any_decrease:
                    if k == "H1":
                        gamma_H1 = min(int(gamma_H1 * 1.5), 5_000_000)
                    elif k == "H2":
                        gamma_H2 = min(int(gamma_H2 * 1.5), 5_000_000)
                    else:
                        gamma_H3 = min(int(gamma_H3 * 1.5), 5_000_000)
                    mut_rate = min(0.5, mut_rate + 0.1)
                    half = max(1, settings.POPULATION_SIZE // 2)
                    new_pop = population[:half]
                    new_pop.extend([create_random_individual() for _ in range(half)])
                    population = new_pop[: settings.POPULATION_SIZE]
                    logger.info(
                        "GA APW escalate | k=%s | gamma=(%d,%d,%d) | mut=%.2f",
                        k,
                        gamma_H1,
                        gamma_H2,
                        gamma_H3,
                        mut_rate,
                    )

        if scored:
            best_score = scored[0][1]
            avg_score = sum(score for _, score in scored) // max(1, len(scored))
            bs, bstats = fitness_with_stats(scored[0][0])
            s_total = 0
            h_total = 0
            for ind, _ in scored:
                _, st = fitness_with_stats(ind)
                s_total += st.get("soft", 0)
                h_total += st.get("hard", 0)
            avg_soft = s_total // max(1, len(scored))
            avg_hard = h_total // max(1, len(scored))
            best_soft_history.append(bstats.get("soft", 0))
            best_hard_history.append(bstats.get("hard", 0))
            avg_soft_history.append(avg_soft)
            avg_hard_history.append(avg_hard)
            unassigned = len(scored[0][0].unassigned_students)
            top_count = max(1, int(len(population) * 0.2))
            for ind, _ in scored[:top_count]:
                local_search(ind)
        else:
            best_score = 0
            avg_score = 0
            best_soft_history.append(0)
            best_hard_history.append(0)
            avg_soft_history.append(0)
            avg_hard_history.append(0)
            unassigned = len(enrollment_slot_sets)

        if gen % 10 == 0 or gen == settings.GENERATIONS - 1:
            logger.info(
                "GA gen %03d | best=%d | avg=%d | unassigned=%d",
                gen,
                best_score,
                avg_score,
                unassigned,
            )
        
        avg_history.append(avg_score)

        if prev_best is None or best_score > prev_best:
            stagnation = 0
            prev_best = best_score
        else:
            stagnation += 1
            if stagnation >= 10:
                mut_rate = min(0.5, mut_rate + 0.1)
                half = max(1, settings.POPULATION_SIZE // 2)
                new_pop = population[:half]
                new_pop.extend([create_random_individual() for _ in range(half)])
                population = new_pop[: settings.POPULATION_SIZE]
                stagnation = 0
                logger.info("GA restarted with diversity injection")

    if not scored:
        raise ValueError("Khong the danh gia lich vi danh sach ca the rong.")

    final_scored = [(ind, fitness(ind)) for ind in population]
    final_scored.sort(key=lambda item: item[1], reverse=True)
    best_individual = final_scored[0][0]

    final_classes: List[ClassAssignment] = [
        ClassAssignment(
            teacher_id=cls.teacher_id,
            room_id=cls.room_id,
            slots=tuple(sorted(cls.slots)),
            student_ids=set(cls.student_ids),
        )
        for cls in best_individual.classes
        if cls.student_ids
    ]

    assigned_students: Set[int] = set()
    for cls in final_classes:
        assigned_students.update(cls.student_ids)

    total_students = set(enrollment_slot_sets.keys())

    if assigned_students != total_students:
        final_classes = build_complete_assignment_via_backtracking()
        assigned_students = set()
        for cls in final_classes:
            assigned_students.update(cls.student_ids)
        logger.info(
            "GA backtracking applied | remaining=%d | final_classes=%d",
            len(total_students - assigned_students),
            len(final_classes),
        )
        if assigned_students == total_students:
            backtracking_score = ASSIGNED_REWARD * len(assigned_students)
            logger.info(
                "GA score after backtracking | score=%d | students=%d",
                backtracking_score,
                len(assigned_students),
            )

    if assigned_students != total_students:
        logger.warning(
            "GA partial schedule | unassigned=%d", len(total_students - assigned_students)
        )

    final_classes.sort(
        key=lambda cls: (tuple(sorted(cls.slots)), cls.teacher_id, cls.room_id)
    )

    if not final_classes and valid_templates:
        tpl = max(
            valid_templates,
            key=lambda t: len(template_candidate_students.get(t, set())),
        )
        t_id, r_id, slots = tpl
        capacity = rooms_by_id[r_id].capacity
        candidates = list(template_candidate_students.get(tpl, set()))
        selected = candidates[: max(0, capacity)]
        final_classes.append(
            ClassAssignment(
                teacher_id=t_id,
                room_id=r_id,
                slots=tuple(sorted(slots)),
                student_ids=set(selected),
            )
        )
        assigned_students.update(selected)

    final_score = ASSIGNED_REWARD * len(assigned_students)
    logger.info(
        "GA final score | score=%d | students=%d | classes=%d",
        final_score,
        len(assigned_students),
        len(final_classes),
    )

    scheduled_classes: List[ScheduledClass] = []
    scheduled_enrollments: List[ScheduledEnrollment] = []

    for cls in final_classes:
        logger.info(
            "GA result class | teacher=%s | room=%s | slots=%s | students=%s",
            cls.teacher_id,
            cls.room_id,
            cls.slots,
            sorted(cls.student_ids),
        )
        for slot in sorted(cls.slots):
            parts = slot.split("_", 1)
            day = parts[0] if parts else "MON"
            time = parts[1] if len(parts) > 1 else "MORNING"
            scheduled_classes.append(
                ScheduledClass(
                    courseId=course.id,
                    teacherId=cls.teacher_id,
                    roomId=cls.room_id,
                    dayOfWeek=day,
                    timeSlot=time,
                    startDate="2025-11-03",
                    endDate="2026-01-03",
                )
            )
            scheduled_class_id = len(scheduled_classes)

            for student_id in sorted(cls.student_ids):
                scheduled_enrollments.append(
                    ScheduledEnrollment(
                        scheduledClassId=scheduled_class_id,
                        enrollmentId=student_id,
                )
            )

    chart_b64: str | None = None
    try:
        import os
        import io
        import base64
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        xs = list(range(len(fitness_history)))
        ys_best = fitness_history
        ys_avg = avg_history
        def norm(series: List[int]) -> List[float]:
            if not series:
                return []
            mn = min(series)
            mx = max(series)
            if mx == mn:
                return [100.0 for _ in series]
            return [((v - mn) * 100.0) / (mx - mn) for v in series]
        def smooth(series: List[float], w: int = 7) -> List[float]:
            if not series:
                return []
            n = len(series)
            out: List[float] = []
            for i in range(n):
                s = 0.0
                c = 0
                for j in range(max(0, i - w + 1), i + 1):
                    s += series[j]
                    c += 1
                out.append(s / max(1, c))
            return out
        n_best = norm(ys_best)
        n_avg = norm(ys_avg)
        n_best_soft = norm(best_soft_history)
        n_best_hard = norm(best_hard_history)
        n_avg_soft = norm(avg_soft_history)
        n_avg_hard = norm(avg_hard_history)
        n_best = smooth(n_best)
        n_avg = smooth(n_avg)
        n_best_soft = smooth(n_best_soft)
        n_best_hard = smooth(n_best_hard)
        n_avg_soft = smooth(n_avg_soft)
        n_avg_hard = smooth(n_avg_hard)
        fig = plt.figure(figsize=(8, 4.5))
        if len(n_best) == len(xs):
            plt.plot(xs, n_best, color="tab:blue", label="Best (norm)")
        if len(n_avg) == len(xs):
            plt.plot(xs, n_avg, color="tab:orange", label="Average (norm)")
        if len(n_best_hard) == len(xs):
            plt.plot(xs, n_best_hard, color="tab:red", alpha=0.6, label="Hard (best, norm)")
        if len(n_best_soft) == len(xs):
            plt.plot(xs, n_best_soft, color="tab:green", alpha=0.6, label="Soft (best, norm)")
        if len(n_avg_hard) == len(xs):
            plt.plot(xs, n_avg_hard, color="tab:pink", alpha=0.5, label="Hard (avg, norm)")
        if len(n_avg_soft) == len(xs):
            plt.plot(xs, n_avg_soft, color="tab:olive", alpha=0.5, label="Soft (avg, norm)")
        plt.xlabel("Generation")
        plt.xlim(0, 80)
        plt.ylabel("Normalized (0-100)")
        plt.legend(loc="best")
        out_path = os.path.join(os.path.dirname(__file__), "ga_convergence_chart.png")
        fig.savefig(out_path, dpi=120, bbox_inches="tight")
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
        buf.seek(0)
        chart_b64 = base64.b64encode(buf.read()).decode("ascii")
        buf.close()
        plt.close(fig)
    except Exception:
        chart_b64 = None

    diagnostics = {
        "unassigned": len(total_students - assigned_students),
        "gamma": {"H1": gamma_H1, "H2": gamma_H2, "H3": gamma_H3},
        "pop": settings.POPULATION_SIZE,
        "gens": settings.GENERATIONS,
        "chartNormalized": True,
        "chartSmoothed": True,
    }
    return ScheduleResult(
        scheduledClasses=scheduled_classes,
        scheduledEnrollments=scheduled_enrollments,
        convergenceChartBase64=chart_b64,
        diagnostics=diagnostics,
    )
