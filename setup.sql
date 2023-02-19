CREATE TABLE books (
    id TEXT PRIMARY KEY, -- can change to be integer if you want
    author_id TEXT,
    title TEXT,
    pub_year TEXT,
    genre TEXT,
    FOREIGN KEY(author_id) REFERENCES authors(id)
);

CREATE TABLE authors (
    id TEXT PRIMARY KEY, -- can change to be integer if you want
    name TEXT,
    bio TEXT
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
);

CREATE TABLE own_book (
    userid TEXT,
    bid TEXT PRIMARY KEY,
    FOREIGN KEY(userid) REFERENCES users(id),
    FOREIGN KEY(bid) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE own_author (
    userid TEXT,
    author_id TEXT PRIMARY KEY,
    FOREIGN KEY(userid) REFERENCES users(id),
    FOREIGN KEY(author_id) REFERENCES authors(id) ON DELETE CASCADE
);