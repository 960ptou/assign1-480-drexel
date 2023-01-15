# assign1-480-drexel



```bash
# get all author
curl http://localhost:3000/author

curl http://localhost:3000/author/1

# get all books
curl http://localhost:3000/book

curl http://localhost:3000/book/1



# add author
curl -X POST -H "Content-Type: application/json" -d '{"id" : 1, "name": "aut", "bio": "tester author"}' http://localhost:3000/author


# post a book
curl -X POST -H "Content-Type: application/json" -d '{"id": 1, "author_id": 1, "title" : "test", "pub_year" : 2133,"genre": "fantasy"}' http://localhost:3000/book


```