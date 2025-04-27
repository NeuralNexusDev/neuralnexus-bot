FROM golang:1.24.2-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o bot .

FROM alpine:edge AS release-stage

WORKDIR /app

COPY --from=build /app/bot .

CMD ["/app/bot"]

