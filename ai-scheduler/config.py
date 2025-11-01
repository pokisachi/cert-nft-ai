from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MAX_CLASSES_PER_TEACHER: int = 3
    POPULATION_SIZE: int = 50
    GENERATIONS: int = 150
    MUTATION_RATE: float = 0.1
    CROSSOVER_RATE: float = 0.8

settings = Settings()
