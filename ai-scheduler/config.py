from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MAX_CLASSES_PER_TEACHER: int = 5
    POPULATION_SIZE: int = 200
    GENERATIONS: int = 400
    MUTATION_RATE: float = 0.05
    CROSSOVER_RATE: float = 0.85

settings = Settings()
