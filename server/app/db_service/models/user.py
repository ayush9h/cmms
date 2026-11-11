from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True, max_length=20)  # login id, stored lowercase
    name: str = Field(max_length=80)
    email: str = Field(unique=True, max_length=120)
    role: str = Field(max_length=20)
    password_hash: str = Field(max_length=160)
