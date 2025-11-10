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

HARD_PENALTY = 1_000_000
ASSIGNED_REWARD = 100
UNASSIGNED_PENALTY = 150
UNASSIGNED_HARD_PENALTY = 10_000
GHOST_CLASS_PENALTY = 1_000


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
                if attempts > 20:
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
        fill_from_unassigned(individual)

    def fitness(individual: Individual) -> int:
        teacher_usage: Dict[str, Set[str]] = {}
        room_usage: Dict[str, Set[str]] = {}
        assigned_students: Set[int] = set()
        score = 0

        for cls in individual.classes:
            room = rooms_by_id.get(cls.room_id)
            teacher = teachers_by_id.get(cls.teacher_id)

            if not cls.student_ids:
                score -= GHOST_CLASS_PENALTY

            if room is None or teacher is None:
                return -HARD_PENALTY

            if course.requirement_qualification and not teacher_supports_course(teacher):
                return -HARD_PENALTY

            if len(cls.student_ids) > room.capacity:
                return -HARD_PENALTY

            slot_set = set(cls.slots)
            for slot in slot_set:
                if slot not in teacher.availability or slot not in room.availability:
                    return -HARD_PENALTY
                if slot in teacher_usage.get(cls.teacher_id, set()):
                    return -HARD_PENALTY
                if slot in room_usage.get(cls.room_id, set()):
                    return -HARD_PENALTY
            teacher_usage.setdefault(cls.teacher_id, set()).update(slot_set)
            room_usage.setdefault(cls.room_id, set()).update(slot_set)

            for student_id in cls.student_ids:
                student_slots = enrollment_slot_sets.get(student_id)
                if not student_slots or not slot_set.issubset(student_slots):
                    return -HARD_PENALTY
                if student_id in assigned_students:
                    return -HARD_PENALTY
                assigned_students.add(student_id)

            score += ASSIGNED_REWARD * len(cls.student_ids)

            if cls.student_ids:
                fill_ratio = len(cls.student_ids) / max(1, room.capacity)
                if fill_ratio > 0.85:
                    score += 10
                elif fill_ratio < 0.4:
                    score -= 10

        total_students = set(enrollment_slot_sets.keys())
        missing = total_students - assigned_students
        score -= UNASSIGNED_PENALTY * len(missing)
        if missing:
            score -= UNASSIGNED_HARD_PENALTY * len(missing)

        return score

    def crossover(p1: Individual, p2: Individual) -> Individual:
        if not p1.classes and not p2.classes:
            return clone_individual(p1)

        if random.random() > settings.CROSSOVER_RATE:
            return clone_individual(random.choice([p1, p2]))

        length = max(len(p1.classes), len(p2.classes))
        child_classes: List[ClassAssignment] = []

        for idx in range(length):
            if idx < len(p1.classes) and idx < len(p2.classes):
                source = p1.classes[idx] if random.random() < 0.5 else p2.classes[idx]
            elif idx < len(p1.classes):
                source = p1.classes[idx]
            else:
                source = p2.classes[idx]
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
            if random.random() < settings.MUTATION_RATE:
                mutated = op(individual) or mutated
        if mutated:
            repair_individual(individual)
        return individual

    population: List[Individual] = [create_random_individual() for _ in range(settings.POPULATION_SIZE)]

    for gen in range(settings.GENERATIONS):
        scored = [(ind, fitness(ind)) for ind in population]
        scored.sort(key=lambda item: item[1], reverse=True)

        elite_count = max(1, settings.POPULATION_SIZE // 5)
        new_population: List[Individual] = [
            clone_individual(ind) for ind, _ in scored[:elite_count]
        ]

        parent_pool = [ind for ind, _ in scored[: max(2, settings.POPULATION_SIZE // 2)]]

        while len(new_population) < settings.POPULATION_SIZE:
            if len(parent_pool) >= 2:
                p1, p2 = random.sample(parent_pool, 2)
            else:
                p1 = p2 = parent_pool[0]
            child = crossover(p1, p2)
            mutate(child)
            new_population.append(child)

        population = new_population

        if scored:
            best_score = scored[0][1]
            avg_score = sum(score for _, score in scored) // max(1, len(scored))
            unassigned = len(scored[0][0].unassigned_students)
        else:
            best_score = 0
            avg_score = 0
            unassigned = len(enrollment_slot_sets)

        if gen % 10 == 0 or gen == settings.GENERATIONS - 1:
            logger.info(
                "GA gen %03d | best=%d | avg=%d | unassigned=%d",
                gen,
                best_score,
                avg_score,
                unassigned,
            )

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
        raise ValueError("Khong the lap lich thoa man cho tat ca hoc vien.")

    final_classes.sort(
        key=lambda cls: (tuple(sorted(cls.slots)), cls.teacher_id, cls.room_id)
    )

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

    return ScheduleResult(
        scheduledClasses=scheduled_classes,
        scheduledEnrollments=scheduled_enrollments,
    )

