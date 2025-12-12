from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MAX_CLASSES_PER_TEACHER: int = 5
    POPULATION_SIZE: int = 200
    GENERATIONS: int = 120
    MUTATION_RATE: float = 0.08
    CROSSOVER_RATE: float = 0.85

settings = Settings()
