# README.md — FAWedding API

## 📌 Visão Geral

O **fawedding-api** é uma API REST responsável por gerenciar os dados e regras de negócio do sistema FAWedding.

O objetivo do projeto é centralizar operações relacionadas ao ecossistema do site de casamento, como convidados, confirmações de presença (RSVP), presentes, mensagens e futuras funcionalidades administrativas.

A aplicação será construída utilizando **Node.js + TypeScript**, seguindo boas práticas de arquitetura backend moderna, com foco em escalabilidade, organização de código e facilidade de manutenção.

---

## 🚀 Stack Tecnológica

* Node.js
* TypeScript
* Hono
* PostgreSQL
* Prisma ORM
* Docker
* Zod (validação de dados)
* Hono OpenAPI (documentação automática)
* Scalar API Reference (documentação visual)
* Ts-node-dev (ambiente de desenvolvimento)

---

## 🎯 Objetivos do Projeto

* Criar uma API robusta e organizada
* Permitir gerenciamento de convidados
* Permitir confirmação de presença (RSVP)
* Permitir envio de mensagens para os noivos
* Permitir gerenciamento de lista de presentes
* Servir como backend oficial do site FAWedding

---

## 📂 Estrutura Inicial

```
src/
  modules/
  shared/
  config/
  app.ts
  server.ts
```

---

## ⚙️ Scripts do Projeto

* `dev` → roda o servidor em modo desenvolvimento
* `build` → compila o projeto
* `start` → roda versão compilada
* `prisma:generate` → gera client do Prisma
* `prisma:migrate` → cria migrations

---

## 🗄️ Banco de Dados

O projeto utiliza **PostgreSQL rodando via Docker**, garantindo facilidade de setup e portabilidade do ambiente de desenvolvimento.

---

## ▶️ Como iniciar o projeto

```
docker compose up -d
npm install
npx prisma init
npm run prisma:migrate
npm run dev
```

---

## ✅ Próximos Passos

* Criar módulo de convidados
* Criar módulo de RSVP
* Criar autenticação administrativa
* Criar sistema de presentes
* Implementar logs e tratamento global de erros
* Criar testes automatizados
